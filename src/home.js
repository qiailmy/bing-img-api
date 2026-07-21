const PUBLIC_ORIGIN = "https://bing-img.wuw.li";
const BING_ORIGIN = "https://www.bing.com";
const FALLBACK_BASE = "/th?id=OHR.SnowyMountains_ZH-CN9869777329";
const STANDARD_SIZES = new Set(["1920x1080", "1080x1920", "1366x768", "800x480", "400x240"]);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function safeImage(image = {}) {
  return {
    urlbase: typeof image.urlbase === "string" && image.urlbase.startsWith("/th?") ? image.urlbase : FALLBACK_BASE,
    startdate: typeof image.startdate === "string" ? image.startdate : "",
    copyright: typeof image.copyright === "string" ? image.copyright : "雪山风光 | 默认备用壁纸",
  };
}

function imageUrl(urlbase, width, height) {
  const size = `${width}x${height}`;
  if (STANDARD_SIZES.has(size)) return `${BING_ORIGIN}${urlbase}_${size}.jpg`;
  return `${BING_ORIGIN}${urlbase}_UHD.jpg&w=${width}&h=${height}&rs=1&c=4`;
}

function formatDate(value) {
  return value.length >= 8 ? `${value.slice(0, 4)}${value.slice(4, 6)}${value.slice(6, 8)}` : value;
}

function downloadUrl(urlbase) {
  return `${PUBLIC_ORIGIN}/download.php?url=${encodeURIComponent(`${BING_ORIGIN}${urlbase}_UHD.jpg`)}`;
}

