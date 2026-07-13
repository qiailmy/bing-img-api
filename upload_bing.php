<?php
/** 每日下载 Bing 横屏与手机竖屏原图到本地 bing-img，按日期去重。CLI only. */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit("CLI only\n"); }
date_default_timezone_set('Asia/Shanghai');
const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN';
const TIMEOUT = 60;
$dir = __DIR__ . '/bing-img';
if (!is_dir($dir) && !mkdir($dir, 0755, true)) { fwrite(STDERR, "无法创建目录: $dir\n"); exit(1); }
function log_msg(string $msg): void { echo '[' . date('Y-m-d H:i:s') . "] $msg\n"; }
function fetch_url(string $url): array {
    $ch = curl_init($url);
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>TIMEOUT,CURLOPT_CONNECTTIMEOUT=>12,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_USERAGENT=>'Mozilla/5.0 BingWallpaperLocal/2.0']);
    $body=curl_exec($ch); $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $type=(string)curl_getinfo($ch,CURLINFO_CONTENT_TYPE); $err=curl_error($ch); curl_close($ch);
    return [$code,$type,$body,$err];
}
function valid_image(string $path): bool { return is_file($path) && filesize($path)>10000 && @getimagesize($path)!==false; }
function save_image(string $url,string $file,string $label): bool {
    if (valid_image($file)) { log_msg("已存在，跳过（去重成功）: ".basename($file)); return true; }
    [$code,$type,$bytes,$err]=fetch_url($url);
    if ($code!==200 || !$bytes || !str_starts_with(strtolower($type),'image/') || strlen($bytes)<10000 || @getimagesizefromstring($bytes)===false) {
        log_msg("ERROR: {$label}下载失败 HTTP=$code type=$type $err"); return false;
    }
    $tmp=$file.'.tmp.'.getmypid();
    if (file_put_contents($tmp,$bytes,LOCK_EX)!==strlen($bytes)) { @unlink($tmp); log_msg("ERROR: {$label}写入失败"); return false; }
    chmod($tmp,0644);
    if (!rename($tmp,$file)) { @unlink($tmp); log_msg("ERROR: {$label}保存失败"); return false; }
    log_msg("保存成功: bing-img/".basename($file).' ('.filesize($file).' bytes)'); return true;
}
log_msg('开始同步 Bing 每日壁纸（PC + 手机）');
[$code,,$json,$err]=fetch_url(BING_API);
if ($code!==200 || !$json) { log_msg("ERROR: Bing API 请求失败 HTTP=$code $err"); exit(1); }
$img=json_decode($json,true)['images'][0]??null;
if (!$img || empty($img['urlbase']) || empty($img['startdate'])) { log_msg('ERROR: Bing API 数据无效'); exit(1); }
$date=substr($img['startdate'],0,4).'-'.substr($img['startdate'],4,2).'-'.substr($img['startdate'],6,2);
$base='https://www.bing.com'.$img['urlbase'];
$okPc=save_image($base.'_UHD.jpg',"$dir/$date.jpg",'PC 原图');
$okMobile=save_image($base.'_1080x1920.jpg',"$dir/$date-mobile.jpg",'手机竖屏图');
exit(($okPc && $okMobile)?0:1);
