# Service Management System

A full-stack web application for managing vehicle and equipment service workshops. Track customers, vehicles, service jobs, inventory, invoices, and more -- all from a single dashboard.

Built with TypeScript end-to-end, featuring a React frontend and Express backend with a SQLite database.

---

## Features

1. **Customer Management** - Add, edit, search, and manage customer records
2. **Vehicle/Equipment Management** - Track vehicles and equipment linked to customers
3. **Service Job Management** - Create and manage service jobs with status tracking (Pending, In Progress, Completed, Delivered, Cancelled)
4. **Service Items** - Add itemized charges (labor, filters, oils, spare parts) to each job
5. **Cost Calculation** - Automatic subtotal, discount, tax, and balance calculation
6. **Inventory Management** - Track parts and supplies with automatic stock deduction and low-stock alerts
7. **Invoice/Receipt Generation** - Create invoices from service jobs with PDF export
8. **Reports** - Summary, income, labor, parts usage, and customer history reports
9. **User Roles** - Role-based access control (Admin, Staff, Cashier)
10. **Dashboard** - At-a-glance overview with today's jobs, revenue, low-stock alerts, and recent activity

---

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | React 18, Vite 6, Tailwind CSS 3, React Router 6 |
| State     | React Query (TanStack Query), React Hook Form   |
| Backend   | Express 4, TypeScript, Node.js                  |
| Database  | SQLite with Prisma ORM                          |
| Auth      | JWT (JSON Web Tokens) with bcrypt password hashing |
| PDF       | @react-pdf/renderer                             |
| Icons     | Lucide React                                    |

