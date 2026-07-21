import { renderHome } from "./home.js";

const BING_API = "https://www.bing.com/HPImageArchive.aspx";
const BING_ORIGIN = "https://www.bing.com";
const DEFAULT_MKT = "zh-CN";
const API_CACHE_SECONDS = 3600;
const R2_PREFIX = "bing-img/";
const R2_PUBLIC_ORIGIN = "https://img.wuw.li";
const PUBLIC_ORIGIN = "https://bing-img.wuw.li";
const STANDARD_SIZES = new Set(["1920x1080", "1080x1920", "1366x768", "800x480", "400x240"]);
const MOBILE_UA = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|Windows Phone|webOS|Symbian|Kindle|Silk|Bada/i;
const FALLBACK_BASE = "/th?id=OHR.SnowyMountains_ZH-CN9869777329";

function integerParam(value, fallback, minimum, maximum) {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function marketParam(value) {
  return value && /^[A-Za-z]{2}(?:-[A-Za-z]{2})?$/.test(value) ? value : DEFAULT_MKT;
}

function isMobile(request) {
  return MOBILE_UA.test(request.headers.get("user-agent") || "");
}

function imageUrl(urlbase, width, height) {
  const size = `${width}x${height}`;
  if (STANDARD_SIZES.has(size)) return `${BING_ORIGIN}${urlbase}_${size}.jpg`;
  const url = new URL(`${BING_ORIGIN}${urlbase}_UHD.jpg`);
  url.searchParams.set("w", String(width));
  url.searchParams.set("h", String(height));
  url.searchParams.set("rs", "1");
  url.searchParams.set("c", "4");
  return url.toString();
}

function fallbackImageUrl(width, height) {
  return imageUrl(FALLBACK_BASE, width, height);
}

async function fetchBingData(idx, n, mkt, ctx) {
  const api = new URL(BING_API);
  api.searchParams.set("format", "js");
  api.searchParams.set("idx", String(idx));
  api.searchParams.set("n", String(n));
  api.searchParams.set("mkt", mkt);

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(api.toString(), { method: "GET" });
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit.json();
  }

  const upstream = await fetch(api, {
    headers: { "User-Agent": "Mozilla/5.0 BingWallpaperWorker/1.0", Accept: "application/json" },
  });
  if (!upstream.ok) throw new Error(`Bing API returned ${upstream.status}`);

  const cachedResponse = new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${API_CACHE_SECONDS}`,
    },
  });
  if (cache && ctx) ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
  return cachedResponse.json();
}

async function currentImage(request, ctx, defaultWidth, defaultHeight) {
  const url = new URL(request.url);
  const idx = integerParam(url.searchParams.get("idx"), 0, 0, 7);
  const width = integerParam(url.searchParams.get("w"), defaultWidth, 1, 7680);
  const height = integerParam(url.searchParams.get("h"), defaultHeight, 1, 7680);
  const mkt = marketParam(url.searchParams.get("mkt"));
  try {
    const data = await fetchBingData(idx, 1, mkt, ctx);
    const urlbase = data?.images?.[0]?.urlbase;
    return { url: urlbase ? imageUrl(urlbase, width, height) : fallbackImageUrl(width, height), width, height };
  } catch (error) {
    console.error(JSON.stringify({ event: "bing_api_error", message: String(error) }));
    return { url: fallbackImageUrl(width, height), width, height };
  }
}

function redirect(location, cacheControl = "public, max-age=300") {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": cacheControl },
  });
}

async function proxyImage(image, headers = {}) {
  const upstream = await fetch(image, {
    headers: { "User-Agent": "Mozilla/5.0 BingWallpaperWorker/1.0", Accept: "image/*" },
    redirect: "follow",
  });
  const type = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !type.toLowerCase().startsWith("image/")) {
    return new Response("Image upstream failed", { status: 502 });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600",
      ...headers,
    },
  });
}

async function handleAuto(request, ctx) {
  const mobile = isMobile(request);
  const current = await currentImage(request, ctx, mobile ? 1080 : 1920, mobile ? 1920 : 1080);
  return proxyImage(current.url, { Vary: "User-Agent" });
}

async function handleRedirect(request, ctx, defaults) {
  const current = await currentImage(request, ctx, defaults[0], defaults[1]);
  return redirect(current.url);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, max-age=${API_CACHE_SECONDS}`,
    },
  });
}

async function handleInfo(request, ctx) {
  const url = new URL(request.url);
  const idx = integerParam(url.searchParams.get("idx"), 0, 0, 7);
  const n = integerParam(url.searchParams.get("n"), 1, 1, 8);
  const mkt = marketParam(url.searchParams.get("mkt"));
  try {
    const data = await fetchBingData(idx, n, mkt, ctx);
    if (!Array.isArray(data?.images) || data.images.length === 0) throw new Error("Bing API returned no images");
    const origin = PUBLIC_ORIGIN;
    const result = data.images.map((image, offset) => {
      const date = image.startdate || "";
      const base = image.urlbase || "";
      return {
        date: date.length >= 8 ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : date,
        startdate: date,
        copyright: image.copyright || "",
        title: image.title || "",
        url: `${BING_ORIGIN}${image.url || ""}`,
        urlbase: `${BING_ORIGIN}${base}`,
        pc_url: imageUrl(base, 1920, 1080),
        mobile_url: imageUrl(base, 1080, 1920),
        api_auto: `${origin}/auto_302.php?idx=${idx + offset}`,
        api_pc: `${origin}/1920x1080_302.php?idx=${idx + offset}`,
        api_mobile: `${origin}/m_302.php?idx=${idx + offset}`,
      };
    });
    return json({ code: 200, msg: "success", count: result.length, data: result });
  } catch (error) {
    console.error(JSON.stringify({ event: "bing_info_error", message: String(error) }));
    return json({ code: 500, msg: "获取壁纸数据失败", data: null }, 502);
  }
}

