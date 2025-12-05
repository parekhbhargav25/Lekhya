
  


// lib/extract.ts
import OpenAI from "openai";

export const USE_MOCK_AI =
  process.env.NEXT_PUBLIC_USE_MOCK_AI === "true";

export type ExtractedReceipt = {
  merchant: string;
  date: string;         // ISO string YYYY-MM-DD
  total: number;
  tax?: number | null;
  currency?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  lineItems?: {
    description: string;
    qty?: number | null;
    price?: number | null;
  }[];
  notes?: string | null;
};

// ---------- MOCK VERSION (keep for testing) ----------
export async function extractReceiptFromImageMock(args: {
  s3Url: string;
}): Promise<ExtractedReceipt> {
  const { s3Url } = args;

  return {
    merchant: "Mock Coffee Shop",
    date: new Date().toISOString().slice(0, 10),
    total: 12.5,
    tax: 1.5,
    currency: "CAD",
    category: "Dining",
    paymentMethod: "Card",
    lineItems: [
      { description: "Latte", qty: 1, price: 5.0 },
      { description: "Croissant", qty: 1, price: 4.0 },
    ],
    notes: `Mock extraction for ${s3Url}`,
  };
}

// ---------- REAL LLM VERSION ----------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Uses an LLM with vision to parse the receipt image at the given S3 URL
 * into a structured JSON object that matches ExtractedReceipt.
 */
export async function extractReceiptFromImageLLM(args: {
  s3Url: string;
}): Promise<ExtractedReceipt> {
  const { s3Url } = args;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that reads shopping receipts and returns clean, structured JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
Read the receipt image and return JSON matching this TypeScript type:

type ExtractedReceipt = {
  merchant: string;
  date: string;          // ISO format YYYY-MM-DD
  total: number;
  tax?: number | null;
  currency?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  lineItems?: {
    description: string;     // human-friendly product name
    qty?: number | null;
    price?: number | null;
  }[];
  notes?: string | null;
};

IMPORTANT RULES:

- "description" must be a human-friendly, expanded product name, not a code.
  - Use abbreviations as hints and decode them.
  - Example: "MV SS&MV" on a Canadian grocery receipt is very likely
    "Miss Vickie's potato chips - Sea Salt & Malt Vinegar".
- If you can reasonably infer the brand and product from the code, expand it.
- If you truly cannot infer the product or not too sure, then use the raw text from the receipt.
- Keep prices and quantities accurate from the receipt.
- "date" must be in YYYY-MM-DD format.
- "category" should be a broad category like "Groceries", "Dining", "Electronics", etc.
- If a field is missing on the receipt, set it to null or an empty array.

Only return valid JSON, with no extra commentary.
`,
          },
          {
            type: "image_url",
            image_url: { url: s3Url },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0].message.content;

  if (!raw) {
    throw new Error("No content returned from model");
  }

  // content is a string containing JSON
  const parsed = JSON.parse(raw) as ExtractedReceipt;

  return parsed;
}
