# Job Recruitment Management System (JRMS)
### Relational Database Design, BCNF Normalization & Multi-Actor Management System

A full-stack enterprise web application and relational database system built for an academic Database Management Systems (DBMS) project. The application models an end-to-end recruitment lifecycle across candidates, job openings, applications, interviews, employers, and skill sets, backed by **Oracle Database 23c Free** and a **BCNF-decomposed 41-table schema**.

---

### 🌐 Live Deployment & Repository

- **Live Web Application:** [job-recruitment-management-system.vercel.app](https://job-recruitment-management-system.vercel.app/)
- **GitHub Repository:** [SAUBHGYA7/job-recruitment-management-system](https://github.com/SAUBHGYA7/job-recruitment-management-system)

---

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Three-Actor Access Control (RBAC)](#three-actor-access-control-rbac)
- [Relational Schema & BCNF Decomposition](#relational-schema--bcnf-decomposition)
  - [Entity Relationship Structure](#entity-relationship-structure)
  - [41 Decomposed Relations](#41-decomposed-relations)
  - [BCNF Normalization Proofs](#bcnf-normalization-proofs)
  - [Non-Decomposed Subtypes & Entities](#non-decomposed-subtypes--entities)
- [Tech Stack](#tech-stack)
- [Key Features by Actor](#key-features-by-actor)
  - [1. Recruiter / End User Portal](#1-recruiter--end-user-portal)
  - [2. Database Designer Portal](#2-database-designer-portal)
  - [3. Database Administrator (DBA) Console](#3-database-administrator-dba-console)
- [REST API Endpoints](#rest-api-endpoints)
- [Directory Structure](#directory-structure)
- [Local Installation & Setup](#local-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Database Initialization](#step-2-database-initialization)
  - [Step 3: Backend Setup](#step-3-backend-setup)
  - [Step 4: Frontend Setup](#step-4-frontend-setup)
- [Environment Configuration](#environment-configuration)
- [Hybrid Cloud Deployment Architecture](#hybrid-cloud-deployment-architecture)
- [Security & Integrity Measures](#security--integrity-measures)
- [Academic Defense / Viva Reference](#academic-defense--viva-reference)

---

## Project Overview

In standard corporate recruitment platforms, relational schemas are often denormalized, leading to update anomalies, redundant column storage, and data integrity discrepancies. 

This project solves those challenges by implementing a rigorous relational database schema that has been methodically normalized into **Boyce-Codd Normal Form (BCNF)** from initial functional dependency (FD) analysis. The application couples this normalized schema with an engineering-grade management console, allowing three distinct personas—**Recruiters**, **Database Designers**, and **Database Administrators**—to interact with data, inspect data dictionaries, and execute administrative maintenance tasks.

### Core Objectives
1. **Academic Rigor:** Translate functional dependencies and minimal covers into a 41-table BCNF schema without losing dependencies or lossless join guarantees.
2. **Real-time Dictionary Introspection:** Query live Oracle internal metadata catalog views (`USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`, `USER_INDEXES`, `USER_OBJECTS`).
3. **Role-Based Workflows:** Enforce complete boundary separation between operational recruitment workflows, schema architectural analysis, and database instance monitoring.
4. **Resilient Data Access:** Implement a dual-mode communication layer supporting live Oracle connections (Thin Driver over TCP/Cloudflare tunnel) and a state-persisted browser storage fallback for cloud-hosted evaluation.

---

## System Architecture

The project employs a decoupled 3-tier client-server architecture with an administrative reverse proxy:

```text
+-------------------------------------------------------------------------+
|                           Client Web Browser                            |
|             React 18 + Vite SPA | Tailwind CSS Console Theme             |
|   ┌───────────────────────┬───────────────────────┬─────────────────┐   |
|   │ Recruiter Portal      │ Schema Designer Tools │ DBA Web Console │   |
|   └───────────────────────┴───────────────────────┴─────────────────┘   |
+-------------------------------------------------------------------------+
                                     │
                                     │ HTTPS / JSON REST API
                                     ▼
+-------------------------------------------------------------------------+
|                  Vercel Edge Platform / API Gateway                     |
|   - Static SPA Distribution (HTML, JS, CSS bundles)                     |
|   - API Reverse Proxy (/api/* -> Tunnel / Node Backend)                 |
+-------------------------------------------------------------------------+
                                     │
                                     │ Secure Tunnel (cloudflared / TLS)
                                     ▼
+-------------------------------------------------------------------------+
|                         Node.js Express Backend                         |
|   ┌─────────────────────────────────────────────────────────────────┐   |
|   │ - REST API Controllers (User, Designer, DBA, Auth)              │   |
|   │ - RBAC Authentication Middleware (JWT + Bcrypt)                 │   |
|   │ - Parameterized SQL Query Engine & Input Sanitizer              │   |
|   │ - Audit Trail Logger Service (APP_AUDIT_LOG)                    │   |
|   └────────────────────────────────┬────────────────────────────────┘   |
|                                    │ oracledb Driver (Thin Mode)        |
|                                    ▼                                    |
|   ┌─────────────────────────────────────────────────────────────────┐   |
|   │                   Oracle Database 23c Free                      |   |
|   │  - 41 BCNF Relational Tables                                    │   |
|   │  - Referential Integrity Constraints (P, R, C, U)               │   |
|   │  - Triggers & Sequences (APP_USERS, APP_AUDIT_LOG)              │   |
|   │  - System Data Dictionary (USER_TABLES, USER_TAB_COLUMNS)       │   |
|   └─────────────────────────────────────────────────────────────────┘   |
+-------------------------------------------------------------------------+
```

---

## Three-Actor Access Control (RBAC)

The system isolates operations into three roles, each with strict server-side and client-side guards:

| Actor Role | Default Username | Default Password | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **End User / Recruiter (`USER`)** | `recruiter` | `User@123` | Pipeline execution: candidate sourcing, job opening management, interview coordination, hiring reports. |
| **Database Designer (`DATABASE_DESIGNER`)** | `designer` | `Designer@123` | Schema governance: inspect relations, foreign key cascades, column catalogs, functional dependency proofs. |
| **Database Administrator (`DBA`)** | `dba_admin` | `Dba@123` | Instance administration: SQL console, index storage, constraint diagnostics, audit logs, optimizer maintenance. |

*Quick-role selector buttons are integrated into the login screen to allow rapid switching during presentations without credential re-entry.*

---

## Relational Schema & BCNF Decomposition

### Entity Relationship Structure

```text
       ┌──────────────┐
       │   EMPLOYER   │◄────────────────┐
       └──────┬───────┘                 │
              │ 1:N                     │ 1:N
              ▼                         │
         ┌─────────┐              ┌─────┴──────┐
         │   JOB   │◄─────────────┤  APPLIES   │
         └────┬────┘       M:N    └─────┬──────┘
              │ 1:N                     │
              ▼                         ▼
        ┌───────────┐             ┌───────────┐
        │ REQUIRES  │             │ CANDIDATE │
        └─────┬─────┘             └─────┬─────┘
              │ M:N                     │
              ▼                         ├───────────────┬───────────────┐
         ┌─────────┐                    ▼               ▼               ▼
         │  SKILL  │◄────────────  ┌─────────┐    ┌───────────┐   ┌───────────┐
         └─────────┘     (HAS)     │EDUCATION│    │EXPERIENCE │   │ INTERVIEW │
                                   └─────────┘    └───────────┘   └───────────┘
```

---

### 41 Decomposed Relations

The database comprises **41 relations** organized into cohesive domains:

| Domain | Relations | Primary Key | Key Attributes & Foreign Keys |
| :--- | :--- | :--- | :--- |
| **Candidate Core** | `Candidate` | `cand_id` | `fname`, `lname`, `dob`, `gender`, `reg_date`, `edu_id`, `app_id`, `dep_id`, `int_id` |
| | `Candidate_Address` | `cand_id` | `house_no`, `city`, `street` $\to$ FK to `Candidate` |
| | `Candidate_Email` | `(cand_id, email)` | Composite key supporting multi-valued emails |
| | `Candidate_Phone` | `(cand_id, phone)` | Composite key supporting multi-valued phone numbers |
| **Job Core** | `Job` | `job_key` | `job_id`, `job_status`, `salary` |
| | `Job_Details` | `job_key` | `job_title`, `descriptive` $\to$ FK to `Job` |
| | `Job_Posting` | `job_title` | `closing_date`, `posted_date` (Eliminates partial FD) |
| **Application Core** | `Application` | `app_id` | `app_status`, `final_result` |
| | `Application_Date` | `app_date` | `commencement_date`, `deadline` |
| | `Application_Info` | `app_id` | `app_date`, `app_type` $\to$ FK to `Application` |
| **Education Core** | `Education` | `edu_id` | `cgpa`, `specialization` |
| | `Education_Degree`| `degree` | `university`, `start_year` (Decomposed from partial FD) |
| | `Education_End` | `(edu_id, degree)`| `end_year` $\to$ Composite associative table |
| **Experience Core** | `Experience` | `exp_id` | `years_of_exp` |
| | `Experience_Candidate` | `exp_id` | `cand_id`, `start_date`, `end_date` $\to$ FK to `Candidate` |
| | `Experience_Company` | `(comp_name, job_title, end_date)` | `end_date` |
| | `Experience_Link` | `(exp_id, comp_name, job_title, end_date)` | Bridge between Candidate experience and company roles |
| **Geographic Core** | `Location` | `pincode` | `country`, `state` |
| | `State_City` | `state` | `city` (Eliminates transitive FD: `pincode -> state -> city`) |
| **Family & Interview**| `Dependent` | `dep_id` | `dob`, `relationship` (Intact BCNF entity) |
| | `Interview` | `int_id` | `int_date`, `int_time` |
| | `Interview_Details` | `int_id` | `int_mode`, `location`, `int_status`, `score`, `feedback` |
| **Employer Domain** | `Employer` | `emp_id` | `company_name`, `founded_year` |
| | `Employer_Details` | `emp_id` | `headquarter`, `company_mail`, `website` |
| | `Employer_Phone` | `(emp_id, phone_no)` | Multi-valued corporate phone numbers |
| | `Company` | `comp_id` | `market_cap`, `tax_id` |
| | `Company_Employer` | `(comp_id, emp_id)` | Associative link between legal corporations and employer units |
| | `Recruitment_Agency` | `agency_no` | `agency_name` |
| | `Recruitment_License` | `emp_id` | `license_no` |
| | `Recruitment` | `(emp_id, agency_no)` | Agency representation link |
| **Skills & Matching** | `Skill` | `skill_id` | `skill_category` |
| | `Skill_Details` | `skill_name` | `skill_id`, `description` |
| | `Requires` | `(job_key, skill_id)` | `min_experience`, `is_mandatory` |
| | `Has` | `(cand_id, skill_id)` | `pgd_level`, `years_of_exp` |
| | `Matched_To` | `match_id` | `cand_id`, `job_key`, `match_percentage`, `generated_at` |
| | `Applies` | `(cand_id, job_key)` | Associative application link |
| | `Prefers` | `(pincode, cand_id)` | Location preferences |
| | `Refers` | `(cand_id, referral_date)` | `referrer_id` employee referrals |
| | `Assessed_For` | `(cand_id, job_key, skill_id)` | `ass_date`, `ass_score`, `match_per` |
| **Candidate Subtypes** | `Freelancer` | `cand_id` | `hourly_rate`, `portfolio_url` |
| | `Fresher` | `cand_id` | `college_rank`, `internship_months` |
| | `Experienced` | `cand_id` | `current_ctc`, `notice_period_days` |
| **Security & Auditing**| `APP_USERS` | `user_id` | `username`, `password_hash`, `full_name`, `role`, `is_active` |
| | `APP_AUDIT_LOG` | `log_id` | `username`, `role`, `action`, `details`, `created_at` |

---

### BCNF Normalization Proofs

A relational schema $R$ is in **Boyce-Codd Normal Form (BCNF)** if and only if, for every non-trivial functional dependency $X \to Y$, the determinant $X$ is a **Superkey** of $R$.

#### 1. JOB Decomposition
- **Initial Relation:** `Job_Original(job_key, job_id, job_status, salary, job_title, descriptive, closing_date, posted_date)`
- **Functional Dependencies:**
  - $FD_1: \text{job\_key} \to \text{job\_id}, \text{job\_status}, \text{salary}, \text{job\_title}, \text{descriptive}$
  - $FD_2: \text{job\_title} \to \text{closing\_date}, \text{posted\_date}$
- **Violation:** In $FD_2$, $\text{job\_title}$ is not a superkey of `Job_Original`.
- **BCNF Decomposition:**
  1. `Job(job_key, job_id, job_status, salary)` with primary key $\text{job\_key}$.
  2. `Job_Details(job_key, job_title, descriptive)` with primary key $\text{job\_key}$.
  3. `Job_Posting(job_title, closing_date, posted_date)` with primary key $\text{job\_title}$.
- **Verification:** In each decomposed relation, the determinant of every non-trivial FD is a superkey.

#### 2. CANDIDATE Address & Multi-Valued Attributes
- **Initial Relation:** `Candidate_Original(cand_id, fname, lname, house_no, city, street, phone, email, ...)`
- **Violations:** Multi-valued phone numbers and emails violate 1NF. Address attributes depend on `cand_id` but have internal spatial cohesion.
- **BCNF Decomposition:**
  1. `Candidate(cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)`
  2. `Candidate_Address(cand_id, house_no, city, street)`
  3. `Candidate_Phone(cand_id, phone)` (Composite PK: `cand_id + phone`)
  4. `Candidate_Email(cand_id, email)` (Composite PK: `cand_id + email`)

#### 3. LOCATION Transitive Dependency
- **Functional Dependencies:** $\text{pincode} \to \text{state}$, and $\text{state} \to \text{city}$.
- **Violation:** $\text{pincode} \to \text{city}$ is transitive via $\text{state}$. $\text{state} \to \text{city}$ has determinant $\text{state}$, which is not a superkey of the full location relation.
- **BCNF Decomposition:**
  1. `Location(pincode, country, state)` with PK $\text{pincode}$.
  2. `State_City(state, city)` with PK $\text{state}$.

---

### Non-Decomposed Subtypes & Entities

Certain entities were preserved without decomposition:
1. **`Dependent(dep_id, dob, relationship)`**: All non-trivial dependencies have `dep_id` as the determinant. Since `dep_id` is the primary key, it satisfies BCNF.
2. **Specialization Subtypes (`Fresher`, `Experienced`, `Freelancer`)**: Each subtype maintains a $1:1$ disjoint relationship with `Candidate` via foreign key `cand_id`. Their attributes are fully functionally dependent on `cand_id`, requiring no further decomposition.

---

## Tech Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS | Single Page Application styled with an engineering console theme |
| **Icons & Visuals** | Lucide React, Recharts | Data visualizations, trend charts, and interface iconography |
| **Client Routing** | React Router DOM v6 | Protected route guards enforcing actor access permissions |
| **Backend Runtime** | Node.js (v18+), Express.js | Modular REST API service |
| **Database Driver** | `oracledb` (v6.7+, Thin Mode) | High-performance direct connection driver to Oracle Database |
| **Database Engine** | Oracle Database 23c Free | Enterprise relational database running in containerized environment |
| **Security & Auth** | JSON Web Tokens (JWT), BCrypt.js | Cryptographic password hashing and stateless authorization headers |
| **Network Gateway** | Cloudflare Tunnel (`cloudflared`) | Secure TLS tunnel mapping localhost Oracle backend to cloud endpoints |
| **Deployment** | Vercel | Production CDN edge hosting with client-side proxying |

---

## Key Features by Actor

### 1. Recruiter / End User Portal
- **Dashboard Metrics:** Summary statistics on active candidates, open jobs, pending applications, and interviews.
- **Candidate Pipeline:** Full CRUD interface for candidate records with real-time field validation (name, email, phone, address).
- **Job Requisitions:** Post and manage jobs, inspect salary bands, closing dates, and required skills.
- **Applications & Interviews:** Track application stages (`Applied`, `Screening`, `Interviewing`, `Offered`, `Rejected`) and schedule interview panels with scoring metrics.
- **Employer Directory:** Maintain corporate profiles, headquarters, and licensing data.
- **Skill Gap Reports:** Aggregated charts comparing market job skill requirements against candidate skill supply.

### 2. Database Designer Portal
- **Tables Catalog (`USER_TABLES`):** Real-time table browser listing all 41 relations, table storage sizes, primary keys, and foreign key counts.
- **Table Detail Inspector:** Inspect exact column data types, precision, scale, nullability flags, and live sample rows.
- **Columns Catalog (`USER_TAB_COLUMNS`):** Search and filter column names across all relations in the schema.
- **Keys & References:** Primary Key viewer (`USER_CONSTRAINTS WHERE constraint_type = 'P'`) and Foreign Key integrity viewer (`constraint_type = 'R'`).
- **Constraint Matrix:** Unified interface auditing check constraints (`C`) and unique constraints (`U`).
- **Interactive Relational Schema Graph:** Visual diagram displaying entity associations and foreign key cascades.
- **BCNF Proof Documentation:** Academic reference detailing functional dependency covers and decomposition proofs.

### 3. Database Administrator (DBA) Console
- **Instance Overview:** Summary of active users, tablespace utilization (`SYSTEM`, `SYSAUX`, `USERS`, `TEMP`), and object distribution.
- **SQL Query Console:** Web terminal for executing custom SQL `SELECT` queries directly against Oracle dictionary views or application tables with formatted result grids.
- **Database Objects (`USER_OBJECTS`):** Real-time census of tables, indexes, views, triggers, and sequences.
- **Role-Based Access Management (RBAC):** List active database users and system privileges.
- **Indexes & Storage:** Review index uniqueness (`UNIQUE` vs `NONUNIQUE`) and associated tables.
- **Constraint Health Diagnostics:** Audit orphan foreign keys, disabled constraints, and validation states.
- **Audit Logging:** System security log tracking logins, schema modifications, and data alterations.
- **Maintenance Operations:** Trigger optimizer statistics collection (`DBMS_STATS.GATHER_SCHEMA_STATS`) and tablespace verification.

---

## REST API Endpoints

All responses follow a uniform JSON structure:
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Operation completed successfully"
}
```

### Authentication Endpoints
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns signed JWT token |
| `GET` | `/api/auth/me` | Authenticated | Returns currently authenticated user context |

### User / Recruiter Endpoints
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/dashboard` | `USER`, `DESIGNER`, `DBA` | Aggregated recruitment metrics and status counts |
| `GET`, `POST` | `/api/candidates` | `USER`, `DESIGNER`, `DBA` | List candidates / Create a new candidate |
| `GET`, `DELETE` | `/api/candidates/:id` | `USER`, `DESIGNER`, `DBA` | Get candidate profile / Delete candidate |
| `GET`, `POST` | `/api/jobs` | `USER`, `DESIGNER`, `DBA` | List jobs / Post a new job requisition |
| `GET`, `DELETE` | `/api/jobs/:id` | `USER`, `DESIGNER`, `DBA` | Get job details / Delete job requisition |
| `GET`, `POST` | `/api/applications` | `USER`, `DESIGNER`, `DBA` | List applications / Submit candidate application |
| `GET`, `DELETE` | `/api/applications/:id` | `USER`, `DESIGNER`, `DBA` | Get application details / Delete application |
| `GET`, `POST` | `/api/interviews` | `USER`, `DESIGNER`, `DBA` | List interviews / Schedule interview |
| `GET`, `DELETE` | `/api/interviews/:id` | `USER`, `DESIGNER`, `DBA` | Get interview score / Cancel interview |
| `GET`, `POST` | `/api/employers` | `USER`, `DESIGNER`, `DBA` | List employers / Register employer company |
| `GET`, `DELETE` | `/api/employers/:id` | `USER`, `DESIGNER`, `DBA` | Get employer details / Remove employer |
| `GET`, `POST` | `/api/skills` | `USER`, `DESIGNER`, `DBA` | List skills / Add skill to catalog |
| `GET`, `DELETE` | `/api/skills/:id` | `USER`, `DESIGNER`, `DBA` | Get skill details / Remove skill |
| `GET` | `/api/reports/user` | `USER`, `DESIGNER`, `DBA` | Analytical reports on hiring and skill gaps |

### Database Designer Endpoints
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/designer/dashboard` | `DESIGNER`, `DBA` | Schema entity totals and decomposition status |
| `GET` | `/api/designer/tables` | `DESIGNER`, `DBA` | Query `USER_TABLES` with PK, FK, and row counts |
| `GET` | `/api/designer/tables/:name` | `DESIGNER`, `DBA` | Column types, precision, nullability, and sample rows |
| `GET` | `/api/designer/columns` | `DESIGNER`, `DBA` | Search columns across `USER_TAB_COLUMNS` |
| `GET` | `/api/designer/primary-keys` | `DESIGNER`, `DBA` | Query primary key constraints and column sets |
| `GET` | `/api/designer/foreign-keys` | `DESIGNER`, `DBA` | Query foreign keys and reference cascades |
| `GET` | `/api/designer/constraints` | `DESIGNER`, `DBA` | Query check, unique, and integrity constraints |
| `GET` | `/api/designer/relationships` | `DESIGNER`, `DBA` | Foreign key dependency matrix for graph rendering |
| `GET` | `/api/designer/normalization` | `DESIGNER`, `DBA` | BCNF proof metadata and decomposition rationale |

### Database Administrator (DBA) Endpoints
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dba/dashboard` | `DBA` | Instance health, tablespace usage, object counts |
| `POST` | `/api/dba/execute-sql` | `DBA` | Execute custom query via parameterized console |
| `GET` | `/api/dba/tables` | `DBA` | Instance tablespace allocation and table status |
| `GET` | `/api/dba/objects` | `DBA` | Grouped breakdown of `USER_OBJECTS` |
| `GET` | `/api/dba/users` | `DBA` | System users and assigned RBAC privileges |
| `GET` | `/api/dba/indexes` | `DBA` | Index health and uniqueness definitions |
| `GET` | `/api/dba/constraints-health`| `DBA` | Referential integrity and constraint health |
| `GET` | `/api/dba/statistics` | `DBA` | Query optimizer statistics and table row counts |
| `GET` | `/api/dba/audit-log` | `DBA` | Query security and operational audit trail |
| `POST` | `/api/dba/maintenance` | `DBA` | Run schema maintenance or stats gathering |

---

## Directory Structure

```text
job-recruitment-management-system/
├── backend/
│   ├── controllers/            # Express controllers handling business logic
│   │   ├── authController.js
│   │   ├── candidateController.js
│   │   ├── jobController.js
│   │   ├── applicationController.js
│   │   ├── interviewController.js
│   │   ├── employerController.js
│   │   ├── skillController.js
│   │   ├── designerController.js
│   │   ├── dbaController.js
│   │   └── userDashboardController.js
│   ├── routes/                 # REST API route declarations
│   │   ├── authRoutes.js
│   │   ├── candidateRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── interviewRoutes.js
│   │   ├── employerRoutes.js
│   │   ├── skillRoutes.js
│   │   ├── designerRoutes.js
│   │   ├── dbaRoutes.js
│   │   └── reportsRoutes.js
│   ├── middleware/             # Security and role authorization guards
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── roleMiddleware.js   # RBAC enforcement
│   ├── db/
│   │   ├── oracle.js           # oracledb connection pool & query executor
│   │   ├── inMemoryDb.js       # Resilient relational data engine
│   │   └── seedData.js         # Standard academic seed records
│   ├── services/
│   │   └── auditService.js     # Audit log insertion service
│   ├── server.js               # Express server entry point (Port 5000)
│   ├── .env.example            # Backend configuration template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI component library
│   │   │   ├── common/         # StatCard, Badge, Button, Modal, Loader
│   │   │   └── layouts/        # AppLayout, Sidebar, Topbar
│   │   ├── context/            # React Context providers (AuthContext, ToastContext)
│   │   ├── pages/              # Portal page views
│   │   │   ├── Login/          # Direct role-selector authentication page
│   │   │   ├── user/           # Recruiter views (Candidates, Jobs, Applications...)
│   │   │   ├── designer/       # Designer views (Tables, Columns, Keys, BCNF...)
│   │   │   └── dba/            # DBA views (SQL Console, Objects, Users, Indexes...)
│   │   ├── services/
│   │   │   ├── api.js          # Axios client with fallback sync interceptors
│   │   │   └── mockDb.js       # Cloud browser data store and mock dictionary
│   │   ├── utils/
│   │   │   └── validation.js   # Client-side input validation utilities
│   │   ├── App.jsx             # React Router hierarchy and role route guards
│   │   ├── index.css           # Global stylesheet (Console engineering theme)
│   │   └── main.jsx
│   ├── vite.config.js          # Vite configuration with local API proxy
│   ├── tailwind.config.js      # Palette configurations (Deep Slate, Steel, Oracle)
│   ├── vercel.json             # Vercel rewrite configuration for API proxying
│   └── package.json
│
├── database/
│   ├── schema.sql              # Complete Oracle DDL: 41 tables, triggers, sequences
│   ├── seed.sql                # Complete Oracle DML: 25+ records per relation
│   └── README.md
│
├── vercel.json                 # Root deployment configuration
├── package.json                # Project root workspace scripts
└── README.md                   # Comprehensive system documentation
```

---

## Local Installation & Setup

Follow these instructions to run the full stack locally with or without a local Oracle Database instance.

### Prerequisites
- **Node.js:** v18.x or higher ([Download Node.js](https://nodejs.org/))
- **npm:** v9.x or higher
- **Oracle Database (Optional for live DB):** Oracle Database 23c Free, 21c XE, or 19c Enterprise
- **Git:** Version control client

---

### Step 1: Clone Repository

```bash
git clone https://github.com/SAUBHGYA7/job-recruitment-management-system.git
cd job-recruitment-management-system
```

---

### Step 2: Database Initialization (Optional if Oracle installed)

1. Open your terminal and connect to your Oracle Database container or instance as `SYSDBA`:
   ```bash
   sqlplus sys/your_password@localhost:1521/FREEPDB1 as sysdba
   ```
2. Create the application user and assign required privileges:
   ```sql
   CREATE USER C##RECRUIT IDENTIFIED BY "Recruit#2026";
   GRANT CONNECT, RESOURCE, DBA TO C##RECRUIT;
   GRANT UNLIMITED TABLESPACE TO C##RECRUIT;
   EXIT;
   ```
3. Execute the schema DDL and comprehensive seed dataset:
   ```bash
   cd database
   sqlplus C##RECRUIT/"Recruit#2026"@localhost:1521/FREEPDB1 @schema.sql
   sqlplus C##RECRUIT/"Recruit#2026"@localhost:1521/FREEPDB1 @seed.sql
   cd ..
   ```

*Note: If Oracle Database is not installed locally, the backend automatically transitions to its built-in relational engine pre-populated with exact seed data.*

---

### Step 3: Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
3. Configure your database connection parameters in `backend/.env`:
   ```ini
   PORT=5000
   NODE_ENV=development

   # Oracle Database Configuration
   ORACLE_USER=C##RECRUIT
   ORACLE_PASSWORD=Recruit#2026
   ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1
   ORACLE_POOL_MIN=2
   ORACLE_POOL_MAX=10
   ORACLE_POOL_INCREMENT=2

   # Security
   JWT_SECRET=super_secret_jwt_key_for_job_recruitment_system_2026
   JWT_EXPIRES_IN=8h
   ```
4. Start the backend service:
   ```bash
   npm start
   # Or with hot-reloading:
   npm run dev
   ```
   The backend will boot on `http://localhost:5000`.

---

### Step 4: Frontend Setup

1. Open a new terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## Environment Configuration

Summary of all environment variables supported by the backend:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP port on which the Express server listens | `5000` |
| `NODE_ENV` | Application environment mode | `development` or `production` |
| `ORACLE_USER` | Oracle schema username | `C##RECRUIT` or `system` |
| `ORACLE_PASSWORD` | Oracle schema password | `Recruit#2026` |
| `ORACLE_CONNECT_STRING` | Oracle TNS connect descriptor | `localhost:1521/FREEPDB1` |
| `ORACLE_POOL_MIN` | Minimum connections in Oracle connection pool | `2` |
| `ORACLE_POOL_MAX` | Maximum connections in Oracle connection pool | `10` |
| `ORACLE_POOL_INCREMENT` | Connection pool allocation increment | `2` |
| `JWT_SECRET` | Cryptographic secret for signing auth tokens | Any 32+ character random string |
| `JWT_EXPIRES_IN` | Token validity timeframe | `8h` |

---

## Hybrid Cloud Deployment Architecture

To bridge cloud hosting platforms (such as Vercel) with an on-premises or containerized Oracle Database, the application uses an enterprise reverse-proxy configuration:

```text
                  +──────────────────────────────+
                  |         User Browser         |
                  +──────────────┬───────────────+
                                 │
                                 │ HTTPS
                                 ▼
                  +──────────────────────────────+
                  |       Vercel Deployment      |
                  |  - Serves compiled React SPA |
                  |  - Proxy rewrite on /api/*   |
                  +──────────────┬───────────────+
                                 │
                                 │ HTTPS via Cloudflare Tunnel
                                 ▼
                  +──────────────────────────────+
                  |       cloudflared Daemon     |
                  |     (TLS Ingress Gateway)    |
                  +──────────────┬───────────────+
                                 │
                                 │ Local HTTP (Port 5000)
                                 ▼
                  +──────────────────────────────+
                  |        Node.js Backend       |
                  |     (Express + oracledb)     |
                  +──────────────┬───────────────+
                                 │
                                 │ Oracle SQL*Net (Port 1521)
                                 ▼
                  +──────────────────────────────+
                  |    Oracle 23c Free DB        |
                  |     (Service: FREEPDB1)      |
                  +──────────────────────────────+
```

1. **Frontend on Vercel:** Serves pre-built static assets. Network requests to `/api/:path*` are proxied via `vercel.json` rewrite rules.
2. **Cloudflare Tunnel:** Secures transit between Vercel and the backend server without requiring open inbound router ports or static IP addresses.
3. **Graceful Cloud Fallback:** If the local Oracle instance goes offline, the frontend's interceptor automatically switches to an in-memory academic dataset saved in `localStorage`, guaranteeing uninterrupted demonstration availability during academic evaluations.

---

## Security & Integrity Measures

1. **Parameterized SQL Queries:** All database interactions in `backend/db/oracle.js` utilize named bind variables (e.g. `:cand_id`, `:job_key`), preventing SQL injection attacks.
2. **Cryptographic Password Hashing:** Passwords in `APP_USERS` are hashed using `bcryptjs` with salted key expansion. Plaintext passwords are never stored.
3. **Stateless JWT Tokens:** Authentication headers (`Authorization: Bearer <token>`) are validated on each restricted endpoint by middleware.
4. **Role-Based Route Protection:** Access control guards verify the actor's role against required permissions before executing controllers. For instance, any non-DBA token requesting `/api/dba/*` receives an immediate `403 Forbidden` response.
5. **System Audit Logging:** Important operations (logins, table inspections, record creations, deletions) are recorded in `APP_AUDIT_LOG` with client IP address, role, timestamp, and action description.

---

## Academic Defense / Viva Reference

### Q1: What is the primary purpose of decomposing relations into BCNF?
> **Answer:** Normalizing relations into Boyce-Codd Normal Form eliminates redundant attribute storage and prevents update, insertion, and deletion anomalies. In our initial unnormalized schema, non-key functional dependencies existed (for example, `job_title -> closing_date, posted_date` in the original Job table). Decomposing `JOB` into `Job`, `Job_Details`, and `Job_Posting` ensures every determinant is a candidate superkey, removing partial dependencies.

### Q2: How does the system guarantee that the BCNF decomposition is lossless?
> **Answer:** A decomposition of relation $R$ into $R_1$ and $R_2$ is guaranteed to have a lossless join with respect to functional dependency set $F$ if and only if $(R_1 \cap R_2) \to R_1$ or $(R_1 \cap R_2) \to R_2$ is in $F^+$. In every decomposition performed (such as `Location` $\cap$ `State_City` = `state`, where `state -> city` is the primary key of `State_City`), the common attributes form a superkey of at least one of the decomposed relations, satisfying the lossless join condition.

### Q3: Why were some entities (e.g., Dependent, Fresher, Freelancer) kept intact?
> **Answer:** Decomposition should only be applied where functional dependency anomalies exist. In `Dependent(dep_id, dob, relationship)`, the sole determinant is `dep_id`, which is the primary key. In Candidate subtype tables (`Fresher`, `Experienced`, `Freelancer`), each tuple has a strict $1:1$ relationship with `Candidate` via `cand_id`. Because all non-trivial dependencies already have a superkey on their left-hand side, these relations are already in BCNF. Decomposing them further would introduce unnecessary join overhead without any normalization gain.

### Q4: How is live database metadata retrieved dynamically?
> **Answer:** Rather than hardcoding schema statistics, the Database Designer and DBA portals execute dynamic queries against Oracle internal data dictionary views, specifically `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`, `USER_CONS_COLUMNS`, and `USER_INDEXES`. This guarantees that object counts, primary keys, and constraint statuses reflect the actual state of the Oracle catalog in real time.

### Q5: How is Role-Based Access Control enforced throughout the stack?
> **Answer:** RBAC is enforced at two separate levels:
> 1. **Client-side:** React Router DOM wraps restricted routes within `<ProtectedRoute allowedRoles={[...]}>`, redirecting unauthorized users to their respective home dashboard.
> 2. **Server-side:** Express middleware (`authenticateUser` and `requireRole(...)`) inspects the cryptographically signed JWT payload before routing requests to controller functions. Requests from unauthorized actors are rejected with HTTP status `403 Forbidden`.

---

## Contributors

- **Project Contributors:** SAUBHAGYA, OM, DIVYAM
- **Course:** Database Management Systems (DBMS DA1 / DA2)
- **Institution:** Academic Relational Database Project

---

## License

This project is licensed under the MIT License — educational and academic use permitted.
