# SARCG Portal - Current Architecture & Status


## 1. Database Configuration (Supabase & Prisma)

We are using **Supabase Pro** as our PostgreSQL database provider, managed via **Prisma**.

### Why do we have two Database URLs?
In our `.env` file, we explicitly use two different connection URLs:
- `DATABASE_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"`
- `DIRECT_URL="postgresql://postgres.[ID]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"`

**The Why:**
Because our backend is deployed on a **Serverless** architecture (Netlify Functions), every single API request spins up a new micro-server, connects to the database, and shuts down. If 2,000 students logged in at once, this would instantly exhaust standard PostgreSQL connection limits and crash the database. 

To solve this, `DATABASE_URL` connects to Supabase's **Connection Pooler** (Port `6543`). The pooler acts like a traffic cop, cleanly multiplexing thousands of incoming serverless requests over a small, safe number of actual database connections. 

However, Prisma's Migration engine (`prisma migrate deploy`) requires a persistent, locked connection to alter tables safely, which a pooler cannot provide. Therefore, we use `DIRECT_URL` (Port `5432`) strictly for running database migrations, while `DATABASE_URL` safely handles all live user traffic.

## 2. Serverless Compute & Billing

The application frontend and backend are deployed via **Netlify Pro**. 

### Understanding Compute Credits
Netlify uses "Compute Credits" to measure usage. A compute credit is consumed by two main things:
1. **Build Time:** The CI/CD pipeline compiling the React frontend and bundling the Node.js backend.
2. **Serverless Function Executions:** The time it takes for your API routes to process requests.

If you see compute credits being consumed immediately after launching (e.g., `0.7 credits`), this is almost entirely due to the **deployment build process** taking 1-2 minutes of heavy server compute. General user traffic (like logging in) consumes milliseconds of execution time, which equates to fractions of a penny. The system is built to scale gracefully without skyrocketing costs.

*(Note: Supabase Pro also uses "Compute Credits", but this refers to the fixed hourly cost of keeping your dedicated database server running 24/7).*

## 3. Real-time Notifications vs. Polling

Currently, the notification bell in the frontend updates via **"Smart Polling"**. 

**How it works:** 
Every 60 seconds, the frontend makes an API call to the backend to check for new notifications, *but only if the user is actively looking at the tab* (using `document.visibilityState`). If the tab is minimized, polling stops to save Netlify execution costs.

**Why not use database triggers (WebSockets)?**
Supabase offers a feature called **Supabase Realtime**, which uses WebSockets to instantly push database changes to the frontend. However, implementing this requires the frontend to establish a direct connection to the database. Because we are using a custom backend for Authentication (JWTs) instead of Supabase Auth, implementing direct frontend-to-database WebSockets securely would require extensive Row Level Security (RLS) configuration and custom token parsing. 

Therefore, the smart polling mechanism was chosen as the most secure, rapid, and cost-effective solution for the current architecture.

## 4. File Uploads (Supabase Storage)

Image and resume uploads are handled via **Supabase Storage**.

**The Setup:**
We use a public bucket named **`sarc-uploads`**. 
When a user uploads a file, the backend (using the `SUPABASE_SERVICE_KEY`) generates a secure signed URL, uploads the file, and then saves the final public URL to the database. 

**Why Public?**
The bucket must be set to "Public" in the Supabase dashboard so that the React frontend can render the images (like profile pictures and project thumbnails) via standard `<img>` tags without requiring complex authentication headers for every image request.
