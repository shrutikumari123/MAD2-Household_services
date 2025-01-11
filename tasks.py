from celery import shared_task
from models import User,ProfessionalProfile, CustomerProfile, ServiceRequest  # Assuming these models exist
from flask_excel import make_response_from_query_sets
import os
from extentions import db
from datetime import datetime
from datetime import timedelta, timezone  # Add timezone here
from jinja2 import Template
#from mail import send_message
from mail import send_email_reminder
#from mail_service import send_email
import time
#import app



# Task to create a CSV file of closed service requests
@shared_task(ignore_result=False)
def create_csv():
    #time.sleep(5)  # Simulating delay for batch processing

    # Fetch closed service requests
    closed_requests = ServiceRequest.query.with_entities(
        ServiceRequest.service_id,
        ServiceRequest.customer_id,
        ServiceRequest.professional_id,
        ServiceRequest.date_of_request,
        ServiceRequest.date_of_completion,
        ServiceRequest.remarks,
    ).filter(ServiceRequest.service_status == "closed").all()

    # Generate CSV content
    csv_out = make_response_from_query_sets(
        closed_requests,
        column_names=[
            "service_id",
            "customer_id",
            "professional_id",
            "date_of_request",
            "date_of_completion",
            "remarks",
        ],
        file_type="csv",
        file_name="file.csv",
    )
    with open('./user-downloads/file.csv', "wb") as file:
        file.write(csv_out.data)

    return 'file.csv'  # Return the path of the saved CSV file


    # Task for Daily Reminders
@shared_task(ignore_result=True)
def daily_task():
    print('daily task')
    users = ProfessionalProfile.query.all()

    for user in users:  # This block was incorrectly indented in your code
        pending_requests = ServiceRequest.query.filter(
            ServiceRequest.professional_id == user.id,
            ServiceRequest.service_status == "requested"
        ).all()

        if not pending_requests:
            continue

        pending_count = len(pending_requests)
        # Read and render the email template
        with open('daily_test.html', 'r') as f:
            template = Template(f.read())
        email_body = template.render(user=user.prof_name, count=pending_count)
        print('sending mail')
        user_email = user.user.email
        # Send the email
        send_email_reminder(
            to=user_email,
            subject="Daily Reminder: Pending Service Requests",
            content_body=email_body
        )

    return "Daily reminders sent successfully!"



@shared_task(ignore_result=True)
def monthly_report():
    users = db.session.query(CustomerProfile).all()
    now = datetime.now(timezone.utc)
    current_month_start = now.replace(day=1, hour=0, minute=0)
    next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
    current_month = now.strftime("%B")
    current_datetime = now.strftime("%Y-%m-%d %H:%M:%S")

    for user in users:
        # Fetch total services requested and closed by the customer
        services = db.session.query(ServiceRequest).filter(
            ServiceRequest.customer_id == user.id,
            ServiceRequest.date_of_request >= current_month_start,
            ServiceRequest.date_of_request < next_month_start
        ).all()

        total_requested = len(services)
        total_closed = sum(1 for s in services if s.service_status == "closed")
        service_details = [
            {
                "id": s.service_request_id,  # Correct field name from the model
                "ser_name": s.service.ser_name,  # Access through the `service` relationship
                "time_required": s.service.time_required  # Access through the `service` relationship
            }
            for s in services
        ]

        # Prepare data for the report
        report_data = {
            "email": user.user.email,  # Access the related User's email
            "customer_name": user.cust_name,
            "total_requested": total_requested,
            "total_closed": total_closed,
            "month": current_month,
            "timestamp": current_datetime,
            "service_details": service_details,
        }

        # Render the HTML report using a template
        with open('monthlyreport.html', 'r') as f:
            template = Template(f.read())
            report_html = template.render(report_data)

        # Send the report via email
        send_email_reminder(
            to=user.user.email,  # Access the related User's email
            subject=f"Your Activity Report for {current_month}",
            content_body=report_html  # Use the rendered HTML
        )

    return "Monthly reports sent successfully!"
