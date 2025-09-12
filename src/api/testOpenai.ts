import { supabase as supabaseClient } from "@/lib/supabase";

type TestOpenaiPayload = {
  prompt: string;
};

type TestOpenaiResponse = {
  response: string;
};

const FN_NAME = "test-openai";

export async function testOpenai(payload: TestOpenaiPayload): Promise<TestOpenaiResponse> {
  const supabase = supabaseClient;
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<TestOpenaiResponse>(FN_NAME, {
    body: payload,
  });

  if (error) {
    const functionErrorMessage = (error as any)?.context?.body?.error || error.message;
    throw new Error(functionErrorMessage);
  }

  if (!data) {
    throw new Error("No data returned from the function.");
  }

  return data;
}