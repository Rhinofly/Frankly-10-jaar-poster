/*
                =============================
                  jQuery Scroll Path Plugin
                            v1.1.1

                - Modifications by Rhinofly -

                   Demo and Documentation:
                  http://joelb.me/scrollpath
                =============================

    A jQuery plugin for defining a custom path that the browser
    follows when scrolling. Comes with a custom scrollbar,
    which is styled in scrollpath.css.

    Author: Joel Besada (http://www.joelb.me)
    Date: 2012-02-01

    Copyright 2012, Joel Besada
    MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
*/
( function ( $, window, document, undefined ) {
	var	PREFIX =  "-" + getVendorPrefix().toLowerCase() + "-",
		HAS_TRANSFORM_SUPPORT = supportsTransforms(),
		HAS_CANVAS_SUPPORT = supportsCanvas(),
		FPS = 60,
		STEP_SIZE = 50,		// Number of actual path steps per scroll steps.
		STEP_SIZE_DRAG = 10,
						// The extra steps are needed to make animations look smooth.
		BIG_STEP_SIZE = STEP_SIZE * 5, // Step size for space, page down/up
		isInitialized = false,
		isDragging = false,
		isAnimating = false,
		step,
		pathObject,
		pathList,
		element,
		scrollBar,
		scrollHandle,

		// Default speeds for scrolling and rotating (with path.rotate())
		speeds = {
			scrollSpeed: 50,
			rotationSpeed: Math.PI/15
		},

		// Default plugin settings
		settings = {
			wrapAround: false,
			drawCanvas: false,
			drawPath: false,
			scrollBar: true
		},

		methods = {
			/* Initializes the plugin */
			init: function( options ) {
				if ( this.length > 1 || isInitialized ) $.error( "jQuery.scrollPath can only be initialized on *one* element *once*" );
				
				$.extend( settings, options );
				isInitialized = true;
				element = this;
				pathList = pathObject.getPath();
				
				$('#fullHeight').css('height', pathList.length + $(window).height());

				$(window).resize(function() {
					$('#fullHeight').css('height', pathList.length + $(window).height());
				});
				
				initCanvas();
				initSmoothScroll();
				// initScrollBar();
				scrollToStep( 0 ); // Go to the first step immediately
				element.css( "position", "relative" );

				// $( window ).on({
				// 	"scroll": scrollHandler
				// });

				$( document ).on({
					"mousewheel": scrollHandler,
					"DOMMouseScroll": ("onmousewheel" in document) ? null : scrollHandler, // Firefox
					"keydown": keyHandler,
					"mousedown": function( e ) {
						if( e.button === 1 ) {
							e.preventDefault();
							return false;
						}
					}
				});

				$( window ).on( "resize", function() { scrollToStep( step ); } ); // Re-centers the screen
				return this;
			},

			getPath: function( options ) {
				$.extend( speeds, options );
				return pathObject || ( pathObject = new Path( speeds.scrollSpeed, speeds.rotationSpeed ));
			},

			getStep : function() {
				return step;
			},

			scrollToStep: function( toStep, duration, easing, callback, disableFastestRoute) {
				var destination = toStep;
				var distance = destination - step;
				$.scrollTo(toStep, Math.abs(distance), {easing: easing || 'easeInOutSine'});
				return;
				

				animateSteps( distance, duration, easing, callback );
				return distance;
			},

			scrollTo: function( name, duration, easing, callback ) {
				var destination = findStep( name );
				if ( destination === undefined ) $.error( "jQuery.scrollPath could not find scroll target with name '" + name + "'" );

				var distance = destination - step;

				if ( settings.wrapAround && Math.abs( distance ) > pathList.length / 2) {
					if ( destination > step) {
						distance = -step - pathList.length + destination;
					} else {
						distance = pathList.length - step + destination;
					}
				}

				$.scrollTo(toStep, Math.abs(distance), {easing: easing});
				return;

				animateSteps( distance, duration, easing, callback );
				return this;
			}
		};

	function distanceBetweenPoints(p1, p2) {
		return Math.sqrt( Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) );
	}
	
	/* The Path object serves as a context to "draw" the scroll path
		on before initializing the plugin */
	function Path( scrollS, rotateS ) {
		var PADDING = 40,
			scrollSpeed = scrollS,
			rotationSpeed = rotateS,
			xPos = 0,
			yPos = 0,
			rotation = 0,
			width = 0,
			height = 0,
			offsetX = 0,
			offsetY = 0,
			canvasPath = [{ method: "moveTo", args: [ 0, 0 ] }], // Needed if first path operation isn't a moveTo
			path = [],
			nameMap = {},

			defaults = {
				rotate: null,
				callback: null,
				name: null
			};

		this.getPointByStep = function (step) {
			var stepObj = this.getPath()[step - 1];
			if(!stepObj) throw 'Trying to get the point at step [' + step + '], but our path isn\'t that long!';
			return new Point(stepObj.x, stepObj.y);
		}

		/* Rotates the screen while staying in place */
		this.rotate = function( radians, options ) {
			var settings = $.extend( {}, defaults, options ),
				rotDistance = Math.abs( radians - rotation ),
				steps = Math.round( rotDistance / rotationSpeed ) * STEP_SIZE,
				rotStep = ( radians - rotation ) / steps,
				i = 1;
			
			if ( !HAS_TRANSFORM_SUPPORT ) {
				if ( settings.name || settings.callback ) {
					// In case there was a name or callback set to this path, we add an extra step with those
					// so they don't get lost in browsers without rotation support
					this.moveTo(xPos, yPos, {
						callback: settings.callback,
						name: settings.name
					});
				}
				return this;
			}
			
			for( ; i <= steps; i++ ) {
				path.push({ x: xPos,
							y: yPos,
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});
			}
			if( settings.name ) nameMap[ settings.name ] = path.length - 1;

			rotation = radians % ( Math.PI*2 );

			return this;
		};

		/* Moves (jumps) directly to the given point */
		this.moveTo = function( x, y, options ) {
			var settings = $.extend( {}, defaults, options ),
				steps = path.length ? STEP_SIZE : 1;
				i = 0;

			for( ; i < steps; i++ ) {
				path.push({ x: x,
							y: y,
							rotate: settings.rotate !== null ? settings.rotate : rotation,
							callback: i === steps - 1 ? settings.callback : null
					});
			}
			if( settings.name ) nameMap[ settings.name ] = path.length - 1;

			setPos( x, y );

			updateCanvas( x, y );
			canvasPath.push({ method: "moveTo", args: arguments });

			return this;
		};

		/* Draws a straight path to the given point */
		this.lineTo = function( x, y, options ) {
			var settings = $.extend( {}, defaults, options ),
				relX = x - xPos,
				relY = y - yPos,
				distance = hypotenuse( relX, relY ),
				steps = Math.round( distance/scrollSpeed ) * STEP_SIZE,
				xStep = relX / steps,
				yStep =  relY / steps,
				canRotate = settings.rotate !== null && HAS_TRANSFORM_SUPPORT,
				rotStep = ( canRotate ? ( settings.rotate - rotation ) / steps : 0 ),
				i = 1;

			for ( ; i <= steps; i++ ) {
				path.push({ x: xPos + xStep * i,
							y: yPos + yStep * i,
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});
			}
			if( settings.name ) nameMap[ settings.name ] = path.length - 1;

			rotation = ( canRotate ? settings.rotate : rotation );
			setPos( x, y );

			updateCanvas( x, y );
			canvasPath.push({ method: "lineTo", args: arguments });

			return this;
		};

		/* Draws an arced path with a given circle center, radius, start and end angle. */
		this.arc = function( centerX, centerY, radius, startAngle, endAngle, counterclockwise, options ) {
			var settings = $.extend( {}, defaults, options ),
				startX = centerX + Math.cos( startAngle ) * radius,
				startY = centerY + Math.sin( startAngle ) * radius,
				endX = centerX + Math.cos( endAngle ) * radius,
				endY = centerY + Math.sin( endAngle ) * radius,
				angleDistance = sectorAngle( startAngle, endAngle, counterclockwise ),
				distance = radius * angleDistance,
				steps = Math.round( distance/scrollSpeed ) * STEP_SIZE,
				radStep = angleDistance / steps * ( counterclockwise ? -1 : 1 ),
				canRotate = settings.rotate !== null && HAS_TRANSFORM_SUPPORT,
				rotStep = ( canRotate ? (settings.rotate - rotation) / steps : 0 ),
				i = 1;

			// If the arc starting point isn't the same as the end point of the preceding path,
			// prepend a line to the starting point. This is the default behavior when drawing on
			// a canvas.
			if ( xPos !== startX || yPos !== startY ) {
				this.lineTo( startX, startY );
			}
			
			for ( ; i <= steps; i++ ) {
				path.push({ x: centerX + radius * Math.cos( startAngle + radStep*i ),
							y: centerY + radius * Math.sin( startAngle + radStep*i ),
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});
			}
			if( settings.name ) nameMap[ settings.name ] = path.length - 1;

			rotation = ( canRotate ? settings.rotate : rotation );
			setPos( endX, endY );

			updateCanvas( centerX + radius, centerY + radius );
			updateCanvas( centerX - radius, centerY - radius );
			canvasPath.push({ method: "arc", args: arguments });
			return this;
		};


		this.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y, options) {

			if(arguments.length < 6) return;

			var settings = $.extend( {}, defaults, options );
			
			var point1 = new Point(xPos, yPos);
			var point2 = new Point(cp1x, cp1y);
			var point3 = new Point(cp2x, cp2y);
			var point4 = new Point(x, y);

			// create Bezier object
			myBezier = new Bezier(point1, point2, point3, point4);

			// calc approximation of bezier length (steps of .005 on a span from 0 to 1)
			var t = .005,
				points = [],
				pointX, pointY;
			for(var i = 0; i <= 1/t; i++) {
				pointX = myBezier.x(i*t);
				pointY = myBezier.y(i*t);
				points.push(new Point(pointX, pointY));
			}

			var distance = 0;
			for(i = 0; i < points.length-1; i++) {
				distance += distanceBetweenPoints(points[i], points[i+1]);
			}


			var steps = Math.round( distance/scrollSpeed ) * STEP_SIZE,
				canRotate = settings.rotate !== null && HAS_TRANSFORM_SUPPORT,
			 	rotStep = ( canRotate ? (settings.rotate - rotation) / steps : 0 ),
			 	i = 0;

		
			var maxXpoint = new Point(0, 0),
				minXpoint = new Point(0, 0),
				maxYpoint = new Point(0, 0),
				minYpoint = new Point(0, 0);
			
			var curPoint;
			for(var i = 0; i < steps; i++) {

				curPoint = new Point(myBezier.x((1/steps)*i), myBezier.y((1/steps)*i));

				path.push({ x: Math.round(curPoint.x),
							y: Math.round(curPoint.y),
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});

				if(curPoint.x < minXpoint.x) minXpoint = curPoint;
				if(curPoint.x > maxXpoint.x) maxXpoint = curPoint;
				if(curPoint.y < minYpoint.y) minYpoint = curPoint;
				if(curPoint.y > maxXpoint.y) maxYpoint = curPoint;
			}


			if( settings.name ) nameMap[ settings.name ] = path.length - 1;

			rotation = ( canRotate ? settings.rotate : rotation );
			

			setPos(myBezier.x(1), myBezier.y(1));

			updateCanvas( maxXpoint.x, maxXpoint.y );
			updateCanvas( minXpoint.x, minXpoint.y );
			updateCanvas( maxYpoint.x, maxYpoint.y );
			updateCanvas( minYpoint.x, minYpoint.y );
			
			canvasPath.push({ method: "bezierCurveTo", args: arguments });

			return this;

		}


		this.getPath = function() {
			return path;
		};

		this.getNameMap = function() {
			return nameMap;
		};

		/* Appends offsets to all x and y coordinates before returning the canvas path */
		this.getCanvasPath = function() {
			var i = 0;
			var offsetX = this.getPathOffsetX(), 
				offsetY = this.getPathOffsetY();

			for( ; i < canvasPath.length; i++ ) {
				canvasPath[ i ].args[ 0 ] -= offsetX;
				canvasPath[ i ].args[ 1 ] -= offsetY;
			}
			return canvasPath;
		};

		this.getPathWidth = function() {
			return width - offsetX + PADDING;
		};

		this.getPathHeight = function() {
			return height - offsetY + PADDING;
		};

		this.getPathOffsetX = function() {
			return (offsetX * _SCALE) - PADDING / 2;
		};

		this.getPathOffsetY = function() {
			return (offsetY * _SCALE) - PADDING / 2;
		};

		/* Sets the current position */
		function setPos( x, y ) {
			xPos = x;
			yPos = y;
		}

		/* Updates width and height, if needed */
		function updateCanvas( x, y ) {
			offsetX = Math.min( x, offsetX );
			offsetY = Math.min( y, offsetY );
			width = Math.max( x, width );
			height = Math.max( y, height );
		}

	}

	/* Plugin wrapper, handles method calling */
	$.fn.scrollPath = function( method ) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		} else if ( typeof method === "object" || !method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( "Method " +  method + " does not exist on jQuery.scrollPath" );
		}
	};



	function initSmoothScroll() {
		var $win = $(window);

		var dimensions, windowHeight, windowWidth;
		var scrollHeight = $('#fullHeight').height();
		
		var currentPosition = getScrollTop() / scrollHeight;
		var targetPosition = currentPosition;

		function setScrollTop(value) {
			$win.scrollTop(value);
		}


		function getScrollTop() {
			return $win.scrollTop();
		}


		function setTargetPosition(position , immediate) {
			targetPosition = position;
			if ( immediate ) currentPosition = targetPosition;
		}

		function handleResize() {
			scrollHeight = $('#fullHeight').height();
			handleScroll();
		}
		
		function handleScroll() {
			setTargetPosition(getScrollTop() / (scrollHeight - $win.height()) );
		}

		function renderTimeline(position) {
			var elemPosition = 0;
			var elemSpeed = 1;
			var posY = elemSpeed * (elemPosition - position) * scrollHeight;
			globals.setPosY(Math.floor(posY));
		};

		$win.resize(handleResize);
		$win.scroll(handleScroll);

		// main render loop
		window.requestAnimFrame = (function (){
			return  window.requestAnimationFrame       ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame    ||
					window.oRequestAnimationFrame      ||
					window.msRequestAnimationFrame     ||
					function (/* function */ callback, /* DOMElement */ element){
						window.setTimeout(callback, 1000 / 60);
					};
		})();


		var _pastPosition;
		function animloop() {
			if ( Math.floor(currentPosition*5000) != Math.floor(targetPosition*5000) ) {
				var deaccelerate = Math.max( Math.min( Math.abs(targetPosition-currentPosition)*5000 , 8 ) , 6 );
				currentPosition += (targetPosition - currentPosition) / deaccelerate;
				if(currentPosition != _pastPosition) {
					$win.trigger('easeScroll', [currentPosition, getScrollTop(), dimensions, deaccelerate]);
					_pastPosition = currentPosition;
				}
			}
			requestAnimFrame(animloop);
		}
		animloop();




		if ( 'ontouchstart' in window ) {

			var scrollPos = 0;
			var MAXSCROLL =  $('#fullHeight').height() - $(window).height();

			$(window).resize(function () {
				MAXSCROLL =  $('#fullHeight').height() - $(window).height();
				// $main.css('height', 0);
			})


			
			var oldGetScrollTop = getScrollTop;
			getScrollTop = function () {
				return scrollPos;
			};

			var oldSetScrollTop = setScrollTop;
			setScrollTop = function (value) {
				scrollPos = value;
				dispatchScroll();
			};
			// globals.setScrollTop = setScrollTop;

			function dispatchScroll() {
				targetPosition = scrollPos / MAXSCROLL;
			}
			var d = document;
			var touchMoved, touchDown, touchBeginPosition;

			function onTouchStart(event) {
				//event.preventDefault();
				touchDown = true;

				var touch = (event.touches) ? event.touches[0] : event;
				touchX = touch.clientX;
				touchY = touch.clientY;
				touchBeginPosition = { x: touchX , y: touchY , scroll: scrollPos };
				d.addEventListener('touchmove', onTouchMove, false);
				d.addEventListener('touchend', onTouchEnd, false);
				
				//d.addEventListener('mousemove', onTouchMove, false);
				//d.addEventListener('mouseup', onTouchEnd, false);
			}
			function onTouchMove(event) {
			    event.preventDefault();
			    touchMoved = true;
				var touch = (event.touches) ? event.touches[0] : event;
				touchX = touch.clientX;
				touchY = touch.clientY;
				scrollPos = touchBeginPosition.scroll - (touchY-touchBeginPosition.y) * 2;
				scrollPos = Math.min( MAXSCROLL , Math.max( 0 , scrollPos ) );
				dispatchScroll();
			}
			
			function onTouchEnd(event) {
				if ( touchMoved ) {
					event.preventDefault();
				}
				d.removeEventListener('touchmove', onTouchMove, false);
				d.removeEventListener('touchend', onTouchEnd, false);

				//d.removeEventListener('mousemove', onTouchMove, false);
				//d.removeEventListener('mouseup', onTouchEnd, false);

				touchDown = false;
			}
			
			d.addEventListener('touchstart', onTouchStart, false);
			//d.addEventListener('mousedown', onTouchStart, false);		
		}

	}


	

	/* Initializes the path canvas */
	function initCanvas() {
		if ( (!settings.drawCanvas && !settings.drawPath) || !HAS_CANVAS_SUPPORT ) return;
		
		var canvas,
			style = {
				position: "absolute",
				"z-index": 100,
				left: pathObject.getPathOffsetX(),
				top: pathObject.getPathOffsetY(),
				"pointer-events": "none"
			};
		
		applyPrefix( style, "user-select", "none" );
		applyPrefix( style, "user-drag", "none" );
		
		canvas = $( "<canvas>" ).
					addClass( "sp-canvas" ).
					css( style ).
					prependTo( element );
		
		canvas[ 0 ].width = pathObject.getPathWidth();
		canvas[ 0 ].height = pathObject.getPathHeight();
		
		if(settings.drawPath) {
			drawCanvasPath( canvas[ 0 ].getContext( "2d" ), pathObject.getCanvasPath() );
		}
	}

	/* Sets the canvas path styles and draws the path */
	function drawCanvasPath( context, path ) {
		var i = 0;
		context.shadowBlur = 15;
		context.shadowColor = "black";
		context.strokeStyle = "white";
		context.lineJoin = "round";
		context.lineCap = "round";
		context.lineWidth = 2;

		for( ; i < path.length; i++ ) {
			context[ path[ i ].method ].apply( context, path[ i ].args );
			context.fillRect(path[i].args[4], path[i].args[5], 10, 10);
		}

		context.stroke();
	}


	var _prevScrollTop = 0, _curScrollTop = 0, _oldStepDiff;
	$(window).bind('easeScroll', function (event, percentage) {
	
		_curScrollTop = Math.round(percentage * pathList.length);
		scrollSteps( _curScrollTop - _prevScrollTop );

		_prevScrollTop = _curScrollTop

	});


	/* Handles mousewheel scrolling */
	var _prevScrollTop = 0, _curScrollTop = 0;
	function scrollHandler( e ) {
		$('html, body').stop(true, false);
	}



	/* Handles mousewheel scrolling */
	function scrollHandler_OLD( e ) {
		var scrollDelta = e.originalEvent.wheelDelta || -e.originalEvent.detail,
			dir = scrollDelta / ( Math.abs( scrollDelta ) );
		e.preventDefault();
		$( window ).scrollTop( 0 ).scrollLeft( 0 );
		scrollSteps( -dir * STEP_SIZE );
		//animateSteps(-dir * BIG_STEP_SIZE, 500);
	}








	/* Handles key scrolling (arrows and space) */
	function keyHandler( e ) {
		// <- 37 | 39 ->
		// Disable scrolling with keys when user has focus on text input elements
		// if ( /^text/.test( e.target.type ) ) e.preventDefault();
		switch ( e.keyCode ) {
			case 35: // End
				$('html, body').stop(true, false);
				e.preventDefault();
				$.scrollTo($(fullHeight).height() - $(window).height(), Math.abs($(fullHeight).height() - $(window).scrollTop())/2, {easing: 'easeInOutSine'});
				break;
			case 36: //Home
				$('html, body').stop(true, false);
				e.preventDefault();
				$.scrollTo(0, Math.abs($(window).scrollTop())/2, {easing: 'easeInOutSine'});
				break;
			case 37:
				$('html, body').stop(true, false);
				e.preventDefault();
				$.scrollTo($(window).scrollTop()- 150, 70, {easing: 'easeInOutSine'});
				break;
			case 39:
				$('html, body').stop(true, false);
				e.preventDefault();
				$.scrollTo($(window).scrollTop()+ 150, 70, {easing: 'easeInOutSine'});
				break;
		}

	}

	/* Handles scrollbar scrolling */
	function dragScrollHandler( e ) {
		var dragStep,
			y = e.clientY - scrollBar.offset().top;

		dragStep = limitWithin( Math.round( y / scrollBar.height() * ( pathList.length - 1 ) ), 0, pathList.length - 1 );

		scrollToStep( snap(dragStep, STEP_SIZE) );
	}

	/* Scrolls forward the given amount of steps. Negative values scroll backward. */
	function scrollSteps( steps ) {
		scrollToStep( step + steps );
	}

	/* Animates forward the given amount of steps over the set duration. Negative values scroll backward */
	function animateSteps ( steps, duration, easing, callback ) {

		if( steps === 0 || isAnimating ) return;
		
		if(duration === 'auto') {
			duration = Math.abs(steps);
		}

		if( !duration || typeof duration !== "number" ) {
			if ( typeof duration === "function" ) duration();
			return scrollSteps( steps );
		}
		isAnimating = true;

		var frames = Math.round(( duration / 1000 ) * FPS),
			startStep = step,
			currentFrame = 0,
			easedSteps,
			nextStep,
			interval = setInterval(function() {
				easedSteps = Math.round( ($.easing[easing] || $.easing.swing)( ++currentFrame / frames, duration / frames * currentFrame, 0, steps, duration) );
				nextStep = wrapStep( startStep + easedSteps);
				if (currentFrame === frames) {
					clearInterval( interval );
					if ( typeof easing === "function" ) {
						easing();
					} else if ( callback ) {
						callback();
					}
					isAnimating = false;
				}
				scrollToStep( nextStep, true );
			}, duration / frames);
	}

	/* Scrolls to a specified step */
	function scrollToStep( stepParam, fromAnimation ) {
		if ( isAnimating && !fromAnimation ) return;
		var cb;
		if (pathList[ stepParam ] ){
			cb = pathList[ stepParam ].callback;
			element.css( makeCSS( pathList[ stepParam ] ) );
		}
		if( scrollHandle ) scrollHandle.css( "top", stepParam / (pathList.length - 1 ) * ( scrollBar.height() - scrollHandle.height() ) + "px" );
		if ( cb && stepParam !== step && !isAnimating ) cb();
		step = stepParam;
	}

	/* Finds the step number of a given name */
	function findStep( name ) {
		return pathObject.getNameMap()[ name ];
	}

	/* Wraps a step around the path, or limits it, depending on the wrapAround setting */
	function wrapStep( wStep ) {
		if ( settings.wrapAround ) {
			if( isAnimating ) {
				while ( wStep < 0 ) wStep += pathList.length;
				while ( wStep >= pathList.length ) wStep -= pathList.length;
			} else {
				if ( wStep < 0 ) wStep = pathList.length - 1;
				if ( wStep >= pathList.length ) wStep = 0;
			}
		} else {
			wStep = limitWithin( wStep, 0, pathList.length - 1 );
		}
		return wStep;
	}

	/* Translates a given node in the path to CSS styles */
	function makeCSS( node ) {
		var centeredX = (node.x * _SCALE) - ($( window ).width() >> 1),
			centeredY = (node.y * _SCALE) - ($( window ).height() >> 1),
			style = {};



		// Only use transforms when page is rotated
		if ( normalizeAngle(node.rotate) === 0 ) {
			style.left = -centeredX;
			style.top = -centeredY;
			applyPrefix( style, "transform-origin", "" );
			applyPrefix( style, "transform", "" );
		} else {
			style.left = style.top = "";
			applyPrefix( style, "transform-origin",  node.x + "px " + node.y + "px" );
			applyPrefix( style, "transform", "translate(" + -centeredX + "px, " + -centeredY + "px) rotate(" + node.rotate + "rad)" );
		}

		return style;
	}

	/* Determine the vendor prefix of the visitor's browser,
		http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/
	*/
	function getVendorPrefix() {
		var regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
			someScript = document.getElementsByTagName( "script" )[ 0 ];

		for ( var prop in someScript.style ) {
			if ( regex.test(prop) ) {
				return prop.match( regex )[ 0 ];
			}
		}

		if ( "WebkitOpacity" in someScript.style ) return "Webkit";
		if ( "KhtmlOpacity" in someScript.style ) return "Khtml";

		return "";
	}

	/* Applied prefixed and unprefixed css values of a given property to a given object*/
	function applyPrefix( style, prop, value ) {
		style[ PREFIX + prop ] = style[ prop ] = value;
	}

	/* Checks for CSS transform support */
	function supportsTransforms() {
		var	testStyle =  document.createElement( "dummy" ).style,
			testProps = [ "transform",
						"WebkitTransform",
						"MozTransform",
						"OTransform",
						"msTransform",
						"KhtmlTransform" ],
			i = 0;

		for ( ; i < testProps.length; i++ ) {
			if ( testStyle[testProps[ i ]] !== undefined ) {
				return true;
			}
		}
		return false;
	}

	/* Checks for canvas support */
	function supportsCanvas() {
		return !!document.createElement( "canvas" ).getContext;
	}

	/* Calculates the angle distance between two angles */
	function sectorAngle( start, end, ccw ) {
		var nStart = normalizeAngle( start ),
			nEnd = normalizeAngle( end ),
			diff = Math.abs( nStart - nEnd ),
			invDiff = Math.PI * 2 - diff;
		
		if ( ( ccw && nStart < nEnd ) ||
			( !ccw && nStart > nEnd ) ||
			( nStart === nEnd && start !== end ) // Special case *
		) {
				return invDiff;
		}

		// *: In the case of a full circle, say from 0 to 2 * Math.PI (0 to 360 degrees),
		// the normalized angles would be the same, which means the sector angle is 0.
		// To allow full circles, we set this special case.

		return diff;
	}

	/* Limits a given value between a lower and upper limit */
	function limitWithin( value, lowerLimit, upperLimit ) {
		if ( value > upperLimit ) {
			return upperLimit;
		} else if ( value < lowerLimit ) {
			return lowerLimit;
		}
		return value;
	}

	/* 'Snaps' a value to be a multiple of a given snap value */
	function snap( value, snapValue ) {
		var mod = value % snapValue;
		if( mod > snapValue / 2) return value + snapValue - mod;
		return value - mod;
	}
	
	/* Normalizes a given angle (sets it between 0 and 2 * Math.PI) */
	function normalizeAngle( angle ) {
		while( angle < 0 ) {
			angle += Math.PI * 2;
		}
		return angle % ( Math.PI * 2 );
	}

	/* Calculates the hypotenuse of a right triangle with sides x and y */
	function hypotenuse( x, y ) {
		return Math.sqrt( x * x + y * y );
	}

})( jQuery, window, document );
