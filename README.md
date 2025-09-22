# ByteRisto - Restaurant Management System

ByteRisto is an internal Restaurant Management System offering an all-in-one solution for menu, inventory, ordering, billing, and analytics. It uses microservices architecture, Docker, REST & Message Queue APIs, with each service independently deployed. It supports staff from waiters to managers with role-based access control.

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
- Node.js 18+ (for local development)
- Git

### Running with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/pennyw1ze/-LabAP.git
   cd -LabAP
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Check service health**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/status
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
   cd services/menu-inventory && npm install
   cd ../order-management && npm install
   cd ../billing-payments && npm install
   cd ../analytics-reporting && npm install
   cd ../api-gateway && npm install
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d rabbitmq postgres-menu postgres-orders postgres-billing redis
   ```

3. **Run services in development mode**
   ```bash
   # Terminal 1 - Menu & Inventory
   cd services/menu-inventory && npm run dev
   
   # Terminal 2 - Order Management
   cd services/order-management && npm run dev
   
   # Terminal 3 - API Gateway
   cd services/api-gateway && npm run dev
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

Each service is containerized with optimized Docker images:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE [PORT]
USER node
CMD ["npm", "start"]
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

Run tests for each service:

```bash
cd services/menu-inventory && npm test
cd services/order-management && npm test
```

## 📈 Monitoring & Health Checks

Each service provides health check endpoints:

- `GET /health` - Service health status
- `GET /status` - Detailed service information

The API Gateway provides a consolidated status endpoint:
- `GET /status` - All services status

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Input validation with Joi
- Environment-based configuration
- Non-root Docker containers

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
