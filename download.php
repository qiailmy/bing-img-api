<?php
/** 安全代理下载 Bing 原图，强制浏览器下载而非打开新标签。 */
$url = $_GET['url'] ?? '';
$parts = parse_url($url);
$host = strtolower($parts['host'] ?? '');
if (($parts['scheme'] ?? '') !== 'https' || !in_array($host, ['www.bing.com','cn.bing.com'], true)) { http_response_code(400); exit('Invalid image URL'); }
$ch = curl_init($url);
curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_MAXREDIRS=>3,CURLOPT_TIMEOUT=>60,CURLOPT_CONNECTTIMEOUT=>12,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_USERAGENT=>'Mozilla/5.0 BingWallpaperDownload/1.0']);
$data=curl_exec($ch); $code=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $type=(string)curl_getinfo($ch,CURLINFO_CONTENT_TYPE); curl_close($ch);
if ($code!==200 || !$data || !str_starts_with(strtolower($type),'image/')) { http_response_code(502); exit('Image download failed'); }
$name='bing-wallpaper-'.date('Ymd-His').'.jpg';
header('Content-Type: image/jpeg'); header('Content-Disposition: attachment; filename="'.$name.'"'); header('Content-Length: '.strlen($data)); header('Cache-Control: private, max-age=3600'); echo $data;
