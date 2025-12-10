// lib/extract.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Toggle mock via env if you ever want to
export const USE_MOCK_AI = process.env.MOCK_RECEIPT_AI === "true";

export type ExtractedReceipt = {
  merchant: string | null;
  date: string | null; // ISO-like string
  total: number | null;
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

// Simple mock for testing / dev
export async function extractReceiptFromImageMock(_params: {
  s3Url: string;
}): Promise<ExtractedReceipt> {
  return {
    merchant: "MockMart",
    date: "2025-02-01",
    total: 45.67,
    tax: 5.0,
    currency: "CAD",
    category: "Groceries",
    paymentMethod: "Visa",
    lineItems: [
      { description: "Mock item A", qty: 1, price: 20.0 },
      { description: "Mock item B", qty: 2, price: 12.84 },
    ],
    notes: "Mocked AI output",
  };
}

// 🚀 Real extraction using OpenAI directly (vision + JSON)
export async function extractReceiptFromImageLLM(params: {
  s3Url: string;
}): Promise<ExtractedReceipt> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const { s3Url } = params;

  const systemPrompt = `
You are an expert system that extracts structured expense data from receipts.

You are given an image of a receipt (via URL). Your job is to read it and return a JSON object describing the purchase.

Rules:
- Return ONLY valid JSON (no markdown, no extra text).
- If a field is missing, use null.
- "date" should be a string (any recognizable date format from the receipt).
- "total" should be the final total amount charged.
- "category" should be a short label (e.g. "Groceries", "Dining", "Fuel", "Transport", "Shopping", "Utilities", "Healthcare", etc.).
- "lineItems" should be as descriptive as possible. Expand abbreviations if you can infer them.
`;

  const userText = `
Please extract the purchase information from this receipt image.

The fields you must return:

{
  "merchant": string | null,
  "date": string | null,
  "total": number | null,
  "tax": number | null,
  "currency": string | null,
  "category": string | null,
  "paymentMethod": string | null,
  "lineItems": [
    {
      "description": string,
      "qty": number | null,
      "price": number | null
    }
  ],
  "notes": string | null
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // supports vision + JSON
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          {
            type: "image_url",
            image_url: {
              url: s3Url,
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content.");
  }

  let parsed: ExtractedReceipt;
  try {
    parsed = JSON.parse(content) as ExtractedReceipt;
  } catch (err) {
    console.error("Failed to parse AI JSON:", content);
    throw new Error("Failed to parse AI JSON");
  }

  return parsed;
}