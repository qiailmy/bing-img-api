# Bing 每日壁纸 API

这是一个用 PHP 编写的 Bing 每日壁纸项目，既可以展示当天壁纸，也可以作为图片 API 使用。

项目不需要数据库，上传到支持 PHP 的服务器后即可运行。首页采用明亮的蓝紫色磨砂玻璃风格，并针对电脑和手机做了适配。

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

部署前请确认服务器具备以下条件：

- PHP 8.0 或更高版本
- PHP cURL 扩展
- 可用的 `getimagesize` 和 `getimagesizefromstring` 函数
- Nginx、OpenResty 或 Apache 等 Web 服务器
- 服务器能够正常访问 `https://www.bing.com`

本项目不需要 MySQL、MongoDB 等数据库。

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

### 1. 上传项目

将仓库中的文件放到网站根目录，并把 `index.php` 设置为默认首页。

### 2. 检查 PHP 环境

```bash
php -v
php -m | grep -i curl
```

PHP 版本应为 8.0 或更高，并且第二条命令应能看到 `curl`。

### 3. 修改网站域名

项目中的演示域名是 `https://bing-img.wuw.li`。部署到自己的域名时，需要修改以下两个文件：

```php
// index.php
$site_url = 'https://你的域名';

// func.php
$site_url = 'https://你的域名';
```

### 4. 设置目录权限

网站运行用户需要能够读取项目文件。

如果要使用首页缓存、每日下载和随机壁纸功能，还需要保证程序能够在项目目录中创建或写入：

- `bing-wallpapers-cache.json`
- `bing-img/`
- `upload_bing.log`

请根据服务器环境设置权限，不建议直接将整个目录设为 `777`。

### 5. 测试访问

部署完成后，先打开首页，再测试一个跳转接口和 JSON 接口：

```text
https://你的域名/
https://你的域名/auto_302.php
https://你的域名/func.php?n=1
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

## 每日自动下载

`upload_bing.php` 会下载当天的两张图片：

```text
bing-img/YYYY-MM-DD.jpg         # PC UHD 原图
bing-img/YYYY-MM-DD-mobile.jpg  # 手机 1080×1920 竖屏图
```

如果当天的图片已经存在，脚本会自动跳过，不会重复下载。

### 手动运行

先进入项目目录，再执行：

```bash
php upload_bing.php
```

看到两张图片保存成功后，再配置定时任务。

### 设置定时任务

以下示例会在每天 06:00 执行，具体时间以服务器时区为准：

```cron
0 6 * * * /bin/bash /path/to/upload_bing.sh
```

`upload_bing.sh` 默认使用 `/usr/bin/php`。如果服务器上的 PHP 不在这个位置，请先执行：

```bash
command -v php
```

然后将脚本中的 PHP 路径改成实际结果。

### 随机壁纸说明

`random.php` 只会从 `bing-img/` 中选择已经下载成功的图片：

- 电脑访问时随机返回横屏图
- 手机访问时随机返回竖屏图

如果还没有下载任何壁纸，该接口会返回 HTTP 503。因此，使用随机壁纸前至少要成功运行一次 `upload_bing.php`。

## 首页中的外部组件

演示站首页底部放置了 Moe Counter 访问计数器和 CDN 徽章。这两项不是项目运行所必需的。

如果不需要，可以在 `index.php` 中搜索 `footer-showcase`，删除或替换对应的 HTML 内容。

## 常用检查命令

检查所有 PHP 文件是否存在语法错误：

```bash
find . -maxdepth 1 -name '*.php' -print0 | xargs -0 -n1 php -l
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

- `auto.php` 会通过你的服务器转发完整图片，会占用服务器流量。访问量较大时，建议优先使用 `auto_302.php`。
- `upload_bing.php` 只能通过命令行执行，不能从网页触发。
- `download.php` 只允许下载来自 `www.bing.com` 和 `cn.bing.com` 的 HTTPS 图片。
- 建议在 Nginx 或 CDN 中设置缓存和访问频率限制，并定期清理日志。

## 版权说明

项目代码采用 [MIT License](LICENSE)。壁纸版权归 Microsoft Bing 及原作者所有，请遵守相关版权要求。
