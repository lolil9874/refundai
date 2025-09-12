import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateRefund } from "@/api/generateRefund";
import { ensureSupabaseConfigured } from "@/lib/supabase";

type Check = {
  name: string;
  status: "idle" | "running" | "ok" | "error";
  detail?: string;
  durationMs?: number;
};

type Meta = {
  traceId?: string;
  timings?: {
    totalMs?: number;
    openAIMs?: number;
  };
  received?: Record<string, unknown>;
};

export default function Diagnostics() {
  const [checks, setChecks] = React.useState<Check[]>([
    { name: "Env variables present (VITE_SUPABASE_URL/ANON_KEY)", status: "idle" },
    { name: "Supabase client configured", status: "idle" },
    { name: "Edge Function round trip (generate-refund)", status: "idle" },
  ]);

  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [resultSummary, setResultSummary] = React.useState<string>("");

  const runChecks = async () => {
    setMeta(null);
    setResultSummary("");
    setChecks((prev) => prev.map((c) => ({ ...c, status: "idle", detail: undefined, durationMs: undefined })));

    // 1) Env presence
    setChecks((prev) => prev.map((c, i) => (i === 0 ? { ...c, status: "running" } : c)));
    const t0 = performance.now();
    const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (url && anon) {
      setChecks((prev) =>
        prev.map((c, i) =>
          i === 0 ? { ...c, status: "ok", detail: `URL and anon key detected`, durationMs: performance.now() - t0 } : c
        )
      );
    } else {
      setChecks((prev) =>
        prev.map((c, i) =>
          i === 0 ? { ...c, status: "error", detail: "Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY", durationMs: performance.now() - t0 } : c
        )
      );
      return;
    }

    // 2) Supabase client configured
    setChecks((prev) => prev.map((c, i) => (i === 1 ? { ...c, status: "running" } : c)));
    const t1 = performance.now();
    try {
      ensureSupabaseConfigured();
      setChecks((prev) =>
        prev.map((c, i) => (i === 1 ? { ...c, status: "ok", detail: "Client instantiated", durationMs: performance.now() - t1 } : c))
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setChecks((prev) =>
        prev.map((c, i) => (i === 1 ? { ...c, status: "error", detail: msg, durationMs: performance.now() - t1 } : c))
      );
      return;
    }

    // 3) Edge function round trip (includes OpenAI)
    setChecks((prev) => prev.map((c, i) => (i === 2 ? { ...c, status: "running" } : c)));
    const t2 = performance.now();
    try {
      const payload = {
        companyDomain: "amazon.com",
        companyDisplayName: "Amazon",
        locale: "en" as const,
        country: "US",
        firstName: "Diag",
        lastName: "Tester",
        productName: "Test Product",
        productValue: 12.34,
        orderNumber: "TEST-ORDER-123",
        purchaseDateISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        issueCategory: "product" as const,
        issueType: "Not received",
        description: "This is a diagnostic request to verify the end-to-end flow.",
        tone: 50,
        hasImage: false,
      };

      const res = await generateRefund(payload);
      const durationMs = performance.now() - t2;

      const subjectLen = (res?.subject || "").length;
      const bodyLen = (res?.body || "").length;
      setResultSummary(`Received subject (${subjectLen} chars) and body (${bodyLen} chars).`);

      // Try to pick meta if available
      const anyRes = res as unknown as { meta?: Meta };
      if (anyRes?.meta) setMeta(anyRes.meta);

      setChecks((prev) =>
        prev.map((c, i) =>
          i === 2
            ? {
                ...c,
                status: "ok",
                detail: `Function responded successfully`,
                durationMs,
              }
            : c
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setChecks((prev) =>
        prev.map((c, i) => (i === 2 ? { ...c, status: "error", detail: msg, durationMs: performance.now() - t2 } : c))
      );
    }
  };

  const colorFor = (status: Check["status"]) => {
    switch (status) {
      case "ok":
        return "bg-emerald-500";
      case "error":
        return "bg-red-500";
      case "running":
        return "bg-amber-500";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This tool verifies your environment, Supabase client, and the end-to-end Edge Function call to OpenAI.
            Nothing runs until you click the button below.
          </p>

          <Button onClick={runChecks} className="w-full sm:w-auto">
            Run checks
          </Button>

          <div className="space-y-3 pt-2">
            {checks.map((c) => (
              <div key={c.name} className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div className="space-y-1">
                  <div className="font-medium">{c.name}</div>
                  {c.detail && <div className="text-sm text-muted-foreground">{c.detail}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {typeof c.durationMs === "number" && (
                    <Badge variant="secondary">{Math.round(c.durationMs)} ms</Badge>
                  )}
                  <span className={`h-2.5 w-2.5 rounded-full ${colorFor(c.status)}`} />
                </div>
              </div>
            ))}
          </div>

          {resultSummary && <div className="text-sm">{resultSummary}</div>}

          {meta && (
            <div className="rounded-md border p-3">
              <div className="font-medium mb-2">Server meta</div>
              <pre className="text-xs overflow-auto max-h-72">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Tip: You can also view function logs in your Supabase dashboard (Edge Functions logs) using the traceId when available.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}