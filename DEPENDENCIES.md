# ByteRisto Dependencies Summary

## All services require:
- Flask==2.3.3 (Web framework)
- Flask-CORS==4.0.0 (Cross-Origin Resource Sharing)
- Flask-SQLAlchemy==3.0.5 (Database ORM - for services using databases)
- Flask-RESTful==0.3.10 (REST API framework)
- Flask-JWT-Extended==4.5.3 (JWT authentication)
- python-dotenv==1.0.0 (Environment variable management)
- marshmallow==3.20.1 (Object serialization/deserialization)
- gunicorn==21.2.0 (WSGI HTTP Server for production)

## Database-specific:
- psycopg2-binary==2.9.7 (PostgreSQL adapter - menu-inventory, order-management)

## Message Queue:
- pika==1.3.2 (RabbitMQ client - order-management)

## Caching:
- redis==4.6.0 (Redis client - menu-inventory)

## HTTP Client:
- requests==2.31.0 (HTTP library - order-management, api-gateway)

## Documentation:
- flask-swagger-ui==4.11.1 (Swagger UI - menu-inventory)

## Service-specific requirements status:
✅ menu-inventory: Complete
✅ order-management: Complete
✅ api-gateway: Complete
