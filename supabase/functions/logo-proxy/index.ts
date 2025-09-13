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
    const url = new URL(req.url);
    const domain = url.searchParams.get("domain");

    if (!domain) {
      return new Response(JSON.stringify({ error: "Domain parameter is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch the logo from Clearbit on the server-side
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    const response = await fetch(logoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      return new Response("Logo not found", {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    // Stream the image back to the client
    const imageBlob = await response.blob();
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", response.headers.get("Content-Type") || "image/png");
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    return new Response(imageBlob, { status: 200, headers });

  } catch (error) {
    console.error("Error in logo-proxy function:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});