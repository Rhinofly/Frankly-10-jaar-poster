var Year = function (year, step) {
	this.year = Number(year);
	this.step = step;
}

var Timeline = function (element, years) {
	var _element, _years, _pos;

	this.element = function (val) {
		if(val) _element = (typeof(val) == 'string') ? $(val) : val;
		else return _element;
	}

	this.years = function (val) {
		if(val) _years = val;
		else return _years;
	}

	this.scrollTo = function(currentPosition, scrollTop) {
		_pos = currentPosition;

		var newPos = _map(scrollTop);

		setFillerWidth(this.element(), _pos * 100);
	}

	this.onScroll = function (event, currentPosition) {
		var scrollTop = Math.round(currentPosition * ($(document).height() - $(window).height()));

		this.scrollTo(currentPosition, scrollTop);
	}

	this.element(element);
	this.years(years);

	var totalLength = years[years.length - 1].step;

	for (var i = 0; i<years.length; i++) {
		years[i].percentage = years[i].step / totalLength;
	}



	function _map(scrollTop) {
		for (var i = 0; i < _years.length; i++) {
			if(_years[i+1] && (scrollTop > _years[i].step && scrollTop < _years[i+1].step)) {
				animateBetween(_years[i], _years[i+1]);
			}
		}
	}

	function setFillerWidth(el, width) {
		el.find('.tl-filler').css('width', width + '%');
	}
}



$(function () {

	var years = [];
	for (year in franklyYears) {
		years.push(new Year(year, franklyYears[year]));
	}

	var timeline = new Timeline('#timeline', years);
	$(window).on('easeScroll', $.proxy(timeline.onScroll, timeline));
});