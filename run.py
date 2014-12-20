
from night import app as application
from night.pkd import pkd
application.register_blueprint(pkd, url_prefix='/PKD', root_path='pkd')

if __name__ == '__main__':
    application.run(debug=True)

