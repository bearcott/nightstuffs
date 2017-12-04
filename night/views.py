from night import app, cut, dateit, query_db, get_db, render_template, abort, redirect, commentsorter, url_for, get_category, request, datetime
from werkzeug import secure_filename
import hashlib, os
from collections import defaultdict
from operator import itemgetter
from pprint import pprint
from urlparse import urljoin
from werkzeug.contrib.atom import AtomFeed

numarticles = [5,2] #  [ # of articles, # to post]   CAREFUL, THIS PROPAGATES THROUGH EACH PAGE
def postmaker(query):
	#get main info
	results = [dict(id=row[0],title=row[1],ctitle=row[2], author=row[3], date=dateit(row[4]).read, category=row[5], tags=row[6].split(','), pic=row[7], picinfo=row[8], desc=row[9])
		for row in query]
	
	#get num of comments for article and misc
	for row in results:
		row['comments'] = query_db('SELECT COUNT(*) FROM comments WHERE ArticleID = ?',[row['id']])[0][0]
		row['author'] = [dict(name=ro[0], pic=ro[1]) for ro in query_db('SELECT Name, Picture FROM users WHERE ID = ?', [row['author']])][0] #clumsy way of selecting first row > array > name
		row['scategory'] = ''.join(e for e in row['category'] if e.isalnum())
		row['color'] = query_db('SELECT Color FROM category WHERE Name = ?',[row['category']])
	
	return results

def taggin(query):
	l = []
	for tag in query:
		for t in tag[0].split(','):
			l.append(t)
	f = []
	for e in list(set(l)):
		d = int(round((6 - l.count(e)/2.5),0))
		c = (d) if (d > 0) else 1
		f.append(dict(name=e, count=c))
	return f
	
def make_external(url):
    return urljoin(request.url_root, url)

	
def get_atom(query, text=''):
	feed = AtomFeed(''.join(['NightStuffs ',text]), feed_url=request.url, url=request.url_root)
	articles = [dict(id=row[0],title=row[1], ctitle=row[2], author=row[3], date=row[4], category=row[5], tags=row[6].split(','), content=row[7], cover=row[8],info=row[9])
		for row in query]
	for article in articles:
		article['author'] = query_db('SELECT Name FROM users WHERE ID = ?',[article['author']])[0][0]
		image = "<img src=\"%s\" title=\"%s\" alt=\"%s\">" % (urljoin(request.url_root,url_for('pics',set='covers',pic=article['cover'])),article['info'],article['info'])
		feed.add(article['title'], unicode(image + article['content']),
			content_type='html',
			author=article['author'],
			url=make_external(url_for('article', article=article['ctitle'], category=article['category'])),
			updated=datetime.strptime(article['date'], '%Y-%m-%d %H:%M:%S'),
			published=datetime.strptime(article['date'], '%Y-%m-%d %H:%M:%S'))
	return feed.get_response()	

