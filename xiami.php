<?php
ERROR_REPORTING(0);
$action = $_GET['action'];
$ret = [];
$ret['erroe'] = 0;
switch ( $action )
{
	case 'get_music':
		{
			$music_id = $_GET['music_id'];
			if ( $music_id == 'girigiri.love' )
			{
				$ret['lyric_url'] = 'girigiri.love';
				$ret['album_pic'] = 'girigiri.love';
				$ret['file_name'] = 'mp3/girigiri.love.mp3';
				$ret['state'] = true;
				break;
			}
			
			$content=file_get_contents('http://www.xiami.com/song/playlist/id/'.$music_id.'/object_name/default/object_id/0/cat/json');
			$json = json_decode($content,true);
			$location = $json['data']['trackList'][0]['location'];
			$xiami = ipcxiami($location);
			$ret['lyric_url'] = $json['data']['trackList'][0]['lyric_url'];
			$ret['album_pic'] = $json['data']['trackList'][0]['album_pic'];
			$filename = 'mp3/' . $music_id.'.mp3';
			$ret['file_name'] = $filename;
			if ( !file_exists($filename) )
			{
				$ret['state'] = copy($xiami,$filename);
			}
			else{
				$ret['state'] = true;
			}
		}
		break;
	case 'get_lrc':
		{
			$res_url = $_GET['res_url'];
			$music_id = $_GET['music_id'];
			if ( $music_id == 'girigiri.love' )
			{
				$ret['file_name'] = 'lrc/girigiri.love.lrc';
				$ret['state'] = true;
				break;
			}
			$filename = 'lrc/' . $music_id.'.lrc';
			$ret['file_name'] = $filename;
			if ( !file_exists($filename) )
			{
				$ret['state'] = copy($res_url,$filename);
			}
			else{
				$ret['state'] = true;
			}
		}
		break;
	case 'get_pic':
		{
			$res_url = $_GET['res_url'];
			$music_id = $_GET['music_id'];
			if ( $music_id == 'girigiri.love' )
			{
				$ret['file_name'] = 'album/girigiri.love.jpg';
				$ret['state'] = true;
				break;
			}
			$filename = 'album/' . $music_id.'.jpg';
			$ret['file_name'] = $filename;
			if ( !file_exists($filename) )
			{
				$ret['state'] = copy($res_url,$filename);
			}
			else{
				$ret['state'] = true;
			}
		}
		break;
	default:
		$ret['erroe'] = 1;
		break;
}
echo json_encode($ret);

function ipcxiami($location){
	$count = (int)substr($location, 0, 1);
	$url = substr($location, 1);
	$line = floor(strlen($url) / $count);
	$loc_5 = strlen($url) % $count;
	$loc_6 = array();
	$loc_7 = 0;
	$loc_8 = '';
	$loc_9 = '';
	$loc_10 = '';
	while ($loc_7 < $loc_5){
		$loc_6[$loc_7] = substr($url, ($line+1)*$loc_7, $line+1);
		$loc_7++;
	}
	$loc_7 = $loc_5;
	while($loc_7 < $count){
		$loc_6[$loc_7] = substr($url, $line * ($loc_7 - $loc_5) + ($line + 1) * $loc_5, $line);
		$loc_7++;
	}
	$loc_7 = 0;
	while ($loc_7 < strlen($loc_6[0])){
		$loc_10 = 0;
		while ($loc_10 < count($loc_6)){
			$loc_8 .= @$loc_6[$loc_10][$loc_7];
			$loc_10++;
		}
		$loc_7++;
	}
	$loc_9 = str_replace('^', 0, urldecode($loc_8));
	return $loc_9;
}
