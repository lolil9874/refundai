// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const { imageBase64, language } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid imageBase64" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const prompt = language === "fr" 
      ? `Analysez cette image de reçu ou capture d'écran. Extrayez en JSON structuré: 
        - company: nom de l'entreprise ou domaine (ex: "Amazon" ou "amazon.com")
        - productName: nom du produit/service
        - productValue: valeur en nombre (ex: 49.99)
        - orderNumber: numéro de commande
        - purchaseDate: date d'achat au format ISO (YYYY-MM-DD)
        Répondez UNIQUEMENT avec un JSON valide, sans texte supplémentaire. Si une info manque, mettez null.`
      : `Analyze this receipt or screenshot image. Extract in structured JSON:
        - company: company name or domain (e.g., "Amazon" or "amazon.com")
        - productName: product/service name
        - productValue: value as number (e.g., 49.99)
        - orderNumber: order number
        - purchaseDate: purchase date in ISO format (YYYY-MM-DD)
        Respond ONLY with valid JSON, no extra text. Use null for missing info.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || "{}";
    
    // Parse the JSON response from GPT
    let extracted;
    try {
      extracted = JSON.parse(extractedText);
    } catch {
      throw new Error("Failed to parse extracted data from OpenAI");
    }

    // Ensure all fields are present (with nulls)
    const result = {
      company: extracted.company || null,
      productName: extracted.productName || null,
      productValue: extracted.productValue ? parseFloat(extracted.productValue) : null,
      orderNumber: extracted.orderNumber || null,
      purchaseDate: extracted.purchaseDate || null,
    };

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("OCR Analyze Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});