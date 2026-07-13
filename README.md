# Bing 每日壁纸 API

一个轻量、无需数据库的 Bing 每日壁纸 API 与展示首页。首页采用明亮蓝紫色调的磨砂玻璃设计，支持桌面端和移动端。

- 在线演示：<https://bing-img.wuw.li>
- 源码仓库：<https://github.com/qiailmy/bing-img-api>

## 功能

- 今日壁纸大图与最近 8 天缩略图
- 根据 User-Agent 自动识别 PC / 手机
- 图片直出与 302 跳转接口
- 常用横屏、竖屏尺寸接口
- JSON 壁纸信息接口
- 自动下载 PC UHD 原图和手机竖屏图
- 从本地历史壁纸中随机返回图片
- 明亮、响应式磨砂玻璃首页

## 环境要求

- PHP 8.0+（使用了 `str_starts_with`）
- PHP cURL 扩展
- 标准 PHP 图片信息函数（`getimagesize`、`getimagesizefromstring`）
- Web 服务器（Nginx、OpenResty 或 Apache）
- 服务器可以访问 `https://www.bing.com`

> 本项目不需要 MySQL、MongoDB 等数据库。

## 文件说明

```text
├── index.php          # 展示首页
├── auto.php           # 自动识别设备并直接输出图片
├── auto_302.php       # 自动识别设备并 302 跳转
├── m_302.php          # 手机竖屏接口，默认 1080×1920
├── 1920x1080_302.php  # 桌面横屏接口，默认 1920×1080
├── 1366x768_302.php   # 轻量横屏接口，默认 1366×768
├── func.php           # JSON 信息接口
├── download.php       # 受限的 Bing 原图代理下载入口
├── upload_bing.php    # 每日壁纸同步脚本（仅 CLI）
├── upload_bing.sh     # 定时任务包装脚本
└── random.php         # 从本地历史壁纸中随机返回
```

运行时会生成以下内容，已被 `.gitignore` 排除：

- `bing-img/`：本地壁纸目录
- `bing-wallpapers-cache.json`：首页的 Bing API 缓存
- `*.log`：同步日志

## 部署

1. 将项目文件复制到网站根目录。
2. 确认 PHP 版本及 cURL 扩展：

```bash
php -v
php -m | grep -i curl
```

3. 将以下两个文件里的演示域名替换为你的实际域名：

```php
// index.php
$site_url = 'https://你的域名';

// func.php
$site_url = 'https://你的域名';
```

4. 确保 Web 服务用户可以读取项目文件。首页需要更新缓存、自动同步需要保存壁纸，因此项目目录、`bing-img/` 及缓存文件还需要合适的写入权限。
5. 配置 Web 服务器以 `index.php` 为默认首页，然后访问首页和接口测试。

### 可选：首页底部组件

当前 `index.php` 包含演示站使用的 Moe Counter 访问计数器和 CDN 徽章。它们不是 API 运行必需项；部署到自己的站点时，可以搜索 `footer-showcase` 后删除、替换对应 HTML，或改成自己的地址。

## 接口

| 路径 | 行为 | 主要参数 |
| --- | --- | --- |
| `/auto_302.php` | 识别设备后 302 跳转到对应壁纸 | `idx`、`w`、`h`、`mkt` |
| `/auto.php` | 识别设备后由服务器直接输出图片 | `idx`、`w`、`h`、`mkt` |
| `/m_302.php` | 默认返回 1080×1920 竖屏图 | `idx`、`w`、`h`、`mkt` |
| `/1920x1080_302.php` | 默认返回 1920×1080 横屏图 | `idx`、`w`、`h`、`mkt` |
| `/1366x768_302.php` | 默认返回 1366×768 横屏图 | `idx`、`w`、`h`、`mkt` |
| `/func.php` | 返回 JSON 壁纸信息 | `idx`、`n`、`mkt` |
| `/random.php` | 按设备类型从本地历史壁纸中随机 302 跳转 | 无必填参数 |
| `/download.php` | 代理下载允许域名内的 Bing 图片 | 首页自动生成 `url` 参数 |

### 参数范围

- `idx`：日期偏移，范围 `0~7`，`0` 为当天
- `n`：返回数量，范围 `1~8`，仅用于 `func.php`
- `w`、`h`：目标宽高；常见尺寸直接使用 Bing 原生图片，其他尺寸使用 Bing UHD 缩放参数
- `mkt`：Bing 市场区域，例如 `zh-CN`、`en-US`

### 调用示例

```text
https://你的域名/auto_302.php
https://你的域名/auto.php?idx=1
https://你的域名/m_302.php
https://你的域名/1920x1080_302.php
https://你的域名/1366x768_302.php
https://你的域名/func.php?n=8&mkt=zh-CN
https://你的域名/random.php
```

> `func.php` 不要求 `info=1`；即使带上该参数也会被忽略。

## 每日自动同步

`upload_bing.php` 会下载当天的 PC UHD 原图和手机 1080×1920 竖屏图，以以下格式保存并自动去重：

```text
bing-img/YYYY-MM-DD.jpg
bing-img/YYYY-MM-DD-mobile.jpg
```

手动测试：

```bash
php upload_bing.php
```

`random.php` 依赖这些本地图片。尚未成功同步任何图片时，它会返回 HTTP `503`。

Cron 示例（每天 06:00，使用服务器时区）：

```cron
0 6 * * * /bin/bash /path/to/upload_bing.sh
```

> `upload_bing.sh` 默认使用 `/usr/bin/php`。如果你的 PHP 位于其他位置，请先运行 `command -v php` 并修改脚本。

## 快速检查

```bash
# 检查全部 PHP 文件语法
find . -maxdepth 1 -name '*.php' -print0 | xargs -0 -n1 php -l

# 检查 JSON 接口
curl -fsSL 'https://你的域名/func.php?n=1'

# 检查跳转接口（只查看响应头）
curl -I 'https://你的域名/auto_302.php'
```

## 安全与运维说明

- `upload_bing.php` 仅允许 CLI 执行，无法通过网页直接触发。
- 同步脚本会检查 HTTP 状态、Content-Type、文件大小和图片格式。
- 图片先写入临时文件，再原子重命名，避免留下不完整文件。
- `download.php` 只接受 HTTPS 且仅允许 `www.bing.com`、`cn.bing.com`。
- `auto.php` 会由你的服务器中转图片流，可能消耗较多带宽；高流量场景优先使用 302 接口。
- 建议在 Web 服务器或 CDN 层配置缓存、访问频率限制和日志轮转。

## 版权

程序代码采用 [MIT License](LICENSE)。壁纸版权归 Microsoft Bing 及原作者所有，请遵守相关版权要求。
