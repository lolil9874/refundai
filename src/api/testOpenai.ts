import { ensureSupabaseConfigured } from "@/lib/supabase";

export async function testOpenai(prompt: string): Promise<any> {
  const supabase = ensureSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke("test-openai", {
    body: { prompt },
  });

  if (error) {
    const functionErrorMessage = (error as any)?.context?.body?.error || error.message;
    throw new Error(functionErrorMessage);
  }

  return data;
}