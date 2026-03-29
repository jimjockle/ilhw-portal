import { NextResponse } from "next/server";

// Levenshtein distance implementation
function levenshteinDistance(a, b) {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  const matrix = [];

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

// Calculate similarity score (0-1, where 1 is identical)
function calculateSimilarity(a, b) {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1 - distance / maxLength;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { business_name, town } = body;

    if (
      !business_name ||
      typeof business_name !== "string" ||
      !town ||
      typeof town !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid business_name or town" },
        { status: 400 }
      );
    }

    // Fetch the dataset
    const datasetUrl =
      process.env.NEXT_PUBLIC_DATASET_URL ||
      "https://ilhw-chatbot.vercel.app/dataset.json";

    let allBusinesses = [];
    try {
      const res = await fetch(datasetUrl, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.businesses)) {
          allBusinesses = data.businesses;
        }
      }
    } catch (fetchErr) {
      // Dataset unavailable — return empty matches
      return NextResponse.json({
        duplicates: [],
        is_likely_duplicate: false,
      });
    }

    // Find candidates in the same town
    const townCandidates = allBusinesses.filter(
      (b) =>
        b.town &&
        b.town.toLowerCase() === town.toLowerCase() &&
        b.name &&
        b.name.toLowerCase() !== business_name.toLowerCase()
    );

    // Calculate similarity scores
    const matches = townCandidates
      .map((candidate) => ({
        name: candidate.name,
        town: candidate.town,
        address: candidate.address || "",
        similarity_score: calculateSimilarity(business_name, candidate.name),
      }))
      .filter((match) => match.similarity_score > 0.7)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 10);

    const is_likely_duplicate = matches.length > 0;

    return NextResponse.json({
      duplicates: matches,
      is_likely_duplicate,
    });
  } catch (err) {
    console.error("Dedup API error:", err);
    return NextResponse.json(
      {
        error: "Failed to check for duplicates",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
