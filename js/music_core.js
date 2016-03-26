//可视化部分使用了 http://www.cnblogs.com/Wayou/p/html5_audio_api_visualizer.html 这里的代码
var devMark = false;
var isIE = /*@cc_on!@*/false;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
var isMobile = {
	Android: function () {
		return navigator.userAgent.match(/Android/i) ? true : false;
	},
	iOS: function () {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
	},
	Windows: function () {
		return navigator.userAgent.match(/IEMobile/i) ? true : false;
	},
	any: function () {
		return (isMobile.Android() || isMobile.iOS() || isMobile.Windows());
	}
};
$(function(){
	isIE = isIE || (document.body.style.msTouchAction !== undefined);
	document.music = NJTechOnlineMusic();
	document.music.ini();
});
var NJTechOnlineMusic = function(){
	var serverUrl =  '/music/',
		lrcHeight_half = 12.5;
	return {
		searchUrl : serverUrl + '',
		musicUrl : serverUrl + '',
		albumUrl : serverUrl + '',
		lrcUrl : serverUrl + '',
		playerList : null,
		myList : null,
		lrcEps : 0.0,
		lrcData : null,
		lrcContent : null,
		lrcController : null,
		searchResult : null,
		albumImg : null,
		albumImgBlur : null,
		searchBox : null,
		searchForm : null,
		searchKey : null,
		searchPage : null,
		player : null,
		useVisualizer : true,
		nowPlayingID : 0,
		progressBar : null,
		loopTable : ['列表循环','单曲循环','顺序播放'],
		loopIndex : 0,
		loopButton : null,
		listClearButton : null,
		_this : null,
		playIndex : 0,
		playCnt : 0,
		playAtom : 0,
		blockUserPlayAction : false,
		userPauseMark : false,
		mobile_ini_mark : false,

		ini : function(){
			if(isIE) this.useVisualizer = false;
			this.mobile_ini_mark = isMobile.any();
			this.player = document.getElementById("player");
			_this = this;
			this.player.oncanplay = function(){
				_this.playAtom = 0;
				this.play();
			};
			this.player.onended = function(){
				_this.removePlayingState();
				_this.refreshPlayer();
			};
			this.searchResult = $('#search-result');
			this.playerList = $('#play-list');
			this.myList = $('#my-list');
			this.searchForm = $('#search-box-form');
			this.searchBox = $('#search-box');
			this.lrcContent = $('#lrc-content');
			this.albumImg = document.getElementById("album-img");
			this.albumImgBlur = document.getElementById("album-img-blur");
			this.progressBar = $('#progress-bar');
			this.lrcController = {};
			this.lrcController.currentPos = {};
			this.lrcController.prefix = 0.5;
			this.lrcController.getLrcMoveRange = function( PlayerTime ){
				//生命不息 萝莉控不止
				//欢迎试听  "ハロ/ハワユ+鹿乃" 第一个结果 萝莉即是正义！！！
				var ret = {};
				if(_this.nowPlayingID == 1769987950){
					var dup_prefix = 1.0;
					ret.needChange = false;
					if(this.currentTime == -1){
						ret.begin = 0;
					}else{
						ret.begin = this.currentPos.end;
					}
					var lrcLength = _this.lrcData.length;
					while( ret.begin < lrcLength && ( _this.lrcData[ret.begin].content.trim().length == 0 ) ){
						++ ret.begin;
					}
					if ( ret.begin == lrcLength ) return ret;
					if( ( _this.lrcData[ret.begin].time - dup_prefix ) <= PlayerTime ){
						ret.needChange = true;
					}
					ret.end = ret.begin + 1;
					while( ret.end < lrcLength ){
						if( _this.lrcData[ret.end].content.trim().length > 0 ){
							++ ret.end;
						}
						else{
							break;
						}
					}
					//1769987950 处理结束
				}
				else{
					ret.needChange = false;
					if(this.currentTime == -1){
						ret.begin = 0;
					}else{
						ret.begin = this.currentPos.end;
					}
					var lrcLength = _this.lrcData.length;
					if ( ret.begin == lrcLength ) return ret;
					if( ( _this.lrcData[ret.begin].time - this.prefix ) <= PlayerTime ){
						ret.needChange = true;
					}
					if(devMark){
						console.log('诡异的BUG@'+PlayerTime);
					}
					ret.end = ret.begin + 1;
					while( ret.end < lrcLength ){
						if( ( _this.lrcData[ret.end].time - _this.lrcData[ret.begin].time ) < _this.lrcEps ){
							++ ret.end;
						}
						else{
							break;
						}
					}
				}
				
				return ret;
			};
			this.lrcController.setCurrentLrc = function( range ){
				var cache_lrc = $('.lrc');
				if(this.currentTime != -1){
					cache_lrc.slice(this.currentPos.begin,this.currentPos.end).removeClass('current-lrc');
				}
				cache_lrc.slice(range.begin,range.end).addClass('current-lrc');
				var mid = Math.floor( ( range.begin + range.end ) * lrcHeight_half );
				if(devMark){
					console.log('移动距离为'+ mid);
				}
				_this.lrcContent.css({"transform":"translateY(-" + mid + "px)",
					"transition": "all 300ms ease"});
			};
			this.searchForm.on('submit',function(event){
				event.preventDefault();
				_this.getSearchResult(_this.searchBox.val(),1);
				return false;
			});
			this.searchResult.on('click','.music-nowplay',function(event){
				event.preventDefault();
				var p = $(this).parent();
				var songData = {
					'id' : p.data('music-id'),
					'name' : p.data('music-name'),
					'artist' : p.data('music-artist')
				};
				if( typeof(songData.id) != "undefined" && _this.blockUserPlayAction == false){
					_this.userPauseMark = false;
					_this.blockUserPlayAction = true;
					_this.addToList(songData);
					_this.removePlayingState();
					_this.playIndex = _this.playCnt - 1;
					_this.blockUserPlayAction = false;
					_this.player.pause();
					_this.refreshPlayer();
				}
				return false;
			});
			this.searchResult.on('click','.music-addlist',function(event){
				event.preventDefault();
				var p = $(this).parent();
				var songData = {
					'id' : p.data('music-id'),
					'name' : p.data('music-name'),
					'artist' : p.data('music-artist')
				};
				if( typeof(songData.id) != "undefined" ){
					_this.addToList(songData);
				}
				return false;
			});
			this.loopButton = $('#list-loop-button');
			this.loopButton.on('click',function(event){
				event.preventDefault();
				_this.loopIndex = (_this.loopIndex + 1) % _this.loopTable.length;
				this.innerHTML = _this.loopTable[_this.loopIndex];
				return false;
			});
			var cache_button_play = $('#player-pause');
			cache_button_play.on('click.playerControlle',function(event){
				if(_this.player.paused){
					_this.userPauseMark = false;
					_this.player.play();
					cache_button_play.find('span').removeClass('mif-play').addClass('mif-pause');
				}else{
					_this.userPauseMark = true;
					_this.player.pause();
					cache_button_play.find('span').removeClass('mif-pause').addClass('mif-play');
				}
			});
			$('#player-next').on('click.playerControlle',function(event){
				_this.player.pause();
				_this.removePlayingState();
				_this.userPauseMark = false;
				_this.refreshPlayer();
			});
			this.playerList.on('click.removeListItem','.music-delete',function(event){
				var delete_item = $(this).parent();
				var delete_item_index = delete_item.index() + 1,
					music_id = delete_item.data('music-id');
				if(delete_item_index == _this.playIndex){
					_this.player.pause();
					_this.deleteMusic(music_id);
					_this.refreshPlayer();
				}else{
					_this.deleteMusic(music_id);
				}
			});
			this.playerList.on('click.palyControl','.music-nowplay',function(event){
				_this.userPauseMark = false;
				_this.blockUserPlayAction = true;
				var index = _this.playerList.children().index( $(this).parent() );
				_this.player.pause();
				_this.removePlayingState();
				_this.playIndex = index;
				_this.blockUserPlayAction = false;
				_this.refreshPlayer();
			});
			$('#mylist-store').on('click.myList',function(event){
				var songDataList = [];
				_this.playerList.children().each(function(index,element){
					songDataList.push($(element).data('songData'));
				});
				window.localStorage['songDataList'] = JSON.stringify(songDataList);
				_this.refreshMyMusicList();
			});
			$('#mylist-restore').on('click.myList',function(event){
				_this.clearMusicList();
				var songDataList = window.localStorage['songDataList'];
				if(songDataList){
					songDataList = JSON.parse(songDataList);
					songDataList.forEach(function(songData){
						_this.addToList(songData);
					});
				}
			});
			$('#volume').on('change',function(e){
				_this.player.volume = this.value / 100;
			});
			this.refreshMyMusicList();
			if(this.mobile_ini_mark) this.mobile_ini();
			if(this.useVisualizer && !this.mobile_ini_mark) this.visualizer_ini();
		},
		mobile_ini : function(){
			if( this.mobile_ini_mark === false ){
				this.mobile_ini_mark = true;
				$('html').one('touchstart', function(){
					_this.player.play();
					_this.player.pause();
				});
			}
		},
		visualizer_ini : function(){
			var ctx = new AudioContext();
			var analyser = ctx.createAnalyser();
			analyser.fftSize = 512;
			var audioSrc = ctx.createMediaElementSource(this.player);
			audioSrc.connect(analyser);
			analyser.connect(ctx.destination);
			var frequencyData = new Uint8Array(analyser.frequencyBinCount);
			var canvas = document.getElementById('visualizer'),
				cwidth = canvas.width,
				cheight = canvas.height - 2,
				meterWidth = 10, //width of the meters in the spectrum
				gap = 2, //gap between meters
				capHeight = 2,
				capStyle = '#2EA4FF',
				meterNum = cwidth / (10 + 2), //count of the meters
				capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame
			ctx = canvas.getContext('2d'),
			gradient = '#2EA4FF';

			var frames_split_cache = $('.frames-split');
			$(window).on('resize.visualizerSize', resizeCanvas);
			$(window).resize();
			function resizeCanvas(e){
				canvas.height = frames_split_cache.height();
				canvas.width = frames_split_cache.width();
				cwidth = canvas.width;
				cheight = canvas.height - 2;
				meterNum = cwidth / (10 + 2);
			}
			function renderFrame() {
				var array = new Uint8Array(analyser.frequencyBinCount);
				analyser.getByteFrequencyData(array);
				var step = Math.floor(array.length / meterNum); //sample limited data from the total array
				ctx.clearRect(0, 0, cwidth, cheight);
				for (var i = 0; i < meterNum; i++) {
					var value = 0;
					for(var _a_i = 0; _a_i < step; ++_a_i){
						value += array[i * step + _a_i];
					}
					value = Math.round(value / step);
					if (capYPositionArray.length < Math.round(meterNum)) {
						capYPositionArray.push(value);
					};
					ctx.fillStyle = capStyle;
					//draw the cap, with transition effect
					if (value < capYPositionArray[i]) {
						ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
					} else {
						ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
						capYPositionArray[i] = value;
					};
					ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
					if(devMark){
						ctx.fillRect(i * 12 /*meterWidth+gap*/ , 233 , meterWidth, cheight); //the meter
					}
					else{
						ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
					}
				}
				requestAnimationFrame(renderFrame);
			}
			renderFrame();
		},
		//controller function begin
		changeMusicSrc : function( music_src ){
			if(music_src){
				this.playAtom = 1;
				this.player.src = 'mp3/'+music_src;				
			}
			else{
				this.player.src = '';
			}
		},
		removePlayingState : function(){
			this.playerList.find('tr').eq(this.playIndex - 1).find('.music-state').find('span').removeClass('mif-music');
		},
		updateMusicRes : function( res ){

		},
		cacheMusicRes : function( music_id, res, reset ){
			var emptyLrc = [{'time' : 23333333, 'content' : '没有歌词'}];
			if(devMark){
				console.log(res);
			}
			if( res.lyric_url && res.lyric_url.length > 2 ){
				$.getJSON( _this.lrcUrl +  'xiami.php',
					{'action': 'get_lrc','music_id':music_id,'res_url':res.lyric_url},
					function( data ){
						if(devMark){
							console.log(data);
							console.log(_this.lrcUrl + data.file_name);
						}
						$.get( _this.lrcUrl + data.file_name ,function(data){
							_this.lrcData = _this.parseLrc(data);
							_this.refreshLrcContent();
							_this.refreshLrcController();
						});
				});
			}
			else{
				_this.lrcData = emptyLrc;
				_this.refreshLrcContent();
				_this.refreshLrcController(reset);
			}
			if( res.album_pic && res.album_pic.length > 2 ){
				$.getJSON( _this.albumUrl +  'xiami.php',
					{'action': 'get_pic','music_id':music_id,'res_url':res.album_pic},
					function( data ){
						if(devMark){
							console.log(data);
						}
						_this.albumImg.src = _this.albumUrl + data.file_name;
						_this.albumImgBlur.src = _this.albumUrl + data.file_name;
						_this.updateMusicRes();
				});
			}
			else{
				_this.albumImg.src = '';
				_this.albumImgBlur.src = '';
			}
		},
		changeMusic : function( list_index ){
			if(this.blockUserPlayAction == false){
				this.blockUserPlayAction = true;
				var musicItem = this.playerList.find('tr').eq(list_index);
				musicItem.find('.music-state').find('span').addClass('mif-music');
				var music_id = musicItem.data('music-id');
				$.getJSON( this.musicUrl + 'xiami.php?action=get_music&music_id='+music_id,function(data){
					_this.nowPlayingID = music_id;
					if(data.state == true){
						_this.cacheMusicRes(music_id, data);
						if(devMark){
							console.log(data);
						}
						_this.changeMusicSrc(music_id+'.mp3');
						_this.blockUserPlayAction = false;
					}else{
						console.log('some Error');
						console.log(data);
						$.Notify({
							caption: '迷の错误',
							content: musicItem.find('.music-name').text() + ' 无法播放，已经从播放列表中移除',
							type: 'alert'
						});
						if(devMark){
							console.log('播放时移除操作前' + _this.blockUserPlayAction);
						}
						_this.blockUserPlayAction = false;
						_this.deleteMusic(music_id);
						_this.refreshPlayer();
						// refreshPlayer -> changeMusic ->  refreshPlayer
						//因为在第一次调用时播放器已经暂停，故这里不需要暂停播放器
						if(devMark){
							console.log('播放时移除操作后' + _this.blockUserPlayAction);
						}
					}
				});
			}
		},
		refreshPlayer : function(){
			if(this.blockUserPlayAction == false && this.player.paused && this.playAtom == 0){
				if(devMark){
					console.log('debug @ refreshPlayer before switch');
				}
				this.blockUserPlayAction = true;
				switch(this.loopIndex){
					case 0://列表循环
						if(this.playCnt && this.playIndex != this.playCnt){
							this.playIndex++;
							this.blockUserPlayAction = false;
							this.changeMusic(this.playIndex - 1);
						}
						else{
							if(this.playCnt){
								this.playIndex = 1;
								this.blockUserPlayAction = false;
								this.changeMusic(this.playIndex - 1);
							}
							else{
								this.clearPlayerRes();
								this.blockUserPlayAction = false;
							}
						}
						break;
					case 1://单曲循环
						if(this.playCnt && this.playIndex <= this.playCnt){
							this.blockUserPlayAction = false;
							if(this.playIndex == 0){
								this.playIndex = 1;
								this.changeMusic(this.playIndex - 1);
							}
							else{
								this.player.play();
							}
						}
						else{
							this.clearPlayerRes();
							this.blockUserPlayAction = false;
						}
						break;
					case 2://顺序播放
						if(this.playCnt && this.playIndex != this.playCnt){
							this.playIndex++;
							this.blockUserPlayAction = false;
							this.changeMusic(this.playIndex - 1);
						}
						else{
							this.playIndex = 0;
							this.blockUserPlayAction = false;
						}
						break;
				}
			}
		},
		clearPlayerRes : function(){
			this.cacheMusicRes(0,{},true);
			this.progressBar.data('progress').set(0);
			this.changeMusicSrc();
		},
		//lrc function begin
		refreshLrcContent : function(){
			var content = '';
			this.lrcData.forEach(function(eLrc){
				content += '<p class="lrc">'+ eLrc.content +'</p>';
			});
			this.lrcContent.empty().append(content);
		},
		refreshLrcController : function(reset){
			$(this.player).off('timeupdate.scroll');
			this.lrcController.currentTime = -1;
			this.lrcController.currentPos.begin = -1;
			this.lrcController.currentPos.end = -1;
			if(reset && reset === true){
				//我的内心是崩溃的 我应该重写这里的
			}
			else{
				$(this.player).on('timeupdate.scroll',function(eventObject){
					_this.progressBar.data('progress').set( (this.currentTime  / this.duration) * 100  );
					var moveRange = _this.lrcController.getLrcMoveRange( this.currentTime );
					if(moveRange.needChange == true){
						if(devMark){
							console.log(moveRange);
							console.log(eventObject);
						}
						_this.lrcController.setCurrentLrc(moveRange);
						_this.lrcController.currentTime = this.currentTime;
						_this.lrcController.currentPos.begin = moveRange.begin;
						_this.lrcController.currentPos.end = moveRange.end;
					}
				});				
			}
		},
		parseLrc : function( raw_data ){
			var lrcList = [];
			//lrc obj -> {time,content}
			var raw_data_lines = raw_data.split('\n');
			raw_data_lines.forEach(function(line){
				line = line.trim();
				var timeStack = [],lrc_line = '';
				var line_length = line.length, i = 0;
				if( line_length ){
					while ( i < line_length ){
						if( line[i] == '[' ){
							++i;
							var timeObj = 0,storeObj = 0;
							while(line[i] != ']'){
								switch(line[i]){
									case '0':case '1':case '2':case '3':case '4':
									case '5':case '6':case '7':case '8':case '9':
										timeObj *= 10;
										timeObj += parseInt(line[i]);
										break;
									case ':':
										timeObj *= 60;
										storeObj *= 60;
										storeObj += timeObj;
										timeObj = 0;
										break;
									case '.':
										var end_pos = line.indexOf(']', i);
										timeObj += parseFloat(  line.substr(i, end_pos - i)  );
										i = end_pos - 1;
										break;
									default:
										;
								}
								++i;
							}
							timeStack.push(storeObj + timeObj);
						} else {
							//lrc_line = line.substr(i).trim();
							lrc_line = line.substr(i); //生命不息 萝莉控不止
							i = line_length;
						}
						++i;
					}
					//buidl lrc obj
					timeStack.forEach(function(timeObj){
						if( timeObj > 0 || lrc_line.length > 0){
							lrcList.push({'time':timeObj,'content':lrc_line});
						}
						else{
							if(devMark){
								console.log('歌词注释部分');
								console.log(line);
							}
							lrcList.push({'time':0,'content':line});
						}
					});
				}
			});
			lrcList.sort(function(a,b){
				return (a.time - b.time);
			});
			return lrcList;
		},
		//lrc function end
		//music_list function begin
		clearMusicList : function(){
			this.blockUserPlayAction = true;
			this.player.pause();
			this.playerList.children().each(function(index, element){
				if(devMark){
					console.log( element.dataset['musicId'] );
				}
				_this.deleteMusic( element.dataset['musicId'] );
			});
			this.progressBar.data('progress').set(0);
			this.cacheMusicRes(0,{});
			this.blockUserPlayAction = false;
		},
		deleteMusic : function(id){
			this.blockUserPlayAction = true;
			var delete_item = $('#music-'+id);
			var music_name = '';
			if( delete_item.length == 1){
				music_name = delete_item.find('.music-name').text();
				var list_index = delete_item.index() + 1;
				this.playCnt --;
				if(list_index == this.playIndex){
					this.playIndex --;
					delete_item.remove();
					this.blockUserPlayAction = false;
				}else if(list_index < this.playIndex){
					this.playIndex --;
					delete_item.remove();
					this.blockUserPlayAction = false;
				}else{
					delete_item.remove();
					this.blockUserPlayAction = false;
				}
				$.Notify({
					caption: '歌曲已经移除',
					content: music_name + '已经从播放列表中移除',
					type: 'success'
				});
			}else{
				$.Notify({
					caption: '警告',
					content: '请不要调戏播放器',
					type: 'alert'
				});
				this.blockUserPlayAction = false;
			}
			if(devMark){
				console.log('移除函数中 ' + this.blockUserPlayAction);
			}
		},
		addToList : function(songData){
			if( $('#music-' + songData.id).length == 0 ){
				var listItem = '<tr class="list-song" id="music-' + songData.id + '" data-music-id="'+songData.id+'" >\
									<td class="music-state"><span></span></td>\
									<td class="music-name">'+songData.name+'</td>\
									<td class="music-artist">'+songData.artist+'</td>\
									<td data-music-id="'+songData.id+'" class="music-nowplay">立即播放</td>\
									<td class="music-delete">从列表中删除</td>\
								</tr>';
				this.playerList.append(listItem);
				$('#music-' + songData.id).data('songData', songData);
				this.playCnt++;
				if(devMark){
					console.log('debug @ addToList before refreshPlayer');
				}
				if(!this.userPauseMark) this.refreshPlayer();
			}else{
				$.Notify({
					caption: '重复的歌曲',
					content: songData.name + '已经在播放列表中',
					type: 'warning'
				});
			}
		},
		getSearchResult : function(key, page){
			this.searchKey = key;
			this.searchPage = page;
			$.getJSON(this.searchUrl + 'music.php?action=search&key='+key + '&page=' + page, function(data){
				if(devMark){
					console.log(data);
				}
				if(data.error == 1){
					alert('无结果');
				}
				else{
					var tabledata = '';
					if(data.res_cnt > 20){
						var all_page = Math.ceil(data.res_cnt/20);
						$('#page-hint').text(page + '/' + all_page);
						$('.search-group-button').off('click.searchGroup');
						if(page != 1){
							$('#search-pre').on('click.searchGroup',page - 1,function(event){
								event.preventDefault();
								_this.getSearchResult(_this.searchKey, event.data);
								$('#tab_search_scroll').redefineScroll().scrollTo( _this.searchResult.position().top );
								return false;
							});
						}
						if(page != all_page){
							$('#search-next').on('click.searchGroup',page + 1,function(event){
								event.preventDefault();
								_this.getSearchResult(_this.searchKey, event.data);
								$('#tab_search_scroll').redefineScroll().scrollTo( _this.searchResult.position().top );
								return false;
							});
						}
						$('.search-group-button').removeClass('hidden');
					}else{
						$('.search-group-button').addClass('hidden');
					}
					data.music.forEach(function(e){
						tabledata += '<tr data-music-id="'+ e.id + '" data-music-name="'+ e.name +'" data-music-artist="' + e.artist + '" class="search-result-song"><td class="music-name">'+ e.name +'</td><td class="music-artist">'+ e.artist +'</td><td  class="music-addlist">添加到播放列表</td><td class="music-nowplay">立即播放</td></tr>';
					});
					_this.searchResult.children('.search-result-song').remove();
					_this.searchResult.append(tabledata);
				}
			});
		},
		refreshMyMusicList : function(){
			var songDataList = window.localStorage['songDataList'];
			if(songDataList){
				songDataList = JSON.parse(songDataList);
				var content = '';
				songDataList.forEach(function(songData){
					content += '<tr>';
					content += '<td>' + songData.name + '</td>';
					content += '<td>' + songData.artist + '</td>';
					content += '</tr>';
				});
				this.myList.empty().append(content);
			}
		}
		//music_list function end
	};
};
