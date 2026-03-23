# 🎧 Customer Support Management System - Architecture & Operations

This document details the inner workings of the **Customer Support Management System**, now powered by **FastAPI** and **SQLite**.

---

## 🏗️ System Architecture

The application follows a **Full-Stack Monolithic** pattern with a sleek, futuristic frontend and a robust asynchronous backend.

-   **Backend**: FastAPI (Python 3.10+)
-   **Database**: SQLite (via `sqlite3` driver)
-   **Frontend**: HTML5, Vanilla CSS (Glassmorphism), Bootstrap 5.3 (Utilities), Jinja2 (Templating)
-   **Session Management**: Starlette SessionMiddleware (signed cookies)

---

## 🛠️ Key Features

### 1. 🎫 Intelligent Ticketing
Customers can raise tickets without an account. The system auto-identifies returning customers by email. Priority levels (High, Medium, Low) steer the service level agreements.

### 2. 🔐 Multi-Role Security
The portal supports three distinct roles:
-   **Customers**: Can raise and track tickets.
-   **Agents**: Can reply to tickets and request password changes.
-   **Administrators**: Can assign tickets, manage the team, and view detailed analytics.

### 3. ⏰ SLA Management
When a ticket is assigned, a **Due Date** is automatically calculated:
-   **High**: 24 Hours
-   **Medium**: 48 Hours
-   **Low**: 72 Hours

### 4. 📊 Admin Analytics
The **Admin Report** provides real-time insights into:
-   Ticket resolution rates.
-   Average customer satisfaction (1-5 stars).
-   Agent performance metrics (tickets solved, average response time).

---

## 🚀 Deployment (Railway MySQL)

The application is now a **Hybrid Database System**. It intelligently detects its environment and switches between **MySQL** (for production on Railway) and **SQLite** (for local development).

### 1. Railway Setup
- Add a **MySQL** service to your Railway project.
- **IMPORTANT**: Go to the Railway MySQL **"Query"** tab and run the `setup_db.sql` script once to initialize all tables and constraints correctly for MySQL.
- The app will automatically connect using Railway's default environment variables (`MYSQLHOST`, `MYSQLUSER`, etc.).

### 2. Environment Variables
In the Railway dashboard, ensure these variables are defined:
- `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT` (Automatic)
- `SECRET_KEY`: A random string for session signing.
- `PORT`: (Automatic) Railway assigns this dynamically.

### 3. Local Development
If no `MYSQLHOST` is detected, the app defaults to using `support_portal.db` (SQLite) for zero-config local testing.

---

## 🛠️ Technology Stack
- **Backend**: FastAPI (Python 3.10+)
- **Database**: 
  - Production: MySQL (Railway)
  - Local: SQLite (via `sqlite3` driver)
- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), Jinja2 (Templating)
- **Deployment**: `Procfile` + `requirements.txt`

---

## 👥 Staff Accounts
The following accounts are pre-configured:

| Email | Password | Role |
| :--- | :--- | :--- |
| `admin@support.com` | `admin1234` | Administrator |
| `ganesh@support.com` | `ganesh123` | Agent |
| `rudransh@support.com` | `rudransh123` | Agent |
| `admin@example.com` | (None) | Administrator (First Login sets PW) |

---

## 🔄 FastAPI Migration & Hybrid DB
1.  **Asynchronous Handling**: FastAPI provides superior performance compared to Flask.
2.  **Environment Awareness**: The `main.py` script checks for Railway configurations and adjusts SQL syntax (e.g., `%s` vs `?`) and drivers automatically.
3.  **Unified Session Logic**: Using Starlette's `SessionMiddleware` for secure, signed sessions.
4.  **Auto-Initialization**: The `init_db` function handles table creation and seeding on both SQLite and MySQL platforms.
