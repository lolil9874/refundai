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

    // 1. Input Validation
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

    // 2. Fetch from Clearbit with a 3-second timeout
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

    // 3. Return the data from Clearbit
    // The format is already { name, domain, logo }[], which is perfect.
    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    // Handle specific errors for better client-side feedback
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Upstream error: The request to Clearbit timed out." }), {
        status: 502, // Bad Gateway
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