(function(window) {

	var Timeline = function (element) {
		this.initialize(element);
	}

	var p = Timeline.prototype,
		s = Timeline;

	p._element = null;
	p._years = [];
	p._yearNodes = $([]);


	p.initialize = function(element) {
		this._element = new Element(element);
	}

	p.years = function() {
		return this._years;
	}

	p.addYear = function(value) {
		if(value instanceof Year) {
			this._years.push(value);
			this._yearNodes = this._yearNodes.add(value.element.node());
			this._element.node().append(value.element.node());
		} else {
			throw 'year must be an instance of Year';
		}
	}

	p.currentYear = undefined;
	p.handleScroll = function (event) {
		var scrollTop = $(window).scrollTop(),
			years = this.years(),
			i;

		for(y in years) {
			if(years[y].isInFocus(scrollTop)) {
				if(this.currentYear != y) {
					this.currentYear = y;
					
					for(i = 0; i < years.length; i++) {
						years[i].setFocus(false);
					}

					years[this.currentYear].setFocus(true);
				}
			}		
		}
	}

	p.lineTo = function(value) {
		var diff = this._yearNodes.eq(2).position().left - this._yearNodes.eq(1).position().left;

		$('#line .filler').stop().animate({
			width: (value - 2) * diff
		}, 1000);
	}

	p.handleYearFocus = function(event) {
		/**
		 *  adds classes to all previous and next elements
		 */

		var $currentYear = event.target.element.node();

		this.lineTo($currentYear.index());

		this._yearNodes.removeClass('past future');
		
		while($currentYear.prev().length > 0) {
			$currentYear = $currentYear.prev().addClass('past');
		}

		$currentYear = event.target.element.node();

		while($currentYear.next().length > 0) {
			$currentYear = $currentYear.next().addClass('future');
		}
	}

	window.Timeline = Timeline;

})(window);