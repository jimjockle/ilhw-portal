import { NextResponse } from "next/server";

// Rate limiting for extract API: 5 requests per minute per IP
const rateMap = new Map();
const RATE_LIMIT = 5;
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

// Supported file types and size limits
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const notes = formData.get("notes") || "";

    // Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Supported types: JPEG, PNG, WebP, HEIC",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // Determine MIME type for API
    const mimeType = file.type;

    // Check API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "placeholder-key") {
      // Return mock response for testing
      return NextResponse.json({
        extracted_data: {
          business_name: "Sample Business",
          address: "123 Main St",
          town: "Sample Town",
          phone: "",
          website: "",
          hours: "",
          category: "Retail",
          subcategory: "Boutique",
          keywords: ["sample", "business"],
          description:
            "This is a mock extraction. Configure your ANTHROPIC_API_KEY to see real results.",
          social_media: "",
          events: [],
          pricing_notes: "",
        },
        confidence_score: 0.65,
        note: "Mock response - API key not configured",
      });
    }

    // Build the system prompt
    const systemPrompt = `You are a business data extraction expert. Your task is to extract all visible business information from images of business cards, flyers, storefronts, or other marketing materials.

Extract and return ONLY a valid JSON object with these exact fields:
- business_name: string
- address: string
- town: string
- phone: string
- website: string
- hours: string (business hours if visible)
- category: string (one of: Home Services, Personal Services, Health & Fitness, Food & Dining, Arts & Creative, Youth Programs, Financial & Insurance, Retail, Professional Services, Automotive, Education, Entertainment, Community)
- subcategory: string (be specific, e.g., "Painting", "Music Instruction", "Boutique Fitness")
- keywords: array of strings
- description: string (a natural 1-2 sentence description based on what you see)
- social_media: string (social media handles if visible)
- events: array of objects with {name, date, type} fields
- pricing_notes: string (any pricing or cost information visible)

If a field is not visible in the image, use empty string for text fields, empty array for array fields.
Return ONLY the JSON object, no other text.`;

    // Build the user prompt
    const userPrompt = `Extract all business information visible in this image. Return a JSON object with the specified fields. If additional context is provided, use it to help disambiguate or categorize the business.${notes ? `\n\nAdditional context: ${notes}` : ""}`;

    // Call Anthropic Claude API with vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: "Failed to extract data from image",
          details: errorData.error?.message || "Unknown error",
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const responseText = result.content?.[0]?.text || "";

    // Parse the JSON response
    let extracted_data;
    try {
      extracted_data = JSON.parse(responseText);
    } catch (parseErr) {
      // Try to extract JSON from the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          extracted_data = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json(
            {
              error: "Failed to parse extracted data",
              details: "Response was not valid JSON",
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Failed to parse extracted data",
            details: "No JSON object found in response",
          },
          { status: 400 }
        );
      }
    }

    // Validate required fields exist
    if (!extracted_data.business_name) {
      extracted_data.business_name = "";
    }
    if (!extracted_data.address) {
      extracted_data.address = "";
    }
    if (!extracted_data.town) {
      extracted_data.town = "";
    }
    if (!extracted_data.phone) {
      extracted_data.phone = "";
    }
    if (!extracted_data.website) {
      extracted_data.website = "";
    }
    if (!extracted_data.hours) {
      extracted_data.hours = "";
    }
    if (!extracted_data.category) {
      extracted_data.category = "Retail";
    }
    if (!extracted_data.subcategory) {
      extracted_data.subcategory = "";
    }
    if (!Array.isArray(extracted_data.keywords)) {
      extracted_data.keywords = [];
    }
    if (!extracted_data.description) {
      extracted_data.description = "";
    }
    if (!extracted_data.social_media) {
      extracted_data.social_media = "";
    }
    if (!Array.isArray(extracted_data.events)) {
      extracted_data.events = [];
    }
    if (!extracted_data.pricing_notes) {
      extracted_data.pricing_notes = "";
    }

    // Calculate confidence score (simple heuristic)
    let confidence = 0.5;
    if (extracted_data.business_name) confidence += 0.15;
    if (extracted_data.address && extracted_data.town) confidence += 0.15;
    if (extracted_data.phone) confidence += 0.1;
    if (extracted_data.website) confidence += 0.05;
    if (extracted_data.category) confidence += 0.1;

    return NextResponse.json({
      extracted_data,
      confidence_score: Math.min(confidence, 1.0),
    });
  } catch (err) {
    console.error("Extract API error:", err);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
