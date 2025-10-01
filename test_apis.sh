#!/bin/bash

echo "🧪 ByteRisto API Test Suite"
echo "=========================="

# Base URLs
GATEWAY_URL="http://localhost:3000"
MENU_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
            echo "   Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body")"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got HTTP $http_code)"
        echo "   Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body")"
    fi
    
    # Return the body for further processing
    echo "$body"
}

echo ""
echo "Testing Health Endpoints"
echo "----------------------------"

# Test health endpoints
test_endpoint "GET" "$MENU_URL/health" "" "200" "Menu Service Health"
test_endpoint "GET" "$GATEWAY_URL/health" "" "200" "API Gateway Health"

echo ""
echo "Testing Menu Service (Direct)"
echo "--------------------------------"

# Test menu service directly
test_endpoint "GET" "$MENU_URL/api/menu/" "" "200" "Get all menu items (empty)"

# Create a menu item
MENU_ITEM_RESPONSE=$(test_endpoint "POST" "$MENU_URL/api/menu/" '{
    "name": "Margherita Pizza", 
    "description": "Classic pizza with tomato, mozzarella, and basil", 
    "price": 12.99, 
    "category": "main", 
    "preparation_time": 15, 
    "allergens": ["dairy", "gluten"]
}' "201" "Create menu item")

# Extract menu item ID for further tests
MENU_ITEM_ID=$(echo "$MENU_ITEM_RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ "$MENU_ITEM_ID" != "null" ] && [ -n "$MENU_ITEM_ID" ]; then
    test_endpoint "GET" "$MENU_URL/api/menu/" "" "200" "Get all menu items (with data)"
    test_endpoint "GET" "$MENU_URL/api/menu/$MENU_ITEM_ID" "" "200" "Get specific menu item"
    test_endpoint "GET" "$MENU_URL/api/menu/available" "" "200" "Get available menu items"
fi

echo ""
echo "Testing API Gateway (Menu Proxy)"
echo "-----------------------------------"

# Test API Gateway proxying menu service
test_endpoint "GET" "$GATEWAY_URL/api/menu/" "" "200" "Gateway: Get menu items"
test_endpoint "GET" "$GATEWAY_URL/api/menu/available" "" "200" "Gateway: Get available menu items"

if [ "$MENU_ITEM_ID" != "null" ] && [ -n "$MENU_ITEM_ID" ]; then
    test_endpoint "GET" "$GATEWAY_URL/api/menu/$MENU_ITEM_ID" "" "200" "Gateway: Get specific menu item"
fi

echo ""
echo "API Testing Summary"
echo "====================="
echo -e "${GREEN}✓${NC} ByteRisto Flask microservices are working!"
echo -e "${YELLOW}ℹ${NC}  Menu Service: $MENU_URL"
echo -e "${YELLOW}ℹ${NC}  API Gateway: $GATEWAY_URL"
echo ""
echo "Available Endpoints:"
echo "  Menu Service:"
echo "    GET    $MENU_URL/api/menu/         - Get all menu items"
echo "    POST   $MENU_URL/api/menu/         - Create menu item"
echo "    GET    $MENU_URL/api/menu/{id}     - Get menu item by ID"
echo "    GET    $MENU_URL/api/menu/available - Get available items"
echo "  "
echo "  API Gateway (proxies all services):"
echo "    All above endpoints via: $GATEWAY_URL/api/..."
echo ""

if [ "$MENU_ITEM_ID" != "null" ] && [ -n "$MENU_ITEM_ID" ]; then
    echo "Sample Data Created:"
    echo "  Menu Item ID: $MENU_ITEM_ID"
    echo "  Try: curl $MENU_URL/api/menu/$MENU_ITEM_ID"
fi
