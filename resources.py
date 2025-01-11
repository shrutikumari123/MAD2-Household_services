import time
from flask_restful import Resource, Api, fields, reqparse, marshal_with
from flask_security import auth_required, roles_required
from extentions import db, cache
from models import ProfessionalProfile
from models import Service

api = Api(prefix='/api')

parser = reqparse.RequestParser() # convert data to dict


parser.add_argument('ser_name', type=str)
parser.add_argument('price', type=float)
parser.add_argument('time_required', type=str)
parser.add_argument('description', type=str)

service_fields  = {
    'id' : fields.Integer,
    'ser_name' : fields.String,
    'price': fields.Float,
    'time_required' : fields.String,
    'description' : fields.String,
    'professional_id': fields.Integer 
}

class ServiceFields(Resource):
    @auth_required('token')
    @cache.cached(timeout=5)
    @marshal_with(service_fields)
    def get(self):
        #time.sleep(3) # artificial slow processing
        # Fetch services with an outer join on ProfessionalProfile
        all_resources = db.session.query(Service, ProfessionalProfile).outerjoin(
            ProfessionalProfile
        ).all()

        filtered_resources = []
        seen_services = set()  # To track unique `ser_name`

        # Loop through the query results and add professional_id to services
        for service, professional in all_resources:
            if service.is_approved and service.ser_name not in seen_services:
                seen_services.add(service.ser_name)
                if professional:
                    service.professional_id = professional.id
                else:
                    service.professional_id = None
                filtered_resources.append(service)

        return filtered_resources
    
    
    
    @auth_required('token')
    def post(self):
        args = parser.parse_args()
        service_resources = Service(ser_name=args.ser_name, price=args.price, time_required=args.time_required,description=args.description )
        db.session.add(service_resources)
        db.session.commit()
        return {'message' : 'fields created'}, 200


class UnapprovedServiceFields(Resource):
    @auth_required('token')
    #@roles_required('inst')
    @cache.cached(timeout=5)
    @marshal_with(service_fields)
    def get(self):
        unapproved_resources = Service.query.filter_by(is_approved=False).all()
        return unapproved_resources
        

api.add_resource(ServiceFields, '/resources')
api.add_resource(UnapprovedServiceFields, '/resources/unapproved')