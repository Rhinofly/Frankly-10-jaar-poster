/**
 * Sorry for the mess!
 * Best Wishes, Rhinofly & Tribewise.
 */



var DEBUG = false,
	_SCALE = 1;

$(document).ready(init);

function shareAnalytics(arr) {
	_gaq.push(arr);
}

function initPathData() {
	var $path = $('.wrapper'),
		path = $(".wrapper").scrollPath('getPath');


	// first initialize ZeroClipboard
	ZeroClipboard.setMoviePath('./js/lib/zeroclipboard/ZeroClipboard.swf');

	var location = document.location.hash.substr(2);

	// Anchor Data
	var anchorData, anchor, point, myAnchors = [];
	for(var i = 0; i < franklyAnchors.length; i++) {
		anchorData = franklyAnchors[i];
		point = path.getPointByStep(anchorData.step);
		
		if(anchorData.offset) {
			if(anchorData.offset.x) point.x += anchorData.offset.x;
			if(anchorData.offset.y) point.y += anchorData.offset.y;
		}

		// create new Anchor
		anchor = new Anchor(anchorData.name, anchorData.step, point);
		myAnchors.push(anchor);

		// add anchor to canvas
		anchor.block().element().appendTo($path);
		
		// check if hashlocation is an anchor 
		if(location == anchor.getAnchorName()) {
			var initiallyScrollToStep = anchor.step();
		} else if(location > 2001 && location < 2013) {
			var initiallyScrollToStep = franklyYears[location];
		}
	}

	if(initiallyScrollToStep) {
		$(".wrapper").scrollPath('scrollToStep', initiallyScrollToStep, 'auto', 'easeInOutSine', null, true);
	}



	// Posts Data
	var postData, post, point, myPosts = [];
	for(var i = 0; i < franklyPosts.length; i++) {
		postData = franklyPosts[i],
		point = path.getPointByStep(postData.step);
		
		if(postData.offset) {
			if(postData.offset.x) point.x += postData.offset.x;
			if(postData.offset.y) point.y += postData.offset.y;
		}

		// create new Post
		post = new Post(postData.url, postData.step, point);
		myPosts.push(anchor);

		// add post to canvas
		post.block().element().appendTo($path);
	}


	//Contact form
	var point = new Point(6690, 3170);
	var formBlock = new Block(point, {id: 'subscribe'}, '<a target="_blank" href="http://www.frank-ly.nl/trendupdate/">Schrijf je in!</a>');
		formBlock.element().appendTo($path);
		formBlock.width(formBlock.element().width());
		formBlock.height(formBlock.element().height());
}

