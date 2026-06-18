# SARCG - Detailed Architecture & Tools Documentation

This document provides a comprehensive breakdown of the system architecture, design patterns, and all tools/libraries used in the **SARCG (Student Academic Research Collaboration)** platform.

---

## 1. High-Level System Architecture

SARCG follows a classic **Client-Server (Monolith API)** architecture:

- **Client Tier (Frontend)**: A Single Page Application (SPA) built with React.js that handles all user interactions, UI rendering, and client-side routing.
- **Application Tier (Backend)**: A Node.js and Express.js RESTful API that handles business logic, authentication, and data processing.
- **Data Tier (Database & Cache)**: 
  - **PostgreSQL**: The primary relational database, chosen for its robustness and data integrity.
  - **Redis**: Used as an in-memory data store for API rate limiting (and potentially caching).
- **Storage & Third-Party Services**:
  - **Supabase**: Utilized for scalable object/file storage (e.g., student resumes, profile pictures).
  - **Nodemailer**: Used for sending transactional emails (notifications, welcome emails).

---

## 2. Frontend Architecture & Tools (`sarc-frontend`)

The frontend is designed to be highly responsive, interactive, and performant. 

### Core Frameworks
* **React 18**: The core UI library used for building component-based interfaces.
* **Vite**: The build tool and development server, chosen over Create React App (CRA) for significantly faster Hot Module Replacement (HMR) and optimized production builds.

### State Management & Routing
* **React Router v6**: Manages client-side routing, enabling seamless navigation between Student, Faculty, and Admin dashboards without full page reloads.
* **@tanstack/react-query (v5)**: Handles asynchronous state management, server-state caching, and data fetching. It eliminates the need for complex Redux setups by automatically caching API responses and managing loading/error states.

### UI / UX & Styling
* **Tailwind CSS**: A utility-first CSS framework used for rapid UI development and ensuring a consistent design system.
* **Framer Motion**: Used for fluid animations, page transitions, and micro-interactions.
* **Lucide React**: Provides clean, scalable SVG icons used throughout the interface.
* **Recharts**: A charting library used to build analytics dashboards for Admins and Faculty (e.g., application statistics, user growth).
* **React Avatar Editor**: A utility component allowing users to upload, crop, and scale profile pictures before saving them.

### Utilities
* **XLSX**: Used for parsing and generating Excel spreadsheets (useful for Admins to bulk export student applications or faculty project lists).
* **ESLint & PostCSS**: Used for code linting and CSS preprocessing to maintain code quality.

---

## 3. Backend Architecture & Tools (`sarc-backend`)

The backend is built as a robust REST API using the MVC (Model-View-Controller) design pattern.

### Core Frameworks
* **Node.js**: JavaScript runtime environment for executing the server.
* **Express.js 5.x**: A minimal and flexible web application framework that provides a robust set of features for web and mobile APIs.

### Database & ORM
* **Prisma ORM**: A next-generation Node.js and TypeScript ORM. It provides a type-safe database client, schema migrations, and intuitive data modeling.
* **PostgreSQL**: The underlying relational database used to store users, projects, applications, and team structures.

### Authentication & Authorization
* **jsonwebtoken (JWT)**: Used for stateless user authentication. Upon login, users receive a JWT which is passed in the `Authorization` header for protected routes.
* **bcryptjs**: Used to securely hash and salt user passwords before storing them in the database.

### Security Middlewares
* **Helmet**: Secures the Express apps by setting various HTTP headers (e.g., X-Frame-Options, Content-Security-Policy).
* **CORS**: Middleware to enable Cross-Origin Resource Sharing, allowing the React frontend to securely request data from the backend.
* **xss-clean**: Sanitizes user input coming from POST body, GET queries, and URL params to prevent Cross-Site Scripting (XSS) attacks.
* **hpp**: Protects against HTTP Parameter Pollution attacks by ignoring repeated query string parameters.

### Performance & Rate Limiting
* **express-rate-limit**: Basic rate-limiting middleware to prevent brute-force attacks and DDoS.
* **rate-limit-redis** & **ioredis**: Uses a Redis datastore to store rate-limiting counters, which is essential for scaling across multiple Node.js processes.

### File Handling & External Services
* **@supabase/supabase-js**: The official Supabase client, likely used to interact with Supabase Storage buckets for uploading resumes and profile pictures.
* **multer** & **form-data**: Middleware for handling `multipart/form-data`, which is primarily used for uploading files.
* **nodemailer**: A module for Node.js apps to send emails easily (e.g., application status updates).

### Process Management & Deployment
* **PM2**: A production process manager for Node.js applications with a built-in load balancer.
* **serverless-http**: A module that allows wrapping the Express API for serverless deployments (e.g., AWS Lambda, Netlify Functions).

---

## 4. Application Data Flow (Example)

Here is a step-by-step example of how the tools interact when a student applies for a research project:

1. **User Action**: The student clicks "Apply" on the React frontend.
2. **State Trigger**: React Hook Form (or local state) validates the input. `@tanstack/react-query` fires a `mutation` function.
3. **Network Request**: A POST request containing form data and the user's JWT is sent to the Express API.
4. **Backend Routing**: Express router catches the request at `/api/applications`.
5. **Security & Auth**:
   - `helmet`, `cors`, `xss-clean` process the incoming headers and sanitize the body.
   - `authMiddleware` verifies the JWT.
   - `express-rate-limit` checks Redis if the user has made too many requests.
6. **Controller Logic**: The request reaches the `applicationController`.
7. **Database Transaction**: The controller uses `Prisma` to insert a new application record into `PostgreSQL`.
8. **External Service (Optional)**: If a resume file was attached, it is streamed to `Supabase Storage`.
9. **Response**: The controller sends a `201 Created` JSON response back to the client.
10. **UI Update**: `react-query` automatically invalidates the applications cache, fetching the updated list and updating the React UI instantly without a page reload.

---

## 5. Deployment Strategy

Based on the configuration files (`netlify.toml` and PM2):
- **Frontend**: Designed to be deployed on static hosting platforms like **Netlify** or **Vercel**. The `vite build` command generates optimized static assets.
- **Backend**: Can be deployed on a VPS (like AWS EC2, DigitalOcean) using **PM2** to manage the Node.js process, or as Serverless functions using the `serverless-http` wrapper.
- **Database**: PostgreSQL hosted either locally during development or on managed services (e.g., Supabase DB, AWS RDS) in production.
