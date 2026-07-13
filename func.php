<?php
/**
 * Bing 每日壁纸 - JSON 信息接口 func.php
 * 功能：返回壁纸的 JSON 信息（日期、版权、图片链接等）
 * 参数：info=1（启用）, idx=偏移天数, n=数量, mkt=地区
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600');

// 获取参数
$idx = isset($_GET['idx']) ? max(0, min(7, intval($_GET['idx']))) : 0;
$n = isset($_GET['n']) ? max(1, min(8, intval($_GET['n']))) : 1;
$mkt = isset($_GET['mkt']) ? $_GET['mkt'] : 'zh-CN';
$site_url = 'https://bing-img.wuw.li';

// Bing 壁纸 API 地址
$bing_api = "https://www.bing.com/HPImageArchive.aspx?format=js&idx={$idx}&n={$n}&mkt={$mkt}";

// 请求获取壁纸信息
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $bing_api);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code != 200 || !$response) {
    echo json_encode([
        'code' => 500,
        'msg' => '获取壁纸数据失败',
        'data' => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($response, true);
if (empty($data['images'])) {
    echo json_encode([
        'code' => 500,
        'msg' => '获取壁纸数据失败',
        'data' => null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 格式化返回数据
$result = [];
$current_idx = $idx;
foreach ($data['images'] as $img) {
    $date = $img['startdate'] ?? '';
    $formatted_date = substr($date, 0, 4) . '-' . substr($date, 4, 2) . '-' . substr($date, 6, 2);
    $urlbase = $img['urlbase'] ?? '';
    
    $result[] = [
        'date' => $formatted_date,
        'startdate' => $date,
        'copyright' => $img['copyright'] ?? '',
        'title' => $img['title'] ?? '',
        'url' => 'https://www.bing.com' . ($img['url'] ?? ''),
        'urlbase' => 'https://www.bing.com' . $urlbase,
        'pc_url' => "https://www.bing.com{$urlbase}_1920x1080.jpg",
        'mobile_url' => "https://www.bing.com{$urlbase}_1080x1920.jpg",
        'api_auto' => $site_url . '/auto_302.php?idx=' . $current_idx,
        'api_pc' => $site_url . '/1920x1080_302.php?idx=' . $current_idx,
        'api_mobile' => $site_url . '/m_302.php?idx=' . $current_idx,
    ];
    $current_idx++;
}

echo json_encode([
    'code' => 200,
    'msg' => 'success',
    'count' => count($result),
    'data' => $result
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
