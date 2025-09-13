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

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Query parameter is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2 || trimmedQuery.length > 64) {
      return new Response(JSON.stringify({ error: "Query must be between 2 and 64 characters." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const clearbitUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(trimmedQuery)}`;
    
    let response;
    try {
      response = await fetch(clearbitUrl, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Upstream Clearbit API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Rewrite the logo URLs to use our proxy
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const rewrittenData = (data || []).map(company => ({
      ...company,
      logo: `${supabaseUrl}/functions/v1/logo-proxy?domain=${company.domain}`
    }));

    return new Response(JSON.stringify(rewrittenData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Upstream error: The request to Clearbit timed out." }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.error("Error in company-search function:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});