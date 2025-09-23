# ByteRisto - Restaurant Management System

ByteRisto is an internal Restaurant Management System offering an all-in-one solution for menu, inventory, ordering, billing, and analytics. Built with **Python Flask microservices**, Docker containerization, REST APIs, and message queues, with each service independently deployed. It supports staff from waiters to managers with role-based access control.

## 🏗️ Architecture

ByteRisto follows a microservices architecture with the following key components:

### Core Services
- **Menu & Inventory Service** (Port 3001) - Manages menu items and inventory tracking
- **Order Management Service** (Port 3002) - Handles order processing and workflow
- **Billing & Payments Service** (Port 3003) - Manages billing and payment processing
- **Analytics & Reporting Service** (Port 3004) - Provides business insights and reports

### Infrastructure
- **API Gateway** (Port 3000) - Unified entry point for all services
- **RabbitMQ** (Port 5672/15672) - Message queue for inter-service communication
- **PostgreSQL** (Multiple instances) - Database per service pattern
- **Redis** (Port 6379) - Caching and analytics data storage

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Git

### Running with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/pennyw1ze/-LabAP.git
   cd -LabAP
   ```

2. **Setup environment (creates .env file)**
   ```bash
   ./install_dependencies.sh
   ```

3. **Deploy services**
   ```bash
   ./deploy.sh
   ```

4. **Or run full deployment with testing**
   ```bash
   ./docker_test.sh
   ```

5. **Or manually start services**
   ```bash
   docker-compose up --build -d
   ```

6. **Test APIs**
   ```bash
   ./test_apis.sh
   ```

### Service URLs

| Service | URL | Documentation |
|---------|-----|---------------|
| API Gateway | http://localhost:3000 | http://localhost:3000/api-docs |
| Menu & Inventory | http://localhost:3001 | http://localhost:3001/api-docs |
| Order Management | http://localhost:3002 | http://localhost:3002/api-docs |
| Billing & Payments | http://localhost:3003 | http://localhost:3003/health |
| Analytics & Reporting | http://localhost:3004 | http://localhost:3004/health |
| RabbitMQ Management | http://localhost:15672 | admin/password |

## 📋 Features

### Menu & Inventory Management
- ✅ CRUD operations for menu items
- ✅ Inventory tracking with stock levels
- ✅ Low stock alerts
- ✅ Category-based organization
- ✅ Nutritional information tracking
- ✅ Allergen management

### Order Management
- ✅ Order creation and tracking
- ✅ Order status workflow (pending → confirmed → preparing → ready → served)
- ✅ Table-based order management
- ✅ Waiter assignment
- ✅ Real-time order updates via message queues
- ✅ Order cancellation with reasons

### Billing & Payments
- 🚧 Invoice generation
- 🚧 Payment processing
- 🚧 Receipt management
- 🚧 Tax calculations

### Analytics & Reporting
- 🚧 Sales analytics
- 🚧 Popular items tracking
- 🚧 Performance metrics
- 🚧 Revenue reports

### Infrastructure Features
- ✅ Microservices architecture
- ✅ Docker containerization
- ✅ API Gateway with request routing
- ✅ Message queue communication (RabbitMQ)
- ✅ Health checks and monitoring
- ✅ Swagger API documentation
- ✅ Database per service pattern

## 🛠️ Development

### Local Development Setup

1. **Install dependencies for each service**
   ```bash
   ./install_dependencies.sh
   ```

2. **Or manually setup Python virtual environments**
   ```bash
   cd services/menu-inventory && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   cd ../order-management && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   cd ../billing-payments && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   cd ../analytics-reporting && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   cd ../api-gateway && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d rabbitmq postgres-menu postgres-orders postgres-billing redis
   ```

4. **Run services in development mode**
   ```bash
   # Terminal 1 - Menu & Inventory
   cd services/menu-inventory && source venv/bin/activate && python src/app.py
   
   # Terminal 2 - Order Management
   cd services/order-management && source venv/bin/activate && python src/app.py
   
   # Terminal 3 - API Gateway
   cd services/api-gateway && source venv/bin/activate && python src/app.py
   ```

### API Examples

#### Create a Menu Item
```bash
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato sauce, mozzarella, and basil",
    "price": 12.99,
    "category": "main",
    "preparationTime": 15,
    "allergens": ["gluten", "dairy"]
  }'
```

#### Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 5,
    "waiterId": "waiter-001",
    "waiterName": "John Doe",
    "customerName": "Alice Smith",
    "items": [
      {
        "menuItemId": "menu-item-uuid",
        "quantity": 2,
        "specialInstructions": "Extra cheese"
      }
    ]
  }'
```

## 🏢 Staff Roles & Access Control

ByteRisto supports different staff roles with appropriate access levels:

### Waiter
- View menu items
- Create and manage orders for their tables
- Update order status
- View customer information

### Kitchen Staff
- View pending orders
- Update order preparation status
- Access inventory information
- Mark orders as ready

### Manager
- Full access to all services
- View analytics and reports
- Manage menu items and pricing
- Manage inventory and suppliers
- Access billing information

### Administrator
- System administration
- User management
- Service configuration
- Database management

## 🔄 Message Queue Events

The system uses RabbitMQ for asynchronous communication between services:

### Order Events
- `order_created` - New order placed
- `order_updated` - Order status changed
- `order_cancelled` - Order cancelled

### Inventory Events
- `inventory_update` - Stock levels changed
- `low_stock_alert` - Stock below minimum threshold

### Billing Events
- `billing_request` - Invoice generation requested
- `payment_processed` - Payment completed

## 📊 Database Schema

### Menu & Inventory Service
- `menu_items` - Menu item information
- `inventory_items` - Inventory tracking
- `menu_item_inventory` - Many-to-many relationship

### Order Management Service
- `orders` - Order information
- `order_items` - Individual order items

### Billing & Payments Service
- `invoices` - Billing information
- `payments` - Payment transactions

## 🐳 Docker Configuration

Each service is containerized with optimized Python Docker images:

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Set Python path
ENV PYTHONPATH=/app/src

EXPOSE [PORT]
CMD ["python", "src/app.py"]
```

## 🔧 Configuration

Services are configured via environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_db
DB_USER=service_user
DB_PASSWORD=service_password

# Message Queue Configuration
RABBITMQ_URL=amqp://admin:password@localhost:5672

# Service URLs
MENU_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
```

## 🧪 Testing

Run comprehensive API tests:

```bash
# Test all services with Docker
./docker_test.sh

# Or test individual APIs
./test_apis.sh
```

Run tests for each service locally:

```bash
cd services/menu-inventory && source venv/bin/activate && python -m pytest
cd services/order-management && source venv/bin/activate && python -m pytest
```

## 📈 Monitoring & Health Checks

Each service provides health check endpoints:

- `GET /health` - Service health status
- `GET /status` - Detailed service information

The API Gateway provides a consolidated status endpoint:
- `GET /status` - All services status

## 🔒 Security Features

- Flask-CORS for cross-origin resource sharing
- Input validation with Marshmallow
- Environment-based configuration
- Secure Docker containers
- Database connection pooling

## 📚 API Documentation

Comprehensive Swagger/OpenAPI documentation is available for each service:

- **API Gateway**: http://localhost:3000/api-docs
- **Menu & Inventory**: http://localhost:3001/api-docs
- **Order Management**: http://localhost:3002/api-docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@byteristo.com

---

**ByteRisto** - Streamlining restaurant operations through modern microservices architecture.
