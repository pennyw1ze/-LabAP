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

#### Story 1.1: View Menu
**As a** customer  
**I want to** view the restaurant menu with items, descriptions, and prices  
**So that** I can decide what to order

**Acceptance Criteria:**
- Menu displays all available items organized by categories
- Each item shows name, description, price, and allergen information
- Unavailable items are clearly marked or hidden
- Menu is responsive and works on mobile devices

#### Story 1.2: Browse Menu Categories
**As a** customer  
**I want to** browse menu items by categories (appetizers, mains, desserts, beverages)  
**So that** I can easily find the type of food I'm looking for

**Acceptance Criteria:**
- Menu is organized into clear categories
- Category navigation is intuitive and accessible
- Items within categories are logically ordered

---

### 2. Waiter Stories

#### Story 2.1: Take Customer Orders
**As a** waiter  
**I want to** take customer orders through the system  
**So that** orders are accurately recorded and sent to the kitchen

**Acceptance Criteria:**
- Can select items from the menu for customer orders
- Can specify quantity and special instructions for each item
- Order total is automatically calculated
- Order is immediately transmitted to kitchen display

#### Story 2.2: Manage Active Orders
**As a** waiter  
**I want to** view and track all active orders at my tables  
**So that** I can provide updates to customers and ensure timely service

**Acceptance Criteria:**
- Can view all orders with their current status
- Orders show preparation time estimates
- Can update order status when serving customers
- Notifications when orders are ready for pickup

#### Story 2.3: Modify Menu Items
**As a** waiter  
**I want to** add, edit, or remove menu items  
**So that** the menu stays current with available ingredients and seasonal changes

**Acceptance Criteria:**
- Can create new menu items with all required information
- Can edit existing items including prices and descriptions
- Can mark items as unavailable without deleting them
- Changes are immediately reflected across all systems

---

### 3. Chef Stories

#### Story 3.1: View Kitchen Orders
**As a** chef  
**I want to** view incoming orders on a kitchen display  
**So that** I can prioritize and prepare orders efficiently

**Acceptance Criteria:**
- Orders appear in chronological order on kitchen display
- Each order shows items, quantities, special instructions, and timing
- Orders are automatically prioritized by preparation time
- Completed orders can be marked as ready

#### Story 3.2: Update Order Status
**As a** chef  
**I want to** update order preparation status  
**So that** waiters and customers know when food is ready

**Acceptance Criteria:**
- Can mark orders as "in preparation", "ready for pickup", or "completed"
- Status updates are immediately visible to waiters
- Preparation time tracking for performance metrics

#### Story 3.3: Manage Menu Availability
**As a** chef  
**I want to** quickly mark menu items as unavailable when ingredients run out  
**So that** customers cannot order items we cannot prepare

**Acceptance Criteria:**
- Can instantly toggle item availability from kitchen interface
- Unavailable items are immediately hidden from customer menu
- Can add preparation time estimates for menu items

---

### 4. Cashier Stories

#### Story 4.1: Process Payments
**As a** cashier  
**I want to** process customer payments for completed orders  
**So that** transactions are recorded and orders can be closed

**Acceptance Criteria:**
- Can view completed orders awaiting payment
- Can process cash, card, and digital payments
- Payment records are stored with order details
- Orders are marked as "paid" after successful payment

#### Story 4.2: View Order History
**As a** cashier  
**I want to** access order history and payment records  
**So that** I can handle customer inquiries and generate reports

**Acceptance Criteria:**
- Can search orders by date, table number, or amount
- Payment history includes payment method and timestamps
- Can generate daily/weekly revenue reports

---

### 5. Manager Stories

#### Story 5.1: Access All System Functions
**As a** manager  
**I want to** access all system features and reports  
**So that** I can oversee restaurant operations effectively

**Acceptance Criteria:**
- Can switch between all user roles and their functions
- Access to comprehensive reporting dashboard
- Can override system restrictions when necessary

---
