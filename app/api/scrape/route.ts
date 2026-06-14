import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ title: "", description: "" });
    }

    // Add common browser headers to prevent sites from blocking our crawler request
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 3600 } // Cache results for 1 hour to prevent rate limits
    });

    if (!response.ok) {
      return NextResponse.json({ title: "", description: "" });
    }

    const html = await response.text();

    // Safer Regex Matching that won't crash if tags are missing
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i);

    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "";
    const description = descMatch && descMatch[1] ? descMatch[1].trim() : "";

    // Clean up HTML entities like &amp; or &quot; if they exist in the metadata
    const cleanTitle = title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const cleanDesc = description.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    return NextResponse.json({ title: cleanTitle, description: cleanDesc });
  } catch (error) {
    console.error("Scraper Error:", error);
    // Return empty strings instead of error codes so the user interface never gets stuck blank
    return NextResponse.json({ title: "", description: "" });
  }
}