// lib/langchain/expenseChat.ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

export type ExpenseSummary = {
  id: string;
  date: string;              // YYYY-MM-DD
  merchant: string | null;
  category: string | null;
  total: number | null;
};

// Model config (you can tweak modelName later if you want)
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
});

const prompt = new PromptTemplate({
  template: `
You are Lekhya, a friendly personal expense assistant.

You are given the user's expenses as JSON:
{expenses}

Each expense (receipt) has:
- id
- date
- merchant
- category
- total
- tax
- paymentMethod
- lineItems: an array of { description, qty, price }

### How to use this data

- "lineItems" represent individual products or services on a receipt.
- If qty is present, the spend for that line is approx: qty * price.
- If qty is missing, assume the spend for that line is just "price".
- When the user asks things like:
  - "At Costco, which item did I spend the most on?"
  - "For Walmart this month, what was my most expensive item?"
  you must:
    1. Filter receipts by that merchant name.
    2. Look at all lineItems in those receipts.
    3. Group them by description and compute total spend per description.
    4. Identify the item with the highest total spend.
    5. Answer in natural language.

### Response style

- Answer in natural conversational English.
- DO NOT use bullet points or markdown unless explicitly asked.
- Examples:
  - "You spent the most at Costco on salmon, with about $78.50 in total."
  - "At Walmart, your highest single item spend was on a TV for $429.99."
- If the data is insufficient (e.g., no lineItems for that merchant), say so honestly.

User question:
"{question}"

Now give your best answer based ONLY on the JSON above.`,
  inputVariables: ["transactions_json", "question"],
});

// Build a small runnable chain that injects JSON + question into the prompt
const chain = RunnableSequence.from([
  (input: { expenses: ExpenseSummary[]; question: string }) => ({
    transactions_json: JSON.stringify(input.expenses),
    question: input.question,
  }),
  prompt,
  model,
]);

export async function answerExpenseQuestion(
  question: string,
  expenses: ExpenseSummary[]
): Promise<string> {
  const aiMessage = await chain.invoke({ question, expenses });

  // aiMessage.content can be string or array depending on the model
  const content = (aiMessage as any).content;

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text ?? ""))
      .join("")
      .trim();
  }

  return JSON.stringify(content);
}