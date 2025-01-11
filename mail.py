from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from jinja2 import Template

SMTP_SERVER = "localhost"
SMTP_PORT = 1025
SENDER_EMAIL = "admin@study"
SENDER_PASSWORD = ''

def send_email_reminder(to, subject, content_body):
    try:
        msg = MIMEMultipart()
        msg["To"] = to
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg.attach(MIMEText(content_body, 'html'))


        with smtplib.SMTP(host=SMTP_SERVER, port=SMTP_PORT) as client:
            client.send_message(msg=msg)
        print(f"Email sent successfully to {to}")
    except Exception as e:
        print(f"Failed to send email to {to}: {str(e)}")
        
#send_email_reminder('aditya@iitm.ac.in', 'Subject Here', '<h1> test 01 </h1>')