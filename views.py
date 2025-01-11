from flask import render_template_string, render_template, Flask, request, jsonify,send_file
from flask_security import auth_required, current_user, roles_required, roles_accepted
from flask_security import SQLAlchemySessionUserDatastore
from flask_security.utils import hash_password,verify_password
from datetime import datetime, timezone
from models import User,ProfessionalProfile,CustomerProfile,Service,ServiceRequest
import json
from sqlalchemy import func
from jinja2 import Template
import time
from time import sleep
from datetime import datetime,timedelta,date
from celery import shared_task,Celery
from celery.result import AsyncResult
from celery.schedules import crontab
from httplib2 import Http
from flask_mail import Message , Mail
from datetime import datetime, timedelta
from flask_caching import Cache
from tasks import monthly_report 
#from tasks import create_csv 
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from tasks import daily_task
import os


def create_view(app, user_datastore : SQLAlchemySessionUserDatastore, db,cache):
    from tasks import create_csv

    #cache 
    @app.route('/cachedemo')
    @cache.cached(timeout=1)
    def cachedemo():
        return jsonify({"time": datetime.now()})


    # create csv with celery
    @app.route('/start-export', methods=["GET"])
    def start_export():
        task = create_csv.delay()
        return jsonify({'task_id' : task.id})


    @app.route('/get-csv/<task_id>')
    def get_csv(task_id):
        result = AsyncResult(task_id)

        if result.ready():
            return send_file('./user-downloads/file.csv')
        else:
            return "task not ready", 405

    


    #homepage

    @app.route('/')
    def home():
        return render_template('index.html')
    
    

    @app.route('/user-login', methods=['POST'])
    def user_login():

        data=request.get_json()
        email=data.get('email')
        password=data.get('password')
        #role = data.get("role")

        if not email or not password:
            return jsonify({'message':'not valid email or password'}), 404      

        user=user_datastore.find_user(email=email)

        if not user:
            return jsonify({'message':'invalid user'}), 404
        
        if not user.active:
            print(f"Blocked login attempt for user: {email}")
            return jsonify({'message': 'Your account is blocked. Please contact support.'}), 403

        if verify_password(password,user.password):
            return jsonify({'token' : user.get_auth_token(), 'role' : user.roles[0].name, 'id':user.id , 'email':user.email}), 200
        else:
            return jsonify({'message':'wrong password'})
   

    
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        # If date_created is passed in the request, otherwise use the default value
        date_created_str = data.get('date_created')
        if date_created_str:
            try:
                date_created = datetime.fromisoformat(date_created_str)
            except ValueError:
                return jsonify({'message': 'Invalid date format'}), 400
        else:
            date_created = datetime.now(timezone.utc)
 
        if not email or not password or not role:
            return jsonify({'message' : 'invalid input'}), 403

        if user_datastore.find_user(email = email ):
            return jsonify({'message' : 'user already exists'}), 400
        
        if role == 'prof':
            user=user_datastore.create_user(username=username, email = email, password = hash_password(password), active = False, roles = [user_datastore.find_or_create_role('prof')], date_created=date_created)
            db.session.commit()
            #user = user_datastore.find_user(email=email)
            return jsonify({'message' : 'Professional succesfully created','redirect': 'professional-signup', 'user_id': user.id}), 201
        
        elif role == 'cust':
            try :
                user=user_datastore.create_user(username=username, email = email, password = hash_password(password), active = True, roles=['cust'], date_created=date_created)
                db.session.commit()
            except:
                print('error while creating')
            return jsonify({'message' : 'Customer successfully created', 'redirect': 'customer-signup', 'user_id': user.id})
        
        return jsonify({'message' : 'invalid role'}), 400


    @app.route('/professional-signup', methods=['POST'])
    def professional_signup():
        data = request.get_json()
        print(data)

        user_id = data.get('user_id')
        service_id=data.get('service_id')
        #ser_name=data.get('ser_name')
        service_type = data.get('service_type')
        prof_address = data.get('prof_address')
        prof_postal_code = data.get('prof_postal_code')
        experience = data.get('experience')
        description = data.get('description')

        if not user_id or not service_type or not experience:
            return jsonify({'message': 'Invalid input'}), 400

        user = user_datastore.find_user(id=user_id)

        if not user or 'prof' not in [role.name for role in user.roles]:
            return jsonify({'message': 'User not found or invalid role'}), 404

        try:
            # Assuming you have a ProfessionalProfile model to store the additional information
            prof_name = user.username
            professional_profile = ProfessionalProfile(
                user_id=user_id,service_id=service_id,prof_name=prof_name, service_type=service_type,prof_address=prof_address,prof_postal_code=prof_postal_code, experience=experience, description=description
            )
            db.session.add(professional_profile)
            db.session.commit()

            return jsonify({'message': 'Professional profile created successfully'}), 201
        except Exception as e:
            print(f"Error: {e}")
            db.session.rollback()
            return jsonify({'message': f'Error creating professional profile: {str(e)}'}), 500


    @app.route('/get-service-id', methods=['POST'])
    def get_service_id():
        data = request.get_json()
        ser_name = data.get('ser_name')

        service = Service.query.filter_by(ser_name=ser_name).first()
        if service:
            return jsonify({'id': service.id}), 200
        return jsonify({'error': 'Service not found'}), 404
    

    @app.route('/get-services', methods=['GET'])
    def get_services():
        # Fetch all services
        services = Service.query.all()

        # Remove duplicates based on `ser_name` using a dictionary
        unique_services = {service.ser_name: {"id": service.id, "name": service.ser_name} for service in services}

        # Convert to a list of services
        service_list = list(unique_services.values())

        return jsonify(service_list)

  

    @app.route('/customer-signup', methods=['POST'])
    def customer_signup():
        data = request.get_json()
        print(data)

        user_id = data.get('user_id')
        cust_address = data.get('cust_address')
        cust_postal_code = data.get('cust_postal_code')

        if not user_id or not cust_address or not cust_postal_code:
            return jsonify({'message': 'Invalid input'}), 400

        user = user_datastore.find_user(id=user_id)

        if not user or 'cust' not in [role.name for role in user.roles]:
            return jsonify({'message': 'User not found or invalid role'}), 404

        try:
            # Assuming you have a CustomerProfile model to store the additional information
            cust_name = user.username
            customer_profile = CustomerProfile(
                user_id=user_id,cust_name=cust_name, cust_address=cust_address, cust_postal_code=cust_postal_code
            )
            db.session.add(customer_profile)
            db.session.commit()

            return jsonify({'message': 'Customer profile created successfully'}), 201
        except Exception as e:
            print(f"Error: {e}")
            db.session.rollback()
            return jsonify({'message': f'Error creating customer profile: {str(e)}'}), 500



    @roles_accepted('admin')
    @app.route('/activate-prof/<id>', methods=['GET'])
    def activate_prof(id):

        user=user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message':'user not present'}), 400
        #check if prof already activated
        if(user.active==True):
            return jsonify({'message':'user already active'}), 400
        
        user.active=True
        db.session.commit()
        return jsonify({'message':'user is activated'}),200


    
    #activate study resource
    @app.route('/verify-resource/<id>')
    @roles_required('admin')
    def activate_resource(id):
        resource=Service.query.get(id)
        if not resource:
            return jsonify({'message':'invalid id'}),400
        resource.is_approved=True
        db.session.commit()
        return jsonify({'message':'resource is now approved'}), 200
    
    @roles_accepted('admin')
    @app.route('/professionals', methods=['GET'])
    def get_professionals():
        # Query for all users
        all_users = user_datastore.user_model().query.all()
        
        # Filter to get only users with the 'prof' role
        professionals = [
            user for user in all_users 
            if any(role.name == 'prof' for role in user.roles)
        ]
        
        # Prepare the response data with active/inactive status
        results = [
            {
                'id': user.id,
                'email': user.email,
                'is_active': user.active,
            }
            for user in professionals
        ]
        
        return jsonify(results), 200

    


    @roles_required('admin')
    @app.route('/block-prof/<id>', methods=['POST'])
    def block_prof(id):
        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        if not user.active:
            return jsonify({'message': 'User is already inactive'}), 400

        user.active = False
        db.session.commit()
        return jsonify({'message': 'User has been blocked'}), 200


    @roles_required('admin')
    @app.route('/api/customers', methods=['GET'])
    def get_customers():
        all_users = user_datastore.user_model().query.all()
        customers = [
            user for user in all_users 
            if any(role.name == 'cust' for role in user.roles)
        ]

        return jsonify([{
            'id': customer.id,
            'email': customer.email,
            'is_active': customer.active
        } for customer in customers])

    

    @roles_required('admin')
    @app.route('/api/block-customer/<int:id>', methods=['POST'])
    def block_customer(id):
        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        if not user.roles or 'cust' not in [role.name for role in user.roles]:
            return jsonify({'message': 'User is not a customer'}), 400

        if not user.active:
            return jsonify({'message': 'User is already blocked'}), 400

        user.active = False  # Set active to False to block the customer
        db.session.commit()

        return jsonify({'message': 'Customer blocked successfully!'}), 200

        
    @roles_required('admin')
    @app.route('/api/activate-customer/<int:id>', methods=['POST'])
    def activate_customer(id):
        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if not user.roles or 'cust' not in [role.name for role in user.roles]:
            return jsonify({'message': 'User is not a customer'}), 400


        if user.active:
            return jsonify({'message': 'User is already active'}), 400

        user.active = True  # Set active to True to activate the customer
        db.session.commit()

        return jsonify({'message': 'Customer activated successfully!'}), 200

    



