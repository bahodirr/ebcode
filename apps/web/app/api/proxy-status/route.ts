import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 5000;

async function ping(url: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method, signal: controller.signal });
    return res.status;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const status = await ping(url, "HEAD");
    if (status === 405) {
      return NextResponse.json({ status: await ping(url, "GET") });
    }
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: 503 });
  }
}

