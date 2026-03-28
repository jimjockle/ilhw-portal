import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { query, businessId, businessName, businessTown } = await request.json();

    if (!query || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return a mock response if no API key configured
      return NextResponse.json({
        response: `Based on your search for "${query}", I'd recommend ${businessName} in ${businessTown || "Westchester"}. This is a preview of how the chatbot would describe your business. Configure your ANTHROPIC_API_KEY to see real responses.`,
        position: 1,
      });
    }

    // Fetch the dataset to find the business and run a mini search
    const datasetUrl = process.env.NEXT_PUBLIC_DATASET_URL || "https://ilhw-chatbot.vercel.app/dataset.json";
    let datasetBusinesses = [];
    try {
      const res = await fetch(datasetUrl);
      const data = await res.json();
      datasetBusinesses = data.businesses || [];
    } catch (e) {
      console.error("Dataset fetch failed:", e);
    }

    // Find the target business and nearby competitors
    const target = datasetBusinesses.find(b => b.name === businessId) || { name: businessName, town: businessTown };
    const queryLower = query.toLowerCase();
    const sameCategory = datasetBusinesses
      .filter(b => b.subcategory === target.subcategory && b.town === (businessTown || target.town))
      .slice(0, 10);

    // Find the position of our business
    const position = sameCategory.findIndex(b => b.name === businessId) + 1 || 1;

    // Build context for Claude
    const contextEntries = sameCategory.slice(0, 5).map(b =>
      `- ${b.name} | ${b.address || ""} | ${b.subcategory || ""} | ${b.description || ""}`
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
          content: `User query: "${query}"\n\nRelevant businesses:\n${contextEntries}\n\nProvide a helpful response that naturally mentions these businesses, especially ${businessName}.`,
        }],
      }),
    });

    const result = await response.json();
    const text = result.content?.[0]?.text || "Preview unavailable.";

    return NextResponse.json({ response: text, position });
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json({
      response: "Preview temporarily unavailable. Please try again.",
      position: null,
    }, { status: 500 });
  }
}
