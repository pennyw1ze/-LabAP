#!/bin/bash

echo "🐳 ByteRisto Docker Test & Deployment Script"
echo "=========================================="

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

# Function to wait for service to be healthy
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "⏳ Waiting for $service_name on port $port... "
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$port/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Ready!${NC}"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            echo -n "⏳ Still waiting ($attempt/$max_attempts)... "
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Timeout waiting for $service_name${NC}"
    return 1
}

# Function to show service logs
show_logs() {
    echo -e "${BLUE}📋 Service logs:${NC}"
    docker compose logs --tail=20
}

# Main execution
echo ""
echo "1️⃣ Checking Docker status..."
check_docker

echo ""
echo "2️⃣ Stopping any existing containers..."
docker compose down

echo ""
echo "3️⃣ Building and starting services..."
docker compose up --build -d

echo ""
echo "4️⃣ Waiting for services to be ready..."

# Wait for databases first
echo "⏳ Waiting for databases to initialize (30 seconds)..."
sleep 30

# Wait for each service
wait_for_service "API Gateway" 3000
wait_for_service "Menu Inventory" 3001
wait_for_service "Order Management" 3002

echo ""
echo "5️⃣ Running API tests..."
./test_apis.sh

echo ""
echo "6️⃣ Service Status:"
docker compose ps

echo ""
echo "🎉 Docker deployment test completed!"
echo ""
echo -e "${BLUE}📋 Available endpoints:${NC}"
echo "   • API Gateway: http://localhost:3000"
echo "   • Menu Inventory: http://localhost:3001" 
echo "   • Order Management: http://localhost:3002"
echo "   • RabbitMQ Management: http://localhost:15672 (admin/password)"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "   • View logs: docker compose logs -f"
echo "   • Stop services: docker compose down"
echo "   • Restart service: docker compose restart <service-name>"
echo ""

# Check if any services failed
failed_services=$(docker compose ps --filter "status=exited" --format "table {{.Service}}")
if [ ! -z "$failed_services" ]; then
    echo -e "${RED}⚠️  Some services failed to start:${NC}"
    echo "$failed_services"
    echo ""
    echo "Showing recent logs for failed services:"
    show_logs
fi
