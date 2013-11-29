var Anchor = function(name, step, point) {
	var _id, _name, _step, _point, _block;

	this.id = function (val) {
		return this.name().replace(/ /g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase();
	}

	this.name = function (val) {
		if(val) _name = val;
		else return _name;
	}

	this.shareName = function(val) {
		var name = this.name().split('/');
		name.splice(0,1);
		return name;
	}

	this.step = function (val) {
		if(val) _step = val;
		else return _step;
	}

	this.point = function (val) {
		if(val) _point = val;
		else return _point;
	}

	this.block = function(val) {
		if(val) _block = val;
		else return _block;
	}

	this.getAnchorName = function() {
		return this.id();
	};

	this.getUrl = function () {
		return document.location.protocol + '//' + document.location.hostname + '/#/' + this.getAnchorName();
	}

	this.handleMouseenter = function(event) {
		
		this.block().element().css({
			zIndex: 99999
		});

		$btn.stop().transition({ rotate: '360deg' }, 400);
		
		$shareContainer.stop().animate({
			width: 96,
			paddingLeft: 23
		}, 400);
		
	}

	this.handleMouseleave = function(event) {
		$btn.stop().transition({ rotate: '0' }, 400);

		$shareContainer.stop().animate({
			width: 0,
			paddingLeft: 0
		}, 400, undefined, $.proxy(function () {
			this.block().element().css({
				zIndex: 'auto'
			});
		}, this));
	}

	this.name(name);
	this.step(step);
	this.point(point);

	this.block(new Block(point, {'class': 'anchor'}) );

	var $element = this.block().element();

	var $btn = $('<div class="btn"></div>');
	
	var $shareContainer = $('<div class="sharer"></div>'),
		$shareFacebook  = $('<a target="_blank" title="Delen op Facebook" class="share-facebook"></a>'),
		$shareTwitter	= $('<a target="_blank" title="Delen op Twitter" class="share-twitter"></a>'),
		$shareClipboard = $('<a target="_blank" title="Kopieren naar klembord" class="share-clipboard"></a>');

	var url_twitter = 'http://twitter.com/intent/tweet?hashtags=frankly10&url=' + encodeURIComponent(this.getUrl()) + '&text=' + encodeURIComponent('Frankly 10 jaar -  ' + this.shareName());
	$shareTwitter.attr('href', url_twitter);

	var url_facebook = 'http://www.facebook.com/sharer.php?s=100&p[title]=' + encodeURIComponent(document.title) + '&p[summary]=' + encodeURIComponent('Bekijk de gebeurtenis "' + this.shareName() + '" op de Frankly 10 jaar, 100 trends-poster') + '&p[images][0]=/logo.png&p[url]=' + encodeURIComponent(this.getUrl());
	$shareFacebook.attr('href', url_facebook);
	
	$shareFacebook.add($shareTwitter).add($shareClipboard).appendTo($shareContainer);

	$shareFacebook.click($.proxy(function() {
		shareAnalytics(['_trackSocial', 'facebook', 'share', this.shareName()]);
	}, this));

	$shareTwitter.click($.proxy(function() {
		shareAnalytics(['_trackSocial', 'twitter', 'tweet', this.shareName()]);
	}, this));

	$shareClipboard.click($.proxy(function() {
		shareAnalytics(['_trackSocial', 'clipboard', 'copy', this.shareName()]);
	}, this));

	$btn.appendTo($element);
	$shareContainer.appendTo($element);

	$element.mouseenter($.proxy(this.handleMouseenter, this));
	$element.mouseleave($.proxy(this.handleMouseleave, this));

	var clip = new ZeroClipboard.Client();
		clip.setText(this.getUrl());

	$(clip.getHTML( 165, 15 )).appendTo($shareClipboard);
}