# ByteRisto - Restaurant Management System

ByteRisto is an internal Restaurant Management System offering an all-in-one solution for menu and ordering. Built with **Python Flask microservices**, Docker containerization, and REST APIs, with each service independently deployed. It supports staff from waiters to managers with role-based access control.

## 🏗️ Architecture

ByteRisto follows a microservices architecture with the following key components:

### Core Services
- **Menu Service** (Port 3001) - Manages menu items and availability
- **Order Management Service** (Port 3002) - Handles order processing and workflow

### Infrastructure
- **API Gateway** (Port 3000) - Unified entry point for all services
- **PostgreSQL** (Multiple instances) - Database per service pattern
- **Frontend** (Port 8080) - React-based user interface

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Git

### Running with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/pennyw1ze/ByteRisto
   cd ByteRisto
   ```

2. **Start all services**
   ```bash
   docker-compose up --build -d
   ```

3. **Wait for services to initialize (first time only)**
   ```bash
   sleep 10
   docker restart byteristo-menu-inventory byteristo-order-management
   ```

4. **Verify services are running**
   ```bash
   docker-compose ps
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - API Gateway: http://localhost:3000
   - Menu Service: http://localhost:3001
   - Order Service: http://localhost:3002

### Service URLs

| Service | URL | Health Check |
|---------|-----|--------------|
| API Gateway | http://localhost:3000 | http://localhost:3000/health |
| Menu Service | http://localhost:3001 | http://localhost:3001/health |
| Order Management | http://localhost:3002 | http://localhost:3002/health |
| Frontend | http://localhost:8080 | N/A |

## 📋 Features

### Menu Management
- ✅ CRUD operations for menu items
- ✅ Category-based organization
- ✅ Nutritional information tracking
- ✅ Allergen management

### Order Management
- ✅ Order creation and tracking
- ✅ Order status workflow (confirmed → preparing → ready → delivered/payed)
- ✅ Table-based order management
- ✅ Special instructions for orders and items
- ✅ Real-time order updates
- ✅ Kitchen display system

### Payment Processing
- ✅ Order payment management
- ✅ Multiple payment methods (cash, card, other)
- ✅ Payment status tracking
- ✅ Order completion workflow

### User Interface
- ✅ Role-based access control (Client, Waiter, Chef, Cashier, Manager)
- ✅ Responsive web interface
- ✅ Real-time data updates
- ✅ Role selector with appropriate views


### Infrastructure Features
- ✅ Microservices architecture
- ✅ Docker containerization
- ✅ API Gateway with request routing
- ✅ RESTful API design
- ✅ Health checks and monitoring
- ✅ Database per service pattern
- ✅ PostgreSQL databases

## 🛠️ Development

### Local Development Setup

1. **Install dependencies**
   ```bash
   cd services/menu-inventory
   pip install -r requirements.txt
   
   cd ../order-management
   pip install -r requirements.txt
   
   cd ../api-gateway
   pip install -r requirements.txt
   
   cd ../../frontend
   npm install
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d postgres-menu postgres-orders
   ```

3. **Run services locally**
   ```bash
   # Terminal 1 - Menu Service
   cd services/menu-inventory/src
   python app.py
   
   # Terminal 2 - Order Service
   cd services/order-management/src
   python app.py
   
   # Terminal 3 - API Gateway
   cd services/api-gateway/src
   python app.py
   
   # Terminal 4 - Frontend
   cd frontend
   npm start
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
    "table_number": 5,
    "customer_name": "Alice Smith",
    "order_type": "dine_in",
    "special_instructions": "No spicy",
    "items": [
      {
        "menu_item_id": "menu-item-uuid",
        "menu_item_name": "Margherita Pizza",
        "quantity": 2,
        "unit_price": 12.99,
        "total_price": 25.98,
        "special_instructions": "Extra cheese"
      }
    ]
  }'
```

#### Update Order Status
```bash
curl -X PUT http://localhost:3000/api/orders/{order_id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing"}'
```

#### Get Orders
```bash
# Get all orders
curl http://localhost:3000/api/orders

# Filter by status
curl http://localhost:3000/api/orders?status=ready

# Filter by table
curl http://localhost:3000/api/orders?table_number=5
```

## 🏢 Staff Roles & Access Control

ByteRisto supports different staff roles with appropriate access levels:

### Client
- View menu items with categories
- View item details including allergens and nutritional info

### Waiter
- All client functions
- Create and manage orders
- Take customer orders
- View and manage active orders
- Update order status

### Chef
- View menu management
- View kitchen display
- Update order and item preparation status
- Mark orders as ready

