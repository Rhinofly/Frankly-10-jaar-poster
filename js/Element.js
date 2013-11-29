(function(window) {
	
	var Element = function (element) {
		this.initialize(element);
	}

	var p = Element.prototype,
		s = Element;

	p._node = null;

	p.initialize = function(element) {
		this.node(element);
	}

	p.node = function (value) {
		if(value) this._node = (typeof(value) == 'string') ? $(value) : value;
		else return this._node;
	}

	window.Element = Element;

})(window);