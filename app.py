from flask import Flask,jsonify
import views
from extentions import db,security,cache
from create_initial_data import create_data
import resources
#from celery_worker import make_celery
from flask_caching import Cache
from worker import celery_init_app
#from tasks import create_csv
import flask_excel as excel 
from tasks import daily_task,monthly_report
from celery.schedules import crontab


def create_app():
    app=Flask(__name__)


    app.config['SECRET_KEY']="should_not_be-exposed"
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///data.db"
    app.config['SECURITY_PASSWORD_SALT']='salty-password'

    #configure token
    app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authentication-Token'
    app.config['SECURITY_TOKEN_MAX_AGE'] = 3600 #1hr 
    app.config['SECURITY_LOGIN_WITHOUT_CONFIRMATION'] = True


    #cache config
    
    app.config["CACHE_DEFAULT_TIMEOUT"]= 300
    app.config["DEBUG"]=True
    app.config["CACHE_TYPE"]="RedisCache"
    app.config["CACHE_REDIS_PORT"]=6379
    
    
    cache.init_app(app)
    db.init_app(app)
    
    #celery_app=celery_init_app(app)

    

    with app.app_context():
        from models import User, Role
        from flask_security import SQLAlchemyUserDatastore

        user_datastore =SQLAlchemyUserDatastore(db,User, Role)

        security.init_app(app,user_datastore)

        db.create_all()
        
        create_data(user_datastore)

    app.config['WTF_CSRF_CHECK_DEFAULT']=False
    app.config['SECURITY_CSRF_PROTECH_MECHANISHMS']=[]
    app.config['SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS']=True

    views.create_view(app, user_datastore, db,cache)

    # connect flask to flask_restful
    resources.api.init_app(app)


    return app

app=create_app()
celery_app = celery_init_app(app)
excel.init_excel(app)

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=14, minute=1),
         daily_task.s(),name='Daily task' ),

    sender.add_periodic_task(
        crontab(day_of_month=3, hour=14, minute=1),
        monthly_report.s(),
        name='Monthly Report')
  

if __name__=="__main__":
    
    app.run(debug=True)