function init() {
	/* ========== DRAWING THE PATH AND INITIATING THE PLUGIN ============= */

	// get scrollPath from illustrator path file
	$.ajax({
		url: 'path.php?t=' + new Date().getTime(),
		dataType: 'json',
		success: function(data) {
			var path_arr = convertPath(data.path);
			initScrollPath(path_arr);
			initPathData();
			initTimeline();
			initScrollDepth();
			initScaler();
			initInfo();

			$(window).resize();
		}
	});

	$('.tribewise').click(function() {
		shareAnalytics(['_trackEvent', 'Outbound Links', $(this).attr('href')]);
	});

	$('.rhinofly').click(function() {
		shareAnalytics(['_trackEvent', 'Outbound Links', $(this).attr('href')]);
	});


	function initScrollPath(path) {
		var $scrollPath = $.fn.scrollPath("getPath");
		
		// if the path's start- and end-point are the same, our path is most likely going for- and backward.
		// Therefore we split out path in the middle (which should be the end of our scrollpath)
		pathLength = path.length;
		if( path[0].pathData[0] == path[pathLength-1].pathData[0]
		 && path[0].pathData[1] == path[pathLength-1].pathData[1] ) pathLength >>= 1;


		for(var i = 0; i < pathLength; i++) {
			$scrollPath[path[i].command].apply($scrollPath, path[i].pathData);
		}

		// We're done with the path, let's initate the plugin on our wrapper element
		$(".wrapper").scrollPath({drawCanvas: false, drawPath: false, wrapAround: true});
	}

	function initTimeline() {
		var timeline = new Timeline('#timeline');
		var firstYear = true;
		for (year in franklyYears) {
			var newYear = new Year(year, franklyYears[year]);
			timeline.addYear(newYear);
			$(newYear).on('focus', $.proxy(timeline.handleYearFocus,timeline));

			if(firstYear === true) {
				firstYear = newYear;
			}
		}
		
		firstYear.setFocus(true);

		$(window).on('scroll', $.proxy(timeline.handleScroll, timeline));

		// initially scroll to first year
		setTimeout(function(){
			if($(window).scrollTop() == 0) {
				timeline.years()[0].handleClick();
			}
		}, 500)
	}

	function initScrollDepth() {
		// $.scrollDepth({
		// 	testing: true
		// });
	}

	function initScaler() {

		var $win = $(window),
			$imgHolder = $('#img-holder'),
			scaleOriginWidth = 1260,
			scaleOriginHeight = 900,
			imgDimensionWidth = 8416,
			imgDimensionHeight = 3000;

		var imgHolderLeft = parseFloat($('#img-holder').css('left')),
			imgHolderTop = parseFloat($('#img-holder').css('top'));

		var scaledWidth, scaledHeight, scaledLeft, scaledTop;
		
		$win.resize(function() {
			var windowWidth = $win.width();
			var windowHeight = $win.height();

			_SCALE = Math.min( Math.min(windowWidth/scaleOriginWidth, windowHeight/scaleOriginHeight), 1);

			scaledWidth = Math.round(_SCALE * imgDimensionWidth),
			scaledHeight = Math.round(_SCALE * imgDimensionHeight);
			
			scaledLeft = imgHolderLeft * _SCALE,
			scaledTop = imgHolderTop * _SCALE;
			
			$imgHolder.css({
				width: scaledWidth,
				height: scaledHeight,
				left: scaledLeft,
				top: scaledTop
			});
			
		}).resize();
		
	}


	function initInfo() {
		var $win = $(window),
			$container = $('#container'),
			$header = $('#header'),
			$headerInner = $('.inner', $header),
			$btn = $('.frankly'),
			$infoElement = $('#what-is-frankly'),
			winHeight, winWidth;

		var $animators = $header.add('#wrapper-wrapper').add('#intro');

		$win.resize(function () {
			winHeight = $win.height();
			$infoElement.css({
				height: winHeight - $header.height() + 20
			});
		});

		function resizeInfoWindow() {
			$animators.css({
				top: winHeight - $header.height() + 20
			}, 500);
		}

		var headerActive = false;
		function toggleInfo(event) {
			
			if(headerActive) {
				$animators.animate({
					top: 0
				}, 1250, 'easeInOutQuint');
				$('body').removeClass('info');

				$btn.bind('click', toggleInfo);
				$headerInner.unbind('click', toggleInfo);
				$win.unbind('resize', resizeInfoWindow);
			} else {
				$animators.animate({
					top: winHeight - $header.height() + 20
				}, 1250, 'easeInOutQuint');
				
				$('body').addClass('info');
				
				$btn.unbind('click', toggleInfo);
				$headerInner.bind('click', toggleInfo);
				$win.bind('resize', resizeInfoWindow);
			}

			headerActive = !headerActive;

			return false;
		}

		$btn.add('#close-info').click(toggleInfo);

	}


	$(window).bind('easeScroll', function (event, progress) {
		var val = Math.round( (progress * 5000) );
		
		val /= 2;

		if(val > 100) {
			$('#intro').css({
				display: 'none'
			});
			
			return;
		}
		if(val >= 0 && val <= 100) {
			
			$('#intro').css({
				display: 'block',
				opacity: (100 - val) / 100,
				top: - val/10 + '%'
			});

		}
	});

	
	$('#btn-holder a').click(function () {
		$(".wrapper").scrollPath('scrollToStep', franklyYears['2002'], 'auto', 'easeInOutSine', null, true);
	});
	

	if(DEBUG === true) {
		var keydownInterval, keydownCounter = 0;
		$(document).keydown(function(e) {
			if(e.keyCode == 17) {// ctrl
				if(++keydownCounter == 3) {
					$('#debug-cursor').show();
					enablestuff();
				}
				clearInterval(keydownInterval);
				keydownInterval = setTimeout(function () {
					keydownCounter = 0;
				}, 500);
			}
		});
	}

	function enablestuff() {
		var path = $(".wrapper").scrollPath('getPath');
		var taOpened = false;

		$('body').addClass('DEBUG');


		var $ta = $('<textarea></textarea>')
			.css({
				position:'absolute',
				width: '100%',
				height: '100%',
				zIndex:9998
			});

		var $taContainer = $('<div></div>')
			.css({
				position: 'fixed',
				zIndex: 99999,
				width: 600,
				height: 50,
				top:100,
				left:'50%',
				marginLeft: -300
			})
			.append($ta).appendTo('body');

		var clip = new ZeroClipboard.Client();
		
		$(clip.getHTML($ta.width(), $ta.height() )).css({
			position: 'absolute',
			zIndex: 99999,
			top:0,
			left:0
		}).appendTo($taContainer);

		clip.addEventListener('complete', function (client, text) {
			taOpened = false;
			$ta.html('');
		});


		var faker = $('<div></div>')
			.css({
				position: 'fixed',
				zIndex:99998,
				width:28,
				height:28,
				background: 'url("img/icon-anchor.png") no-repeat'
			})
			.appendTo('body');

		$(document).mousemove(function(event) {
			faker.css({
				left: event.clientX - 15,
				top: (event.clientY - 15 > 100) ? event.clientY - 15 : 100
			})
		})


		
		$(document).mousedown(function(event) {
			if(taOpened) {
				return;
			}

			taOpened = true;
			
			var winWidth = $(window).width(),
				winHeight = $(window).height();

			var offsetX = (winWidth/2) - event.clientX;
			var offsetY = (winHeight/2) - event.clientY;
			
			var step = $(".wrapper").scrollPath('getStep');

			var point = path.getPointByStep(step);
			
			

			switch(event.which) {
				case 1:
					// left mouse

					var year = prompt('Timeline Anker :: Jaar', '200');

					if(!year) {
						taOpened = false;
						return;
					}

					var title = prompt('Timeline Anker :: Titel');

					if(!title) {
						taOpened = false;
						return;
					}

					break;

				case 2:
					alert(step)
					taOpened = false;
					return;
					break;
				case 3:
					// right mouse

					var url = prompt('Frank-ly Artikel :: URL', 'http://');

					if(!url) {
						taOpened = false;
						return;
					}

					break;
				default:
					// dead mousedown
			}




			var pointX = point.x - offsetX/_SCALE - 14;
			var pointY = point.y - offsetY/_SCALE - 14;

			var point = new Point(pointX, pointY);
			
			if(!url) {
				var anchor = new Anchor(title, step, point);
			} else {
				var anchor = new Post(title, url, step, point);
			}
			
			// add anchor to canvas
			anchor.block().element().appendTo('.wrapper');

			$(window).resize();
			
			var br = '\n';

			if(!url) {
				var contentString = [
					'{',
					'	name: "' + year + '/' + title + '",',
					'	step: ' + step + ',',
					'	offset: { ',
					'		x: ' + -(offsetX/_SCALE + 14) + ',',
					'		y: ' + -(offsetY/_SCALE + 14),
					'	}',
					'},'
				].join('\n');
			} else {
				var contentString = [
					'{',
					'	url: "' + url + '",',
					'	step: "' + step + '",',
					'	offset: { ',
					'		x: ' + -(offsetX/_SCALE + 14) + ',',
					'		y: ' + -(offsetY/_SCALE + 14),
					'	}',
					'},'
				].join('\n');
			}

			$ta.html(contentString);

			clip.setText(contentString);

			$ta.click(function(event) {
				event.stopPropagation();
				event.preventDefault();
				return false;
			});			

			event.preventDefault();
			return false;
		});

	}

}