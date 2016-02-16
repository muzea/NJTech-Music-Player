<?php
$action = $_GET['action'];
if ( $action == 'search' )
{
	$key = $_GET['key'];
	$page = $_GET['page'];
	header("Content-type: text/html; charset=utf-8");
	echo json_encode( getSearchResult($key, $page),JSON_UNESCAPED_UNICODE);
}
else
{
	# code...
}
if ( $action == 'getlist' )
{
	header("Content-type: text/html; charset=utf-8");
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "http://www.xiami.com/chart/data?c=4");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	$output = curl_exec($ch);
	curl_close($ch);
	$output = str_replace(PHP_EOL, '', $output);
	if ( stristr($output,'您要找的是不是') )
	{
		$arr['errorcode'] = 'NULL';
	}
	else
	{
		$reg = '/<div class="song">.*?<div class="info">.*?<a target="_blank" href="\/song\/(.*?)".*?>(.*?)<\/a>.*?<a class="artist".*?>(.*?)<\/a>.*?<\/div>.*?<\/div>/';
		preg_match_all( $reg, $output, $matchs );
		foreach ($matchs[2] as $key=>$value)
		{
			$matchs[2][$key] = strip_tags($matchs[2][$key]);
		}
		$arr['name'] = $matchs[2];
		$arr['id'] = $matchs[1];
		$arr['artist'] = $matchs[3];
	}
	echo json_encode($arr,JSON_UNESCAPED_UNICODE);
}


function getSearchResult ( $key, $page = 1)
{
	//为了某些会多打空格的智障儿童
	$keyarray = explode (' ' , $key );
	$r_keyarray = array();
	foreach( $keyarray as $key_item )
	{
		if( strlen($key_item) > 0 ){
			$r_keyarray []= $key_item;
		}
	}
	$key = implode('+', $r_keyarray);
	$key = urlencode($key);
	if ( isset($_GET['raw']) )
	{
		echo $key;
	}
	$searchUrl = "http://www.xiami.com/search/song/page/$page?key=$key&category=-1";
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $searchUrl);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	$output = curl_exec($ch);
	curl_close($ch);
	$output = str_replace(PHP_EOL, '', $output);
	$ret = [];
	$ret['erroe'] = 0;
	$ret['page'] = $page;
	if ( stristr($output,'<p class="seek_counts error">') )
	{
		$ret['res_cnt'] = 0;
	}
	else
	{
		$reg = '/<p class="seek_counts ok">找到约<b>(.+?)<\/b>/';
		preg_match( $reg, $output, $matchs );
		if ( isset($_GET['raw']) )
		{
			echo $output;
			exit(0);
		}
		$ret['res_cnt'] = intval($matchs[1]);
	}
	
	if ( $ret['res_cnt'] == 0 )
	{
		$ret['error'] = 1;
	}
	else
	{
		$reg = '/<tr.*?>.*?<td class="song_name">.*?<a.*?song\/(.*?)".*?title.*?>(.*?)<\/a>.*?<a target="_blank" href="http:\/\/www.xiami.com\/artist\/.*?" title="(.*?)">.*?<\/tr>/';
		preg_match_all( $reg, $output, $matchs );
		$len = count( $matchs[1] );
		$i = 0;
		$music_list = [];
		while ( $i < $len )
		{
			$music_obj = []; 
			$music_obj[ 'id' ] = $matchs[1][$i];
			$music_obj[ 'name' ] = strip_tags($matchs[2][$i]);
			$music_obj[ 'artist' ] = $matchs[3][$i];
			$music_list []= $music_obj;
			$i ++;
		}
		$ret['music'] = $music_list;
	}
	return $ret;
}