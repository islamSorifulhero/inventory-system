# Live link: https://inventory-system-app-opal.vercel.app

# StockFlow — Smart Inventory & Order Management System

A full-featured inventory and order management web application with real-time stock tracking, order fulfillment workflows, and conflict detection.

## Features

- **Authentication** — Email/password login & signup with JWT tokens. Demo login button available.
- **Product & Category Management** — Full CRUD for categories and products with price, stock, threshold.
- **Order Management** — Create, update, cancel orders with automatic stock deduction.
- **Stock Handling** — Auto-deduct on order, out-of-stock detection, restock warnings.
- **Restock Queue** — Auto-populates with low-stock products, sorted by priority (High/Medium/Low).
- **Conflict Detection** — Prevents duplicate products in orders, blocks inactive products.
- **Dashboard** — Live KPIs: orders today, pending, low stock count, revenue today, weekly chart.
- **Activity Log** — Tracks all system actions with timestamps.
- **Search & Filter** — Products and orders searchable with pagination.
- **Role-based display** — Admin and Manager roles.

## Demo Credentials

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| Admin   | admin@demo.com    | demo123   |
| Manager | manager@demo.com  | demo123   |

## Tech Stack

- **Backend:** Node.js + Express.js (in-memory store, no database required)
- **Frontend:** Vanilla HTML/CSS/JavaScript (single file, zero dependencies)
- **Auth:** JWT + bcrypt

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Open the Frontend

Open `frontend/index.html` in your browser directly, OR serve it:

```bash
cd frontend
npx serve .
# Open http://localhost:3000
```

> **Note:** The frontend expects the backend at `http://localhost:5000`. If you change the backend port, update the `API` constant at the top of `frontend/index.html`.

## Project Structure

```
inventory-system/
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js          # Express app entry point
│       ├── db.js              # In-memory database + seed data
│       ├── middleware/
│       │   └── auth.js        # JWT middleware
│       └── routes/
│           ├── auth.js        # Login & signup
│           ├── categories.js  # Category CRUD
│           ├── products.js    # Product CRUD + restock
│           ├── orders.js      # Order CRUD + status
│           └── dashboard.js   # Dashboard stats + logs
└── frontend/
    └── index.html             # Complete single-file frontend app
```

## API Endpoints

| Method | Endpoint                      | Description               |
|--------|-------------------------------|---------------------------|
| POST   | /api/auth/signup              | Register new user         |
| POST   | /api/auth/login               | Login                     |
| GET    | /api/categories               | List categories           |
| POST   | /api/categories               | Add category              |
| DELETE | /api/categories/:id           | Delete category           |
| GET    | /api/products                 | List products (paginated) |
| POST   | /api/products                 | Add product               |
| PUT    | /api/products/:id             | Edit product              |
| DELETE | /api/products/:id             | Delete product            |
| POST   | /api/products/:id/restock     | Restock product           |
| GET    | /api/orders                   | List orders (paginated)   |
| POST   | /api/orders                   | Create order              |
| PUT    | /api/orders/:id/status        | Update order status       |
| DELETE | /api/orders/:id               | Delete cancelled order    |
| GET    | /api/dashboard                | Dashboard stats           |
| GET    | /api/restock-queue            | Restock queue             |
| DELETE | /api/restock-queue/:id        | Remove from queue         |
| GET    | /api/activity-log             | Activity log              |

## Notes

- Data is stored **in-memory** — it resets when the server restarts
- The backend includes seed data with 8 products, 5 categories, 5 sample orders
- CORS is enabled for all origins (suitable for local development)
# inventory-system
