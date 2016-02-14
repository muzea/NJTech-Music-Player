var test = {};
$(function(){
	$('.sidebar2').on('click', 'li', function(){
		if (!$(this).hasClass('active') && !$(this).hasClass('none-color')) {
			$('.sidebar2 > li').removeClass('active');
			$(this).addClass('active');
		}
	});
	$('.tabs-split').children('li').children('a').on('click.tab-split',function(event){
		event.preventDefault()
		var frame_id = this.getAttribute('href');
		$('.frames-split .frame').addClass('hidden');
		$(frame_id).removeClass('hidden');
		$('#mobile-tablist').data('charm').close();
		return false;
	});
	$('#tab-list-layout').on('click',function(event){
		event.preventDefault();
		$('#mobile-tablist').data('charm').close();
		return false;
	});
	$('#menu-layout').on('click', function(event){
		event.preventDefault();
		$('#mobile-tablist').data('charm').open();
		return false;
	});
	//$('#tab_list_scroll').redefineScroll().bind();
	//$('#tab_search_scroll').redefineScroll().bind();
})