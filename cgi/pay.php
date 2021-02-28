<?php
header('content-type: application/json; charset=utf-8');
header("access-control-allow-origin: *");

function openCurl($url){
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_AUTOREFERER, true);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 120);
	curl_setopt($ch, CURLOPT_TIMEOUT, 120);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_ENCODING, '');
	curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:31.0) Gecko/20100101 Firefox/31.0');
	$data = curl_exec($ch);
	curl_close($ch);
	return $data;
}

$amount = trim($_POST['amount']);
$order = time();

$callback = 'https://magarun.io/callback';

$content = openCurl('https://plisio.net/api/v1/invoices/new?source_currency=USD&source_amount=' . $amount . '&order_number=' . $order . '&order_name=Deposit&currency=DOGE&callback_url=' .  $callback . '&api_key=9xMX8kZ5ImghUZ4HrmQVlHIHPI0f2Z-ckSWS6Uw4aXQ_o-fQijw2OAMd7es0zqAc');

$decode = json_decode($content, true);

if($decode['status'] == 'success'){
    $redirect = $decode['data']['invoice_url'];
    exit(json_encode([ 'status' => 'success', 'url' => $redirect ]));
}

exit(json_encode([ 'status' => false ]));