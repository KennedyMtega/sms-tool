import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 