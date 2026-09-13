# Job Recruitment Management System (JRMS)
### Academic DBMS Project — Full-Stack Web Application (DA1 / DA2)

A modern, full-stack database management web application built with **React (Vite + Tailwind CSS)**, **Node.js (Express.js)**, and **Oracle Database (oracledb)**.

The system strictly adheres to the relational design, functional dependency proofs, and BCNF normalization analysis from **DA1**, featuring **Three Distinct Actors** with strict Role-Based Access Control (RBAC):
1. **End User / Recruiter (`USER`)**
2. **Database Designer / Schema Architect (`DATABASE_DESIGNER`)**
3. **Database Administrator (`DBA`)**

---

## 🌟 Key Highlights & Academic Features

- **41 Normalized Relational Tables**: Full lossless join and dependency preserving BCNF decomposition of Candidate, Job, Education, Experience, Location, and Application entities.
- **Three Separate Dashboards & Portals**: Dynamically rendered navigation and server-side RBAC enforcement.
- **Live Oracle Metadata Inspection**: Dynamic queries on `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`, `USER_INDEXES`, and `USER_OBJECTS`.
- **Interactive ER Schema Viewer**: Clickable entity-relationship graph visualizing foreign key linkages, cascades, and column schemas.
- **Dual-Mode Resilient Database Layer**: Direct connection to live Oracle Database via `oracledb` Thin Mode with automatic fallback simulation preloaded with exact DA1 records if the listener is offline.
- **Security & Integrity**: BCrypt password hashing, JWT authorization, parameterized SQL queries (SQL injection immune), and system audit logging.

---

## 👥 Three Actors & Default Credentials

| Actor Role | Username | Password | Purpose & Scope |
| :--- | :--- | :--- | :--- |
| **USER** | `recruiter` | `User@123` | Recruitment portal: Candidates directory, job postings, applications pipeline, interview schedules, employer directory, skill catalog, analytics reports. |
| **DATABASE_DESIGNER** | `designer` | `Designer@123` | Schema architecture: Live `USER_TABLES`, column definitions, primary & foreign keys, constraints matrix, interactive ER diagram, and BCNF proof explanations. |
| **DBA** | `dba_admin` | `Dba@123` | Database administration: Schema objects (`USER_OBJECTS`), user/role management, index performance, constraint integrity diagnostics, and maintenance. |

*(A 1-click Quick Role Switcher is available in both the Login Page and Topbar for easy viva presentation)*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router DOM v6, Axios
- **Backend**: Node.js, Express.js, `oracledb` Thin Mode driver, JWT, BCryptJS, CORS, Dotenv
- **Database**: Oracle Database 23c / 21c / 19c / XE / Free

---

## 📁 Project Architecture

```
d:\dbms da2\
├── backend/
│   ├── controllers/         # REST API Controllers (Auth, Candidate, Job, Designer, DBA, etc.)
│   ├── routes/              # Express API Route Handlers with RBAC middleware
│   ├── middleware/          # JWT Authentication & Role Authorization guards
│   ├── services/            # System audit trail logger
│   ├── db/
│   │   ├── oracle.js        # oracledb pool initializer & parameterized executor
│   │   ├── seedData.js      # Complete DA1 dataset
│   │   └── inMemoryDb.js    # Resilient relational engine
│   ├── .env.example
│   ├── server.js            # Express server entry point (Port 5000)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # StatCard, Badge, Button, Modal, Loader
│   │   │   └── layouts/     # AppLayout, Sidebar, Topbar, RoleBadge
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── pages/
│   │   │   ├── Login/       # LoginPage with 1-click actor selector
│   │   │   ├── user/        # UserDashboard, Candidates, Jobs, Applications, Interviews, etc.
│   │   │   ├── designer/    # DesignerDashboard, Tables, Columns, ER Diagram, BCNF Guide
│   │   │   └── dba/         # DbaDashboard, Objects, UsersRoles, Indexes, Diagnostics
│   │   ├── services/        # Axios API client with JWT interceptor
│   │   ├── App.jsx          # Protected route declarations by role
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js       # Vite dev server proxy (Port 3000 -> 5000)
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   ├── schema.sql           # Oracle DDL: 41 normalized relations + APP_USERS + APP_AUDIT_LOG
│   ├── seed.sql             # Oracle DML: DA1 sample data insertion
│   └── README.md
│
├── DA2_complete_oracle.sql  # Original reference script
└── README.md
```

---

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **Oracle Database** (Optional for live execution; built-in relational engine runs automatically if Oracle is offline)

### 2. Backend Setup
```bash
cd backend
npm install

# Start the Backend Server (Runs on http://localhost:5000)
npm start
# OR for live code reloading:
npm run dev
```

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install

# Start Vite Development Server (Runs on http://localhost:3000)
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🔐 Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

# Oracle DB Connection
ORACLE_USER=system
ORACLE_PASSWORD=oracle
ORACLE_CONNECT_STRING=localhost:1521/XE
ORACLE_POOL_MIN=2
ORACLE_POOL_MAX=10
ORACLE_POOL_INCREMENT=2

# Security
JWT_SECRET=super_secret_jwt_key_for_job_recruitment_system_2026
JWT_EXPIRES_IN=8h
```

---

## 🎓 Academic Viva Cheat Sheet

### Q1: Why are tables decomposed instead of keeping a single large relation?
> **Answer**: To eliminate redundancy, update anomalies, insertion anomalies, and deletion anomalies caused by partial and transitive functional dependencies. For example, in the `Job` relation, `job_title -> closing_date, posted_date` represents a partial dependency on non-key attributes, violating BCNF. We decomposed it into `Job(job_key, job_id, job_status, salary)`, `Job_Details(job_key, job_title, descriptive)`, and `Job_Posting(job_title, closing_date, posted_date)`.

### Q2: Why were some relations NOT decomposed?
> **Answer**: Following our DA1 FD analysis, relations like `Dependent(dep_id, dob, relationship)` and subtype tables (`Freelancer`, `Fresher`, `Experienced`) have all non-trivial functional dependencies `X -> Y` where `X` is already a superkey. Decomposing relations that are already in BCNF would needlessly introduce join overhead without any normalization benefit.

### Q3: How does the application enforce Role-Based Access Control?
> **Answer**: RBAC is enforced both on the client via React Router guards and on the server via Express middleware (`authenticateUser` and `requireRole(...)`). For instance, if a user logged in as `USER` attempts to access `GET /api/dba/dashboard` or `PUT /api/dba/users`, the backend rejects the request with HTTP `403 Forbidden`.

### Q4: How is database metadata queried in real time?
> **Answer**: The Database Designer and DBA portals query Oracle data dictionary views such as `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`, `USER_CONS_COLUMNS`, and `USER_INDEXES`, ensuring that table counts and schema statistics reflect the real database state.
