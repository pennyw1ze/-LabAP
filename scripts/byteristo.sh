#!/bin/bash

# ByteRisto Development Helper Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍕 ByteRisto Restaurant Management System${NC}"
echo -e "${BLUE}===========================================${NC}"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to start all services
start_services() {
    echo -e "${YELLOW}🚀 Starting all ByteRisto services...${NC}"
    docker compose up -d
    
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 30
    
    echo -e "${GREEN}✅ Services started!${NC}"
    echo -e "${BLUE}📋 Service URLs:${NC}"
    echo -e "   🌐 API Gateway:      http://localhost:3000"
    echo -e "   📚 API Docs:         http://localhost:3000/api-docs"
    echo -e "   🍽️  Menu & Inventory: http://localhost:3001"
    echo -e "   📋 Order Management: http://localhost:3002"
    echo -e "   💳 Billing:          http://localhost:3003"
    echo -e "   📊 Analytics:        http://localhost:3004"
    echo -e "   🐰 RabbitMQ:         http://localhost:15672 (admin/password)"
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all ByteRisto services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Services stopped!${NC}"
}

# Function to check service health
check_health() {
    echo -e "${YELLOW}🔍 Checking service health...${NC}"
    
    services=(
        "API Gateway:http://localhost:3000/health"
        "Menu Service:http://localhost:3001/health"
        "Order Service:http://localhost:3002/health"
        "Billing Service:http://localhost:3003/health"
        "Analytics Service:http://localhost:3004/health"
    )
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d: -f1)
        url=$(echo $service | cut -d: -f2,3)
        
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ $name - Healthy${NC}"
        else
            echo -e "   ${RED}❌ $name - Unhealthy${NC}"
        fi
    done
}

# Function to view logs
view_logs() {
    if [ -n "$1" ]; then
        echo -e "${YELLOW}📋 Viewing logs for $1...${NC}"
        docker compose logs -f "$1"
    else
        echo -e "${YELLOW}📋 Viewing logs for all services...${NC}"
        docker compose logs -f
    fi
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting all ByteRisto services...${NC}"
    docker compose restart
    echo -e "${GREEN}✅ Services restarted!${NC}"
}

# Function to setup development environment
setup_dev() {
    echo -e "${YELLOW}🛠️  Setting up development environment...${NC}"
    
    # Install dependencies for each service
    services=("menu-inventory" "order-management" "billing-payments" "analytics-reporting" "api-gateway")
    
    for service in "${services[@]}"; do
        if [ -d "services/$service" ]; then
            echo -e "${BLUE}📦 Installing dependencies for $service...${NC}"
            cd "services/$service" && npm install && cd ../..
        fi
    done
    
    echo -e "${GREEN}✅ Development environment setup complete!${NC}"
}

# Main menu
case "$1" in
    "start")
        check_docker
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        check_docker
        restart_services
        ;;
    "health")
        check_health
        ;;
    "logs")
        view_logs "$2"
        ;;
    "setup")
        setup_dev
        ;;
    *)
        echo -e "${BLUE}Usage: $0 {start|stop|restart|health|logs|setup}${NC}"
        echo -e ""
        echo -e "${YELLOW}Commands:${NC}"
        echo -e "  start   - Start all services with Docker Compose"
        echo -e "  stop    - Stop all services"
        echo -e "  restart - Restart all services"
        echo -e "  health  - Check health of all services"
        echo -e "  logs    - View logs (optionally specify service name)"
        echo -e "  setup   - Setup development environment"
        echo -e ""
        echo -e "${YELLOW}Examples:${NC}"
        echo -e "  $0 start"
        echo -e "  $0 logs menu-inventory-service"
        echo -e "  $0 health"
        exit 1
esac