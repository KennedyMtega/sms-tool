import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";

export async function GET() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("campaigns").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
} 