// app/api/expense-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

export const runtime = "nodejs"; // make sure we’re on the Node runtime


type ExpenseDoc = {
  id: string;
  date: string;
  merchant: string;
  category: string;
  total: number;
  tax: number | null;
  paymentMethod: string | null;
  lineItems: {
    description: string;
    qty: number | null;
    price: number | null;
  }[];
};

function tryAnswerMaxItemAtMerchant(
  question: string,
  expenses: ExpenseDoc[]
): string | null {
  const q = question.toLowerCase();

  // Only trigger this logic if question sounds like an item-level query
  const isAskingMaxItem =
    q.includes("which item") ||
    (q.includes("most") && q.includes("item"));

  if (!isAskingMaxItem || !q.includes("at ")) {
    return null;
  }

  // Naive merchant extraction: text after "at"
  const afterAt = q.split("at")[1]?.trim();
  if (!afterAt) return null;

  // Clean merchant phrase (remove punctuation)
  const merchantQuery = afterAt
    .replace(/[.?]/g, "")
    .trim(); // e.g. "costco", "costco wholesale"

  if (!merchantQuery) return null;

  // Filter receipts whose merchant contains that phrase
  const relevant = expenses.filter((e) =>
    e.merchant.toLowerCase().includes(merchantQuery)
  );

  if (relevant.length === 0) {
    return `I couldn’t find any receipts for "${merchantQuery}".`;
  }

  // Aggregate spend per item description across those receipts
  const totalsByItem: Record<
    string,
    { total: number; merchant: string }
  > = {};

  for (const exp of relevant) {
    for (const item of exp.lineItems || []) {
      const desc = item.description.trim();
      if (!desc) continue;

      const qty = item.qty ?? 1;
      const price = item.price ?? 0;
      const spend = (qty || 1) * price;

      if (!totalsByItem[desc]) {
        totalsByItem[desc] = { total: 0, merchant: exp.merchant };
      }
      totalsByItem[desc].total += spend;
    }
  }

  const entries = Object.entries(totalsByItem).filter(
    ([, v]) => v.total > 0
  );

  if (entries.length === 0) {
    return `I found receipts for ${relevant[0].merchant}, but there weren’t any line items with valid prices to compare.`;
  }

  // Find the item with the highest total spend
  const [topDesc, topData] = entries.sort(
    (a, b) => b[1].total - a[1].total
  )[0];

  const displayMerchant = relevant[0].merchant;
  const rounded = topData.total.toFixed(2);

  return `At ${displayMerchant}, you spent the most on ${topDesc}, with about $${rounded} in total.`;
}

export async function POST(req: NextRequest) {
  // 1) Auth – tie chat strictly to logged-in user
  const session = await getServerSession(authOptions);

  const userId = session?.user?.email; // we’re using email as userId in this app
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2) Read question from request body
  const body = await req.json().catch(() => null);
  const question = (body?.message as string | undefined)?.trim();

  if (!question) {
    return NextResponse.json(
      { error: "Missing message" },
      { status: 400 }
    );
  }

  // 3) Fetch this user’s parsed receipts from Prisma
  const receipts = await prisma.receipt.findMany({
    where: {
      userId,
      status: "parsed",
      extractedJson: {
        not: Prisma.JsonNull, // only receipts where AI extraction ran
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (receipts.length === 0) {
    return NextResponse.json({
      answer:
        "I don’t see any parsed receipts yet. Try uploading a few receipts and running AI extraction first.",
    });
  }

  // 4) Convert receipts into a compact JSON structure for the model
  const expenseDocs = receipts.map((r) => {
    const parsed = r.extractedJson as any;
  
    const rawItems = Array.isArray(parsed?.lineItems) ? parsed.lineItems : [];
  
    const lineItems = rawItems
      .filter((item: any) => item && item.description)
      .map((item: any) => ({
        description: String(item.description),
        qty:
          typeof item.qty === "number"
            ? item.qty
            : item.qty == null
            ? null
            : Number(item.qty) || null,
        price:
          typeof item.price === "number"
            ? item.price
            : item.price == null
            ? null
            : Number(item.price) || null,
      }));
  
    return {
      id: r.id,
      date: parsed?.date ?? r.createdAt.toISOString().slice(0, 10),
      merchant: parsed?.merchant ?? "Unknown merchant",
      category:
        r.categoryOverride ??
        parsed?.category ??
        "Uncategorized",
      total: parsed?.total ?? 0,
      tax: parsed?.tax ?? null,
      paymentMethod: parsed?.paymentMethod ?? null,
      lineItems,
    };
  });
  
  const expensesJson = JSON.stringify(expenseDocs, null, 2);

  // 5) LangChain: prompt + model + simple chain
  const prompt = PromptTemplate.fromTemplate(
    `You are Lekhya, a friendly personal expense assistant.

      You are given the user's expenses as JSON:
      {expenses}

      Each item includes: id, date, merchant, category, total, tax, paymentMethod.

      Your job is to answer the user's question in **natural conversational English**.

      ### Response Style Rules:
      - DO NOT use bullet points unless explicitly asked.
      - DO NOT return lists or markdown formatting.
      - Always respond in smooth sentences like:
        "You spent $389.60 at United Airlines on February 1st."
      - If summarizing multiple expenses, speak like a human:
        "This month, you spent the most at Costco, totaling $214.50."
      - If you don’t know something, say so clearly.
      - Base everything ONLY on the receipts JSON provided.
      - Keep answers concise and friendly.

      ### User question:
      "{question}"

      ### Your conversational answer:`
  );
  const directItemAnswer = tryAnswerMaxItemAtMerchant(question, expenseDocs as any);
  if (directItemAnswer) {
    return NextResponse.json({ answer: directItemAnswer }, { status: 200 });
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
  });

  const chain = RunnableSequence.from([prompt, model]);

  const llmResponse: any = await chain.invoke({
    expenses: expensesJson,
    question,
  });

  let answerText: string;

  if (typeof llmResponse === "string") {
    answerText = llmResponse;
  } else if (Array.isArray(llmResponse.content)) {
    // ChatOpenAI sometimes returns an array of content parts
    answerText = llmResponse.content
      .map((part: any) => part.text ?? part)
      .join("");
  } else {
    answerText = String(llmResponse.content ?? "Sorry, I couldn’t generate a response.");
  }

  return NextResponse.json({ answer: answerText });
}