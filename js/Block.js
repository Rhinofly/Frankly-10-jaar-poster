var Block = function(point, attributes, element) {
	this._element = undefined;
	this._point = point;
	this._width = 0;
	this._height = 0;

	this.init = function () {
		var $el = $(element || '<div></div>');
		$el.css({
			left: this.point().x,
			top: this.point().y
		});

		if(attributes) {
			for (attribute in attributes) {
				$el.attr(attribute, attributes[attribute]);
			}
		}
		
		this.element($el);

		$(window).resize($.proxy(this.handleResize, this));
	}

	this.init();
}

Block.prototype = {
	element: function(val) {
		if(val) this._element = val;
		else return this._element;
	},

	point : function (val) {
		if(val) this._point = val;
		else return this._point;
	},

	width : function (val) {
		if(val) {
			this._width = val;
			this.element().css('width', val);
		}
		else return this._width;
	},

	height : function (val) {
		if(val) {
			this._height = val;
			this.element().css('height', val);
		}
		else return this._height;
	},

	handleResize : function() {
		this.element().css({
			left: this.point().x * _SCALE,
			top: this.point().y * _SCALE
		});

		var w = this.width(), 
			h = this.height();

		if( w > 0 || h > 0) {
			this.element().css({
				width: this.width() * _SCALE,
				height: this.height() * _SCALE
			})
		}
	}
	
}