# Mini SaaS Template Store

A full-stack web application designed for browsing, searching, and managing curated SaaS templates, complete with secure JWT authentication and user-specific favorites management.

Built for the **Full Stack Web Developer Intern Technical Task** with all core requirements and **bonus features** implemented.

---

## 🌟 Features Overview

### 1. Core Requirements
- **User Authentication**:
  - Registration & Login forms with client-side & server-side validation.
  - Secure password hashing using **`bcryptjs`** (salt rounds: 10).
  - Stateless **JWT-based authentication** (`jsonwebtoken`).
  - JWT token and user profile securely persisted in `localStorage`.
- **Templates Store**:
  - Relational database schema with fields: `id`, `name`, `description`, `thumbnail_url`, `category`.
  - Responsive, modern grid displaying template cards with images, categories, and descriptions.
  - Interactive **"Favorite"** toggle button with visual active status (filled heart).
- **User Favorites ("My Favorites")**:
  - Filtered list showing only the templates favorited by the currently authenticated user.
  - Dedicated `/favorites` page with empty states and quick unfavorite actions.
- **RESTful API**:
  - Standardized JSON responses with proper HTTP status codes (`200`, `201`, `400`, `401`, `404`, `409`, `500`).
  - Pre-seeded with **8 diverse, production-ready SaaS templates**.

### 2. Bonus Features (All Implemented!)
- 🔍 **Live Search**: Instant keyword search matching title, description, or category.
- 🏷️ **Category Filter Pills**: Filter templates dynamically by category (*CRM, Analytics, AI Tools, Developer Tools, E-Commerce, Project Management, Fintech, Customer Support*).
- 🔒 **Protected Routes & Auth Redirects**: Custom `<ProtectedRoute>` wrapper that redirects guests attempting to access `/favorites` to `/login`, preserving return destination.
- 🚪 **Logout & User Session**: Dedicated Logout button in the navigation header with user profile avatar and name badges.
- 👁️ **Template Details Modal**: Interactive preview modal showcasing detailed descriptions and included capabilities.
- ⚡ **Dual Database Engine**:
  - **Supabase PostgreSQL** via Knex.js (`pg`) for cloud production.
  - **SQLite3** automatic local fallback for zero-configuration local review!
- ☁️ **Deployment Ready**:
  - `render.yaml` for one-click backend deployment on **Render**.
  - `vercel.json` & `_redirects` for single-page routing on **Vercel** / **Netlify**.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite 8 | Ultra-fast build tool and modern component tree |
| **Styling** | Tailwind CSS v4 | Responsive utility-first modern dark UI |
| **Icons** | Lucide React | Clean, lightweight SVG icons |
| **HTTP Client** | Axios | Configured with automatic Bearer JWT injection interceptors |
| **Routing** | React Router DOM v7 | Client-side SPA routing with protected route guards |
| **Backend** | Node.js + Express.js | Modular REST API architecture |
| **Database** | PostgreSQL (**Supabase**) & SQLite | Relational schema with foreign keys and cascade delete |
| **Query Builder** | Knex.js | Structured SQL queries, auto-migration, and seed scripts |
| **Security** | bcryptjs + jsonwebtoken | Encrypted credential storage and signed tokens |

---

## 📂 Project Structure

