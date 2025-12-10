// app/api/expense-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never pre-render / analyze as static

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

  const isAskingMaxItem =
    q.includes("which item") ||
    (q.includes("most") && q.includes("item"));

  if (!isAskingMaxItem || !q.includes("at ")) return null;

  const afterAt = q.split("at")[1]?.trim();
  if (!afterAt) return null;

  const merchantQuery = afterAt.replace(/[.?]/g, "").trim();
  if (!merchantQuery) return null;

  const relevant = expenses.filter((e) =>
    e.merchant.toLowerCase().includes(merchantQuery)
  );

  if (relevant.length === 0) {
    return `I couldn’t find any receipts for "${merchantQuery}".`;
  }

  const totalsByItem: Record<string, { total: number; merchant: string }> = {};

  for (const exp of relevant) {
    for (const item of exp.lineItems || []) {
      const desc = item.description?.trim();
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

  const [topDesc, topData] = entries.sort(
    (a, b) => b[1].total - a[1].total
  )[0];

  const displayMerchant = relevant[0].merchant;
  const rounded = topData.total.toFixed(2);

  return `At ${displayMerchant}, you spent the most on ${topDesc}, with about $${rounded} in total.`;
}

export async function POST(req: NextRequest) {
  // 1) Auth
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email; // email as user id

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Read question
  const body = await req.json().catch(() => null);
  const question = (body?.message as string | undefined)?.trim();
  if (!question) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  // 3) Fetch receipts
  const receipts = await prisma.receipt.findMany({
    where: {
      userId,
      status: "parsed",
      extractedJson: {
        not: null,
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

  // 4) Shape into expense docs
  const expenseDocs: ExpenseDoc[] = receipts.map((r: any) => {
    const parsed = r.extractedJson as any;

    const rawItems = Array.isArray(parsed?.lineItems)
      ? parsed.lineItems
      : [];

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
      category: r.categoryOverride ?? parsed?.category ?? "Uncategorized",
      total: parsed?.total ?? 0,
      tax: parsed?.tax ?? null,
      paymentMethod: parsed?.paymentMethod ?? null,
      lineItems,
    };
  });

  // 🔍 special-case: “which item did I spend the most on at Costco?”
  const directItemAnswer = tryAnswerMaxItemAtMerchant(
    question,
    expenseDocs
  );
  if (directItemAnswer) {
    return NextResponse.json({ answer: directItemAnswer }, { status: 200 });
  }

  const expensesJson = JSON.stringify(expenseDocs, null, 2);

  // 5) Guard: no key in env => don’t crash build/runtime
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in environment");
    return NextResponse.json(
      {
        answer:
          "AI expense analysis is not configured on this deployment (missing OpenAI API key).",
      },
      { status: 500 }
    );
  }

  // 6) Dynamically import LangChain & OpenAI – avoids build-time issues
  const [{ ChatOpenAI }, { PromptTemplate }, { RunnableSequence }] =
    await Promise.all([
      import("@langchain/openai"),
      import("@langchain/core/prompts"),
      import("@langchain/core/runnables"),
    ]);

  const prompt = PromptTemplate.fromTemplate(
    `You are Lekhya, a friendly personal expense assistant.

You are given the user's expenses as JSON:
{expenses}

Each item includes: id, date, merchant, category, total, tax, paymentMethod.

Your job is to answer the user's question in natural conversational English.

Response style rules:
- DO NOT use bullet points or markdown.
- Answer in smooth sentences, e.g. "You spent $389.60 at United Airlines on February 1st."
- If summarizing multiple expenses, say things like "This month, you spent the most at Costco, totaling $214.50."
- If you don’t know something, say so clearly.
- Base everything ONLY on the receipts JSON provided.
- Keep answers concise and friendly.

User question: "{question}"

Your conversational answer:`
  );

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
    answerText = llmResponse.content
      .map((part: any) => part.text ?? part)
      .join("");
  } else {
    answerText = String(
      llmResponse.content ?? "Sorry, I couldn’t generate a response."
    );
  }

  return NextResponse.json({ answer: answerText });
}