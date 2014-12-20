import sqlite3
from night import app
from contextlib import closing
def connect_db():
	return sqlite3.connect(app.config['DATABASE'], timeout=10)

def init_db(): #only to be run by command prompt
	with closing(connect_db()) as db:
		with app.open_resource('schema.sql', mode='r') as f:
			db.cursor().executescript(f.read())
		db.commit()
		
init_db()