```text
fullstack-intern-task/
├── client/                     # Frontend React + Vite application
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing redirect
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx      # Navigation header with auth badges
│   │   │   ├── Footer.jsx      # Brand footer
│   │   │   ├── TemplateCard.jsx # Template card with Favorite button
│   │   │   ├── TemplateDetailModal.jsx # Preview modal
│   │   │   └── ProtectedRoute.jsx # Auth route protection wrapper
│   │   ├── context/
│   │   │   └── AuthContext.jsx # React context for authentication state
│   │   ├── pages/              # Routed views
│   │   │   ├── TemplatesPage.jsx # Store catalogue (/templates, /)
│   │   │   ├── FavoritesPage.jsx # Favorited templates (/favorites)
│   │   │   ├── LoginPage.jsx   # Sign in form (/login)
│   │   │   └── RegisterPage.jsx# Registration form (/register)
│   │   ├── services/
│   │   │   └── api.js          # Axios client with interceptors
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind CSS styles
│   ├── .env.example
│   ├── vercel.json             # Vercel SPA routing rewrite
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend Node.js + Express application
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js   # Knex database connection & auto-table creator
│   │   │   ├── seeds.js        # 8 pre-seeded SaaS templates data
│   │   │   └── seed-runner.js  # Standalone seed reset script
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # /api/auth routes (register, login, me)
│   │   │   ├── templates.js    # /api/templates routes (list, search, get)
│   │   │   └── favorites.js    # /api/favorites routes (list, add, delete)
│   │   └── index.js            # Express server entry point
│   ├── test-api.js             # Comprehensive automated test suite
│   ├── supabase_schema.sql     # Standalone SQL schema for Supabase Editor
│   ├── knexfile.js             # Knex config for Postgres & SQLite
│   ├── .env.example
│   └── package.json
│
├── render.yaml                 # Render web service deployment manifest
├── .gitignore
└── README.md                   # Complete documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended; verified on Node v20)
- **npm** (v9 or higher)
- *(Optional)* A free **Supabase** account for PostgreSQL cloud hosting

---

### Step 1: Backend Setup (`server/`)

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   **Using Supabase PostgreSQL (Recommended):**
   - In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to:
     `Project Settings` -> `Database` -> `Connection String` -> `URI` (or Transaction Pooler).
   - Set the `DATABASE_URL` in your `server/.env`:
     ```env
     PORT=5000
     JWT_SECRET=super_secret_jwt_key_saas_store_2026
     DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```

   > 💡 **Zero-Config Local Mode**: If you leave `DATABASE_URL` empty, the server automatically uses local SQLite (`database.sqlite`), creating tables and seeding sample templates automatically on first run!

4. Start the backend server:
   ```bash
   npm run dev
   # Or production mode:
   npm start
   ```
   The backend API will run at `http://localhost:5000`.

5. *(Optional)* Run the automated API test suite:
   ```bash
   npm test
   ```

---

### Step 2: Frontend Setup (`client/`)

1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Default content:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the local Vite URL (e.g., `http://localhost:5173`).

---

## 📡 API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user (`name`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes** (Bearer Token) |

### Templates Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/templates` | List all templates (supports `?category=` & `?search=`) | No |
| `GET` | `/api/templates/:id` | Fetch specific template details by ID | No |

### Favorites Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/favorites` | Fetch all favorited templates for logged-in user | **Yes** (Bearer Token) |
| `POST` | `/api/favorites/:templateId` | Add template to user favorites | **Yes** (Bearer Token) |
| `DELETE` | `/api/favorites/:templateId` | Remove template from user favorites | **Yes** (Bearer Token) |

---

## 🌐 Deployment Instructions

### Deploy Backend to Render
1. Push your repository to GitHub.
2. In Render, click **New +** -> **Web Service**.
3. Select your repository and set the **Root Directory** to `server`.
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: A long secure random string.
   - `NODE_ENV`: `production`

### Deploy Frontend to Vercel
1. In Vercel, click **Add New...** -> **Project** and select your GitHub repository.
2. Set **Root Directory** to `client`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: Your hosted backend API URL (e.g. `https://fullstack-intern-task-te6m.onrender.com/api`).
4. Click **Deploy**. Single-page routing is automatically handled via `vercel.json`.

---

## 👤 Candidate Information

- **Name**: Baala Murugan K
- **Email**: baala25harish01@gmail.com
- **Repository**: [https://github.com/Baala-Murugan-K/fullstack-intern-task](https://github.com/Baala-Murugan-K/fullstack-intern-task)
- **Role Applied**: Full Stack Web Developer Intern


