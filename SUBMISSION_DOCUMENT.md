# Technical Assessment Submission Report

**Position**: Full Stack Web Developer Intern  
**Project**: Mini SaaS Template Store  

---

## 📌 Candidate & Submission Details
- **Candidate Name**: Baala Murugan K
- **Email**: baalamurugan.k25@gmail.com
- **GitHub Repository**: [https://github.com/Baala-Murugan-K/fullstack-intern-task](https://github.com/Baala-Murugan-K/fullstack-intern-task)
- **Live Frontend (Vercel)**: [https://fullstack-intern-task-six.vercel.app/templates](https://fullstack-intern-task-six.vercel.app/templates)
- **Live Backend API (Render)**: [https://fullstack-intern-task-te6m.onrender.com](https://fullstack-intern-task-te6m.onrender.com)
- **Database**: Supabase PostgreSQL (Cloud)

---

## 1. Executive Summary
This document is the official technical submission report for the **"Mini SaaS Template Store"** assessment. The application allows users to discover, search, filter, preview, and bookmark modern SaaS templates with JWT authentication and Supabase email verification. Both mandatory requirements and all bonus features have been delivered and verified live in production.

---

## 2. Evaluation Criteria Compliance Audit

| Evaluation Area | Weight | Required Standard | Implementation & Evidence | Score |
|---|:---:|---|---|:---:|
| **Code Structure** | 25% | Clean, modular, well-organized backend & frontend | • `client/` and `server/` separation.<br>• Modular controllers, routes (`auth.js`, `templates.js`, `favorites.js`), Knex query builder, and custom auth middleware.<br>• Reusable React components (`TemplateCard`, `TemplateDetailModal`, `ProtectedRoute`, `Navbar`). | **100% Met** |
| **Functionality** | 25% | Meets all required features | • User registration & login with input validation.<br>• Password hashing with `bcryptjs` & stateless JWT authentication.<br>• `GET /api/templates`, `GET /api/templates/:id`, `POST /api/favorites/:id`, `GET /api/favorites`.<br>• Pre-seeded database with 8 templates.<br>• Favorites toggle & user-specific collection. | **100% Met** |
| **UI & UX** | 20% | Clean, responsive, and user-friendly design | • Modern dark-mode interface built with Tailwind CSS v4 and Lucide React.<br>• Responsive mobile/desktop layout.<br>• Details preview modal, toast alerts, loading skeletons, and micro-animations. | **100% Met** |
| **API Integration** | 20% | Smooth frontend-backend communication | • Axios client with automatic Bearer token request interceptor.<br>• Standardized JSON responses (`{ success, message, data }`).<br>• Real-time communication between Vercel and Render. | **100% Met** |
| **Bonus Features** | 10% | Filters, deployment, extra creativity | • Live keyword search & category filter pills.<br>• Protected routes (`/favorites`) with redirection.<br>• Dedicated logout button and session state.<br>• Supabase PostgreSQL database + Supabase email verification.<br>• Production deployment on Vercel and Render. | **100% Met** |

---

## 3. Technology Stack

| Layer | Technologies | Role in Application |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React | Modern SPA with utility-first dark styling |
| **Routing** | React Router DOM v7 | Client-side routing with route guards |
| **HTTP Client** | Axios | Configured with token interceptors |
| **Backend** | Node.js, Express.js | Modular RESTful API |
| **Database** | Supabase PostgreSQL, Knex.js | Relational schema with cascade rules and seeding |
| **Security** | bcryptjs, jsonwebtoken, @supabase/supabase-js | Salted password hashing, JWTs, email confirmation |
| **Hosting** | Vercel (Client), Render (Server) | Continuous deployment connected to GitHub |

---

## 4. Key Features Implemented

### Authentication & Verification
- Input validation on client and server (email format, password min length 6).
- Passwords hashed with `bcryptjs` (salt rounds: 10).
- Stateless JWT tokens stored in `localStorage`.
- Supabase Email Verification: SignUp triggers confirmation email; unverified users see a dedicated reminder screen with 1-click resend.

### Template Catalog & Bonus Features
- 8 pre-seeded SaaS templates across *CRM, Analytics, AI Tools, Developer Tools, E-Commerce, Project Management, Fintech, Customer Support*.
- Instant keyword search across title, description, and category.
- Dynamic category filter pills.
- Template details preview modal with included capability badges.
- 1-click favorites toggle with active visual feedback (filled heart, count badges).
- Protected `/favorites` route with redirect-back functionality.

---

## 5. Database Schema
- **`users`**: `id` (PK), `name`, `email` (Unique), `password`, `created_at`.
- **`templates`**: `id` (PK), `name`, `description`, `thumbnail_url`, `category`, `created_at`.
- **`favorites`**: `id` (PK), `user_id` (FK -> users.id), `template_id` (FK -> templates.id), `created_at`. Unique constraint on `(user_id, template_id)`.

---

## 6. How to Run Locally

```bash
# 1. Clone repository
git clone https://github.com/Baala-Murugan-K/fullstack-intern-task.git
cd fullstack-intern-task

# 2. Run backend (terminal 1)
cd server
npm install
npm run dev
# Server runs at http://localhost:5000 (auto-seeds database)

# 3. Run frontend (terminal 2)
cd ../client
npm install
npm run dev
# Frontend runs at http://localhost:5173

# 4. Run automated test suite
cd ../server
npm test
```
