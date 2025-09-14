// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function buildParsingPrompt(ocrText: string): { system: string; user: string } {
  const system = `You are an expert at extracting structured information from OCR text of receipts and invoices.
Your task is to analyze the text and return a valid JSON object containing the extracted data.
The JSON object should have the following possible keys: "productName", "productValue" (as a number), "currency" (3-letter code), "orderNumber", "purchaseDate" (in YYYY-MM-DD format), "company", "otherCompany", "firstName", "lastName", "issueType", "description".
- Use the "company" key for well-known company names.
- If you find a website domain instead of a name, use the "otherCompany" key for the domain (e.g., "example.com").
- The "issueType" and "description" fields are unlikely to be on a standard receipt. Only populate them if the document explicitly describes a problem or reason for return.
- Pay close attention to shipping or billing address sections, as they often contain the customer's "firstName" and "lastName". Extract these if present.
If a piece of information is not found, omit the key from the JSON object.
Your response must be ONLY the valid JSON object, with no extra text, explanations, or markdown formatting.`;

  const user = `Here is the OCR text from a receipt/invoice. Please extract the information and return it as a JSON object.

"""
${ocrText}
"""`;

  return { system, user };
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<any> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" }, // Use JSON mode for reliable output
    temperature: 0.1,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} — ${text}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned no valid content.");
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON from OpenAI response:", content);
    throw new Error("OpenAI returned invalid JSON.");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      throw new Error("Missing or invalid 'text' in request body.");
    }

    const { system, user } = buildParsingPrompt(text);
    const parsedData = await callOpenAI(system, user);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error) {
    console.error("Error in parse-ocr-text:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});