import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";

export async function POST() {
  const supabase = getSupabaseClient();
  // Fetch business info from settings
  const { data: settings } = await supabase.from("settings").select("*").single();
  const businessName = settings?.businessName || "your business";
  const businessType = settings?.businessType || "business";
  const products = settings?.products || "products/services";
  const description = settings?.description || "";
  // Compose prompt
  const prompt = `Generate a short, engaging SMS marketing campaign message for ${businessName}, a ${businessType}. Mention our products/services: ${products}. ${description} Keep it under 160 characters and include a call to action.`;
  // Call OpenAI or similar AI service (replace with your actual AI integration)
  // For demonstration, we'll return a static message
  // Replace this with your actual AI call
  const aiMessage = `Don't miss out! Shop ${products} at ${businessName} today. Limited time offer! Reply STOP to opt out.`;
  return NextResponse.json({ message: aiMessage });
} 