@app.route('/')
def index():
	g = postmaker(query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles ORDER BY ID DESC LIMIT ?',[numarticles[0]]))
	tags = taggin(query_db('SELECT Tags FROM articles'));
	amount = True if len(g) == 0 else False
	
	#output everything
	return render_template('index.html', results=g, amount=amount, categories=get_category(), na=numarticles, args=None, tags=tags)
	
@app.route('/<category>')
def category(category=None):
	results = [dict(name=row[0],desc=row[1],color=row[2],pic=row[3]) for row in query_db('SELECT Name, Description, Color, Picture FROM category where Name = ?', [category])]
	
	articles = postmaker(query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles WHERE Category = ? ORDER BY ID DESC LIMIT ?', [category, numarticles[0]]))
	tags = taggin(query_db('SELECT Tags FROM articles WHERE Category = ?',[category]));
	
	amount = True if len(articles) == 0 else False
	
	if len(results) == 0 or len(results) > 1: return abort(404)
	
	return render_template('category.html',categories=get_category(), category=results[0], article=articles, amount=amount, na=numarticles,tags=tags, args=','.join(['Category',results[0]['name']]))	

@app.route('/tags/<path:tag>')
def tags(tag=None):
	results = postmaker(query_db('SELECT ID, Title, SafeTitle,AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles WHERE Tags LIKE ? ORDER BY ID DESC LIMIT ?', ['%'+tag+'%', numarticles[0]]))
	if len(results) == 0: return abort(404)
	articles = [result for result in results if str(tag) in result['tags']]
	
	amount = True if len(articles) == 0 else False
	
	return render_template('tag.html',categories=get_category(), tag=tag, article=articles, amount=amount, na=numarticles, args=','.join(['Tags',tag]))	

	
@app.route('/archives')
def archives():
	g = [dict(id=row[0], name=row[1], cname=row[2], authorid=row[3], date=dateit(row[4]).read, year=dateit(row[4]).year, month=dateit(row[4]).month, monthnum=dateit(row[4]).monthnum, category=row[5], scategory=''.join(e for e in row[4] if e.isalnum())) for row in query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category FROM articles')]
	
	#----sort by date----#
	a = defaultdict(list)
	
	#sort by year > monthnum > id, and newest on top
	
	for d in sorted(g, key=itemgetter('year','monthnum','id'), reverse=True):
		#add to defaultdict with the key(year) => dictionary of results
		a[d['year']].append(d)

	#final default dict to be outputted
	q = defaultdict(list)
	#for each year in a (list of tuples) version of the default dict above
	for v in a.items():
		#new defaultdict for each month
		s = defaultdict(list)
		#for each dict in the year
		for e in v[1]:
			#create new default dict key(month) => dictionary of results (this is inside each year's dict!)
			s[e['month']].append(e)
		#add the results to the new defaultdict
		q[v[0]].append(s)
	#FIN~
	
	return render_template('archives.html', categories=get_category(), archives=q)

@app.route('/<category>/', defaults={'article':None})
@app.route('/<category>/<path:article>')
def article(category=None, article=None):
	if article == None: return redirect(url_for('category', category=category))
	
	#get main article info
	results = [dict(id=row[0],title=row[1], ctitle=row[2], author=row[3], date=dateit(row[4]).read, category=row[5], tags=row[6].split(','), pic=row[7], picinfo=row[8], desc=row[9], content=row[10])
		for row in query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Content FROM articles WHERE SafeTitle = ?',[article])]
	
	#check if article exists
	if len(results) == 0 or len(results) > 1: return abort(404)
	
	#get comments for article THIS BETTER BE 1 ROW!
	for row in results:
		comments = [dict(id=ro[0], name=ro[1], date=dateit(ro[2]).read, email=hashlib.md5(ro[3]).hexdigest(), parent=ro[4], level=ro[5], comment=ro[6]) for ro in query_db('SELECT ID, Name, Date, Email, Parent, Level, Comment FROM comments WHERE ArticleID = ? ORDER BY ID DESC', [row['id']])]
		row['comment'] = query_db('SELECT COUNT(*) FROM comments WHERE ArticleID = ? ORDER BY ID DESC',[row['id']])[0][0]
		author = [dict(name=ro[0],pic=ro[1],desc=ro[2]) for ro in query_db('SELECT Name, Picture, Description FROM users WHERE ID = ?', [row['author']])]
		row['scategory'] = ''.join(e for e in row['category'] if e.isalnum())
		row['color'] = query_db('SELECT Color FROM category WHERE Name = ?',[row['category']])[0][0]
		#related articles
		re = [dict(name=ro[0],pic=ro[1],tags=ro[2], cname=ro[0].replace(' ','_'), category=ro[3]) for ro in query_db('SELECT Title, CoverURL, Tags, Category FROM articles WHERE Category = ?', [row['category']])]
		related = []
		others = None
		g = [i.upper() for i in row['tags']]
		for r in re:
			cnt = 0
			for x in r['tags'].split(','):
				if x.upper() in g and r['name'] != row['title']:
					cnt+=1
			if cnt >= 1: #if at least 1 tag matched (set up like this so it can be adjusted later)
				related.append(r)
		if len(related) == 0:
			related = None
			others = [dict(name=ro[0],pic=ro[1],tags=ro[2], cname=ro[0].replace(' ','_'), category=ro[3]) for ro in query_db('SELECT Title, CoverURL, Tags, Category FROM articles WHERE Title != ? AND Category = ?', [row['title'],row['category']])]
			if len(others) == 0:
				others = None
	#sorting comments
	comments = commentsorter.popcomments(comments)
	
	#output everything
	return render_template('article.html', categories=get_category(), article=results[0], title=results[0]['title'], author=author[0], related=related, others=others, comments=comments)


#ATOM POSTS
@app.route('/rss/recent.atom')
def feed():
	return get_atom(query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category, Tags, Content, CoverURL, CoverInfo FROM articles ORDER BY ID DESC LIMIT 15'))
@app.route('/rss/<category>/recent.atom')
def categoryfeed(category=None):
	return get_atom(query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category, Tags, Content, CoverURL, CoverInfo FROM articles WHERE Category = ? ORDER BY ID DESC LIMIT 15',[category]),category)

	
@app.route('/about')
def about():
	#get authors
	authors = (dict(name=row[0],pic=row[1],desc=row[2]) for row in query_db('SELECT Name, Picture, Description FROM users'))
	return render_template('about.html', categories=get_category(), authors=authors)

@app.route('/projects')
def projects():
	return render_template('projects.html', categories=get_category())

@app.route('/contact')
def contact():
	return render_template('contact.html', categories=get_category())
	
@app.route('/privacy')
def privacy():
	return render_template('privacy.html', categories=get_category())

@app.route('/policy')
def policy():
	return render_template('policy.html', categories=get_category())
	
@app.errorhandler(404)
def fof(e):
    return render_template('404.html'), 404