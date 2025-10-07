# ByteRisto - Role-Based Access Control Implementation

## Overview
Implemented a role-based access control system with a user-friendly role selection interface.

## Implementation Details

### 1. Role Selector Component
Created a new component at `frontend/src/components/RoleSelector.js` that displays a beautiful modal with four role options:

#### Available Roles:
- **👤 Cliente** - Can only view the menu
- **🧑‍🍳 Cameriere** (Waiter) - Can access:
  - Menu
  - Gestione Menu (Menu Management)
  - Presa Ordini (Order Taking)
  - Ordini Attivi (Active Orders)
  
- **👨‍🍳 Chef** - Can access:
  - Menu
  - Gestione Menu (Menu Management)
  - Cucina (Kitchen)
  
- **💰 Cassiere** (Cashier) - Can access:
  - Menu
  - Ordini Attivi (Active Orders)
  - Pagamenti (Payments)

### 2. Updated App.js
Modified the main App component to:
- Show the role selector on initial load
- Filter available tabs based on selected role
- Display current role in the status bar
- Add "Cambia Ruolo" (Change Role) button to switch roles

### 3. Styling
Created `frontend/src/styles/RoleSelector.css` with:
- Beautiful glassmorphism design
- Smooth animations and transitions
- Responsive layout for mobile and tablet
- Hover effects with role-specific colors
- Accessibility-friendly design

## Features

### Role Selection Screen
- Full-screen overlay with blurred background
- Four large, interactive role cards
- Each card shows:
  - Role icon (emoji)
  - Role name
  - Brief description of what that role can do
  - Color-coded hover effect

### Main Application
- Dynamic tab filtering based on role
- Current role displayed in header
- Easy role switching with "Cambia Ruolo" button
- Maintains all existing functionality

## Usage

1. Open the application at http://localhost:3003
2. Select your role from the welcome screen
3. Access only the features available to your role
4. Click "Cambia Ruolo" in the top right to switch roles anytime

## Role Permissions Matrix

| Feature | Cliente | Cameriere | Chef | Cassiere |
|---------|---------|-----------|------|----------|
| Menu Display | ✅ | ✅ | ✅ | ✅ |
| Gestione Menu | ❌ | ✅ | ✅ | ❌ |
| Presa Ordini | ❌ | ✅ | ❌ | ❌ |
| Ordini Attivi | ❌ | ✅ | ❌ | ✅ |
| Cucina | ❌ | ❌ | ✅ | ❌ |
| Pagamenti | ❌ | ❌ | ❌ | ✅ |

## Technical Notes

- State management uses React hooks (useState)
- No authentication/authorization backend (for now - this is UI only)
- Role is stored in component state (resets on page refresh)
- Future enhancement: Store role in localStorage or implement backend authentication
