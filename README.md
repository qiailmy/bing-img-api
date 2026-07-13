# Bing 每日壁纸 API

一个轻量、无需数据库的 Bing 每日壁纸 API 与展示首页。首页采用明亮蓝紫色调的磨砂玻璃设计，支持桌面端和移动端。

在线演示：<https://bing-img.wuw.li>

## 功能

- 今日壁纸大图与最近 8 天缩略图
- PC / 手机自动识别
- 图片直出与 302 跳转接口
- 常用尺寸接口
- JSON 壁纸信息接口
- 自动下载 PC 原图和手机竖屏图
- 本地历史壁纸随机返回
- 明亮、响应式磨砂玻璃首页

## 环境要求

- PHP 8.0+（使用了 `str_starts_with`）
- PHP cURL 扩展
- PHP GD 或支持 `getimagesize` 的标准 PHP 环境
- Web 服务器（Nginx、OpenResty 或 Apache）
- 可访问 `www.bing.com`

## 文件说明

```text
├── index.php          # 展示首页
├── auto.php           # 自动识别设备并直接输出图片
├── auto_302.php       # 自动识别设备并 302 跳转
├── m_302.php          # 手机竖屏 1080×1920
├── 1920x1080_302.php  # 桌面横屏 1920×1080
├── 1366x768_302.php   # 轻量横屏 1366×768
├── func.php           # JSON 信息接口
├── download.php       # 原图下载入口
├── upload_bing.php    # 每日壁纸同步脚本（仅 CLI）
├── upload_bing.sh     # 定时任务包装脚本
└── random.php         # 从本地历史壁纸中随机返回
```

运行时会生成以下内容，已被 `.gitignore` 排除：

- `bing-img/`：本地壁纸目录
- `bing-wallpapers-cache.json`：Bing API 缓存
- `*.log`：同步日志

## 部署

1. 将项目文件复制到网站根目录。
2. 确认 PHP cURL 扩展可用。
3. 在 `index.php` 中修改站点地址：

```php
$site_url = 'https://你的域名';
```

4. 确保 Web 服务用户对项目目录拥有必要的读取权限；如需自动同步，还需对 `bing-img/` 和缓存文件拥有写入权限。
5. 访问首页和接口进行测试。

## 接口示例

```text
https://你的域名/auto_302.php
https://你的域名/auto.php
https://你的域名/random.php
https://你的域名/m_302.php
https://你的域名/1920x1080_302.php
https://你的域名/1366x768_302.php
https://你的域名/func.php?info=1
```

部分接口支持：

- `idx`：日期偏移，`0` 为今天
- `w`：自定义宽度
- `h`：自定义高度
- `mkt`：地区，例如 `zh-CN`、`en-US`

## 每日自动同步

`upload_bing.php` 会下载当天的 PC UHD 原图和手机竖屏图，并按日期去重保存到 `bing-img/`。

```bash
php upload_bing.php
```

Cron 示例（每天 06:00，按服务器时区）：

```cron
0 6 * * * /bin/bash /path/to/upload_bing.sh
```

## 安全说明

- `upload_bing.php` 仅允许 CLI 执行，无法通过网页直接触发。
- 下载内容会检查 HTTP 状态、Content-Type、文件大小和图片格式。
- 临时文件写入完成后再原子重命名，避免留下不完整图片。
- 请根据实际部署环境配置访问频率限制和缓存策略。

## 版权

程序代码采用 [MIT License](LICENSE)。壁纸版权归 Microsoft Bing 及原作者所有，请遵守相关版权要求。
