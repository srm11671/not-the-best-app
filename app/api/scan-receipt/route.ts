import { NextResponse } from "next/server"

// Sends a receipt photo to Claude's vision API and asks for structured
// JSON back: restaurant name, line items with prices, and a total.
// This only extracts what the receipt literally says -- it never
// infers or guesses a rating, since a receipt can't say whether the
// food was good. The person still rates everything themselves.
// Drinks/beverages are deliberately excluded from "items" -- this app
// tracks food dishes, not what was ordered to drink.

export async function POST(request: Request) {
  try {
    const { image, mediaType } = await request.json()

    if (!image || !mediaType) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Receipt scanning is not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image },
              },
              {
                type: "text",
                text: `Read this restaurant receipt. Respond with ONLY valid JSON, no other text, in exactly this shape:
{
  "restaurant": "name as printed, or null if not visible",
  "address": "the street address or location line as printed on the receipt, or null if not visible",
  "items": [{ "name": "item name", "price": 0.00 }],
  "total": 0.00,
  "date": "YYYY-MM-DD or null if not visible"
}
"items" must only include FOOD dishes (appetizers, entrees, sides, desserts). Do NOT include drinks or beverages of any kind -- no soda, coffee, tea, water, juice, beer, wine, cocktails, or any other alcohol. Skip those lines entirely, even though they were paid for. "total" should still be the full receipt total including drinks, tax, and tip. Only include items and amounts that are actually printed on the receipt. Do not invent or guess anything. If a field isn't visible, use null.`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Anthropic API error:", errText)
      return NextResponse.json({ error: "Could not read receipt" }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ""
    const cleaned = text.replace(/```json|```/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "Could not parse receipt data" }, { status: 502 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Receipt scan error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
