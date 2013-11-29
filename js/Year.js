(function(window) {
	
	var Year = function (year, step) {
		this.initialize(year, step);
	}

	var p = Year.prototype,
		s = Year;

	s.offset = 200;
	s.startTime = +new Date();

	p._year = null;
	p._step = null;
	p._active = false;
	p._analyticed = false;

	p.initialize = function(year, step) {
		this.element = new Element($('<div class="year future year-' + year + '"><span class="focus"><span></span></span><span class="popup"><span></span></span></div>'));
		this.year(Number(year));
		this.step(step);

		this.element.node().click($.proxy(this.handleClick, this));
	}

	p.element = new Element();

	p.year = function(value) {
		if(value !== undefined) this._year = value;
		else return this._year;
	}

	p.step = function(value) {
		if(value !== undefined) this._step = value;
		else return this._step;
	}

	p.handleClick = function() {
		$('html, body').stop(true, false); // stop scrolling
		$(".wrapper").scrollPath('scrollToStep', this.step(), 'auto', 'easeInOutSine', null, true);
	}

	p.isInFocus = function(scrollTop) {
		return (scrollTop > this.step() - s.offset) && (scrollTop < this.step() + s.offset);
	}

	p.setFocus = function (value) {
		if(!this._active && value === true) {
			this.element.node().addClass('present');
			$(this).trigger('focus');
			this._active = true;
			this.PushToAnalytics();
		}

		if(this._active && value === false) {
			this.element.node().removeClass('present');
			$(this).trigger('blur');
			this._active = false;
		}
	}

	p.PushToAnalytics = function() {
		if(!this._analyticed) {
			var timing = +new Date - s.startTime;
			shareAnalytics(['_trackEvent', 'Scroll Depth', 'ScrolledToYear', this.year() + '', 1, true]);
			shareAnalytics(['_trackTiming', 'Scroll Depth', 'ScrolledToYear', timing, this.year() + '', 100]);
			this._analyticed = true;
		}
	}

	window.Year = Year;

})(window);