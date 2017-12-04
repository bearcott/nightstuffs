import os

root = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(root,'night','tmp','database.db')

SECRET_KEY = "AEIOJvlsidjvLWEivjSIDuviNWEucjWExxxxPenisxxxxociuSDbkiWHEncilSUvnKLSDjvuWNE/xfc/xa9/xa8p/xb5&/xdfk_6/x81/x7fhL/xbca/x08/x03/x99'/xc8/xa9/x06/xfd" #lolololol

PICTURE_FOLDER = os.path.join(root,'night','static','pics','pictures')
AUTHOR_FOLDER = os.path.join(root,'night','static','pics','authors')
TOPIC_FOLDER = os.path.join(root,'night','static','pics','topics')
COVER_FOLDER = os.path.join(root,'night','static','pics','covers')

MAX_CONTENT_LENGTH = 3 * 1024 * 1024 #This sets limit on maximum file transfer to 3mb

DEBUG = True