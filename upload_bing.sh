#!/bin/bash
# 必应每日壁纸同步 - 供 1Panel 计划任务调用
# 每日 06:00 执行，下载 Bing 原图到本地的去重存储
cd "$(dirname "$0")" || exit 1
/usr/bin/php -d memory_limit=256M ./upload_bing.php >> ./upload_bing.log 2>&1
