<?php
/**
 * Bing 每日壁纸 - 移动端接口 m_302.php
 * 功能：302跳转到 Bing 移动端壁纸
 * 分辨率：1080x1920（竖屏手机适配）
 * 参数：idx=偏移天数, w=宽度, h=高度, mkt=地区
 */

// 获取参数
$idx = isset($_GET['idx']) ? max(0, min(7, intval($_GET['idx']))) : 0;
$w = isset($_GET['w']) ? intval($_GET['w']) : 1080;
$h = isset($_GET['h']) ? intval($_GET['h']) : 1920;
$mkt = isset($_GET['mkt']) ? $_GET['mkt'] : 'zh-CN';

// Bing 壁纸 API 地址
$bing_api = "https://www.bing.com/HPImageArchive.aspx?format=js&idx={$idx}&n=1&mkt={$mkt}";

// 请求获取壁纸信息
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $bing_api);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 构建图片URL
$image_url = '';
if ($http_code == 200 && $response) {
    $data = json_decode($response, true);
    if (!empty($data['images'][0]['urlbase'])) {
        $urlbase = $data['images'][0]['urlbase'];
        // 标准尺寸直接用 Bing 原生尺寸后缀
        $standard_sizes = ['1920x1080', '1080x1920', '1366x768', '800x480'];
        $size = "{$w}x{$h}";
        if (in_array($size, $standard_sizes)) {
            $image_url = "https://www.bing.com{$urlbase}_{$size}.jpg";
        } else {
            $image_url = "https://www.bing.com{$urlbase}_UHD.jpg&w={$w}&h={$h}&rs=1&c=4";
        }
    }
}

// 备用图
if (!$image_url) {
    $image_url = 'https://www.bing.com/th?id=OHR.SnowyMountains_ZH-CN9869777329_1080x1920.jpg';
}

header('Location: ' . $image_url, true, 302);
exit;