export function renderHome(sourceImages) {
  const fallback = safeImage();
  const images = Array.from({ length: 8 }, (_, index) => safeImage(sourceImages?.[index] || fallback));
  const today = images[0];
  const weeklyItems = images.map((wallpaper, index) => {
    const date = index === 0 ? "今天" : index === 1 ? "昨天" : `${wallpaper.startdate.slice(4, 6)}/${wallpaper.startdate.slice(6, 8)}`;
    return `                <div class="weekly-item ${index === 0 ? "active" : ""}" data-index="${index}">
                    <img src="${escapeHtml(imageUrl(wallpaper.urlbase, 400, 240))}" alt="壁纸" onerror="this.style.background='#6366f1';this.src=''">
                    <div class="date">${escapeHtml(date)}</div>
                </div>`;
  }).join("\n");
  const wallpaperDataJson = JSON.stringify(images).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Bing 每日壁纸 API</title>
    <style>
        /* ==================== 亮色主题变量 ==================== */
        :root {
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --bg-card: #ffffff;
            --bg-code: #f1f5f9;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;
            --border-color: #e2e8f0;
            --accent-color: #6366f1;
            --accent-light: #eef2ff;
            --accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
            --shadow-glow: 0 0 40px rgba(99, 102, 241, 0.3);
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 16px;
            --radius-xl: 20px;
        }

        html { color-scheme: light !important; }
        @media (prefers-color-scheme: dark) { html { color-scheme: light !important; } }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
            background: radial-gradient(circle at 50% -10%, #eef2ff 0, transparent 34rem), var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1080px;
            margin: 0 auto;
            padding: 2.5rem 1.5rem 2rem;
        }

        /* ==================== 页头标题 ==================== */
        .site-header { text-align: center; margin-bottom: 2.25rem; }
        .site-header h1 {
            font-size: clamp(1.5rem, 4vw, 2.2rem);
            font-weight: 700;
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }
        .site-header .subtitle { color: var(--text-secondary); font-size: clamp(0.85rem, 2vw, 0.95rem); }

        /* ==================== 今日壁纸大图 ==================== */
        .today-wallpaper {
            position: relative;
            border-radius: var(--radius-xl);
            overflow: hidden;
            margin-bottom: 2.5rem;
            box-shadow: 0 18px 45px rgba(30, 41, 59, 0.16);
            background: #475569;
            min-height: 300px;
        }
        .today-wallpaper img {
            width: 100%;
            height: auto;
            display: block;
            aspect-ratio: 16 / 9;
            object-fit: cover;
        }
        .wallpaper-info {
            position: static;
            padding: 1rem 1.25rem 1.15rem;
            background: var(--bg-card);
            color: var(--text-primary);
            border-top: 1px solid var(--border-color);
        }
        .wallpaper-info .title { font-size: 1.05rem; font-weight: 650; margin-bottom: 0.2rem; }
        .wallpaper-info .copyright { font-size: 0.84rem; color: var(--text-secondary); }

        .download-btn {
            position: absolute;
            top: 1.5rem; right: 1.5rem;
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: var(--radius-md);
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: transform 0.2s, box-shadow 0.2s;
            text-decoration: none;
            z-index: 10;
        }
        .download-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

        /* ==================== 近7天壁纸 ==================== */
        .section-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        .section-title::before {
            content: '';
            width: 3px; height: 1rem;
            background: var(--accent-color);
            border-radius: 2px;
        }

        .weekly-wallpapers, .api-section, .params-section { margin-bottom: 2.5rem; position: relative; }
        .weekly-scroll {
            display: flex;
            gap: 0.8rem;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            scrollbar-width: thin;
            scrollbar-color: var(--accent-color) var(--bg-secondary);
        }
        .weekly-scroll::-webkit-scrollbar { height: 6px; }
        .weekly-scroll::-webkit-scrollbar-track { background: var(--bg-secondary); border-radius: 3px; }
        .weekly-scroll::-webkit-scrollbar-thumb { background: var(--accent-color); border-radius: 3px; }

        .weekly-item {
            flex-shrink: 0;
            width: 120px;
            cursor: pointer;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 2px solid transparent;
            transition: all 0.2s;
            background: var(--bg-card);
        }
        .weekly-item.active {
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px var(--accent-light);
        }
        .weekly-item:hover { transform: translateY(-2px); }
        .weekly-item img {
            width: 100%;
            height: 70px;
            object-fit: cover;
            display: block;
            background: linear-gradient(135deg, #667eea, #764ba2);
        }
        .weekly-item .date {
            text-align: center;
            padding: 0.4rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
            background: var(--bg-card);
        }
        .weekly-item.active .date { color: var(--accent-color); font-weight: 600; }

        .scroll-progress {
            height: 4px;
            background: var(--bg-secondary);
            border-radius: 2px;
            margin-top: 0.5rem;
            overflow: hidden;
        }
        .scroll-progress-bar {
            height: 100%;
            background: var(--accent-gradient);
            border-radius: 2px;
            width: 30%;
            transition: width 0.3s;
        }

        /* ==================== 接口卡片区域 ==================== */

        .api-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
            align-items: stretch;
        }
        .api-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 1.25rem;
            min-height: 164px;
            transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
        }
        .api-card:hover { border-color: #c7d2fe; box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .api-card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.9rem;
        }
        .api-card-title { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
        .api-badge {
            font-size: 0.7rem;
            padding: 0.15rem 0.5rem;
            border-radius: 999px;
            background: var(--accent-light);
            color: var(--accent-color);
            font-weight: 500;
        }
        .api-badge.blue { background: #dbeafe; color: #2563eb; }

        /* 统一代码框样式 */
        .code-box {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--bg-code);
            border-radius: var(--radius-md);
            padding: 0.6rem 0.8rem;
            margin-bottom: 0.6rem;
            height: 46px;
            min-height: 46px;
            overflow: hidden;
            contain: layout style;
        }
        .code-box code {
            flex: 1 1 0%;
            min-width: 0;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.82rem;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
            user-select: all;
        }
        .copy-btn {
            flex-shrink: 0;
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 0.35rem 0.8rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            cursor: pointer;
            transition: background 0.2s;
        }
        .copy-btn:hover { background: #4f46e5; }
        .copy-btn.copied { background: #10b981; }
        .api-desc { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.65; flex: 1; margin-top: auto; }

        /* ==================== 参数用法 ==================== */

        .params-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 1.2rem;
        }
        .params-subtitle {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        .params-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .params-table th, .params-table td {
            padding: 0.6rem 0.8rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        .params-table th { font-weight: 600; color: var(--text-secondary); background: var(--bg-code); }
        .params-table tr:last-child td { border-bottom: none; }
        .params-table code {
            background: var(--bg-code);
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-family: monospace;
        }

        /* ==================== 页脚 ==================== */
        .site-footer {
            text-align: center;
            padding-top: 2rem;
            margin-top: 1rem;
            border-top: 1px solid var(--border-color);
            color: var(--text-muted);
            font-size: 0.85rem;
        }
        .visit-counter {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 1.5rem auto 0;
        }
        .visit-counter img {
            display: block;
            max-width: 100%;
            height: auto;
        }

        /* ==================== 明亮磨砂透明视觉 ==================== */
        :root {
            --bg-primary: #edf4ff;
            --bg-secondary: rgba(255, 255, 255, 0.58);
            --bg-card: rgba(255, 255, 255, 0.62);
            --bg-code: rgba(239, 245, 255, 0.72);
            --text-primary: #172033;
            --text-secondary: #5f6c83;
            --text-muted: #8d98ab;
            --border-color: rgba(255, 255, 255, 0.7);
            --accent-color: #6575e8;
            --accent-light: rgba(101, 117, 232, 0.11);
            --accent-gradient: linear-gradient(130deg, #667eea 0%, #7786ee 42%, #9a7bea 100%);
            --shadow-sm: 0 8px 24px rgba(69, 91, 145, 0.08);
            --shadow-md: 0 18px 45px rgba(69, 91, 145, 0.13);
            --shadow-lg: 0 30px 80px rgba(69, 91, 145, 0.16);
            --shadow-glow: 0 0 50px rgba(112, 126, 232, 0.16);
            --radius-sm: 9px;
            --radius-md: 14px;
            --radius-lg: 20px;
            --radius-xl: 28px;
        }

        html { color-scheme: light !important; scroll-behavior: smooth; }
        @media (prefers-color-scheme: dark) { html { color-scheme: light !important; } }
        body {
            position: relative;
            overflow-x: hidden;
            background:
                radial-gradient(circle at 10% 7%, rgba(130, 197, 255, 0.45), transparent 31rem),
                radial-gradient(circle at 90% 18%, rgba(194, 163, 255, 0.34), transparent 30rem),
                radial-gradient(circle at 48% 90%, rgba(153, 225, 224, 0.25), transparent 34rem),
                linear-gradient(145deg, #f8fbff 0%, #edf4ff 48%, #f5f1ff 100%);
            background-attachment: fixed;
            color: var(--text-primary);
            letter-spacing: 0.01em;
        }
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            pointer-events: none;
            opacity: 0.11;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
            mix-blend-mode: multiply;
            z-index: -1;
        }
        .container { max-width: 1120px; padding: 4rem 1.5rem 2.5rem; }
        .site-header { margin-bottom: 2.75rem; }
        .site-header .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: .55rem;
            margin-bottom: .9rem;
            padding: .38rem .84rem;
            border: 1px solid rgba(101, 117, 232, .18);
            border-radius: 999px;
            background: rgba(255,255,255,.48);
            color: #6673ce;
            font-size: .69rem;
            font-weight: 700;
            letter-spacing: .2em;
            text-transform: uppercase;
            backdrop-filter: blur(18px) saturate(135%);
            -webkit-backdrop-filter: blur(18px) saturate(135%);
            box-shadow: 0 8px 24px rgba(69,91,145,.08), inset 0 1px 0 rgba(255,255,255,.8);
        }
        .site-header .eyebrow::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #7d8af0;
            box-shadow: 0 0 12px rgba(101,117,232,.55);
        }
        .site-header h1 {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            font-size: clamp(2rem, 5vw, 3.15rem);
            font-weight: 760;
            line-height: 1.16;
            letter-spacing: .025em;
            filter: drop-shadow(0 7px 22px rgba(101,117,232,.12));
        }
        .site-header .subtitle { color: #6f7b91; font-size: clamp(.82rem, 2vw, .94rem); letter-spacing: .08em; }

        .today-wallpaper {
            isolation: isolate;
            margin-bottom: 3rem;
            min-height: 0;
            border: 1px solid rgba(255,255,255,.8);
            border-radius: var(--radius-xl);
            background: rgba(255,255,255,.5);
            box-shadow: 0 28px 75px rgba(69,91,145,.19), 0 0 0 1px rgba(119,134,238,.05) inset;
        }
        .today-wallpaper::after {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            border-radius: inherit;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.85), inset 0 -70px 100px rgba(28,40,73,.16);
        }
        .today-wallpaper img { transition: transform .7s cubic-bezier(.2,.8,.2,1), filter .5s; }
        .today-wallpaper:hover img { transform: scale(1.015); filter: saturate(1.04) contrast(1.02); }
        .wallpaper-info {
            position: absolute;
            z-index: 4;
            left: 1.35rem;
            right: 1.35rem;
            bottom: 1.25rem;
            padding: 1rem 1.15rem;
            border: 1px solid rgba(255,255,255,.58);
            border-radius: 16px;
            color: #fff;
            background: linear-gradient(110deg, rgba(26,37,63,.48), rgba(53,62,86,.2));
            backdrop-filter: blur(20px) saturate(130%);
            -webkit-backdrop-filter: blur(20px) saturate(130%);
            box-shadow: 0 12px 32px rgba(19,31,61,.18), inset 0 1px 0 rgba(255,255,255,.22);
        }
        .wallpaper-info .title { color: #fff; font-weight: 650; letter-spacing: .035em; text-shadow: 0 1px 8px rgba(0,0,0,.18); }
        .wallpaper-info .copyright { color: rgba(255,255,255,.82); text-shadow: 0 1px 8px rgba(0,0,0,.18); }
        .download-btn {
            top: 1.25rem;
            right: 1.25rem;
            padding: .68rem 1.12rem;
            border: 1px solid rgba(255,255,255,.5);
            border-radius: 999px;
            color: #fff;
            font-weight: 650;
            box-shadow: 0 12px 30px rgba(66,78,164,.22), inset 0 1px 0 rgba(255,255,255,.3);
        }
        .download-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 38px rgba(66,78,164,.27), 0 0 24px rgba(112,126,232,.16); }

        .section-title { margin-bottom: 1.1rem; font-size: 1rem; font-weight: 650; letter-spacing: .055em; }
        .section-title::before { width: 22px; height: 2px; background: var(--accent-gradient); box-shadow: 0 0 10px rgba(101,117,232,.25); }
        .weekly-wallpapers, .api-section, .params-section { margin-bottom: 3rem; }
        .weekly-scroll { gap: .9rem; padding: .35rem .15rem .85rem; scrollbar-color: #8793ed rgba(255,255,255,.35); }
        .weekly-scroll::-webkit-scrollbar-track, .scroll-progress { background: rgba(255,255,255,.45); }
        .weekly-scroll::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #6d7be8, #aa86ea); }
        .weekly-item {
            width: 128px;
            border: 1px solid rgba(255,255,255,.72);
            border-radius: 16px;
            background: rgba(255,255,255,.48);
            box-shadow: 0 12px 28px rgba(69,91,145,.1), inset 0 1px 0 rgba(255,255,255,.75);
            backdrop-filter: blur(15px) saturate(125%);
            -webkit-backdrop-filter: blur(15px) saturate(125%);
        }
        .weekly-item.active { border-color: rgba(101,117,232,.48); box-shadow: 0 0 0 3px rgba(101,117,232,.09), 0 15px 32px rgba(69,91,145,.16); }
        .weekly-item:hover { transform: translateY(-4px); border-color: rgba(101,117,232,.36); }
        .weekly-item .date { background: rgba(255,255,255,.58); color: #758198; }
        .weekly-item.active .date { color: #5d6bd0; }
        .scroll-progress { height: 3px; }
        .scroll-progress-bar { background: var(--accent-gradient); box-shadow: 0 0 10px rgba(101,117,232,.24); }

        .api-grid { gap: 1.15rem; }
        .api-card, .params-card {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.72);
            background: linear-gradient(145deg, rgba(255,255,255,.66), rgba(246,249,255,.48));
            backdrop-filter: blur(24px) saturate(135%);
            -webkit-backdrop-filter: blur(24px) saturate(135%);
            box-shadow: 0 18px 45px rgba(69,91,145,.1), inset 0 1px 0 rgba(255,255,255,.9);
        }
        .api-card::before, .params-card::before {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.95), transparent);
        }
        .api-card { padding: 1.35rem; min-height: 174px; }
        .api-card:hover { border-color: rgba(129,142,235,.42); box-shadow: 0 24px 58px rgba(69,91,145,.16), 0 0 30px rgba(112,126,232,.06); transform: translateY(-4px); }
        .api-card-title { color: #263149; font-weight: 650; }
        .api-badge, .api-badge.blue { background: rgba(101,117,232,.1); color: #6270d2; border: 1px solid rgba(101,117,232,.14); }
        .code-box { border: 1px solid rgba(132,148,190,.13); background: rgba(236,243,255,.7); }
        .code-box code { color: #46536c; }
        .copy-btn { background: linear-gradient(135deg, #7584ec, #9177df); color: #fff; font-weight: 650; box-shadow: 0 6px 14px rgba(101,117,232,.16); }
        .copy-btn:hover { background: linear-gradient(135deg, #6676e8, #826bd6); }
        .copy-btn.copied { background: linear-gradient(135deg, #61c69c, #45a77f); color: #fff; }
        .api-desc { color: #6f7b91; }
        .params-card { padding: 1.4rem; }
        .params-table th { color: #5f6b82; background: rgba(232,240,255,.66); }
        .params-table th, .params-table td { border-color: rgba(114,132,174,.11); }
        .params-table code { color: #5f6dcc; border: 1px solid rgba(101,117,232,.1); }

        .footer-showcase {
            margin-top: .5rem;
            padding: 1.2rem 1rem;
            border: 1px solid rgba(255,255,255,.7);
            border-radius: 20px;
            background: rgba(255,255,255,.48);
            backdrop-filter: blur(22px) saturate(130%);
            -webkit-backdrop-filter: blur(22px) saturate(130%);
            box-shadow: 0 16px 42px rgba(69,91,145,.09), inset 0 1px 0 rgba(255,255,255,.85);
        }
        .service-badges {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
            margin: .7rem auto;
        }
        .service-badges img { display: block; filter: drop-shadow(0 8px 15px rgba(69,91,145,.13)); }
        .workers-usage-card {
            display: inline-flex;
            align-items: center;
            height: 20px;
            overflow: hidden;
            border-radius: 3px;
            color: #fff;
            font: 11px/20px Arial, sans-serif;
            text-decoration: none;
            box-shadow: 0 8px 15px rgba(69,91,145,.13);
        }
        .workers-usage-card span { padding: 0 5px; background: #555; }
        .workers-usage-card strong {
            min-width: 32px;
            padding: 0 5px;
            background: #f38020;
            text-align: center;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }
        .site-footer { border-color: rgba(100,119,160,.12); color: #8b96a8; }

        /* ==================== 响应式适配 ==================== */
        @media (max-width: 768px) {
            .container { padding: 2.25rem 1rem 1.5rem; }
            .site-header { margin-bottom: 1.75rem; }
            .api-grid { grid-template-columns: 1fr; }
            .today-wallpaper { border-radius: 20px; margin-bottom: 2.35rem; }
            .wallpaper-info { left: .7rem; right: .7rem; bottom: .7rem; padding: .72rem .85rem; border-radius: 13px; }
            .wallpaper-info .title { font-size: .92rem; }
            .wallpaper-info .copyright { font-size: .68rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .download-btn { top: .75rem; right: .75rem; padding: .48rem .82rem; font-size: .76rem; }
            .weekly-item { width: 104px; }
            .weekly-item img { height: 62px; }
            .code-box code { font-size: 0.75rem; }
            .params-card { overflow-x: auto; }
            .params-table { min-width: 500px; font-size: 0.75rem; }
            .params-table th, .params-table td { padding: 0.5rem; }
        }

        @media (max-width: 480px) {
            .site-header h1 { font-size: 1.4rem; }
            .api-grid { display: flex; flex-direction: column; gap: 1rem; }
            .api-card { padding: 1rem; min-height: 164px; }
            .code-box { gap: 0.3rem; padding: 0.5rem 0.6rem; overflow: hidden; contain: layout style; }
            .code-box code { font-size: 0.7rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1 1 0%; min-width: 0; }
            .copy-btn { flex-shrink: 0; padding: 0.3rem 0.6rem; font-size: 0.7rem; align-self: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 页头 -->
        <header class="site-header">
            <div class="eyebrow">Daily Visual Collection</div>
            <h1>Bing 每日壁纸 API</h1>
            <p class="subtitle">每日自动更新 · PC 与手机自适应 · 免费开放调用</p>
        </header>

        <!-- 今日壁纸大图 -->
        <div class="today-wallpaper">
            <img id="todayImg" src="${escapeHtml(imageUrl(today.urlbase, 1920, 1080))}" alt="今日必应壁纸" onerror="this.style.display='none'">
            <a href="${escapeHtml(downloadUrl(today.urlbase))}" class="download-btn" id="todayDownload" download>
                <span>⬇</span> 下载原图
            </a>
            <div class="wallpaper-info">
                <div class="title">今日必应壁纸</div>
                <div class="copyright" id="copyrightText">${escapeHtml(formatDate(today.startdate))} | ${escapeHtml(today.copyright)}</div>
            </div>
        </div>

        <!-- 近7天壁纸 -->
        <div class="weekly-wallpapers">
            <div class="section-title">近 7 天壁纸</div>
            <div class="weekly-scroll" id="weeklyScroll">
${weeklyItems}
            </div>
            <div class="scroll-progress">
                <div class="scroll-progress-bar" id="scrollBar"></div>
            </div>
        </div>

        <!-- 推荐接口 -->
        <div class="api-section">
            <div class="section-title">推荐接口</div>
            <div class="api-grid">
                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">自适应跳转</span>
                        <span class="api-badge">推荐</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/auto_302.php">${PUBLIC_ORIGIN}/auto_302.php</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">根据访问设备自动返回 PC 或手机竖屏壁纸，节省服务器流量。</p>
                </div>

                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">自适应直出</span>
                        <span class="api-badge blue">无跳转</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/auto.php">${PUBLIC_ORIGIN}/auto.php</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">PHP 直接输出图片流，适合需要稳定图片地址的场景。</p>
                </div>

                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">随机壁纸</span>
                        <span class="api-badge">新</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/random.php">${PUBLIC_ORIGIN}/random.php</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">从历史收藏中随机返回一张精选 Bing 壁纸，每次刷新不同惊喜。</p>
                </div>
            </div>
        </div>

        <!-- 尺寸接口 -->
        <div class="api-section">
            <div class="section-title">尺寸接口</div>
            <div class="api-grid">
                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">📱 手机竖屏 1080×1920</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/m_302.php">${PUBLIC_ORIGIN}/m_302.php</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">适合手机锁屏、移动端背景图。</p>
                </div>

                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">🖥️ 桌面横屏 1920×1080</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/1920x1080_302.php">${PUBLIC_ORIGIN}/1920x1080_302.php</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">适合电脑壁纸、网页背景模版展示。</p>
                </div>

                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">🪟 轻量尺寸 1366×768</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/1366x768_302.php">${PUBLIC_ORIGIN}/1366x768_302.php</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">适合低分辨率设备和轻量页面背景。</p>
                </div>

                <div class="api-card">
                    <div class="api-card-header">
                        <span class="api-card-title">📊 JSON 信息接口</span>
                    </div>
                    <div class="code-box">
                        <code class="api-url" data-base="${PUBLIC_ORIGIN}/func.php?info=1">${PUBLIC_ORIGIN}/func.php?info=1</code>
                        <button class="copy-btn" onclick="copyCode(this)">复制</button>
                    </div>
                    <p class="api-desc">返回日期、版权描述、PC 与手机壁纸链接。</p>
                </div>
            </div>
        </div>

        <!-- 参数用法 -->
        <div class="params-section">
            <div class="section-title">参数用法</div>
            <div class="params-card">
                <div class="params-subtitle">
                    <span>🔧</span> 通用参数
                </div>
                <table class="params-table">
                    <thead>
                        <tr>
                            <th>参数</th>
                            <th>说明</th>
                            <th>示例</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>idx</code></td>
                            <td>偏移天数，0为今天，1为昨天，最多7天</td>
                            <td><code>?idx=1</code></td>
                        </tr>
                        <tr>
                            <td><code>w</code></td>
                            <td>自定义图片宽度</td>
                            <td><code>?w=1920</code></td>
                        </tr>
                        <tr>
                            <td><code>h</code></td>
                            <td>自定义图片高度</td>
                            <td><code>?h=1080</code></td>
                        </tr>
                        <tr>
                            <td><code>mkt</code></td>
                            <td>地区，zh-CN / en-US 等</td>
                            <td><code>?mkt=en-US</code></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 服务标识 -->
        <div class="footer-showcase">
            <div class="service-badges">
                <a href="https://www.cloudflare.com/zh-cn/application-services/products/cdn/" title="CDN: Cloudflare CDN" target="_blank" rel="noopener noreferrer">
                    <img src="https://img.wuw.li/tu/2025-09-13T00-56a1t.svg" alt="CDN: Cloudflare CDN">
                </a>
                <a id="workers-usage-card" class="workers-usage-card" href="https://worker.wuw.li/" title="Workers 今日请求量（UTC）" target="_blank" rel="noopener noreferrer">
                    <span>Workers</span>
                    <strong id="workers-usage-value">加载中</strong>
                </a>
            </div>
        </div>

        <!-- 页脚 -->
        <footer class="site-footer">
            <p>Powered by Bing Wallpaper API · 图片版权归微软所有</p>
        </footer>
    </div>

    <script>
        // ========== Workers 今日请求量 ==========
        (function () {
            var card = document.getElementById('workers-usage-card');
            var value = document.getElementById('workers-usage-value');
            if (!card || !value) return;

            function shortNumber(number) {
                if (number >= 1000000) return (number / 1000000).toFixed(1).replace('.0', '') + 'M';
                if (number >= 1000) return (number / 1000).toFixed(1).replace('.0', '') + 'K';
                return String(number);
            }

            var request = new XMLHttpRequest();
            request.open('GET', 'https://worker.wuw.li/api/usage', true);
            request.onreadystatechange = function () {
                if (request.readyState !== 4) return;
                if (request.status < 200 || request.status >= 300) {
                    value.textContent = '--';
                    card.title = 'Workers 请求量暂不可用';
                    return;
                }
                try {
                    var data = JSON.parse(request.responseText);
                    var requests = data.usage.requests;
                    var requestPercent = data.usage.requestPercent;
                    var percentText = Number(requestPercent).toFixed(1).replace('.0', '') + '%';
                    value.textContent = shortNumber(requests) + ' ' + percentText;
                    card.title = 'Workers 今日请求量（UTC）：' + requests.toLocaleString('zh-CN') + '，使用率：' + percentText;
                } catch (error) {
                    value.textContent = '--';
                    card.title = 'Workers 请求量暂不可用';
                }
            };
            request.onerror = function () {
                value.textContent = '--';
                card.title = 'Workers 请求量暂不可用';
            };
            request.send();
        })();

        // ========== 复制功能（兼容方案） ==========
        function copyCode(btn) {
            var codeEl = btn.parentElement.querySelector('code');
            var text = codeEl.textContent || codeEl.innerText;

            // 优先用现代 API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(function() {
                    showCopied(btn);
                }).catch(function() {
                    fallbackCopy(text, btn);
                });
            } else {
                fallbackCopy(text, btn);
            }
        }

        function fallbackCopy(text, btn) {
            var textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showCopied(btn);
            } catch (e) {
                alert('复制失败，请手动选择复制');
            }
            document.body.removeChild(textArea);
        }

        function showCopied(btn) {
            var original = btn.textContent;
            btn.textContent = '已复制';
            btn.classList.add('copied');
            setTimeout(function() {
                btn.textContent = original;
                btn.classList.remove('copied');
            }, 1500);
        }

        // ========== 滚动进度条 ==========
        var scrollContainer = document.getElementById('weeklyScroll');
        var scrollBar = document.getElementById('scrollBar');

        function updateScrollBar() {
            var maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            var percent = maxScroll > 0 ? (scrollContainer.scrollLeft / maxScroll) * 100 : 30;
            scrollBar.style.width = Math.min(100, Math.max(10, percent)) + '%';
        }

        scrollContainer.addEventListener('scroll', updateScrollBar);
        window.addEventListener('load', updateScrollBar);
        window.addEventListener('resize', updateScrollBar);

        // ========== 切换今日壁纸 ==========
        var weeklyItems = document.querySelectorAll('.weekly-item');
        var todayImg = document.getElementById('todayImg');
        var todayDownload = document.getElementById('todayDownload');
        var copyrightText = document.getElementById('copyrightText');

        var wallpaperData = ${wallpaperDataJson};

        function buildImgUrl(urlbase, w, h) {
            var size = w + 'x' + h;
            var standard = ['1920x1080', '1080x1920', '1366x768', '800x480', '400x240'];
            if (standard.indexOf(size) !== -1) {
                return 'https://www.bing.com' + urlbase + '_' + size + '.jpg';
            }
            return 'https://www.bing.com' + urlbase + '_UHD.jpg&w=' + w + '&h=' + h + '&rs=1&c=4';
        }

        for (var i = 0; i < weeklyItems.length; i++) {
            (function(index) {
                weeklyItems[index].addEventListener('click', function() {
                    // 切换 active
                    for (var j = 0; j < weeklyItems.length; j++) {
                        weeklyItems[j].classList.remove('active');
                    }
                    weeklyItems[index].classList.add('active');

                    var wp = wallpaperData[index];
                    if (!wp) return;

                    var imgUrl = buildImgUrl(wp.urlbase, 1920, 1080);
                    var originalUrl = 'https://www.bing.com' + wp.urlbase + '_UHD.jpg';
                    todayImg.src = imgUrl;
                    todayImg.style.display = 'block';
                    todayDownload.href = '/download.php?url=' + encodeURIComponent(originalUrl);

                    // 更新版权文字
                    var dateStr = wp.startdate || '';
                    var formattedDate = dateStr.length >= 8
                        ? dateStr.substring(0, 4) + dateStr.substring(4, 6) + dateStr.substring(6, 8)
                        : dateStr;
                    copyrightText.textContent = formattedDate + ' | ' + (wp.copyright || '');

                    // 同步更新所有接口地址
                    var apiUrls = document.querySelectorAll('.api-url');
                    for (var k = 0; k < apiUrls.length; k++) {
                        var el = apiUrls[k];
                        var base = el.getAttribute('data-base') || el.textContent;
                        if (index === 0) {
                            el.textContent = base;
                        } else {
                            var sep = base.indexOf('?') !== -1 ? '&' : '?';
                            el.textContent = base + sep + 'idx=' + index;
                        }
                    }
                });
            })(i);
        }


    </script>
</body>
</html>
`;
}
