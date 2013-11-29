var Post = function(url, step, point) {
	var _id, _name, _url, _step, _point, _block;

	this.id = function (val) {
		return this.name().replace(/ /g, '-').replace(/'/g, '').replace(/"/g, '').toLowerCase();
	}

	this.url = function (val) {
		if(val) _url = val;
		else return _url;
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

	this.handleMouseenter = function(event) {
		
		$element.stop().transition({ rotate: '360deg' }, 400);		
	}

	this.handleMouseleave = function(event) {
		$element.stop().transition({ rotate: '0' }, 400);
	}

	this.handleResize = function(event) {
		this.block().element().css({
			marginLeft: 28 - (_SCALE * 28)
		})
		
	}


	// this.name(name);
	this.url(url);
	this.step(step);
	this.point(point);

	this.block(new Block(point, {'class': 'post'}, '<a target="_blank" title="Ga naar het Frank-ly artikel"></a>'));
	var $element = this.block().element().addClass('share-frankly');


	$element.attr('href', this.url());

	$element.click($.proxy(function() {
		shareAnalytics(['_trackEvent', 'FranklyPost', 'VisitFrankly', this.url()]);
	}, this));

	$element.mouseenter($.proxy(this.handleMouseenter, this));
	$element.mouseleave($.proxy(this.handleMouseleave, this));

	$(window).resize($.proxy(this.handleResize, this));
}