function randomIndex(length) {
  if (length < 2) return 0;
  const ceiling = Math.floor(0x100000000 / length) * length;
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= ceiling);
  return value[0] % length;
}

async function handleRandom(request, env, ctx) {
  const mobile = isMobile(request);
  if (env.BING_IMAGES) {
    try {
      const listed = await env.BING_IMAGES.list({ prefix: R2_PREFIX, limit: 1000 });
      const pattern = mobile ? /^bing-img\/\d{4}-\d{2}-\d{2}-mobile\.jpg$/ : /^bing-img\/\d{4}-\d{2}-\d{2}\.jpg$/;
      const objects = listed.objects.filter((object) => pattern.test(object.key) && object.size > 10000);
      if (objects.length) {
        const selected = objects[randomIndex(objects.length)];
        return redirect(`${R2_PUBLIC_ORIGIN}/${selected.key.split("/").map(encodeURIComponent).join("/")}`, "no-store");
      }
    } catch (error) {
      console.error(JSON.stringify({ event: "r2_random_error", message: String(error) }));
    }
  }
  const current = await currentImage(request, ctx, mobile ? 1080 : 1920, mobile ? 1920 : 1080);
  return redirect(current.url, "no-store");
}

async function saveDailyImages(env, ctx) {
  if (!env.BING_IMAGES) return;
  const data = await fetchBingData(0, 1, DEFAULT_MKT, ctx);
  const image = data?.images?.[0];
  if (!image?.urlbase || !/^\d{8}$/.test(image.startdate || "")) throw new Error("Bing API returned invalid daily image data");
  const date = `${image.startdate.slice(0, 4)}-${image.startdate.slice(4, 6)}-${image.startdate.slice(6, 8)}`;
  const variants = [
    { key: `${R2_PREFIX}${date}.jpg`, url: imageUrl(image.urlbase, 1920, 1080) },
    { key: `${R2_PREFIX}${date}-mobile.jpg`, url: imageUrl(image.urlbase, 1080, 1920) },
  ];
  for (const variant of variants) {
    if (await env.BING_IMAGES.head(variant.key)) continue;
    const response = await fetch(variant.url, { headers: { "User-Agent": "Mozilla/5.0 BingWallpaperWorker/1.0", Accept: "image/*" } });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) throw new Error(`Daily image fetch failed: ${response.status}`);
    await env.BING_IMAGES.put(variant.key, response.body, {
      httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { source: "Bing", date: image.startdate },
    });
  }
}

async function handleDownload(request) {
  const requested = new URL(request.url).searchParams.get("url") || "";
  let image;
  try {
    image = new URL(requested);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }
  if (image.protocol !== "https:" || !["www.bing.com", "cn.bing.com"].includes(image.hostname) || image.username || image.password || image.port) {
    return new Response("Invalid image URL", { status: 400 });
  }
  const name = `bing-wallpaper-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}.jpg`;
  return proxyImage(image.toString(), {
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `attachment; filename="${name}"`,
  });
}

async function handleHome(_request, ctx) {
  let images = [];
  try {
    const data = await fetchBingData(0, 8, DEFAULT_MKT, ctx);
    images = Array.isArray(data?.images) ? data.images : [];
  } catch (error) {
    console.error(JSON.stringify({ event: "bing_home_error", message: String(error) }));
  }
  return new Response(renderHome(images), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}

export async function route(request, env = {}, ctx) {
  if (!["GET", "HEAD"].includes(request.method)) return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  let response;
  switch (path) {
    case "/":
    case "/index.php": response = await handleHome(request, ctx); break;
    case "/auto.php": response = await handleAuto(request, ctx); break;
    case "/auto_302.php": {
      const mobile = isMobile(request);
      response = await handleRedirect(request, ctx, mobile ? [1080, 1920] : [1920, 1080]);
      response.headers.set("Vary", "User-Agent");
      break;
    }
    case "/m_302.php": response = await handleRedirect(request, ctx, [1080, 1920]); break;
    case "/1920x1080_302.php": response = await handleRedirect(request, ctx, [1920, 1080]); break;
    case "/1366x768_302.php": response = await handleRedirect(request, ctx, [1366, 768]); break;
    case "/func.php": response = await handleInfo(request, ctx); break;
    case "/download.php": response = await handleDownload(request); break;
    case "/random.php": response = await handleRandom(request, env, ctx); break;
    default: response = new Response("Not Found", { status: 404 });
  }
  if (request.method === "HEAD") return new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers });
  return response;
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (error) {
      console.error(JSON.stringify({ event: "unhandled_error", message: String(error) }));
      return new Response("Internal Server Error", { status: 500 });
    }
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(saveDailyImages(env, ctx));
  },
};
