// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function callOpenAI(prompt: string): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant. Respond concisely." },
      { role: "user", content: prompt },
    ],
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
  const text = data.choices?.[0]?.message?.content;

  return text ?? "No valid text content returned from OpenAI.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const traceId = crypto.randomUUID();
  console.log(`[${traceId}] test-openai invoked`);

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Missing or invalid 'prompt' in request body.");
    }

    const openAIResponse = await callOpenAI(prompt);

    return new Response(JSON.stringify({ response: openAIResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error) {
    console.error(`[${traceId}] Error in test-openai:`, error);
    return new Response(JSON.stringify({ error: error.message, traceId }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});