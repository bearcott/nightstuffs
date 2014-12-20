import sys
sys.path.insert(0, '/home/nightstuffs/')

activate_this = '/home/nightstuffs/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

from night import app as application
from night.pkd import pkd
application.register_blueprint(pkd, url_prefix='/PKD', root_path='pkd')
