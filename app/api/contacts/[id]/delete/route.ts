import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 