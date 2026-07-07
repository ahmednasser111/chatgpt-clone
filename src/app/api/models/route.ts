import { NextResponse } from "next/server";
import { listAvailableModels } from "@/lib/ai";

export function GET() {
  return NextResponse.json({ models: listAvailableModels() });
}
