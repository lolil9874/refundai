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

    const LOGO_DEV_API_KEY = Deno.env.get("LOGO_DEV_API_KEY");
    if (!LOGO_DEV_API_KEY) {
      throw new Error("LOGO_DEV_API_KEY is not set in Supabase secrets.");
    }

    const searchUrl = new URL("https://api.logo.dev/v1/search");
    searchUrl.searchParams.set("query", query);

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${LOGO_DEV_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Logo.dev API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
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