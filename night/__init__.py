import sqlite3, hashlib
from flask import Flask, render_template, redirect, abort, session, g, url_for, json, request, Markup, Blueprint, make_response, send_from_directory
from contextlib import closing
from datetime import datetime
import night.commentsorter
from simplekv.memory import DictStore
from flask.ext.kvsession import KVSessionExtension


app = Flask('night')
app.config.from_object('config')

#STORE SESSION INFO SERVERSIDE RATHER THAN IN CLIENTSIDE COOKIE.
store = DictStore()
KVSessionExtension(store,app)
#SO EASY, I LOVE KV!! WOW!

def connect_db():
	return sqlite3.connect(app.config['DATABASE'], timeout=10)
	
def init_db(): #only to be run by command prompt
	with closing(connect_db()) as db:
		with app.open_resource('schema.sql', mode='r') as f:
			db.cursor().executescript(f.read())
		db.commit()

def get_db():
	db = getattr(g, 'db', None)
	if db is None:
		db = g.db = connect_db()
	return db

def query_db(query, args=(), one=False):
	cursor = get_db().execute(query, args)
	rv = cursor.fetchall()
	cursor.close()
	return (rv[0] if rv else None) if one else rv
	
def cut(s, l): 
	return s if s <= l else s[0:l]

def get_category():
	return [dict(name=row[0], color=row[1], sname=''.join(e for e in row[0] if e.isalnum())) for row in query_db('SELECT Name, Color FROM category')]

#def dateobj(object): #need to make this function a bit more advanced
#	d = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
#	return d
		
class dateit(str):
	def __init__(self, date):
		d = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
		self.read = d.strftime('%b  %d, %Y')
		self.year = d.strftime('%Y')
		self.month = d.strftime('%b')
		self.monthnum = d.strftime('%m')

import night.views
import night.back

