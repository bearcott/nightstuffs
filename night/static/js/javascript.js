function log(sdfs) {
	window.console.log(sdfs);
}

$(document).ready(function() {
	$('img').hide().load(function() {
		$(this).fadeIn(1000);
	})
	var lw, ww, pw, left, sw;
	left = $('body > section.left');
	$('.hideaside').click(function() {
		t = 600;
		$('.left, #wrapper, #wrapper > section').stop(true,true);
		lw = left.width()/left.parent().width()*100;
		ww = $('#wrapper').width()/$('#wrapper').parent().width()*100;
		pw = $('#wrapper > section').css('paddingLeft');
		sw = $('#wrapper > section').width()/$('#wrapper > section').parent().width()*100;
		left.animate({'width' : '0%'}, t);
		$('#wrapper > section').animate({'paddingLeft' : '10%' }, {duration : t, queue : false});
		$('#wrapper > section').animate({'width' : '80%' }, {duration : t, queue : false});
		$('#wrapper').animate({'width' : '100%'}, t, function() { 
			$('.showaside').animate({'opacity' : '1'});
		});
		left.addClass('hidden');
	});
	$('.showaside').click(function() {
		t = 600;
		$('.left, #wrapper, #wrapper > section').stop(true,true);
		$('#wrapper').animate({'width' : ww + "%"}, {duration : t, queue : false});
		$('#wrapper > section').animate({'width' : sw + "%" }, {duration : t, queue : false});
		$('#wrapper > section').animate({'paddingLeft' : pw }, {duration : t, queue : false});
		left.animate({'width' : lw + "%"}, {duration : t, queue : false});
		$('.showaside').animate({'opacity' : '0'});
		left.removeClass('hidden');
	});
	if (left.hasClass('hidden')) {
		$('.hideaside').trigger('click');
		$('.left, #wrapper, #wrapper > section').stop(true,true);
	}
	/*LEFT IMAGE FADE IN*/
	if (left.css('background-image')) {
		g = left.css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
		f = left.css('background-image');
		left.css('background-image','');
		a = new Image();
		a.src = g;
		a.onload = function() {
			left.css('background-image',f);
		};
	}

	$('a.share').click(function() {
		window.open($(this).attr('href'),'share', 'height=300px,width=500px');
		return false;
	})
	$('textarea, input').each(function() {
		if ($(this).is('[placeholder]')) {
			var p,t,y;
			t = $(this);
			p = t.attr('placeholder');
			y = t.attr('type');
			t.attr('placeholder','').attr('type','text').val(p).addClass('empty');
			t.focus(function() {
				if (t.hasClass('empty')) {
					t.val('').removeClass('empty');
					t.attr('type',y);
				}
			});
			t.blur(function() {
				if (t.val() == '') {
					t.val(p).addClass('empty');
					t.attr('type','text');
				}
			});
		}
	})
	
	//AJAX LOAD MORE POSTS
	if (typeof($NUM_ARTICLES) != 'undefined') {
		postnum = $NUM_NEW; //number of articles to post
		postcur = $NUM_ARTICLES; //number of articles currently paged
		//CHECK IF ARTICLE
		var testposts = $.ajax({
			type: 'POST',
			url: $POSTURL,
			data: "numthere=" + postcur + "&numnew=" + postnum + "&args=" + $POSTARGS
		});
		testposts.success(function(data) {
			if ((data) == "FAIL: NO RESULTS") {
			$('.loadnewposts').remove();
			}
		});
		$('.loadnewposts').click(function() {
			if ($(this).hasClass('loading')) return false;
			$(this).addClass('loading');
			$this = $(this);
			var posts = $.ajax({
				type: 'POST',
				url: $POSTURL,
				data: "numthere=" + postcur + "&numnew=" + postnum + "&args=" + $POSTARGS
			});
			posts.success(function(data) {
				if (data == "FAIL: NO RESULTS") {
					$this.remove();
					$('html, body').stop().animate({scrollTop: '-=50'}, 500, 'swing');	
					return false;
				}
				g = $('<div/>').hide().append(data);
				$('.newposts').append(g.fadeIn(800, function() {
					g.children().unwrap();
				}));
				$('html, body').stop().animate({scrollTop: (g.offset().top - 100)}, 800, 'swing');
				postcur = +postcur + +postnum;
			});
			posts.error(function(data) {
				log(data.responseText)
			});
			posts.done(function(data) {
				$this.removeClass('loading');
			});
		});
	}
	//POST FX FOR POSTS u kno
	$('.posts > *').css('display','none').each(function(i) {
		$(this).delay(i*150).fadeIn();
	});
	//COMMENTS FUNCTION
	var comments;
	comments = $('section.comments');
	comments.c = comments.find('.comment');
	comments.c.reply = comments.c.find('.reply');
	comments.r = comments.find($('.commenter'));
	comments.r.submit = comments.r.find($("button[class='submit']"));
	comments.data = false; //replies
	comments.r.b = comments.r.find('.alert').css('display','none');
	comments.r.b.h = comments.r.b.html();
	comments.r.b.l = 1500 //CHARACTER LIMIT FOR COMMENTS
	comments.r.p = comments.r.find('.preview');
	comments.r.submit.click(function() {
		var n, e, t, s, w, error;
		error=false;
		t = $(this).parent().parent();
		n = t.find('.name').removeClass('error');
		e =	t.find('.email').removeClass('error');
		s = t.find('textarea').removeClass('error');
		if (n.hasClass('empty') || n.val().replace(/\s/g, '') == '') { n.addClass('error'); error=true }
		if (s.hasClass('empty') || s.val().replace(/\s/g, '') == '' || s.val().length > comments.r.b.l) { s.addClass('error'); error=true }
		if (e.val().split('@')[1] === undefined || e.hasClass('empty') || e.val().split('@')[1].split('.')[1] == undefined) { e.addClass('error'); error=true }
		
		if (!error) {
			$this = $(this);
			setTimeout(function(){ 
				if (!($this.hasClass('win') || $this.hasClass('fail'))) $this.addClass('loading'); 
			},300);
				
			
			if (comments.data) var l=comments.data['level'],p=comments.data['parent'];
			d = $this.data('id')['id'];
			dat = (comments.data) ? {name:n.val(),email:e.val(),text:s.val().replace(/\n/gm,"\n"),level:l,parent:p,id:d} : {name:n.val(),email:e.val(),text:s.val(),id:d};
			$.ajax({
				type: 'POST',
				contentType: "application/json; charset=utf-8",
				url: $COMMENT_URL,
				data: JSON.stringify(dat),
				success: function(data) {
					$this.removeClass('loading');
					if (data.split(' ')[0] == 'Nice!') {
						$this.addClass('win');
						$this.html('posted')
						$this[0].disabled = true;
						log(data)
					}else{
						$this.removeClass('loading');
						$this.addClass('fail');
						$this.html('fail');
						log(data)
					}
				},
				error: function(error) {
					$this.removeClass('loading');
					$this.addClass('fail');
					$this.html('fail');
					log(error)
				}
			});
		}
	})
	comments.r.find('input').keypress(function(e) {
		if (e.which == 13) {
			comments.r.submit.click()
		}
	})
	comments.r.find('textarea').focus(function() {
		var b = comments.r.b;
		var p = comments.r.p;
		$this = $(this);
		$this.keyup(function() {
			b.html((comments.r.b.l - $(this).val().length) + b.h);
			p.html("<p>" + $('<div/>').text($this.val()).html().replace(/\n/gm,"</p><p>") + "</p>");
			if ($this.val().length >= comments.r.b.l) {
				b.addClass('red');
				b.html(Math.abs(comments.r.b.l - $(this).val().length) + " characters too long man..");
			} else if (b.hasClass('red')) {
				b.removeClass('red');
			}
			if ($this[0].offsetHeight < $this[0].scrollHeight) {
				$this.animate({'height' : '+=20px'}, 200)
			}
		})
		$this.keyup();
		b.stop().slideDown();
		p.stop().slideDown();
	})
	comments.r.find('textarea').blur(function() {
		$(this).unbind('keyup');
		var b = comments.r.b;
		b.stop().slideUp();
	})
	comments.c.reply.click(function() {
		var r,t;
		r = $(this).data('reply');
		comments.data = r;
		t = comments.r.find('.replyto');
		t.find('.named').html(r['name']);
		t.find('.pic').css('background-image',"url('http://www.gravatar.com/avatar/" + r['email'] + "?d=identicon&f=y')");
		t.finish().fadeIn();
	})
	comments.r.find('.replyto').click(function() {
		comments.data = false;
		$(this).finish().fadeOut();
	})
});
$(window).load(function() { //after pictures load
	
	//MAKE NAV SECTIONS CLICKABLE
	$('nav').find('ul ul').css('display', 'none').end().find('li.slide').append($('<div/>',{'class':'after'}));
	$('nav').find('li.slide').click(function() {
		if ($(this).next('ul').length > 0 && !$(this).hasClass('downed')) {
			$(this).addClass('downed').next('ul').stop().css('opacity', 0).slideDown(300).animate({'opacity' : 1},{queue : false, duration : 600});
		}else{
			$(this).removeClass('downed').next('ul').stop().slideUp(300);
		}
	});

	//MAKE FOOTER FIXED NO MATTER WHAT
	//MAKE NAV BACKGROUND PARALLAX
	var left, foot;
	left = $('body > section.left');
	left.y = left.css('backgroundPosition').split(' ')[1].replace('px','');
	left.t = (left.css('top') == 'undefined' ? 'auto' : left.css('top'));
	foot = $('footer > .container');
	//WHAT TO DO WHEN SCROLLING
	function scroll() {
		var t, w, h, d, fh;
		w = $(window).scrollTop();
		h = $(window).height();
		d = $(document).height();
		fh = foot.outerHeight();
		foot.o = foot.parent().offset().top;
		foot.parent().css('height',foot.outerHeight() + "px")
		
		left.css('backgroundPosition', 'right ' + (left.y*(w/d)) + 'px'); //left bg
		if ((w + h) >= foot.o)  {
			//foot.css('top', (w+h-foot.o-fh) + 'px');
			left.css({'top' : foot.o - left.height() + 'px', 'position' : 'absolute'});
		}else{
			left.css({'top' : left.t, 'position' : 'fixed'});
		}
	}
	scroll();
	$(window).scroll(function() {
		scroll();
	})
	$(window).resize(function() {
		scroll();
	})
	
	//FADE OUT CURTAIN WHEN CLICK
	var curtain, dialog
	curtain = $('.curtain');
	dialog = $('.dialog');
	curtain.click(function(e) {
		if (e.target == $(this)[0]) {
			dialog.css('opacity',0);
			curtain.stop().fadeOut(600, function() { dialog.html('').attr('style','')});
		}
	});
	
	//MAKE PICTURES CLICKABLE AND SCALABLE RESULT AND ALT TEXT
	$('.p').click(function() {
		var ph, pw, wh, ww;
		wh = $(window).height(); ww = $(window).width();
		var p = new Image();
		p.src = $(this).is('img') ? $(this).attr('src') : $(this).css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
			
		p.onload = function() {
			if (this.height >= wh*.9 && this.width >= ww*.9) {
				if (this.height >= this.width) {
					if ((wh*.9/this.height)*this.width > ww*.9) {
						ph = (ww*.9/this.width)*this.height;
						pw = ww*.9;
					}else{
						ph = ww*.9;
						pw = (wh*.9/this.height)*this.width;
					}
				}else{
					if ((ww*.9/this.width)*this.height > wh*.9) {
						ph = wh*.9;
						pw = (wh*.9/this.height)*this.width;
					}else{
						ph = (ww*.9/this.width)*this.height;
						pw = ww*.9;
					}
				}
			}else if (this.height >= wh*.9 || this.width >= ww*.9){
				ph = (this.height > wh*.9) ? wh*.9 : (ww*.9/this.width)*this.height;
				pw = (this.width > ww*.9) ? ww*.9 : (wh*.9/this.height)*this.width;
			}else{
				ph = (this.height >= wh*.9) ? wh*.9 : this.height;
				pw = (this.width >= ww*.9) ? ww*.9 : this.width;
			}
			dialog.append($('<img>',{'src' : p.src, 'class' : 'image'})).css({'margin-left' : -(pw/2), 'margin-top' : -(ph/2), 'width' : pw, 'height' : ph, 'opacity' : 0});
			curtain.stop().fadeIn(300, function() {
				dialog.css('opacity',1)
			});
		}
	})
	
	
	//ABOUT SECTION DESCRIPTIONS SHOW
	var pics, picdivs;
	pics = $('section.about .pic');
	picdivs = pics.find('div').css('display','none');
	
	pics.click(function() {
		var d,f;
		d = $(this).find('div');
		f = (d.css('display') == 'none') ? true : false;
		picdivs.stop(true,true).fadeOut(200).promise().done(function() {	
			log(f)
			if (f) {
				d.stop().css('opacity', 0).slideDown(500).animate({'opacity' : 1},{queue : false, duration : 700});
			}
		})
	})
});