import { NextResponse } from "next/server";

// Simple in-memory rate limiting (per IP, 10 requests per minute)
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return false;
  return true;
}

// Cleanup stale entries every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now - entry.start > RATE_WINDOW * 2) rateMap.delete(ip);
  }
}, 5 * 60 * 1000);

export async function POST(request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await request.json();
    const { query, businessId, businessName, businessTown } = body;

    if (!query || typeof query !== "string" || !businessName || typeof businessName !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Sanitize inputs (max length)
    const safeQuery = query.slice(0, 200).replace(/<[^>]*>/g, "");
    const safeName = businessName.slice(0, 255).replace(/<[^>]*>/g, "");
    const safeTown = (businessTown || "").slice(0, 100).replace(/<[^>]*>/g, "");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "placeholder-key") {
      return NextResponse.json({
        response: `Based on your search for "${safeQuery}", I'd recommend ${safeName} in ${safeTown || "Westchester"}. This is a preview of how the chatbot would describe your business. Configure your ANTHROPIC_API_KEY to see real responses.`,
        position: 1,
      });
    }

    // Fetch the dataset to find the business and run a mini search
    const datasetUrl = process.env.NEXT_PUBLIC_DATASET_URL || "https://ilhw-chatbot.vercel.app/dataset.json";
    let datasetBusinesses = [];
    try {
      const res = await fetch(datasetUrl, { next: { revalidate: 300 } }); // Cache for 5 min
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.businesses)) {
          datasetBusinesses = data.businesses;
        }
      }
    } catch (e) {
      // Dataset unavailable — continue with limited context
    }

    // Find the target business and nearby competitors
    const target = datasetBusinesses.find(b => b.name === businessId) || { name: safeName, town: safeTown };
    const sameCategory = datasetBusinesses
      .filter(b => b.subcategory === target.subcategory && b.town === (safeTown || target.town))
      .slice(0, 10);

    const position = sameCategory.findIndex(b => b.name === businessId) + 1 || 1;

    const contextEntries = sameCategory.slice(0, 5).map(b =>
      `- ${(b.name || "").slice(0, 100)} | ${(b.address || "").slice(0, 200)} | ${b.subcategory || ""} | ${(b.description || "").slice(0, 300)}`
    ).join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are the I Live Here Westchester chatbot. You help people find local businesses and things to do in Westchester County, NY. Be warm, concise, and specific. Always mention the business name, address, and key details. Keep responses under 4 sentences.`,
        messages: [{
          role: "user",
          content: `User query: "${safeQuery}"\n\nRelevant businesses:\n${contextEntries}\n\nProvide a helpful response that naturally mentions these businesses, especially ${safeName}.`,
        }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        response: "Preview temporarily unavailable. The AI service may be experiencing issues.",
        position,
      });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "Preview unavailable.";

    return NextResponse.json({ response: text, position });
  } catch (err) {
    return NextResponse.json({
      response: "Preview temporarily unavailable. Please try again.",
      position: null,
    }, { status: 503 });
  }
}
