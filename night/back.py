from night import app, redirect, json, request, session, url_for, query_db, cut, get_db, abort, Markup, dateit, render_template, make_response, send_from_directory
from werkzeug import secure_filename, FileStorage
import os, math, urllib, time, mimetypes
from datetime import datetime, timedelta, date, time
from PIL import Image, ImageFile
from os.path import splitext, basename, isfile, join
from os import listdir
from urlparse import urlparse, urljoin
from base64 import decodestring
from night.views import postmaker

def allowed_file(f):
	ALLOWED_EXTENSIONS = set(['jpeg','jpg','png'])
	return '.' in f and f.rsplit('.',1)[1] in ALLOWED_EXTENSIONS

def optimize(pic,resize=True):
	im = Image.open(pic)
	width, height = im.size
	if (width > 1000 or height > 1000) and resize is True:
		width = float(width)*float(0.7)
		height = float(height)*float(0.7)
	im = im.resize((int(math.floor(width)),int(math.floor(height))), Image.ANTIALIAS)
	try:
		im.save(pic,optimize=True,quality=80)
	except IOError:
		ImageFile.MAXBLOCK = int(math.floor(width)) * int(math.floor(height))
		im.save(pic,optimize=True,quality=80)	

@app.route('/pics/pictures/<pic>', defaults={'set':'pictures'})
@app.route('/pics/<set>/<pic>')
def pics(set=None, pic=None):
	return redirect(url_for('static',filename='pics/%s/%s' % (set, pic)))

@app.route('/sitemap.xml')
def sitemap():
	#generate sitemap.xml
	pages = []
	# All pages registed with flask apps
	#tendaysago = time.isoformat(datetime.now() - timedelta(days=10))
	for rule in app.url_map.iter_rules():
		if "GET" in rule.methods and len(rule.arguments) == 0:
			pages.append(urljoin(request.url_root,rule.rule))

	sitemap_xml = render_template('sitemap.xml', pages=pages)
	response = make_response(sitemap_xml)
	response.headers["Content-Type"] = "application/xml"

	return response

@app.route('/robots.txt')
def robots():
	return send_from_directory(app.static_folder, request.path[1:])

@app.route('/google77c5c390e18eaa5b.html')
def google():
	return send_from_directory(app.static_folder, request.path[1:])

