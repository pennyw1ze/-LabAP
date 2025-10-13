# ByteRisto - Restaurant Management System

## System Description

**ByteRisto** is a comprehensive internal restaurant management system designed to streamline operations across all aspects of restaurant service. Built with a modern **microservices architecture**, ByteRisto provides an all-in-one solution for menu management, order processing, and workflow coordination.

### Core Features

- **Menu Management**: Complete control over menu items, pricing, availability, and nutritional information
- **Order Processing**: Full order lifecycle management from taking orders to payment processing
- **Role-Based Access Control**: Secure access management for different staff roles
- **Real-time Communication**: Message queue system for seamless inter-service communication
- **Kitchen Display**: Dedicated interface for kitchen staff to manage order preparation
- **Payment Processing**: Integrated payment handling system

### Technical Architecture

ByteRisto follows a **microservices architecture** with the following components:

#### 1. Core Services
- **Menu Service** (Port 3001) - Manages menu items, categories, pricing, and availability
- **Order Management Service** (Port 3002) - Handles complete order workflow and status tracking

#### 2. Infrastructure
- **API Gateway** (Port 3000) - Unified entry point and request routing
- **RabbitMQ** (Port 5672/15672) - Message queue for asynchronous communication
- **PostgreSQL** - Database-per-service pattern for data isolation
- **Redis** (Port 6379) - Caching and session management

#### 3. Frontend
- **React Application** (Port 3003) - Modern, responsive user interface
- **Role-based UI** - Dynamic interface adaptation based on user roles

### Technology Stack

- **Backend**: Python Flask with RESTful APIs
- **Frontend**: React.js with modern JavaScript
- **Database**: PostgreSQL with service-specific schemas
- **Message Queue**: RabbitMQ for event-driven communication
- **Caching**: Redis for performance optimization
- **Containerization**: Docker and Docker Compose
- **Architecture**: Microservices with API Gateway pattern

---

## User Stories

### 1. Customer Stories

#### Story 1.1: View All Menu Items
**As a** customer  
**I want to** view all restaurant menu items with descriptions and prices  
**So that** I can see the complete selection available

#### Story 1.2: Browse Appetizers
**As a** customer  
**I want to** filter and view only appetizer menu items  
**So that** I can choose starters for my meal

#### Story 1.3: Browse Main Dishes
**As a** customer  
**I want to** filter and view only main course items  
**So that** I can select my primary course

#### Story 1.4: Browse Desserts
**As a** customer  
**I want to** filter and view only dessert menu items  
**So that** I can choose a sweet ending to my meal

#### Story 1.5: Browse Beverages
**As a** customer  
**I want to** filter and view only beverage options  
**So that** I can select drinks to accompany my meal

#### Story 1.6: Browse Side Dishes
**As a** customer  
**I want to** filter and view only side dish options  
**So that** I can complement my main course

#### Story 1.7: View Menu Item Details
**As a** customer  
**I want to** see detailed information about each menu item including allergens and nutritional info  
**So that** I can make informed dietary choices

---

### 2. Waiter Stories

#### Story 2.1: Take New Order
**As a** waiter  
**I want to** create a new order for a specific table  
**So that** I can start recording customer requests

#### Story 2.2: Add Items to Order
**As a** waiter  
**I want to** add menu items with quantities to an order  
**So that** I can build the complete customer order

#### Story 2.3: Add Special Instructions
**As a** waiter  
**I want to** add special cooking instructions for menu items  
**So that** the kitchen knows about customer preferences

#### Story 2.4: View Active Orders by Status
**As a** waiter  
**I want to** filter orders by status (confirmed, preparing, ready)  
**So that** I can track orders at different stages

#### Story 2.5: View Orders by Table
**As a** waiter  
**I want to** filter orders by table number  
**So that** I can focus on specific tables I'm serving

#### Story 2.6: Track Order Timing
**As a** waiter  
**I want to** see elapsed time and estimated completion for orders  
**So that** I can manage customer expectations

#### Story 2.7: Create Menu Items
**As a** waiter  
**I want to** add new items to the menu with complete details  
**So that** new dishes become available for ordering

#### Story 2.8: Edit Menu Item Details
**As a** waiter  
**I want to** modify existing menu items' information and pricing  
**So that** menu information stays current and accurate

#### Story 2.9: Toggle Menu Item Availability
**As a** waiter  
**I want to** mark menu items as available or unavailable  
**So that** customers cannot order unavailable items

#### Story 2.10: Delete Menu Item
**As a** waiter  
**I want to** delete a menu item when requested by a manager  
**So that** the menu remains always updated

---

### 3. Chef Stories

#### Story 3.1: View Kitchen Queue
**As a** chef  
**I want to** see all incoming orders in chronological order  
**So that** I can prioritize preparation efficiently

#### Story 3.2: Start Order Preparation
**As a** chef  
**I want to** mark confirmed orders as "preparing"  
**So that** staff knows I've started cooking

#### Story 3.3: Mark Orders Ready
**As a** chef  
**I want to** change preparing orders to "ready" status  
**So that** waiters know food is ready for pickup

#### Story 3.4: View Order Details
**As a** chef  
**I want to** see complete order details including special instructions  
**So that** I can prepare dishes according to customer requests

#### Story 3.5: Manage Kitchen Display
**As a** chef  
**I want to** filter orders by preparation status on kitchen display  
**So that** I can focus on orders at specific cooking stages

---

### 4. Cashier Stories

#### Story 4.1: View Ready Orders for Payment
**As a** cashier  
**I want to** see only orders with "ready" status awaiting payment  
**So that** I can process completed orders efficiently

#### Story 4.2: Process Cash Payments
**As a** cashier  
**I want to** select cash as payment method and complete transactions  
**So that** I can handle cash payments from customers

#### Story 4.3: Process Card Payments
**As a** cashier  
**I want to** select card as payment method for transactions  
**So that** I can handle credit/debit card payments

#### Story 4.4: Filter Orders by Table for Payment
**As a** cashier  
**I want to** filter payment-ready orders by table number  
**So that** I can quickly find orders for specific customers

#### Story 4.5: View Order Payment Summary
**As a** cashier  
**I want to** see detailed order breakdown with total amounts  
**So that** I can verify charges before processing payment

---

### 5. Manager Stories

#### Story 5.1: Monitor Order Flow
**As a** manager  
**I want to** view real-time order statistics and counts  
**So that** I can track restaurant performance

#### Story 5.2: Access to Complete Order History and System Information
**As a** manager  
**I want to** view all historical orders regardless of status and system data 
**So that** I can analyze past performance and trends

---

### 6. System Administration Stories

#### Story 6.1: Auto-Refresh Data
**As a** system user  
**I want to** enable automatic refresh of order data  
**So that** I always see current information without manual updates

#### Story 6.2: Manual Data Refresh
**As a** system user  
**I want to** manually refresh order and menu data  
**So that** I can get the latest information on demand

#### Story 6.3: Switch Between User Roles
**As a** system user  
**I want to** access all system roles (customer, waiter, chef, cashier)  
**So that** I can oversee all operational aspects

---
