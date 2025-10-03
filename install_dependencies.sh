#!/bin/bash

# ByteRisto Docker Services Setup Script
echo "🚀 Setti# Build all Docker images
echo ""
echo "📝 Environment setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "🐳 Build and test all services:"
echo "   ./docker_test.sh"
echo ""
echo "🐳 Or manually start services:"
echo "   docker-compose up --build -d"sto Python Flask Services with Docker..."

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "� Creating environment file..."
    cat > .env << EOF
# Flask Environment
FLASK_ENV=development

# Database Configuration - Menu Inventory
DB_HOST_MENU=postgres-menu
DB_PORT_MENU=5432
DB_NAME_MENU=menu_inventory_db
DB_USER_MENU=menu_user
DB_PASSWORD_MENU=menu_password

# Database Configuration - Orders
DB_HOST_ORDERS=postgres-orders
DB_PORT_ORDERS=5432
DB_NAME_ORDERS=orders_db
DB_USER_ORDERS=orders_user
DB_PASSWORD_ORDERS=orders_password

# RabbitMQ Configuration
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=password

# Redis Configuration
REDIS_URL=redis://redis:6379

# Service URLs (Internal Docker Network)
MENU_SERVICE_URL=http://menu-inventory-service:3001
ORDER_SERVICE_URL=http://order-management-service:3002
EOF
    echo "✅ Created .env file with default configuration"
else
    echo "✅ .env file already exists"
fi

# Build all Docker images
echo ""
echo "� Building Docker images..."
docker-compose build

echo ""
echo "🎉 ByteRisto Docker setup completed successfully!"
echo ""
echo "📋 Available commands:"
echo ""
echo "🐳 Start all services:"
echo "   docker-compose up"
echo ""
echo "🐳 Start services in background:"
echo "   docker-compose up -d"
echo ""
echo "🐳 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🐳 Stop all services:"
echo "   docker-compose down"
echo ""
echo "� Restart specific service:"
echo "   docker-compose restart <service-name>"
echo ""
echo "🔍 Service endpoints:"
echo "   • API Gateway: http://localhost:3000"
echo "   • Menu Inventory: http://localhost:3001" 
echo "   • Order Management: http://localhost:3002"
echo "   • RabbitMQ Management: http://localhost:15672 (admin/password)"
echo ""
echo "🧪 Test all APIs:"
echo "   ./test_apis.sh"
