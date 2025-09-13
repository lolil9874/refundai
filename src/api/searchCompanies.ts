import { supabase as supabaseClient } from "@/lib/supabase";

export type CompanySearchResult = {
  name: string;
  domain: string;
  logo: string;
};

export async function searchCompanies(query: string): Promise<CompanySearchResult[]> {
  if (query.trim().length < 2) {
    return [];
  }

  const supabase = supabaseClient;
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<CompanySearchResult[]>("company-search", {
    body: { query },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}