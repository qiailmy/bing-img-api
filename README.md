# Bing 每日壁纸 API

这是一个运行在 Cloudflare Workers 上的 Bing 每日壁纸项目，既可以展示当天壁纸，也可以作为图片 API 使用。

项目不需要传统服务器或数据库：Worker 提供首页和兼容原 PHP 路径的 API，Cloudflare Cron 每天同步壁纸，R2 保存历史横屏与竖屏图片。首页采用明亮的蓝紫色磨砂玻璃风格，并针对电脑和手机做了适配。

- 在线演示：<https://bing-img.wuw.li>
- GitHub 仓库：<https://github.com/qiailmy/bing-img-api>

## 主要功能

- 展示今日壁纸和最近 8 天的壁纸缩略图
- 根据访问设备自动选择横屏或竖屏图片
- 支持图片直出和 302 跳转两种调用方式
- 提供 1920×1080、1366×768、1080×1920 等常用尺寸
- 提供 JSON 格式的壁纸信息
- 每天自动下载 PC 原图和手机竖屏图
- 从已经下载的历史壁纸中随机返回一张图片
- 首页支持电脑和手机，并带有复制接口地址等功能

## 运行环境

- Cloudflare Workers
- Cloudflare R2
- Node.js 20 或更高版本
- Wrangler 4

本项目不需要 PHP、Nginx、传统服务器或数据库。仓库根目录中的 PHP 文件仅作为旧实现参考；生产入口由 `src/index.js` 提供。

## 文件说明

```text
├── index.php          # 首页
├── auto.php           # 自动识别设备，直接输出图片
├── auto_302.php       # 自动识别设备，302 跳转到图片地址
├── m_302.php          # 手机竖屏接口，默认 1080×1920
├── 1920x1080_302.php  # 电脑横屏接口，默认 1920×1080
├── 1366x768_302.php   # 轻量横屏接口，默认 1366×768
├── func.php           # JSON 壁纸信息接口
├── download.php       # 首页“下载原图”功能使用的下载接口
├── upload_bing.php    # 每日壁纸下载脚本，只能在命令行运行
├── upload_bing.sh     # 定时任务入口
└── random.php         # 从本地历史壁纸中随机返回一张
```

程序运行后还会生成以下文件或目录：

```text
bing-img/                  # 已下载的本地壁纸
bing-wallpapers-cache.json # 首页使用的 Bing 数据缓存
upload_bing.log            # 定时下载日志
```


## 部署方法

### 1. 安装依赖并验证

```bash
npm ci
npm test
npm run check
npx wrangler deploy --dry-run
```

### 2. 配置 R2 与域名

`wrangler.jsonc` 默认绑定 R2 存储桶 `ailmy`，绑定名为 `BING_IMAGES`。部署到其他账户时，请先创建自己的存储桶并修改 `bucket_name`。

正式域名通过 `routes[].custom_domain` 配置。若目标主机名已有 DNS 记录，需要先安全迁移或删除冲突记录，Cloudflare 才能自动建立 Worker Custom Domain。

### 3. 部署

```bash
npx wrangler deploy
```

当前 Cron 表达式为 `0 17 * * *`，即每天 `17:00 UTC`（北京时间次日 `01:00`）同步当天的横屏与竖屏壁纸。

### 4. 测试访问

部署完成后，先打开首页，再测试一个跳转接口、JSON 接口和随机历史图片：

```text
https://你的域名/
https://你的域名/auto_302.php
https://你的域名/func.php?n=1
https://你的域名/random.php
```

## 接口说明

| 接口 | 用途 | 可用参数 |
| --- | --- | --- |
| `/auto_302.php` | 根据设备类型跳转到横屏或竖屏壁纸 | `idx`、`w`、`h`、`mkt` |
| `/auto.php` | 根据设备类型直接输出壁纸图片 | `idx`、`w`、`h`、`mkt` |
| `/m_302.php` | 跳转到手机竖屏壁纸，默认 1080×1920 | `idx`、`w`、`h`、`mkt` |
| `/1920x1080_302.php` | 跳转到 1920×1080 横屏壁纸 | `idx`、`w`、`h`、`mkt` |
| `/1366x768_302.php` | 跳转到 1366×768 横屏壁纸 | `idx`、`w`、`h`、`mkt` |
| `/func.php` | 返回 JSON 格式的壁纸信息 | `idx`、`n`、`mkt` |
| `/random.php` | 从本地历史壁纸中随机返回一张 | 无必填参数 |
| `/download.php` | 下载指定的 Bing 原图 | 由首页自动生成参数 |

### 参数含义

- `idx`：日期偏移量，范围为 `0～7`。`0` 表示当天，`1` 表示前一天。
- `n`：返回的壁纸数量，范围为 `1～8`，仅用于 `func.php`。
- `w`、`h`：图片宽度和高度。
- `mkt`：Bing 市场区域，例如 `zh-CN`、`en-US`。

### 调用示例

```text
# 自动识别设备并跳转
https://你的域名/auto_302.php

# 直接输出前一天的壁纸
https://你的域名/auto.php?idx=1

# 手机竖屏壁纸
https://你的域名/m_302.php

# 获取最近 8 天的 JSON 信息
https://你的域名/func.php?n=8&mkt=zh-CN

# 从本地历史壁纸中随机返回一张
https://你的域名/random.php
```

`func.php` 不需要 `info=1` 参数。即使带上该参数，程序也不会使用它。

## 每日自动同步

Worker 的 `scheduled` 处理器会下载当天的两张图片到 R2：

```text
bing-img/YYYY-MM-DD.jpg         # PC UHD 原图
bing-img/YYYY-MM-DD-mobile.jpg  # 手机 1080×1920 竖屏图
```

如果当天的对象已经存在，Worker 会自动跳过，不会重复下载。Cron 配置随 `wrangler.jsonc` 一起部署，无需服务器 crontab。开发时可使用 Wrangler 的 scheduled 测试能力验证处理器。

### 随机壁纸说明

`random.php` 只会从 R2 的 `bing-img/` 前缀中选择已经下载成功的图片，并由 Worker 直接输出对象：

- 电脑访问时随机返回横屏图
- 手机访问时随机返回竖屏图

如果还没有下载任何壁纸，该接口会返回 HTTP 503。因此，使用随机壁纸前至少要成功运行一次 `upload_bing.php`。

## 首页中的外部组件

演示站首页底部放置了 Moe Counter 访问计数器和 CDN 徽章。这两项不是项目运行所必需的。

如果不需要，可以在 `index.php` 中搜索 `footer-showcase`，删除或替换对应的 HTML 内容。

## 常用检查命令

检查代码与测试：

```bash
npm test
npm run check
npx wrangler deploy --dry-run
```

检查 JSON 接口：

```bash
curl -fsSL 'https://你的域名/func.php?n=1'
```

检查 302 跳转接口：

```bash
curl -I 'https://你的域名/auto_302.php'
```

## 使用建议

- `auto.php` 会通过 Worker 转发完整图片；访问量较大时，建议优先使用 `auto_302.php`。
- `download.php` 只允许下载来自 `www.bing.com` 和 `cn.bing.com` 的 HTTPS 图片。
- R2 历史图片通过 Worker 的 `/bing-img/YYYY-MM-DD.jpg` 路径提供，并设置长期不可变缓存。
- 建议启用 Workers Observability，并定期查看 Cron 与 R2 写入结果。

## 版权说明

项目代码采用 [MIT License](LICENSE)。壁纸版权归 Microsoft Bing 及原作者所有，请遵守相关版权要求。