---

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes bundled with Node.js)
- **Git** - [Download here](https://git-scm.com/)

To verify your installations, run:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show git version 2.x.x
```

---

## Installation

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd service-system
```

### 2. Install Dependencies

From the project root directory, install all dependencies for both the server and client:

```bash
npm install
```

This uses npm workspaces to install dependencies for the root, `server/`, and `client/` packages in one command.

### 3. Set Up the Database

Navigate to the server directory and initialize the database:

```bash
cd server
npx prisma generate
npx prisma db push
```

- `prisma generate` creates the Prisma Client (the TypeScript database interface)
- `prisma db push` creates the SQLite database file and all tables

### 4. Seed the Database

Still in the `server/` directory, populate the database with sample data and the default admin user:

```bash
npx tsx src/seed.ts
```

### 5. Go Back to Root and Start the Application

```bash
cd ..
npm run dev
```

This starts both the backend API server and the frontend development server concurrently.

---

## Accessing the Application

Once the app is running, open your browser:

| Service      | URL                        |
| ------------ | -------------------------- |
| Frontend     | http://localhost:5173      |
| Backend API  | http://localhost:3000      |

### Default Login Credentials

| Username | Password  | Role  |
| -------- | --------- | ----- |
| admin    | admin123  | Admin |

---

## User Roles Explained

The system has three user roles with different levels of access:

### Admin
- Full access to all features
- Can create, edit, and delete users
- Can manage all settings and data
- Access to reports and dashboard

### Staff / Technician
- Can create and update service jobs
- Can manage customers and vehicles
- Can add service items and update job status
- Cannot manage users or access admin settings

### Cashier
- Can view service jobs and invoices
- Can process payments and update payment amounts
- Can generate and print invoices
- Cannot delete records or manage users

---

## Project Structure

```
service-system/
├── package.json              # Root workspace configuration
├── README.md                 # This file
│
├── server/                   # Backend API
│   ├── package.json
│   ├── .env                  # Environment variables
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema definition
│   │   └── dev.db            # SQLite database file (generated)
│   └── src/
│       ├── index.ts          # Express server entry point
│       ├── seed.ts           # Database seeding script
│       ├── middleware/
│       │   └── auth.ts       # JWT authentication middleware
│       ├── routes/
│       │   ├── auth.ts       # Login/register endpoints
│       │   ├── customers.ts  # Customer CRUD
│       │   ├── vehicles.ts   # Vehicle CRUD
│       │   ├── serviceJobs.ts    # Service job CRUD
│       │   ├── serviceItems.ts   # Service item management
│       │   ├── inventory.ts  # Inventory CRUD
│       │   ├── invoices.ts   # Invoice management
│       │   ├── reports.ts    # Report endpoints
│       │   └── dashboard.ts  # Dashboard data
│       └── utils/
│           └── calculations.ts   # Cost calculation helpers
│
├── client/                   # Frontend React app
│   ├── package.json
│   ├── index.html            # Vite entry HTML
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── src/
│       ├── main.tsx          # React entry point
│       ├── App.tsx           # Root component with routing
│       ├── index.css         # Global styles with Tailwind
│       ├── lib/
│       │   ├── api.ts        # Axios instance with JWT interceptor
│       │   └── auth.tsx      # Auth context and protected routes
│       ├── components/
│       │   ├── Layout.tsx    # App shell with sidebar navigation
│       │   └── ui/           # Reusable UI components
│       └── pages/
│           ├── Dashboard.tsx
│           ├── Login.tsx
│           ├── customers/    # Customer pages
│           ├── vehicles/     # Vehicle pages
│           ├── serviceJobs/  # Service job pages
│           ├── inventory/    # Inventory pages
│           ├── invoices/     # Invoice pages (with PDF)
│           ├── reports/      # Report pages
│           └── users/        # User management (admin only)
```

---

## Environment Variables

The server uses a `.env` file located at `server/.env`:

```env
JWT_SECRET=dev-secret-change-in-production-k8s7m2x9p4
DATABASE_URL=file:./dev.db
```

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `JWT_SECRET`   | Secret key used to sign JWT tokens. Change this in production! |
| `DATABASE_URL` | Path to the SQLite database file (configured in `prisma/schema.prisma`) |

> **Important:** Never commit production secrets to version control. The included `.env` file contains development-only values.

---

## Available Scripts

Run these commands from the project root directory:

| Command          | Description                                        |
| ---------------- | -------------------------------------------------- |
| `npm run dev`    | Start both frontend and backend in development mode |
| `npm run build`  | Build both packages for production                 |
| `npm run start`  | Start the production server                        |
| `npm test`       | Run the test suite                                 |

### Server-specific scripts (run from `server/` directory):

| Command                  | Description                          |
| ------------------------ | ------------------------------------ |
| `npm run dev`            | Start backend with hot reload        |
| `npm run seed`           | Seed the database with sample data   |
| `npm run db:generate`    | Regenerate Prisma Client             |
| `npm run db:push`        | Push schema changes to database      |

### Client-specific scripts (run from `client/` directory):

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start frontend dev server            |
| `npm run build`    | Build frontend for production        |
| `npm run preview`  | Preview the production build locally |

---

## Troubleshooting

### Port already in use

If you see an error like `EADDRINUSE: address already in use`, another process is using the port.

```bash
# Find and kill the process on port 3000 (backend)
lsof -i :3000
kill -9 <PID>

# Find and kill the process on port 5173 (frontend)
lsof -i :5173
kill -9 <PID>
```

On Windows, use:

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma Client not generated

If you see errors like `Cannot find module '.prisma/client'`:

```bash
cd server
npx prisma generate
```

### Database not found

If you see errors about the database file not existing:

```bash
cd server
npx prisma db push
npx tsx src/seed.ts
```

This recreates the database and seeds it with initial data.

### Node version too old

If you encounter syntax errors or unexpected behavior:

```bash
node --version
```

Make sure you are running Node.js v18 or higher. If not, download the latest LTS version from [nodejs.org](https://nodejs.org/).

### Module not found errors

If dependencies are missing after pulling new changes:

```bash
npm install
```

Run this from the root directory to reinstall all workspace dependencies.

---

## License

This project is licensed under the [MIT License](LICENSE).
