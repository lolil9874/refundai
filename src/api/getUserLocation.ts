import { supabase as supabaseClient } from "@/lib/supabase";

type LocationResponse = {
  country: string;
};

export async function getUserLocation(): Promise<LocationResponse> {
  const supabase = supabaseClient;
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<LocationResponse>("get-user-location");

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No data returned from the location function.");
  }

  return data;
}