@app.route('/requests/<req>', methods=['POST'])
def requests(req=None): 
	if req == 'comment' and request.method == 'POST': #COMMENT REQUESTS
		error = False
		r = request.json
		n = r['name']
		e =	r['email']
		s = r['text']
		l = r['level'] + 1 if 'level' in r else '0'
		p = r['parent'] if 'parent' in r else '0'
		d = r['id']
		if n.replace(" ", "") == "": error=True
		if s.replace(" ", "") == "": error=True
		if e.split('@')[1] == 'undefined' or e.split('@')[1].split('.')[1] == 'undefined': error=True
		
		if error == True: return 'failed: requests not valid'
		#processing and limiting text
		s = ("<p>%s</p>" % cut(Markup.escape(s),1500)).replace("\n","</p><p>")
		n = cut(n,60)
		e = cut(e,100)
			
		
		query_db("INSERT INTO comments (Name, Date, Email, Parent, Level, Comment, ArticleID) VALUES (?,DATETIME('NOW'),?,?,?,?,?)",[n,e,p,l,s,d])
		get_db().commit()
		return "Nice! Request recieved! And look at you looking into the console. Well here's your reward: raw request data { Name: %s, Email: %s, Comment: %s, Level: %s, Parent: %s, ArticleID: %s }" % (n,e,s,l,p,d)
	if req == 'profile' and request.method == 'POST':
		if not session.get('user'): return "Fail.."
		r = request.form['name']
		d = request.form['desc']
		h = request.form['hasimage']
		n = session.get('name')
		query_db("UPDATE users SET Description=? WHERE Username = ?",[d,session.get('user')])
		get_db().commit()
		g = 'image uploaded!'
		if h == 'true':
			s = FileStorage(stream=request.files['image']).save(os.path.join(app.config['AUTHOR_FOLDER'],secure_filename(''.join([n,'.jpg']))))
		else:
			g = "no image uploaded."
		return "Nice! Author Updated! Description changed to '%s', and %s" % (d,g)
	if req == 'article' and request.method == 'POST':
		if not session.get('user'): return "Fail.."
		a = request.form['article']
		h = request.form['html']
		id = request.form['id']
		t = request.form['title'].lstrip().rstrip()
		st = secure_filename(t)
		c = request.form['category']
		ta = request.form['tags']
		hc = request.form['hascover']
		cd = request.form['coverdesc']
		d = request.form['desc']
		i = request.form['image'] #DO NOT I REPEAT DO NOT Markup.escape THIS U FUCKING DUMB PIECE OF SHIT.
		titles = query_db('SELECT ID FROM articles WHERE Title=?', [t])
		hoc = request.form['hoc']
		p = None
		ta = ','.join([e.strip() for e in ta.split(',')])
		if id == 'false': #new article
			if (len(titles) > 0): return "ERROR: The title ur trying to use has been used %s time before!" % (len(titles))
			id = query_db('SELECT ID FROM users WHERE Username=?', [session.get('user')])[0][0] #set ID from article id to author id
			query_db("INSERT INTO articles (Title, SafeTitle, AuthorID, Date, Category, Tags, Description, CoverInfo, Pictures, Content, Text) VALUES (?,?,?,DATETIME('NOW'),?,?,?,?,?,?,?)",[t,st,id,c,ta,d,cd,i,h,a])
		else: #update article
			if (len(titles) > 0 and id != str(titles[0][0])): return "ERROR: The renaming of this article will cause a conflict with (%s) other articles!" % (len(titles))
			query_db("UPDATE articles SET Title=?, SafeTitle=?, Category=?, Tags=?, Description=?, CoverInfo=?, Pictures=?, Content=?, Text=? WHERE id = ?",[t,st,c,ta,d,cd,i,h,a,id])
		#UPLOAD COVER
		if hc == 'true':
			pid = str(query_db("SELECT ID FROM articles WHERE Title=?",[t])[0][0])
			p = secure_filename(''.join([pid,'.jpeg']))
			pic = os.path.join(app.config['COVER_FOLDER'],p)
			s = FileStorage(stream=request.files['cover']).save(pic)
			optimize(pic)
			query_db("UPDATE articles SET CoverURL=?, CoverInfo=? WHERE id=?",[p,cd,pid])
		#DELETE cover?!?!? D:
		if hoc == 'false':
			pic = query_db("SELECT CoverURL FROM articles WHERE ID=?",[str(id)])
			try:
				os.remove(os.path.join(app.config['COVER_FOLDER'],secure_filename(str(pic[0][0]))))
			except: pass
			query_db("UPDATE articles SET CoverURL='', CoverInfo='' WHERE id=?",[id])
		get_db().commit()
		return "Nice! everything went smoothly!"
	if req == 'upload' and request.method == 'POST':
		if not session.get('user'): return "Fail.."
		t = request.form['type']
		n = secure_filename(request.form['name'])
		folder = app.config['PICTURE_FOLDER']
		allfiles = [ f for f in listdir(folder) if isfile(join(folder,f)) ]
		for file in allfiles:
			if file.split('.')[0] == n:
				return "FAIL:, Already a picture named that!"
		if t == 'file':
			ext = request.form['ext']
			if allowed_file(ext):
				d = request.files['stuff']
				filename = secure_filename(''.join([n,ext]))
				pic = os.path.join(folder,filename)
				s = FileStorage(stream=d).save(pic)
				optimize(pic)
				n = filename
			else:
				return "FAIL:, not right file type!"
		elif t == 'url':
			d = request.form['stuff']
			name = urlparse(d)
			notusing, ext = splitext(basename(name.path))
			filename = secure_filename(''.join([n,ext]))
			if allowed_file(filename):
				finalp = os.path.join(folder, filename)
				urllib.urlretrieve(d, finalp)
				optimize(finalp)
				n = filename
			else:
				return "FAIL:, not right file type!"
		else:
			return "FAIL:, no images!!"
		return "%s" % url_for('pics', set='pictures', pic=n);
	if req == 'category' and request.method == 'POST':
		if not session.get('user'): return "Fail.."
		n = request.form['name'].lstrip().rstrip()
		d = request.form['desc']
		c = request.form['color']
		h = request.form['hasimage']
		fname = secure_filename(''.join([n.lower(),'.jpg']))
		all = query_db('SELECT Name FROM category')
		done = False
		for a in all:
			if n.lower() == str(a[0]).lower():
				done = True
				query_db("UPDATE category SET Name = ?, Description = ?, Color = ?, Picture = ? WHERE Name = ?",[n.lower(),d,c,fname,n.lower()])
		if done == False:	
			query_db("INSERT INTO category(Name, Description, Color, Picture) VALUES (?,?,?,?)",[n.lower(),d,c,fname])
		get_db().commit()
		g = 'image uploaded!'
		if h == 'true':
			file = os.path.join(app.config['TOPIC_FOLDER'],fname)
			s = FileStorage(stream=request.files['image']).save(file)
			optimize(file,resize=False)
		else:
			g = 'no image uploaded.'
		return "DONE my good sir! NEW CATEGORY! Name: %s, Color: %s, Description: %s and %s" % (n,c,d,g)
	if req == 'delete_article' and request.method == 'POST':
		if not session.get('user'): return "Fail.."
		id = request.form['id']
		pic = str(query_db("SELECT CoverURL FROM articles WHERE ID=?",[str(id)])[0][0])
		try:
			os.remove(os.path.join(app.config['COVER_FOLDER'],secure_filename(pic)))
		except: pass
		query_db("DELETE FROM articles WHERE ID = ?",[id])
		query_db("DELETE FROM comments WHERE ArticleID = ?",[id])
		get_db().commit()
		return "article with id #%s deleted :(" % (id)
	if req == 'posts' and request.method == 'POST':
		na = request.form['numthere'] #number of articles already there
		n = request.form['numnew'] #number of articles to request
		args = request.form['args'].split(',')
		#get main info
		if args[0] == 'None':
			results = postmaker(query_db("SELECT ID, Title, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles ORDER BY ID DESC LIMIT ?,?",[na,n]))
		elif args[0] == 'Category':
			results = postmaker(query_db("SELECT ID, Title, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles WHERE Category = ? ORDER BY ID DESC LIMIT ?,?",[args[1],na,n]))
		elif args[0] == 'Tags':
			results = postmaker(query_db("SELECT ID, Title, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles WHERE Tags = ? ORDER BY ID DESC LIMIT ?,?",[args[1],na,n]))
		
		if len(results) == 0:
			return "FAIL: NO RESULTS"
		
		#output everything
		return render_template('post.html', results=results)
	return abort(404)