### Cashier
- View menu
- Process payments
- View orders ready for payment
- Complete order transactions

### Manager
- Full access to all services
- Menu management (create, update, delete items)
- View all order history and analytics
- Access to all system functions

## 🔄 System Architecture

The system follows a simplified microservices architecture:

```
┌─────────────┐
│   Frontend  │ (React - Port 8080)
│   (Nginx)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│       API Gateway               │ (Flask - Port 3000)
│    (Route Management)           │
└──────┬──────────────────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│ Menu Service │   │  Order Service   │
│  (Port 3001) │   │   (Port 3002)    │
└──────┬───────┘   └────────┬─────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌──────────────────┐
│  PostgreSQL  │   │   PostgreSQL     │
│ (Port 5432)  │   │   (Port 5433)    │
└──────────────┘   └──────────────────┘
```

### Communication Flow
1. **Frontend** sends HTTP requests to **API Gateway**
2. **API Gateway** routes requests to appropriate microservices
3. **Microservices** process requests and interact with their databases
4. Responses flow back through the gateway to the frontend


## 📊 Database Schema

### Menu Service (PostgreSQL - Port 5432)
- `menu_items` - Menu item information
  - id (UUID), name, description, price, category
  - is_available, preparation_time
  - allergens (JSON), nutritional_info (JSON)
  - created_at, updated_at

### Order Management Service (PostgreSQL - Port 5433)
- `orders` - Order information
  - id (UUID), order_number, table_number
  - customer_name, order_type, status
  - special_instructions, discount_amount, final_amount
  - estimated_completion_time, created_at, updated_at

- `order_items` - Individual order items
  - id (UUID), order_id (FK), menu_item_id, menu_item_name
  - quantity, unit_price, total_price
  - special_instructions, status
  - created_at


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
# Database Configuration (Menu Service)
DB_HOST=postgres-menu
DB_PORT=5432
DB_NAME=menu_inventory_db
DB_USER=menu_user
DB_PASSWORD=menu_password

# Database Configuration (Order Service)
DB_HOST=postgres-orders
DB_PORT=5432
DB_NAME=orders_db
DB_USER=orders_user
DB_PASSWORD=orders_password

# Service URLs
MENU_SERVICE_URL=http://menu-inventory-service:3001
ORDER_SERVICE_URL=http://order-management-service:3002

# Flask Configuration
FLASK_ENV=development
PORT=3000
DEBUG=True
```

## 🧪 Testing

Run comprehensive API tests:

```bash
# Start all services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Test Menu API
curl http://localhost:3000/api/menu

# Test Order API
curl http://localhost:3000/api/orders

# Access Frontend
open http://localhost:8080
```

## 📈 Monitoring & Health Checks

Each service provides health check endpoints:

- `GET /health` - Service health status
- `GET /api` - Service API documentation

**Health Check Examples:**
```bash
curl http://localhost:3001/health  # Menu Service
curl http://localhost:3002/health  # Order Service
curl http://localhost:3000/health  # API Gateway
```

## 🔒 Security Features

- Flask-CORS for cross-origin resource sharing
- Input validation with Marshmallow schemas
- Environment-based configuration
- Secure Docker containers
- Database connection pooling
- SQLAlchemy ORM for SQL injection prevention

## 📚 Technology Stack

### Backend
- **Python 3.11** - Primary programming language
- **Flask** - Web framework for microservices
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL 13** - Relational database
- **Marshmallow** - Data validation and serialization

### Frontend
- **React 19** - UI framework
- **JavaScript (ES6+)** - Programming language
- **Nginx** - Web server for production

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Project Structure

```
ByteRisto/
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/             # API integration
│   │   ├── components/      # React components
│   │   ├── styles/          # CSS files
│   │   └── App.js           # Main app component
│   ├── Dockerfile
│   └── package.json
├── services/
│   ├── api-gateway/         # API Gateway service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── app.py
│   │   │   └── config.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── menu-inventory/      # Menu service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── models.py
│   │   │   ├── app.py
│   │   │   └── config.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── order-management/    # Order service
│       ├── src/
│       │   ├── routes/
│       │   ├── models.py
│       │   ├── app.py
│       │   └── config.py
│       ├── Dockerfile
│       └── requirements.txt
├── booklets/                # Documentation
├── docker-compose.yml       # Docker orchestration
├── input.txt               # User stories
└── README.md               # This file
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
---

**ByteRisto** - Streamlining restaurant operations through modern microservices architecture.

Built with ❤️ using Python, Flask, React, PostgreSQL, and Docker.