#API PART
    

    @app.route("/api/edit_service/<id>",methods=(["PUT"]))
    @roles_accepted('admin')
    def api_edit_service(id):
        service = Service.query.filter_by(id=id).first()
        if not service:
            return jsonify({'message':'invalid id'}),404
        service.ser_name = request.json["ser_name"]
        service.price = request.json["price"]
        service.time_required = request.json["time_required"]
        service.description = request.json["description"]
        db.session.add(service)
        db.session.commit()
        ser = Service.query.filter_by(id=id).first()
        return jsonify({"id":ser.id,"name":ser.ser_name,"price":ser.price,"time_required":ser.time_required,"description":ser.description})



    @app.route("/api/delete_service/<id>",methods=(["DELETE"]))
    @roles_accepted('admin')
    def api_delete_service(id):
        service = Service.query.filter_by(id=id).first()
        if not service:
            return jsonify({'message':'invalid id'}),404
        
        db.session.delete(service)
        db.session.commit()
        return jsonify({"message":'Service (along with their alloted shows if any) got deleted successfully.'})
        

    @app.route('/api/book', methods=['POST'])
    @auth_required('token')
    def book_service():
        data = request.get_json()
        # Add debug logs
        print("Received data:", data)
        user_id = data.get('user_id')
        service_id = data.get('service_id')
        professional_id = data.get('professional_id')  # Retrieve professional_id

        print("user_id:", user_id)
        print("service_id:", service_id)
        print("professional_id:", professional_id)

        if not user_id or not service_id:
            return jsonify({'message': 'Missing user_id or service_id'}), 400

        # Find the customer profile associated with the user
        customer_profile = CustomerProfile.query.filter_by(user_id=user_id).first()
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        # Find the service to be booked
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'message': 'Service not found'}), 404
            
        # Create a new service request
        service_request = ServiceRequest(
            service_id=service.id,
            customer_id=customer_profile.id,
            professional_id=professional_id,  
            service_status='requested'
        )
        db.session.add(service_request)
        db.session.commit()

        return jsonify({'message': 'Service booked successfully'}), 201
    

    @app.route('/api/service-history', methods=['GET'])
    @auth_required('token')
    def get_service_history():
        # Assume user ID is available from the token
        user_id = current_user.id
        customer_profile = CustomerProfile.query.filter_by(user_id=user_id).first()

        if not customer_profile:
            return jsonify([])

        # Fetch service history for the customer and include professional data
        service_requests = db.session.query(ServiceRequest, ProfessionalProfile).\
            outerjoin(ProfessionalProfile, ServiceRequest.professional_id == ProfessionalProfile.id).\
            filter(ServiceRequest.customer_id == customer_profile.id).all()

        history = []
        for req, professional in service_requests:
            history.append({
                'service_request_id': req.service_request_id,
                'service_type': req.service.ser_name,  # Get service name
                'prof_name': professional.prof_name if req.professional else 'Not Assigned',  # Get professional name
                'status': req.service_status,
                #"professional_id": req.professional_id
            })

        return jsonify(history)
    
    @app.route('/api/service-review/<int:service_request_id>', methods=['POST'])
    @auth_required('token')
    def post_service_review(service_request_id):
        data = request.get_json()
        remarks = data.get('remarks', None)
        action = data.get('action', None)  # New field to determine if the request should be closed

        service_request = ServiceRequest.query.get(service_request_id)
        if action == 'close':
        # Allow customers to close the request if it is in the "accepted" state
            if service_request.service_status == 'accepted':
                service_request.service_status = 'closed'
                service_request.date_of_completion = datetime.utcnow()
                db.session.commit()
                return jsonify({
                    'message': 'Service request closed successfully',
                    'date_of_completion': service_request.date_of_completion.isoformat()}), 200
            return jsonify({'message': 'Service request cannot be closed in its current state'}), 400

        if remarks and service_request.service_status == 'closed':
        # Allow customers to submit a review only for closed requests
            service_request.remarks = remarks
            db.session.commit()
            return jsonify({'message': 'Review submitted successfully'}), 201

        return jsonify({'message': 'Unable to process request'}), 400



    @app.route('/api/professional_profile/<int:professional_id>', methods=['GET'])
    def get_professional_profile(professional_id):
        # Query the ProfessionalProfile based on professional_id
        professional = ProfessionalProfile.query.filter_by(id=professional_id).first()
        
        if not professional:
            return jsonify({'message': 'Professional not found'}), 404
        
        # Return the professional's details as JSON
        return jsonify({
            'id': professional.id,
            'name': professional.prof_name,
            'service_type': professional.service_type,
            'experience': professional.experience,
            'description': professional.description
        }), 200
    

    @app.route('/api/professional_profiles_by_service/<string:ser_name>', methods=['GET'])
    def get_professionals_by_service(ser_name):
        # Find the service by its name
        service = Service.query.filter_by(ser_name=ser_name).first()
        
        if not service:
            return jsonify({'message': 'Service not found'}), 404
        
        # Get the service_id from the found service
        service_id = service.id
        
        # Now query professionals using the service_id
        professionals = ProfessionalProfile.query.filter_by(service_id=service_id).all()
        
        if not professionals:
            return jsonify({'message': 'No professionals found for this service'}), 404
        
        # Filter unique professionals based on their ser_name
        #unique_professionals = {prof.prof_name: prof for prof in professionals}.values()

        return jsonify([{
            'id': prof.id,
            'name': prof.prof_name,
            'service_type': prof.service_type,
            'experience': prof.experience,
            'description': prof.description,
        } for prof in professionals]), 200
    
        
    

    @app.route('/api/booked-requests/<int:professional_id>', methods=['GET'])
    @auth_required('token')
    def get_booked_requests(professional_id):
        print(f"Fetching requests for professional ID: {professional_id}")
        professional = ProfessionalProfile.query.filter_by(user_id=professional_id).first()
        if not professional:
            return jsonify({'error': 'Professional not found'}), 404
        
        # Fetching the service requests and customer profile
        requests = db.session.query(ServiceRequest, CustomerProfile).join(
            CustomerProfile, ServiceRequest.customer_id == CustomerProfile.id
        ).filter(ServiceRequest.professional_id == professional.id).all()
        
        # Log what is being returned
        print(f"Requests found: {requests}")
        
        if not requests:
            print(f"No booked requests found for professional ID: {professional_id}")
        
        # Format the response
        response = [{
            'service_request_id': request.ServiceRequest.service_request_id,
            'customer_name': request.CustomerProfile.cust_name,
            'address': request.CustomerProfile.cust_address,  # Make sure CustomerProfile has these fields
            'postal_code': request.CustomerProfile.cust_postal_code,
            'status': request.ServiceRequest.service_status,
            'booking_time': request.ServiceRequest.date_of_request
        } for request in requests]

        print("Formatted Response:", response)  # Log the response being sent
        return jsonify(response)

        
    
    @app.route('/api/update-service-status', methods=['POST'])
    @auth_required('token')
    def update_service_status():
        data = request.get_json()
        service_request_id = data.get('service_request_id')  # Use `service_request_id` from the request
        new_status = data.get('status')  # Use `status` from the request

        # Validate presence of required parameters
        if not service_request_id or not new_status:
            print("Missing parameters:", data)
            return jsonify({'message': 'Missing service_request_id or status'}), 400

        try:
            # Fetch the service request by ID
            service_request = ServiceRequest.query.get(service_request_id)
            if not service_request:
                return jsonify({'message': 'Service request not found'}), 404

            # Validate status transitions
            valid_transitions = {
                'requested': ['accepted', 'rejected'],
                'accepted': ['closed'],
            }

            # Check if the transition is valid
            current_status = service_request.service_status
            if new_status not in valid_transitions.get(current_status, []):
                return jsonify({'message': 'Invalid status update.'}), 400

            # Update the status
            service_request.service_status = new_status
            if new_status == 'closed':
                service_request.date_of_completion = datetime.utcnow()
                service_request.remarks = data.get('remarks')  # Optional remarks

            # Commit changes to the database
            db.session.commit()

            return jsonify({'message': f'Service status updated to {new_status}'}), 200

        except Exception as e:
            db.session.rollback()
            print("Error:", str(e))
            return jsonify({'message': 'Failed to update service status'}), 500

            
    
    @app.route('/api/search_services', methods=['GET'])
    def search_services():
        search_by = request.args.get('search_by')
        search_text = request.args.get('search_text')

        if not search_text:
            return jsonify([])

        query = db.session.query(Service, ProfessionalProfile).join(ProfessionalProfile, Service.id == ProfessionalProfile.service_id)

        if search_by == "service_name":
            results = query.filter(Service.ser_name.ilike(f"%{search_text}%")).all()
        elif search_by == "pin_code":
            results = query.filter(ProfessionalProfile.prof_postal_code.ilike(f"%{search_text}%")).all()
        elif search_by == "address":
            results = query.filter(ProfessionalProfile.prof_address.ilike(f"%{search_text}%")).all()
        else:
            results = []

        services = [
            {
                'service_name': service.ser_name,
                'price': service.price,
                'description': service.description,
                'professional_name': professional.prof_name,
                'service_type': professional.service_type,
                'prof_address' : professional.prof_address,
                'prof_postal_code' : professional.prof_postal_code,
                'experience': professional.experience,
            }
            for service, professional in results
        ]
        print("Response data:", services)
        return jsonify(services)



    @app.route('/api/search-professionals', methods=['GET'])
    def search_professionals():
        """
        Search professionals based on block/unblock status and remarks.
        """
        query = request.args.get('query', '').lower()  # Search query for prof_name or email
        status_filter = request.args.get('status', '').lower()  # Status filter: blocked, unblocked
        remarks_filter = request.args.get('remarks', '').lower()  # Remarks filter for service requests

        # Base query to join User, ProfessionalProfile, and ServiceRequest
        professionals_query = db.session.query(
            ProfessionalProfile.id.label("id"),
            ProfessionalProfile.prof_name.label("name"),
            User.email.label("email"),
            User.active.label("status"),
            ServiceRequest.remarks.label("remarks")
        ).join(User, ProfessionalProfile.user_id == User.id)\
        .outerjoin(ServiceRequest, ProfessionalProfile.id == ServiceRequest.professional_id)

        # Apply search query
        if query:
            professionals_query = professionals_query.filter(
                or_(
                    ProfessionalProfile.prof_name.ilike(f'%{query}%'),
                    User.email.ilike(f'%{query}%')
                )
            )

        # Apply block/unblock status filter
        if status_filter == "blocked":
            professionals_query = professionals_query.filter(User.active == False)
        elif status_filter == "unblocked":
            professionals_query = professionals_query.filter(User.active == True)

        # Apply remarks filter
        if remarks_filter:
            professionals_query = professionals_query.filter(
                ServiceRequest.remarks.ilike(f'%{remarks_filter}%')
            )

        # Fetch results
        professionals = professionals_query.all()

        # Serialize response
        result = [
            {
                'id': prof.id,
                'name': prof.name,
                'email': prof.email,
                'status': "Blocked" if not prof.status else "Unblocked",
                'remarks': prof.remarks or "No remarks"
            }
            for prof in professionals
        ]

        return jsonify(result), 200


