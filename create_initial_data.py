from flask_security import SQLAlchemyUserDatastore
from extentions import db
from flask_security.utils import hash_password

def create_data(user_datastore : SQLAlchemyUserDatastore):

    print('##creating Data ######')

    #create roles
    user_datastore.find_or_create_role(name='admin', description = "Administrator")
    user_datastore.find_or_create_role(name='prof', description = "Professional")
    user_datastore.find_or_create_role(name='cust', description = "Customer")

    #create user data

    if not user_datastore.find_user(email ="admin@iitm.ac.in"):
        user_datastore.create_user(username="admin", email="admin@iitm.ac.in",password=hash_password('pass'), active= True,roles=["admin"])
    if not user_datastore.find_user(email ="prof@iitm.ac.in"):
        user_datastore.create_user(username="prof", email="prof@iitm.ac.in",password=hash_password('pass'),active= True, roles=["prof"])
    if not user_datastore.find_user(email ="cust@iitm.ac.in"):
        user_datastore.create_user(username="cust", email="cust@iitm.ac.in",password=hash_password('pass'), active= True, roles=["cust"])
    
    db.session.commit()