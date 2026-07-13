<?php
/**
 * Bing 每日壁纸 - 自动适配接口 auto_302.php
 * 功能：智能识别设备类型，302跳转到对应分辨率壁纸
 * PC端：1920x1080 横屏
 * 移动端：1080x1920 竖屏
 * 参数：idx=偏移天数, w=宽度, h=高度, mkt=地区
 */

// 获取参数
$idx = isset($_GET['idx']) ? max(0, min(7, intval($_GET['idx']))) : 0;
$mkt = isset($_GET['mkt']) ? $_GET['mkt'] : 'zh-CN';

// 检测设备类型
$is_mobile = is_mobile_device();

// 默认尺寸
$default_w = $is_mobile ? 1080 : 1920;
$default_h = $is_mobile ? 1920 : 1080;
$w = isset($_GET['w']) ? intval($_GET['w']) : $default_w;
$h = isset($_GET['h']) ? intval($_GET['h']) : $default_h;

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
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0');
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 构建图片URL
$image_url = '';
if ($http_code == 200 && $response) {
    $data = json_decode($response, true);
    if (!empty($data['images'][0]['urlbase'])) {
        $urlbase = $data['images'][0]['urlbase'];
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
    if ($is_mobile) {
        $image_url = 'https://www.bing.com/th?id=OHR.SnowyMountains_ZH-CN9869777329_1080x1920.jpg';
    } else {
        $image_url = 'https://www.bing.com/th?id=OHR.SnowyMountains_ZH-CN9869777329_1920x1080.jpg';
    }
}

header('Location: ' . $image_url, true, 302);
exit;

/**
 * 检测是否为移动设备
 * @return bool
 */
function is_mobile_device() {
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $mobile_keywords = [
        'Mobile', 'Android', 'iPhone', 'iPad', 'iPod',
        'BlackBerry', 'Opera Mini', 'IEMobile', 'Windows Phone',
        'webOS', 'Symbian', 'Kindle', 'Silk', 'Bada'
    ];
    
    foreach ($mobile_keywords as $keyword) {
        if (stripos($user_agent, $keyword) !== false) {
            return true;
        }
    }
    
    return false;
}
