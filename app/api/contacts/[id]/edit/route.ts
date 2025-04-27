import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseClient();
  const updates = await request.json();
  const { data, error } = await supabase.from("contacts").update(updates).eq("id", params.id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ contact: data });
} 