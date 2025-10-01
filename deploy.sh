#!/bin/bash

echo "🐳 ByteRisto Docker Deployment Script"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

echo ""
echo "1️⃣ Checking Docker status..."
check_docker

echo ""
echo "2️⃣ Stopping any existing containers..."
docker-compose down

echo ""
echo "3️⃣ Building and starting services..."
docker-compose up --build -d

echo ""
echo "4️⃣ Service status:"
sleep 5
docker-compose ps

echo ""
echo "🎉 Deployment completed!"
echo ""
echo -e "${BLUE}📋 Available endpoints:${NC}"
echo "   • API Gateway: http://localhost:3000"
echo "   • Menu Inventory: http://localhost:3001" 
echo "   • Order Management: http://localhost:3002"
echo "   • Billing Payments: http://localhost:3003"
echo "   • RabbitMQ Management: http://localhost:15672 (admin/password)"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   • Test APIs: ./test_apis.sh"
echo "   • Full test: ./docker_test.sh"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop: docker-compose down"
