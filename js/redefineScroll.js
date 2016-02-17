jQuery.fn.extend({
	redefineScroll : function(_config){
		var config = {
			width : '10px',
			right : '0px',
			color : '#bbb',
			speed : 40,
			unsureHeight : true,
			autoHidden : true,
			autoAdaptWidth : false,
		};
		if(typeof(_config) == 'undefined'){
			;
		}
		else{
			for(var P in _config) config[P]=_config[P];
		}
		var _this = $(this);
		var container = _this.parent();
		var height = _this.height();
		var containerHeight = container.height();
		var barHeight = Math.floor( containerHeight * containerHeight / height );
		var template = '<div class="redefineScrollBar"></div>';
		var scrollBar = null;
		var position = 0;
		var scrollBarTop = 0;
		if( config.unsureHeight || containerHeight <  height ){
			var rs_bind = {};
			rs_bind.bind = function(){
				_this.data('rsScrollPos',0);
				container.append(template);
				scrollBar = container.children('.redefineScrollBar');
				_this.data('rsScrollBar', scrollBar);
				var bar_ini_css = {
					'background-color' : config.color,
					'height' : barHeight,
					'width' : config.width,
					'right' : config.right,
					'top' : scrollBarTop
				};
				scrollBar.css(bar_ini_css);
				container.on('mousewheel',function(event){
					event.preventDefault();
					position = _this.data('rsScrollPos');
					if( config.unsureHeight ){
						height = _this.height();
						containerHeight = container.height();
						barHeight = Math.floor( containerHeight * containerHeight / height );
						if( containerHeight >  height ) return false;
					}
					if(event.originalEvent.deltaY < 0){
						//向上翻滚
						if(position > 0){
							if( position % config.speed ){
								position -= (position % config.speed);
							}
							else{
								position -= config.speed;
							}
							_this.data('rsScrollPos', position);
							scrollBarTop = Math.floor( containerHeight * ( position / height ) );
							rs_bind._scrollTo(position, scrollBarTop, barHeight);
						}
					}
					else{
						//向下翻滚
						if( (position + containerHeight) < height ){
							if( (config.speed + position + containerHeight) > height ){
								position = height - containerHeight;
							}
							else{
								position += config.speed;
							}
							_this.data('rsScrollPos', position);
							scrollBarTop = Math.floor( containerHeight * ( position / height ) );
							rs_bind._scrollTo(position, scrollBarTop, barHeight);
						}
					}
					return false;
				});
			};
			rs_bind._scrollTo = function( contentPos, scrollBarPos, scrollBarHeight ){
				var scrollBar = _this.data('rsScrollBar');
				scrollBar.off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
				_this.stop();
				scrollBar.stop();
				_this.css({"transform":"translateY(-" + contentPos + "px)","transition": "all 300ms ease"});
				scrollBar.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',function(event){
					event.preventDefault();
					scrollBar.animate({
						'opacity': 0
						},500,'linear',function(){
							scrollBar.css({'display':'none'});
						});
					return false;
				});
				scrollBar.css({
					'height' : scrollBarHeight,
					'transform':'translateY(' + scrollBarPos + 'px)',
					'transition': 'all 300ms ease',
					'display' : 'block',
					'opacity': 1
				});
			};
			rs_bind.scrollTo = function( pos ){
				if( containerHeight >  height ){
					rs_bind._scrollTo(0,0,0);
					return;
				};
				if( config.unsureHeight ){
					height = _this.height();
					containerHeight = container.height();
					barHeight = Math.floor( containerHeight * containerHeight / height );
				}
				var can_scroll_bottom = height - containerHeight;
				if(pos < 0) pos = 0;
				if( pos > can_scroll_bottom ) pos = can_scroll_bottom;
				position = pos;
				_this.data('rsScrollPos', position);
				scrollBarTop = Math.floor( containerHeight * ( position / height ) );
				rs_bind._scrollTo(position, scrollBarTop, barHeight);
			};
			return rs_bind;
		}
	}
});