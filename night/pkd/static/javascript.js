$(document).ready(function() {
	function log(d) { window.console.log(d); }
	//get date 
	function dateit(date) {
		m = date.getMonth();
		mo = ["Jan", "Feb", "Mar", "Apr", "May",
	  "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
		return [mo[m] + " " + date.getDate() + "," + " " + date.getFullYear(),date.getTime()];
	}
	//CONVERT BASE64 TO BLOB
	function toblob(stuff) {
		var g, type, bi, ab, ua, b, i;
		g = stuff.split(',');
		if (g[0].split('jpeg')[1])
			type = 'jpeg';
		else if (g[0].split('png')[1])
			type = 'png';
		else
			return false;
		bi = atob(g[1]);
		ab = new ArrayBuffer(bi.length);
		ua = new Uint8Array(ab);
		for (i = 0; i < bi.length; i++) {
			ua[i] = bi.charCodeAt(i);
		}
		b = new Blob([ua], {
			type: "image/" + type
		});
		return b;
	}
	function blobtype(stuff) {
		g = stuff.split(',');
		if (g[0].split('jpeg')[1])
			return '.jpeg'
		else if (g[0].split('png')[1])
			return '.png'
		else
			return false
	}
	
	$('.overlay').css('background','#000');
	background = new Image();
	background.src = 'static/switzStars.jpg';
	background.onload = function() {
		$('.overlay').fadeOut();
	}
	
	//random color
	$('.post').each(function() {
		var color = Math.floor(Math.random()*300);
		$(this).css("background-color","hsl(" + color + ",30%,50%)");
	});
	
	var clikedfds_spam = false;
	$('.showclouds').click(function() {
		if (clikedfds_spam) return false;
		loop_cloud()
		clikedfds_spam = true;
	})
	
	function loop_cloud() {
		var h, w, m;
		h = $(window).height();
		w = $(window).width();
		m = Math.random()*3000+10000;
		setTimeout(function() {
			var l, c
			c = $('<div/>').attr('class','cloud').css({
				'height': Math.floor(Math.random()*150+30) + 'px',
				'width': Math.floor(Math.random()*300+30) + 'px',
				'top': Math.floor(Math.random()*h) + 'px',
				}).hide();
			$('.background').append(c.fadeIn().animate({'right': '-20%'}, 30000, function() { $(this).remove() }));
			loop_cloud();
		},m)
	}
	//sets textarea hover
	$('textarea, input').each(function() { 
		if ($(this).is('[placeholder]') && !$(this).val()) {
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
	//login
	if ($('.login').hasClass('error')) { 
		$('.login').animate({'left':'+=10px'},100).animate({'left':'-=20px'},100).animate({'left':'+=10px'},100);
	}
	setTimeout(function() {
		$('.login .error').fadeOut();
	}, 4000)
	//edit description
	$('.editp').click(function() {
		var t,h,d;
		t = $(this);
		h = t.html();
		t.hide().before($('<textarea>').css('height',t.height() + 20 + 'px').val(h).addClass('editextarea').blur(function() {
			var t = $(this);
			$('.editpsubmit').show();
			t.parent().find('.editp').html(t.val()).show().end().end().remove();
		}))
	})
	$('button.editpsubmit').click(function() {
		if ($(this).hasClass('loading')) return false;
		var t = $(this);
		if (t.hasClass('win')) return false;
		s = new FormData();
		g = false;
		if ($('.fakefileinput').hasClass('submit') && $('.canvas')) {
			d = toblob($('.canvas')[0].toDataURL('image/jpeg',1));
			g = true;
			s.append('image', d);
		}
		s.append('id', $(this).parent().find('.editp').data('id'));
		s.append('desc', $(this).parent().find('.editp').html());
		s.append('name', $(this).parent().find('.name').html());
		s.append('hasimage', g);
		t.addClass('loading');
		var g = $.ajax({
			url: $POSTAUTHOR, 
			type: 'POST',
			processData : false,
			contentType : false,  
			data: s
		}) //POSTDATA
		g.success(function(data) {
			t.addClass('win');        
			log(data)
		});
		g.fail(function(d) { 
			log(d) 
		});
		g.done(function() {
			t.removeClass('loading')
		});
	})
	//edit pic
	$('.picdsubmit').change(function(e) {
		$this = $(this);
		$this.addClass('loading');
		if ($('.fakefileinput').hasClass('submit')) return false;
		$('.profileslider').css('display','block');
		d = new FileReader();
		d.readAsDataURL(e.target.files[0]);
		s = document.createElement('canvas');
		c = s.getContext('2d');
		d.onload = function(v) {
			g = new Image();
			a = $('.profile.picture');
			g.onload = function() {
				c.drawImage(g,0,0);
			};
			g.src = v.target.result;
			s.width = a.width();
			s.height = a.height();
			a.after($(s).addClass('canvas')).hide();
			$this.removeClass('loading');
			$('.fakefileinput').addClass('submit');
			//zoom
			var cw=g.width, ch=g.height;
			$('.profileslider').val(100).change(function() {
				r = $('.profileslider').val();
				cw = g.width*(r/100);
				ch = g.height*(r/100);
				c.drawImage(g,ix,iy,cw,ch);
			});
			//DRAG POSITION FUCK THIS TOOK ME FOREVER TO GET WORKING :OOO!!
			var ix = 0, iy = 0; //initial x and y of canvas image
			$('.profile .canvas').mousedown(function(e) { //click to move mouse
				var mix = e.pageX - $(e.target).offset().left;
				miy = e.pageY - $(e.target).offset().top;
				var x,y;
				$(this).mousemove(function(e) {//moving mouse action~
					x = e.pageX - $(e.target).offset().left;
					y = e.pageY - $(e.target).offset().top;
					c.drawImage(g,ix+x-mix,iy+y-miy,cw,ch);
				});
				$(this).mouseup(function() {
					$(this).unbind('mouseup');
					$(this).unbind('mousemove'); 
					ix = ix+x-mix;
					iy = iy+y-miy;
				}) //unclick to stop moving mouse
			});
		};
	});
	//MISC ARTICLE FUNCTIONS
	article = $('#wmd-input');
	article.t = $("input[name='title']");
	article.ta = $("input[name='tags']");
	article.d = $("textarea[name='desc']");
	article.pd = $("input[name='picdesc']");
	article.p = false;
	article.c = $('.top select');
	article.s = false;
	function checkStorage() {
		name = ($NEW) ? 'NEW' : $ID;
		try {
			g = localStorage.getItem('title');
		}
		catch (e) {
			alert('unable to retrieve locally Stored Data \n' + e)
		}
		if (g !== null) {
			$('.loadarticle').show();
		}
	}
	checkStorage();
	$('.savearticle').click(function() {
		name = ($NEW) ? 'NEW' : $ID;
		$this = $(this)
		cp = $('.coverpic').css('background-image');
		try {
			localStorage.setItem('picBase',article.s);
			localStorage.setItem('pic', cp);
			localStorage.setItem('uploaded',($('.uploadpictures .uploaded').html() == "") ? false : $('.uploadpictures .uploaded').html());
			localStorage.setItem('title', article.t.val());
			localStorage.setItem('category', article.c.find('option:selected').html());
			localStorage.setItem('tags',article.ta.val());
			localStorage.setItem('desc',article.d.val());
			localStorage.setItem('picdesc',article.pd.val());
			localStorage.setItem('content', article.val());
		}
		catch (e) {
			alert('Draft was not saved: \n"' + e + '"')
		}
		finally {
			$this.addClass('win');
			setTimeout(function() {$this.removeClass('win')},300);
		}
	});
	$('.loadarticle').click(function() {
		name = ($NEW) ? 'NEW' : $ID;
		if (localStorage.getItem('title') != null && confirm('doing this will, like, delete everything.')) {
			article.t.val(localStorage.getItem('title')).removeClass('empty');
			$('.article h1').html(localStorage.getItem('title'));
			article.ta.val(localStorage.getItem('tags')).removeClass('empty');
			article.d.val(localStorage.getItem('desc')).removeClass('empty');
			article.pd.val(localStorage.getItem('picdesc')).removeClass('empty');
			article.c.val(localStorage.getItem('category')).removeClass('empty');
			article.val(localStorage.getItem('content')).removeClass('empty');
			$('.uploadpictures .uploaded').html(localStorage.getItem('uploaded'))
			$('.wmd-preview').html(converter.makeHtml(localStorage.getItem('content')));
			f = localStorage.getItem('pic')
			if (f !== null && f !== undefined && f !== 'none') {
				//EVERYTHING BELOW MIMICS ALL THE PATTERNS I SET BEFORE IDK IF IT WORKS?!!?
				$('.coverpic').addClass('haspic').css('background-image', f);
				$('.deletecover').fadeIn();
				$('.fakepic').addClass('disabled').find('input').attr('disabled','disabled')
				article.pd.fadeIn().addClass('changed');
				article.p = toblob(localStorage.getItem('picBase'));
			}
		}
		$this = $(this);
		$this.addClass('win');
		setTimeout(function() {$this.removeClass('win')},300);
	});
	$('.top input.pic').change(function(e) {
		$this = $(this);
		$this.parent().addClass('loading');
		var g;
		g = new FileReader();
		g.readAsDataURL(e.target.files[0]);
		g.onload = function(e) {
			s = document.createElement('canvas');
			c = s.getContext('2d');
			i = new Image();
			i.src = e.target.result
			i.onload = function() {
				s.width = i.width
				s.height = i.height
				c.drawImage(i,0,0,i.width,i.height)
				$('.editor .coverpic').css('background-image', 'url(' + s.toDataURL('image/jpeg',1) + ')');
				article.pd.addClass('changed');
				article.p = toblob(s.toDataURL('image/jpeg',1));
				article.s = s.toDataURL('image/jpeg',1);
				$('.coverpic').addClass('haspic');
				$this.parent().removeClass('loading');
			}
		}
		$('.deletecover').fadeIn();
		article.pd.fadeIn();
		$(this).attr('disabled','disabled');
		$('.editor .top .fakepic').addClass('disabled')
	})
	/* ADD NEW CATEGORY */
	$('.top select.category').change(function() {
		if ($(this).find('.new').val() == $(this).find(':selected').val()) {
			$('.diag > .category').show();
			$('.modal').fadeIn();
			$('.diag').slideDown();
		}
	})
	$('.modal .back').click(function() {
		$('.modal .diag').slideUp(function() {
			$('.modal .diag > *').hide();
			$(this).parent().fadeOut();
		});
	});
	category = $('.diag .category .category');
	category.c = $('.diag .categorycolor');
	category.d = $('.diag .categorydesc');
	$('.categorycolor').spectrum({
		color: '#333',
		showInput: true,
		className: 'colorpik'
	}); //color picker
	if ($('.top select.category').children().length == 1) {
		$('.top select.category').prepend($('<option/>').attr('selected','selected'));
	}
	$('.categorypic').change(function(e) { //wow how fucking sutpid why did u change this to clikc u dumbass
		var j = new FileReader();
		$(this).addClass('changed');
		j.readAsDataURL(e.target.files[0]);
		j.onload = function(v) {
			f = new Image();
			f.src = v.target.result;
			f.onload = function() {
				s = $('#bullshitid')[0];
				c = s.getContext('2d');
				x = 1100/f.height;
				s.height = 1100;
				s.width = 800;
				c.drawImage(f,0,0,f.width*x,s.height);
				//stackBlurCanvasRGB('bullshitid',0,0, s.width, s.height,30); //NOT BLURRING THE IMAGE BECAUSE IT LOOKS MORE SHITTY.
				$('.showpic').css('background-image', 'url(' + (s.toDataURL('image/jpeg',1)) + ')');
				category.p = s.toDataURL('image/jpeg',1);
			}
		}
	});
	$('.submitcategory').click(function() {
		if ($(this).hasClass('loading')) return false;
		$('.diag .category *').removeClass('error');
		var t = $(this);
		if (t.hasClass('win')) return false;
		var error = false;
		if (category.val().replace(/\s/g, '') == '') {category.addClass('error'); error = true; }
		if (category.c.val().replace(/\s/g, '') == '') {$('.colorpik').addClass('error'); error = true; }
		if (category.d.val().replace(/\s/g, '') == '') {category.d.addClass('error'); error = true; }
		if (category.val().replace(/\s/g, '') == '') {category.addClass('error'); error = true; }
		if (!$('.categorypic').hasClass('changed')) {$('.categorypic').addClass('error'); error = true; }
		if (!error) {
			if (confirm('U SURE? Once you make a new category IT CANNOT BE REMOVED!!!! :O!!!')) {
				s = new FormData();
				g = false;
				if (category.p) {
					d = toblob(category.p);
					g = true;
					s.append('image', d);
				}
				s.append('name', category.val());
				s.append('desc', category.d.val());
				s.append('color', category.c.val());
				s.append('hasimage', g);
				t.addClass('loading');
				var g = $.ajax({
					url: $POSTCATEGORY, 
					type: 'POST',
					processData : false,
					contentType : false,  
					data: s
				}) //POSTDATA
				g.success(function(data) {
					t.addClass('win');        
					log(data);
					done = false
					$('.top select.category option').each(function() {
						if (category.val() == $(this).val().toLowerCase()) {
							done = true;
							return $(this).attr('selected','selected');
						}
					});
					if (!done) $('.top select.category').prepend($('<option/>').html(category.val().toLowerCase()).attr('selected','selected'));
					$('.diag').slideUp();
					$('.modal').fadeOut();
				});
				g.fail(function(d) { 
					log(d) 
				});
				g.done(function() {
					t.removeClass('loading')
				});
			}
		}
	});
	$('.uploadpic').click(function() {
		$('.diag > *').hide();
		$('.diag .uploadpictures').show();
		$('.modal').fadeIn();
		$('.diag').slideDown();
	});
	//UPLOAD IMAGES!!!! OMGOMGOMGOMG
	$(".uploadpictures .uploadimagefile").change(function() {
		g = new FileReader();
		g.readAsDataURL($(this)[0].files[0]);
		g.onload = function(e) {
			$('.uploadpictures .submit img').attr('src', e.target.result).removeClass('url').addClass('file')
		}
	});
	$(".uploadpictures .uploadimageurl").blur(function() {
		$('.uploadpictures .submit img').attr('src', $(this).val()).removeClass('file').addClass('url')
	});
	$("input[name='title']").keyup(function() { //UPDATE TITLE FROM TITLE EFFECT
		$('.editor .article h1').html($(this).val());
	});
	$('.uploadpictures .submit button').click(function() {
		if ($(this).hasClass('loading')) return false;
		error = false;
		$('.uploadpictures *').removeClass('error');
		if ($('.uploadpictures .submit img').attr('src') == '') {$('.uploadpictures .submit img').addClass('error'); error = true; }
		if ($('.uploadpictures .submit input').val().replace(/\s/g, '') == '' || $('.uploadpictures .submit input').hasClass('empty')) {$('.uploadpictures .submit input').addClass('error'); error = true; }
		if (error) return false;
		var g = new FormData();
		$this = $(this);
		g.append('name',$('.uploadpictures .submit input').val());
		if ($('.uploadpictures .submit img').hasClass('file')) {
			d = $('.uploadpictures .submit img').attr('src');
			g.append('type','file');
			g.append('stuff',toblob(d));
			g.append('ext',blobtype(d));
		}
		if ($('.uploadpictures .submit img').hasClass('url')) {
			g.append('type','url');
			g.append('stuff',$('.uploadpictures .submit img').attr('src'))
		}
		$this.addClass('loading')
		s = $.ajax({
			type: 'POST',
			url: $UPLOAD_URL,
			processData : false,
			contentType : false,  
			data: g
		});
		s.success(function(data) {
			if (data.indexOf('FAIL:,') != -1) {
				return alert('FAIL:' + data.split('FAIL:,')[1]);
			}
			$this.addClass('win');
			setTimeout(function() {$this.removeClass('win')},300);
			$('.uploadpictures .uploaded').append($('<div/>').addClass('image').append($('<img/>').attr('src',data)).append($('<p/>').html(data)));
				
			log(data)
		});
		s.fail(function(d) { 
			log(d.responseText) 
		});
		s.done(function() {
			$this.removeClass('loading')
		});
	});
	$('.editor .article h1').html($("input[name='title']").val());
	$("input[name='title']").focus(function() { $(this).unbind('keydown'); });
	$('.pull').click(function() {
		if ($(this).hasClass('after')) {
			$('.top').slideDown();
			$(this).removeClass('after');
		}else{
			$('.top').slideUp();
			$(this).addClass('after');
		}
	})
	$('.top').hide();
	$('.pull').addClass('after');
	if ($NEW) {
		$('button.delete').hide();
		$('.top').slideDown();
		$('.pull').removeClass('after');
	}
	//DELETE ARTICLE! D:
	$('button.delete').click(function(e) {
		if ($(this).hasClass('loading')) return false;
		$this = $(this)
		if ($NEW) {
			return e.preventDefault();
		}
		itwillhappen = false;
		if (confirm('WAIT WAT? Are you sure!?!? :O U want to delete this article?!!?')) {
			if (confirm('nu uh..')) {
				if (confirm('...')) {
					if (confirm('Are u sure?...')) {
						itwillhappen = true;
					}else{
						return;
					}
				}else{
					return;
				}
			}else{
				return;
			}
		}else{
			return;
		}
		if (!itwillhappen) return;
		$this.addClass('loading');
		s = $.ajax({url: $DELETE_URL, type:'POST', data: 'id=' + $ID})
		s.success(function(d) {
			$this.removeClass('loading')
			alert(d)
			window.location.replace($HOME);
		});
		s.fail(function(d) {
			$this.removeClass('loading')
			log(d)
			alert('delete failed? :O!')
		});
	});
	//RESIZE TO MEET BOTTOM OF PAGE YES!!
	function resizeeditor() {
		if ($('body').height() <= $(window).height()) {
			b = $('body').height();
			w = $(window).height();
			t = parseInt($('.wmd-input').css('height'));
			p = parseInt($('.wmd-preview').css('height'));
			$('.wmd-input').css('height', w-b+t-1 + "px");  // subtracting one as a quickfix to making scroll bar go away!
			$('.wmd-preview').css('height', w-b+p-1 + "px");
		}else{
			b = $('body').height();
			w = $(window).height();
			t = parseInt($('.wmd-input').css('height'));
			p = parseInt($('.wmd-preview').css('height'));
			$('.wmd-input').css('height', (t-(b-w)-1) + "px");
			$('.wmd-preview').css('height', (p-(b-w)-1) + "px");
		}
	}
	$(window).resize(function() { resizeeditor() });
	resizeeditor();
	if (!$('.coverpic').hasClass('haspic')) {
		$('.deletecover').hide();
		article.pd.hide();
	}
	$('.deletecover').click(function() {
		if (!confirm('Dude if you delete this image it wont come back again, u sure man?')) return false;
			article.pd.removeClass('changed');
			$('.coverpic').removeClass('haspic').css('background','');
			article.p = false;
		$('.editor .top .pic').removeAttr('disabled')
		$('.editor .top .fakepic').removeClass('disabled')
		$(this).fadeOut();
		article.pd.fadeOut().html('');
	});
	//REQUEST ARTICLE MAKE!!!!!
	$('.submitarticle').click(function(e) {
		if ($(this).hasClass('loading')) return false;
		if ($(this).hasClass('win')) return false;
		$('input, textarea, .input').removeClass('error');
		$this =  $(this);
		error = false;
		if (article.val().replace(/\s/g, '') == '' || article.hasClass('empty')) {article.addClass('error'); error = true; }
		if (article.t.val().replace(/\s/g, '') == '' || article.t.hasClass('empty')) {article.t.addClass('error'); error = true; }
		if (article.ta.val().replace(/\s/g, '') == '' || article.ta.hasClass('empty') || article.ta.val().indexOf(',') == -1) {article.ta.addClass('error'); error = true; }
		if (article.pd.hasClass('changed')) {
			if (article.pd.val().replace(/\s/g, '') == '' || article.pd.hasClass('empty')) {article.pd.addClass('error'); error = true; }
		}
		if (article.d.val().replace(/\s/g, '') == '' || article.d.hasClass('empty')) {article.d.addClass('error'); error = true; }
		if ($('select.category option:selected').hasClass('new')) {$('select.category').addClass('error'); error = true; }
		if (error) return false
		//BEGIN PROCESSING
		if (confirm('are you sure?')) {
			if (article.pd.hasClass('empty'))
				article.pd.val('');
			//CHECK IF WE HAVE A COVER PICTURE
			//FIND IMAGES IN TEXT and used to prcess them o well.
			i = $('.wmd-preview').find('img');
			article.i = false
			if (i.length > 0) {
				article.i = new Array();
				i.each(function() {
					article.i.push($(this).attr('src'))
				});
			}
			/*lol useless function but whatever, it was result of very confusing hard work. */
			submitshit(
				article.val(),
				article.t.val(),
				(article.c.find('option:selected').hasClass('new') ? false : article.c.find('option:selected').val()),
				article.ta.val(),
				article.p,
				article.pd.val(),
				article.d.val(),
				article.i,
				(($('.coverpic').hasClass('haspic')) ? true : false)
			)
			function submitshit(a,t,c,ta,cp,cd,d,i,hoc) {
				//BEGIN FORMDATA
				g = new FormData();
				conv = new Markdown.Converter();
				Markdown.Extra.init(conv);
				if (!$NEW) {
					g.append('id',$ID);
				}else{
					g.append('id',false);
				}
				g.append('article',a);
				g.append('html', conv.makeHtml(a));
				g.append('title',t);
				g.append('category',c);
				g.append('tags',ta);
				g.append('cover',cp);
				g.append('hascover',((cp) ? true : false))
				g.append('coverdesc',cd);
				g.append('desc',d);
				g.append('image',JSON.stringify(i));
				g.append('hoc',hoc);
				$this.addClass('loading');
				var sendreq = (typeof $CONNECT_URL != 'undefined') ? 
					$.ajax({
					url:$CONNECT_URL,
					type:'POST',
					processData : false,
					contentType : false,
					data: g
					}) : log("upload url not set!");
				sendreq.success(function(dat) {
					$this.removeClass('loading')
					if (dat.indexOf('ERROR:') != -1) {
						return alert(dat);
					}
					$this.addClass('win');
					$('.butt').addClass('win');
					log(dat);
					($NEW) ? alert('new article created!!! Nice!!') : alert('Article updated!')
					window.location.replace($HOME)
				});
				sendreq.fail(function(dat) {
					$this.removeClass('loading')
					log(dat.responseText);
				});
			}
		}
	});
	//EDITOR!!! GREAT THANKS TO WHO EVER MADE PAGE DOWN WOOO!!
	//
	$(document).keydown(function(e) { //DETECT CTRL + S TO SAVE
		if ((e.which == '115' || e.which == '83' ) && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
				$('.savearticle').click();
			return false;
		}
		return true;
	});
	if ($('.wmd-panel')[0]) {
		var converter = new Markdown.Converter();
		Markdown.Extra.init(converter,{highlighter: "highlight"});
		editor = new Markdown.Editor(converter);
		editor.run();
		$('#wmd-input').tabby({tabString : '    '});
	}
})