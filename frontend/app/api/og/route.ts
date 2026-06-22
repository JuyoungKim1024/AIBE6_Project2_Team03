import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "no url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const getMeta = (names: string[]) => {
      for (const name of names) {
        const m =
          html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")) ||
          html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"));
        if (m?.[1]) return m[1];
      }
      return null;
    };

    const title = getMeta(["og:title", "twitter:title"]) || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
    const description = getMeta(["og:description", "twitter:description", "description"]);
    const image = getMeta(["og:image", "twitter:image"]);
    const hostname = new URL(url).hostname;

    return NextResponse.json({ url, title, description, image, hostname });
  } catch {
    try {
      const hostname = new URL(url).hostname;
      return NextResponse.json({ url, title: null, description: null, image: null, hostname });
    } catch {
      return NextResponse.json({ url, title: null, description: null, image: null, hostname: url });
    }
  }
}
