import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const prompt = `Analyze this bill or invoice image and extract the expense information.
Return ONLY a valid JSON object with no markdown, no backticks, no explanation — just raw JSON.

Required fields:
{
  "amount": <number — total amount, e.g. 1250.00>,
  "date": <string — YYYY-MM-DD format, use today if not visible>,
  "purpose": <string — one of: "Rent", "Utilities", "Groceries", "Salary", "Marketing", "Supplies", "Transport", "Maintenance", "Other">,
  "remarks": <string — brief description, vendor name or item summary, max 60 chars>,
  "confidence": <number — 0 to 1>
}

Rules:
- amount must be a positive number
- If multiple items, sum into total amount
- date must be YYYY-MM-DD
- remarks max 60 characters`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mediaType ?? "image/jpeg",
                    data: imageBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // low temp = more consistent JSON
            maxOutputTokens: 512,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "Failed to analyze image" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip accidental markdown fences
    const clean = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const extracted = JSON.parse(clean);

    return NextResponse.json({ success: true, data: extracted });
  } catch (err) {
    console.error("extract-expense error:", err);
    return NextResponse.json(
      { error: "Failed to extract expense data from image" },
      { status: 500 },
    );
  }
}
