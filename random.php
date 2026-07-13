<?php
/** 从本地 bing-img 随机返回壁纸：PC 横屏、手机竖屏。idx 仅作缓存刷新参数。 */
function is_mobile(): bool { return (bool)preg_match('/Mobile|Android|iPhone|iPod|iPad|WebOS|BlackBerry|IEMobile|Opera Mini/i', $_SERVER['HTTP_USER_AGENT']??''); }
$dir=__DIR__.'/bing-img';
$mobile=is_mobile();
$pattern=$mobile?'*-mobile.jpg':'*.jpg';
$files=is_dir($dir)?glob($dir.'/'.$pattern):[];
$files=array_values(array_filter($files?:[],static function($f)use($mobile){
    $name=basename($f);
    $re=$mobile?'/^\d{4}-\d{2}-\d{2}-mobile\.jpg$/':'/^\d{4}-\d{2}-\d{2}\.jpg$/';
    return preg_match($re,$name)&&filesize($f)>10000&&@getimagesize($f)!==false;
}));
if(!$files){http_response_code(503);header('Content-Type: text/plain; charset=UTF-8');exit('本地壁纸暂不可用');}
$chosen=$files[random_int(0,count($files)-1)];
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Vary: User-Agent');
header('Location: /bing-img/'.rawurlencode(basename($chosen)),true,302);exit;
