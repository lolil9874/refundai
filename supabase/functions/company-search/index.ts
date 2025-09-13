// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // IMPORTANT: User needs to set this secret in Supabase project settings
    const CLEAROUT_API_KEY = Deno.env.get("CLEAROUT_API_KEY");
    if (!CLEAROUT_API_KEY) {
      throw new Error("CLEAROUT_API_KEY is not set in Supabase secrets.");
    }

    const response = await fetch("https://api.clearout.io/v2/company/autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLEAROUT_API_KEY}`,
      },
      body: JSON.stringify({ name: query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse JSON error from Clearout
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Clearout API error: ${response.status} - ${errorJson.error?.message || errorText}`);
      } catch {
        throw new Error(`Clearout API error: ${response.status} ${errorText}`);
      }
    }

    const data = await response.json();
    
    // The API returns a `data` object which contains a `results` array.
    // We need to map this to the format our frontend expects: { name, domain, logo }[]
    const results = data?.data?.results || [];
    const formattedResults = results.map(item => ({
      name: item.name,
      domain: item.domain,
      logo: item.logo,
    }));

    return new Response(JSON.stringify(formattedResults), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in company-search function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});