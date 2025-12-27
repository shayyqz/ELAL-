const FEED_URL = "https://www.ynet.co.il/Integration/StoryRss1854.xml";

let cache = { ts: 0, data: null };

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripCdata(str) {
  return str.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function extractItemsFromRss(xml, limit) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;

  while ((m = itemRegex.exec(xml)) && items.length < limit) {
    const itemXml = m[1];

    const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(itemXml);
    const linkMatch  = /<link\b[^>]*>([\s\S]*?)<\/link>/i.exec(itemXml);

    let title = titleMatch ? stripCdata(titleMatch[1].trim()) : "";
    let link  = linkMatch  ? stripCdata(linkMatch[1].trim())  : "";

    title = decodeHtmlEntities(title).replace(/\s+/g, " ").trim();
    link  = decodeHtmlEntities(link).replace(/\s+/g, "").trim();

    if (title && link) items.push({ title, link });
  }
  return items;
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const limit = Math.max(1, Math.min(parseInt(params.limit || "8", 10) || 8, 20));

    const now = Date.now();
    if (cache.data && now - cache.ts < 5 * 60 * 1000) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" },
        body: JSON.stringify({ source: "cache", items: cache.data.slice(0, limit) }),
      };
    }

    const res = await fetch(FEED_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Netlify Function)",
        "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: "Failed to fetch RSS", status: res.status }),
      };
    }

    const xml = await res.text();
    const items = extractItemsFromRss(xml, limit);

    cache = { ts: now, data: items };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" },
      body: JSON.stringify({ source: "live", items }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "Server error", message: String(err?.message || err) }),
    };
  }
};
