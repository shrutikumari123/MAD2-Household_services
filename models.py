from extentions import db,security
from flask_security import UserMixin, RoleMixin
from flask_security.models import fsqla_v3 as fsq
from datetime import datetime, timezone

fsq.FsModels.set_db_info(db)

class User(db.Model,UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, nullable=False, unique=True)
    password = db.Column(db.String, nullable=False)
    roles = db.relationship('Role', secondary='user_roles')
    #role = db.Column(db.String, nullable=False)  # 'admin', 'professional', 'customer'
    email = db.Column(db.String, unique=True, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    active = db.Column(db.Boolean(), default=True)
    # New field required by Flask-Security
    fs_uniquifier = db.Column(db.String(65), unique = True, nullable = False)
    
    # Relationships
    professional_profile = db.relationship('ProfessionalProfile', backref='user', uselist=False)
    customer_profile = db.relationship('CustomerProfile', backref='user', uselist=False)

class UserRoles(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(80), unique = True)
    description = db.Column(db.String(255))

class ProfessionalProfile(db.Model):
    __tablename__ = 'professional_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    prof_name=db.Column(db.String, nullable=False)
    service_type = db.Column(db.String, nullable=False)
    prof_address = db.Column(db.String)
    prof_postal_code = db.Column(db.String)
    experience = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    service_requests = db.relationship('ServiceRequest', backref='professional', lazy=True)

class CustomerProfile(db.Model):
    __tablename__ = 'customer_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cust_name=db.Column(db.String, nullable=False)
    cust_address = db.Column(db.String)
    cust_postal_code = db.Column(db.String)
    
    # Relationships
    service_requests = db.relationship('ServiceRequest', backref='customer', lazy=True)

class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    ser_name = db.Column(db.String, nullable=False)
    price = db.Column(db.Float, nullable=False)
    time_required = db.Column(db.String)  # Example: '2 hours'
    description = db.Column(db.Text)
    is_approved=db.Column(db.Boolean(), default=False)

class ServiceRequest(db.Model):
    service_request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer_profiles.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('professional_profiles.id'), nullable=True)  # Assigned later
    date_of_request = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    date_of_completion = db.Column(db.DateTime, nullable=True)
    service_status = db.Column(db.String, nullable=False, default='requested')  # requested/assigned/closed
    remarks = db.Column(db.Text)

    # Relationships
    service = db.relationship('Service', backref='service_requests')
    