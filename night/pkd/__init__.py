from flask import Flask, Blueprint, session, render_template, url_for, current_app, send_from_directory, redirect, request, abort
from night import app, query_db, get_db, dateit, request, send_from_directory
import os, time, hashlib, datetime
from night.back import pics

#SET UP THIS BAD BOY
pkd = Blueprint('pkd', __name__, template_folder='templates', static_folder='static')
	
def get_user():
	return [dict(id=row[0], user=row[1], name=row[2], pic=row[3], desc=row[4]) for row in query_db('SELECT ID, Username, Name, Picture, Description FROM users WHERE Username=?',[session.get('user')])][0]
	
#BEGIN THE ROUTING

@pkd.route('/', methods=['GET','POST'])
def index():
	if not session.get('user'): return redirect(url_for('pkd.login'))

	#get main info
	results = [dict(id=row[0],title=row[1],ctitle=row[2], author=row[3], date=dateit(row[4]).read, category=row[5], tags=row[6].split(','), pic=row[7], picinfo=row[8], desc=row[9])
		for row in query_db('SELECT ID, Title, SafeTitle, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description FROM articles ORDER BY ID DESC')]
	
	#get num of comments for article
	for row in results:
		row['comments'] = query_db('SELECT COUNT(*) FROM comments WHERE ArticleID = ?',[row['id']])[0][0]
		row['author'] = query_db('SELECT Name FROM users WHERE ID = ?', [row['author']])[0][0] #clumsy way of selecting first row > array > name
	
	#output everything
	return render_template('admin/index.html', user=get_user(), results=results)

@pkd.route('/edit/', defaults={'article':None}, methods=['GET','POST'])
@pkd.route('/edit/<path:article>')
def edit(article=None):
	if not session.get('user'): return redirect(url_for('pkd.login'))
	
	if article == None: return redirect(url_for('pkd.index'))
	
	#get main article info
	results = [dict(id=row[0],title=row[1], author=row[2], date=dateit(row[3]).read, category=row[4], tags=row[5].split(','), pic=row[6], picinfo=row[7], desc=row[8], text=row[9])
		for row in query_db('SELECT ID, Title, AuthorID, Date, Category, Tags, CoverURL, CoverInfo, Description, Text FROM articles WHERE Title = ?',[article.replace('_',' ')])]
	
	#check if article exists
	if len(results) == 0 or len(results) > 1: return abort(404)
	
	#get comments & author for article
	for row in results:
		row['comment'] = query_db('SELECT COUNT(*) FROM comments WHERE ArticleID = ? ORDER BY ID DESC',[row['id']])[0][0]
		author = [dict(name=ro[0],pic=ro[1],desc=ro[2]) for ro in query_db('SELECT Name, Picture, Description FROM users WHERE ID = ?', [row['author']])]
		category = [dict(name=ro[0]) for ro in query_db('SELECT (Name) FROM category ORDER BY ID DESC')]
	
	#output everything
	return render_template('admin/editor.html', hidden=True, article=results[0], title=results[0]['title'], author=author[0], user=get_user(), category=category)

@pkd.route('/new')
def new():
	if not session.get('user'): return redirect(url_for('pkd.login'))
	
	date = datetime.datetime.now()
	
	category = [dict(name=ro[0]) for ro in query_db('SELECT (Name) FROM category ORDER BY ID DESC')]
	
	return render_template('admin/editor.html', user=get_user(), date=date.strftime('%b  %d, %Y'), category=category, new=True)
	
@pkd.route('/profile', methods=['GET','POST'])
def profile():
	if not session.get('user'): return redirect(url_for('pkd.login'))
	return render_template('admin/profile.html', user=get_user())

@pkd.route('/login', methods=['GET','POST'])
def login():
	
	error = False
	if request.method == 'POST':
		g = valid_login(request.form['user'],hashlib.sha1(request.form['pass']).hexdigest())
		if g:
			session['user'] = g[0]
			session['name'] = g[1]
			return redirect(url_for('pkd.index'))
		else:
			time.sleep(2)
			error = "Wrong username or password :3"
	return render_template('admin/login.html', error=error)

def valid_login(u,p):
	query = (dict(user=row[0],name=row[1],passw=row[2]) for row in query_db('SELECT Username, Name, Password FROM users'))
	for d in query:
		if d['user'].upper() == u.upper() and d['passw'] == p:
			return [d['user'],d['name']]
	return False
	
@pkd.route('/logout', methods=['GET','POST'])
def logout():
	session.pop('user',None)
	return redirect(url_for('pkd.login'))
