# Job Recruitment Management System (JRMS) — Neo4j Modernization
### Graph Database Migration, Cypher Analytics & Multi-Actor Management System

A full-stack enterprise web application and graph database system modernized for an academic Database Management Systems (DBMS) project. The application models an end-to-end recruitment lifecycle across candidates, job openings, applications, interviews, employers, and skill sets.

Originally architected on an **Oracle Database 23c Free** BCNF-decomposed 41-table relational schema, this project has been modernized and migrated to **Neo4j Graph Database 5.x**, replacing recursive relational multi-table JOINs with native graph nodes, labeled property graphs, and expressive Cypher queries.

---

### 🌐 Repository & Documentation

- **GitHub Repository:** [divyamvermadpsv-rgb/job-recruitment-management-system-neo4j](https://github.com/divyamvermadpsv-rgb/job-recruitment-management-system-neo4j)
- **Detailed Graph Model:** [docs/GRAPH_DATA_MODEL.md](docs/GRAPH_DATA_MODEL.md)
- **Database Selection & Justification:** [docs/DATABASE_JUSTIFICATION.md](docs/DATABASE_JUSTIFICATION.md)
- **Neo4j Setup & Migration Guide:** [docs/NEO4J_SETUP_AND_MIGRATION_GUIDE.md](docs/NEO4J_SETUP_AND_MIGRATION_GUIDE.md)
- **Original Oracle Relational Sources:** [database/schema.sql](database/schema.sql), [database/seed.sql](database/seed.sql), [DA2_complete_oracle.sql](DA2_complete_oracle.sql) *(preserved for academic defense and RDBMS-to-Graph lineage comparison)*

---

## Table of Contents

- [Project Overview & Modernization](#project-overview--modernization)
- [Demo Login Credentials](#demo-login-credentials)
- [System Architecture](#system-architecture)
- [Neo4j Property Graph Model](#neo4j-property-graph-model)
  - [Graph Nodes & Labels](#graph-nodes--labels)
  - [Native Graph Relationships](#native-graph-relationships)
  - [Schema Constraints & Uniqueness](#schema-constraints--uniqueness)
- [Three-Actor Access Control (RBAC)](#three-actor-access-control-rbac)
- [Tech Stack](#tech-stack)
- [Key Features by Actor](#key-features-by-actor)
  - [1. Recruiter / End User Portal](#1-recruiter--end-user-portal)
  - [2. Database Designer Portal](#2-database-designer-portal)
  - [3. Database Administrator (DBA) Console](#3-database-administrator-dba-console)
- [REST API Endpoints](#rest-api-endpoints)
- [Directory Structure](#directory-structure)
- [Local Installation & Setup (Cross-Platform)](#local-installation--setup-cross-platform)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository](#step-1-clone-repository)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
  - [Step 4: Launch Neo4j (Docker Compose)](#step-4-launch-neo4j-docker-compose)
  - [Step 5: Run Schema Initialization & Migration](#step-5-run-schema-initialization--migration)
  - [Step 6: Start Backend & Frontend](#step-6-start-backend--frontend)
- [Environment Configuration](#environment-configuration)
- [Security & Integrity Measures](#security--integrity-measures)
- [Academic Defense / Viva Reference](#academic-defense--viva-reference)
  - [RDBMS Normalization Proofs](#rdbms-normalization-proofs)
  - [Graph Database Modernization Rationale](#graph-database-modernization-rationale)
- [Contributors & License](#contributors--license)

---

## Project Overview & Modernization

In recruitment management, entities naturally form a interconnected network: candidates possess multiple skills, employers post jobs with specific requirements, candidates apply for jobs, and interviews evaluate candidate competencies. 

In a traditional relational database (RDBMS), answering recruitment questions like *"Which candidates possess 80%+ of the skills required for open Senior Developer roles?"* requires joining 5 to 7 relational tables (`Candidate`, `Has`, `Skill`, `Requires`, `Job`, `Applies`, `Application`), which incurs exponential query complexity and index lookups as data scales.

### Why Neo4j?
1. **Index-Free Adjacency:** Graph traversals follow direct physical pointers between nodes in $O(1)$ constant time per hop, eliminating expensive multi-table joins.
2. **Expressive Cypher Queries:** Complex multi-hop queries (matching candidate skills against job requirements or analyzing candidate referral networks) are written in intuitive ASCII-art Cypher patterns.
3. **Flexible Schema Evolution:** Adding new candidate attributes (e.g. GitHub profile, certifications) or relationship properties (e.g. proficiency scores, interview ratings) requires no destructive `ALTER TABLE` migrations.
4. **Academic DBMS Comparison:** Demonstrates complete end-to-end lineage from Boyce-Codd Normal Form (BCNF) relational design to modern NoSQL Labelled Property Graph (LPG) architecture.

---

## Demo Login Credentials

The application is pre-configured with three role-based accounts to facilitate local demonstration and evaluation:

| Role | Username | Password | Permitted Access |
|---|---|---|---|
| **Recruiter / End User** | `recruiter` | `User@123` | Candidate pipelines, job requisitions, applications, interview panels, skill gap reports |
| **Database Designer** | `designer` | `Designer@123` | Schema entity browser, graph relationship matrix, constraint catalog, normalization proofs |
| **Database Administrator (DBA)** | `dba_admin` | `Dba@123` | Database instance monitoring, query console, constraint diagnostics, audit logs |

> **Note:** These are **demo credentials for local project evaluation**. Each account provides access to features permitted by its role. Quick-role selector buttons are also available on the login screen for rapid switching during review without manual credential re-entry.

---

## System Architecture

The modernized JRMS employs a decoupled 3-tier client-server architecture with an Express API backend and a Neo4j property graph instance:

```text
+-------------------------------------------------------------------------+
|                           Client Web Browser                            |
|             React 18 + Vite SPA | Tailwind CSS Console Theme            |
|   ┌───────────────────────┬───────────────────────┬─────────────────┐   |
|   │ Recruiter Portal      │ Schema Designer Tools │ DBA Web Console │   |
|   └───────────────────────┴───────────────────────┴─────────────────┘   |
+-------------------------------------------------------------------------+
                                     │
                                     │ HTTP / REST API (JSON)
                                     ▼
+-------------------------------------------------------------------------+
|                         Node.js Express Backend                         |
|   ┌─────────────────────────────────────────────────────────────────┐   |
|   │ - REST API Controllers (User, Designer, DBA, Auth)              │   |
|   │ - RBAC Authentication Middleware (JWT + Bcrypt.js)              │   |
|   │ - Cypher Query Builder & Input Sanitizer                        │   |
|   │ - Audit Trail Logger Service (AppAuditLog nodes)                │   |
|   └────────────────────────────────┬────────────────────────────────┘   |
|                                    │ neo4j-driver (Bolt Protocol :7687)  |
|                                    ▼                                    |
|   ┌─────────────────────────────────────────────────────────────────┐   |
|   │                   Neo4j Graph Database 5.x                      |   |
|   │  - Labeled Property Graph (11 Primary Node Types)               │   |
|   │  - Native Relationships (APPLIED_TO, REQUIRES, HAS_SKILL, etc.) │   |
|   │  - Schema Uniqueness Constraints & Indexes                      │   |
|   │  - In-Memory Fallback Engine (for offline demonstration)        │   |
|   └─────────────────────────────────────────────────────────────────┘   |
+-------------------------------------------------------------------------+
```

---

## Neo4j Property Graph Model

### Graph Nodes & Labels

| Node Label | Key Properties | Description |
| :--- | :--- | :--- |
| `:Candidate` | `cand_id`, `fname`, `lname`, `dob`, `gender`, `email`, `phone`, `house_no`, `city`, `street` | Job seeker entity with personal and contact details |
| `:Job` | `job_key`, `job_id`, `job_title`, `job_status`, `salary`, `descriptive`, `posted_date`, `closing_date` | Corporate employment openings |
| `:Employer` | `emp_id`, `company_name`, `headquarter`, `company_mail`, `website`, `founded_year`, `phone_no` | Hiring companies and organizations |
| `:Skill` | `skill_id`, `skill_name`, `skill_category`, `description` | Technical and professional competencies |
| `:Application` | `app_id`, `app_date`, `app_type`, `app_status`, `final_result` | Formal application record linking candidate to job |
| `:Interview` | `int_id`, `int_date`, `int_time`, `int_mode`, `location`, `int_status`, `score`, `feedback` | Evaluative interview rounds |
| `:Education` | `edu_id`, `cgpa`, `specialization`, `degree`, `university`, `start_year`, `end_year` | Academic qualifications |
| `:Experience` | `exp_id`, `comp_name`, `job_title`, `years_of_exp`, `start_date`, `end_date` | Prior employment history |
| `:Location` | `pincode`, `city`, `state`, `country` | Geographic reference nodes |
| `:AppUser` | `username`, `password` *(bcrypt hash)*, `role`, `full_name`, `email` | Application access accounts |
| `:AppAuditLog` | `log_id`, `timestamp`, `username`, `role`, `action`, `ip_address` | System security audit trail |

### Native Graph Relationships

```text
       ┌──────────────┐
       │  :Employer   │
       └──────┬───────┘
              │ [:POSTED]
              ▼
         ┌─────────┐              ┌───────────────┐
         │  :Job   │◄─────────────┤ :Application  │
         └────┬────┘ [:FOR_JOB]   └───────▲───────┘
              │                           │ [:SUBMITTED]
              │ [:REQUIRES]               │
              ▼                     ┌─────┴─────┐
         ┌─────────┐   [:HAS_SKILL] │:Candidate │
         │ :Skill  │◄───────────────┤           │
         └─────────┘                └─────┬─────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │ [:HAS_EDUCATION]  │ [:HAS_EXPERIENCE] │ [:ATTENDED]
                      ▼                   ▼                   ▼
                ┌───────────┐       ┌───────────┐       ┌───────────┐
                │:Education │       │:Experience│       │:Interview │
                └───────────┘       └───────────┘       └───────────┘
```

| Relationship Type | Source $\to$ Target | Semantics & Properties |
| :--- | :--- | :--- |
| `[:POSTED]` | `(:Employer) -> (:Job)` | Employer owns and manages the job opening |
| `[:REQUIRES]` | `(:Job) -> (:Skill)` | `min_experience`, `is_mandatory` constraints |
| `[:HAS_SKILL]` | `(:Candidate) -> (:Skill)` | `proficiency_level`, `years_of_exp` |
| `[:SUBMITTED]` | `(:Candidate) -> (:Application)` | Candidate submits an application |
| `[:FOR_JOB]` | `(:Application) -> (:Job)` | Application targets a specific job requisition |
| `[:HAS_EDUCATION]` | `(:Candidate) -> (:Education)` | Links candidate to degrees and academic history |
| `[:HAS_EXPERIENCE]` | `(:Candidate) -> (:Experience)` | Links candidate to previous employment history |
| `[:ATTENDED]` | `(:Candidate) -> (:Interview)` | Scheduled or completed interview panel |
| `[:EVALUATES]` | `(:Interview) -> (:Application)` | Assessment for a specific application |
| `[:LOCATED_IN]` | `(:Candidate) -> (:Location)` | Candidate address mapping to geographic node |

### Schema Constraints & Uniqueness

Neo4j schema constraints are defined idempotently in `scripts/initConstraints.js`:

```cypher
CREATE CONSTRAINT candidate_id_unique IF NOT EXISTS FOR (c:Candidate) REQUIRE c.cand_id IS UNIQUE;
CREATE CONSTRAINT job_key_unique IF NOT EXISTS FOR (j:Job) REQUIRE j.job_key IS UNIQUE;
CREATE CONSTRAINT employer_id_unique IF NOT EXISTS FOR (e:Employer) REQUIRE e.emp_id IS UNIQUE;
CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.skill_id IS UNIQUE;
CREATE CONSTRAINT app_id_unique IF NOT EXISTS FOR (a:Application) REQUIRE a.app_id IS UNIQUE;
CREATE CONSTRAINT int_id_unique IF NOT EXISTS FOR (i:Interview) REQUIRE i.int_id IS UNIQUE;
CREATE CONSTRAINT user_username_unique IF NOT EXISTS FOR (u:AppUser) REQUIRE u.username IS UNIQUE;
```

---

## Three-Actor Access Control (RBAC)

The system isolates operations into three roles, each with strict server-side middleware and client-side guards:

| Actor Role | Default Username | Default Password | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **End User / Recruiter (`USER`)** | `recruiter` | `User@123` | Pipeline execution: candidate sourcing, job opening management, interview coordination, hiring reports. |
| **Database Designer (`DATABASE_DESIGNER`)** | `designer` | `Designer@123` | Schema governance: inspect graph labels, relationship matrices, constraints catalog, normalization proofs. |
| **Database Administrator (`DBA`)** | `dba_admin` | `Dba@123` | Instance administration: Cypher console, object distribution, constraint diagnostics, audit logs. |

---

## Tech Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS | Single Page Application styled with an engineering console theme |
| **Icons & Visuals** | Lucide React, Recharts | Data visualizations, trend charts, and interface iconography |
| **Client Routing** | React Router DOM v6 | Protected route guards enforcing actor access permissions |
| **Backend Runtime** | Node.js (v18+), Express.js | Modular REST API service |
| **Database Engine** | **Neo4j Community Edition 5.x** | Enterprise property graph database |
| **Database Driver** | `neo4j-driver` (v6.2.0, Bolt Protocol) | High-performance binary connection driver to Neo4j |
| **Containerization** | Docker, Docker Compose v2 | Reproducible containerized Neo4j database setup |
| **Security & Auth** | JSON Web Tokens (JWT), BCrypt.js | Cryptographic password hashing and stateless authorization headers |
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
- **Entity & Label Catalog:** Real-time graph browser listing all primary node labels, node counts, and relationship degrees.
- **Relationship Inspector:** Dependency matrix detailing active graph edge types and traversal patterns.
- **Schema Constraints & Keys:** Uniqueness constraint inspector and index analyzer.
- **Interactive Graph Schema:** Visual diagram displaying entity associations and property mappings.
- **BCNF Proof Documentation:** Academic reference detailing the original functional dependency covers and decomposition proofs alongside the graph modernization mapping.

### 3. Database Administrator (DBA) Console
- **Instance Overview:** Summary of active users, graph node/relationship distribution, and driver connection health.
- **Cypher Query Console:** Web terminal for executing read-only Cypher queries directly against the graph with formatted result grids.
- **Database Objects Census:** Census of labels, relationship types, property keys, and constraints.
- **Role-Based Access Management (RBAC):** List active database users and system privileges.
- **Constraint Diagnostics:** Audit constraint health, validation states, and orphaned node detection.
- **Audit Logging:** System security log tracking logins, schema modifications, and data alterations.

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
| `GET` | `/api/designer/dashboard` | `DESIGNER`, `DBA` | Graph schema totals and entity counts |
| `GET` | `/api/designer/tables` | `DESIGNER`, `DBA` | Query node entities with properties and relationship counts |
| `GET` | `/api/designer/tables/:name` | `DESIGNER`, `DBA` | Property definitions, types, and sample records |
| `GET` | `/api/designer/columns` | `DESIGNER`, `DBA` | Search properties across graph labels |
| `GET` | `/api/designer/primary-keys` | `DESIGNER`, `DBA` | Query unique identifier constraints |
| `GET` | `/api/designer/foreign-keys` | `DESIGNER`, `DBA` | Query graph relationships and traversal paths |
| `GET` | `/api/designer/constraints` | `DESIGNER`, `DBA` | Query unique constraints and index rules |
| `GET` | `/api/designer/relationships` | `DESIGNER`, `DBA` | Relationship matrix for interactive graph rendering |
| `GET` | `/api/designer/normalization` | `DESIGNER`, `DBA` | RDBMS BCNF proofs and Graph migration mapping |

### Database Administrator (DBA) Endpoints
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dba/dashboard` | `DBA` | Instance health, node/relationship counts, connection status |
| `POST` | `/api/dba/execute-sql` | `DBA` | Execute custom read-only Cypher query with formatted grid |
| `GET` | `/api/dba/tables` | `DBA` | Node storage statistics and counts |
| `GET` | `/api/dba/objects` | `DBA` | Census of labels, relationship types, and constraints |
| `GET` | `/api/dba/users` | `DBA` | System users and assigned RBAC privileges |
| `GET` | `/api/dba/indexes` | `DBA` | Index health and schema constraint definitions |
| `GET` | `/api/dba/constraints-health`| `DBA` | Graph integrity and constraint status |

---

## Directory Structure

```text
job-recruitment-management-system-neo4j/
├── backend/                        # Node.js & Express REST API
│   ├── controllers/                # Request handlers (User, Designer, DBA, Auth)
│   ├── db/
│   │   ├── neo4j.js                # Official Neo4j Driver & Cypher execution engine
│   │   ├── inMemoryDb.js           # Offline in-memory fallback database
│   │   └── seedData.js             # Initial dataset for in-memory mode
│   ├── middleware/                 # JWT Auth, RBAC guards, and Error handlers
│   ├── routes/                     # Express REST route definitions
│   ├── tests/                      # Automated API & security verification tests
│   └── server.js                   # Application entrypoint
├── database/                       # Original Oracle SQL source files (preserved)
│   ├── schema.sql                  # Original 41-table BCNF Oracle DDL
│   ├── seed.sql                    # Original Oracle INSERT statements
│   └── README.md
├── docs/                           # Comprehensive Engineering & Architecture Docs
│   ├── DATABASE_JUSTIFICATION.md   # Detailed RDBMS vs Graph technical analysis
│   ├── GRAPH_DATA_MODEL.md         # Full Node & Relationship specification
│   ├── NEO4J_SETUP_AND_MIGRATION_GUIDE.md # Cross-platform setup guide
│   └── SCHEMA_MAPPING.md           # Attribute-by-attribute Oracle to Neo4j mapping
├── frontend/                       # React 18, Vite & Tailwind CSS SPA
│   ├── src/
│   │   ├── components/             # Reusable UI components & layouts
│   │   ├── context/                # AuthContext & ToastContext
│   │   ├── pages/                  # Recruiter, Designer, DBA, and Login views
│   │   └── services/               # Axios API client
│   └── vite.config.js
├── scripts/                        # Migration & verification automation
│   ├── initConstraints.js          # Neo4j schema constraint creation
│   ├── migrate.js                  # Parses seed data and populates Neo4j graph
│   └── verify_migration.js         # 9-part automated data integrity test suite
├── docker-compose.yml              # Containerized Neo4j 5.x service configuration
├── .env.example                    # Clean environment variable template
├── package.json                    # Workspace scripts & dependencies
└── README.md
```

---

## Local Installation & Setup (Cross-Platform)

Follow these steps to run the complete stack on **macOS**, **Windows (WSL2/PowerShell)**, or **Linux**.

### Prerequisites
- **Node.js:** v18.x or higher ([nodejs.org](https://nodejs.org/))
- **Docker Desktop:** v24.0+ ([docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop))
- **Git:** Version control client

---

### Step 1: Clone Repository

```bash
git clone https://github.com/divyamvermadpsv-rgb/job-recruitment-management-system-neo4j.git
cd job-recruitment-management-system-neo4j
```

---

### Step 2: Install Dependencies

Install root, backend, and frontend dependencies:
```bash
npm run install:all
```
*(Or install manually: `npm install && cd backend && npm install && cd ../frontend && npm install`)*

---

### Step 3: Configure Environment Variables

Copy the clean environment template:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Ensure `.env` contains:
```ini
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=YourSecurePassword123!
NEO4J_DATABASE=neo4j

PORT=5000
NODE_ENV=development
JWT_SECRET=ReplaceWithYourSecureRandomSecretKey2026!
```

---

### Step 4: Launch Neo4j (Docker Compose)

Start the Neo4j container in the background:
```bash
npm run neo4j:up
# Or: docker compose up -d
```

Verify the container is healthy:
```bash
docker ps --filter "name=jrms-neo4j"
```

> **Neo4j Browser GUI:** Available at **[http://localhost:7474](http://localhost:7474)**  
> - **Connection URL:** `bolt://localhost:7687`  
> - **Username:** `neo4j`  
> - **Password:** *(the password set in your `.env`)*

---

### Step 5: Run Schema Initialization & Migration

1. **Create Constraints & Indexes:**
   ```bash
   npm run schema:init
   ```
2. **Migrate Seed Data into Graph:**
   ```bash
   npm run migrate
   ```
3. **Run Migration Parity & Integrity Verification:**
   ```bash
   npm run verify:migration
   ```
   *This asserts node count parity, relationship preservation, multi-edge constraints, and idempotent re-execution.*

---

### Step 6: Start Backend & Frontend

#### Terminal 1 — Backend API Server:
```bash
npm run dev:backend
```
*Backend runs on `http://localhost:5000`.*

#### Terminal 2 — Frontend Application:
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:3000`.*

Open your browser to `http://localhost:3000` and sign in using any of the [Demo Login Credentials](#demo-login-credentials).

---

## Environment Configuration

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Express HTTP server port | `5000` |
| `NODE_ENV` | Application environment mode | `development` or `production` |
| `NEO4J_URI` | Neo4j Bolt connection URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j database username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j database password | Configured in `.env` |
| `NEO4J_DATABASE` | Default Neo4j database name | `neo4j` |
| `JWT_SECRET` | Cryptographic secret for signing auth tokens | Any 32+ character random string |
| `JWT_EXPIRES_IN` | Token validity timeframe | `8h` |

---

## Security & Integrity Measures

1. **Cypher Injection Prevention:** All queries in `backend/db/neo4j.js` use parameterized Cypher statements (`$param`), preventing injection attacks.
2. **Cryptographic Password Hashing:** User passwords in `:AppUser` are hashed with `bcryptjs` with salted key expansion. Plaintext passwords are never stored.
3. **Stateless JWT Tokens:** Authentication headers (`Authorization: Bearer <token>`) are verified on every protected API endpoint.
4. **Role-Based Guards (RBAC):** Middleware validates user roles (`USER`, `DATABASE_DESIGNER`, `DBA`) before controller execution. Unauthorized access returns `HTTP 403 Forbidden`.
5. **System Audit Logging:** Administrative actions, logins, and data modifications are logged to `:AppAuditLog` graph nodes.
6. **Zero Secrets in Git:** Sensitive `.env` files are strictly ignored by `.gitignore`.

---

## Academic Defense / Viva Reference

### RDBMS Normalization Proofs

#### Q1: What is the primary purpose of decomposing relations into BCNF?
> **Answer:** Normalizing relations into Boyce-Codd Normal Form eliminates redundant attribute storage and prevents update, insertion, and deletion anomalies. In our initial unnormalized schema, non-key functional dependencies existed (e.g. `job_title -> closing_date, posted_date` in the Job relation). Decomposing `JOB` into `Job`, `Job_Details`, and `Job_Posting` ensures every determinant is a candidate superkey, removing partial dependencies.

#### Q2: How does the system guarantee that the BCNF decomposition is lossless?
> **Answer:** A decomposition of relation $R$ into $R_1$ and $R_2$ is guaranteed to have a lossless join with respect to functional dependency set $F$ if and only if $(R_1 \cap R_2) \to R_1$ or $(R_1 \cap R_2) \to R_2$ is in $F^+$. In every decomposition performed (such as `Location` $\cap$ `State_City` = `state`, where `state -> city` is the primary key of `State_City`), the common attributes form a superkey of at least one of the decomposed relations, satisfying the lossless join condition.

---

### Graph Database Modernization Rationale

#### Q3: Why modernize from Oracle RDBMS to Neo4j Graph Database?
> **Answer:** Recruitment networks are inherently graph-structured. Querying candidate skill matches, multi-stage application pipelines, and referral paths in an RDBMS requires joining 5 to 7 decomposed tables, which incurs quadratic performance degradation as table sizes increase. Neo4j uses **index-free adjacency**, meaning each node stores direct physical references to its adjacent nodes. Graph traversals execute in $O(1)$ constant time per relationship hop, regardless of the overall graph size.

#### Q4: How were 41 BCNF relations mapped into Neo4j?
> **Answer:** 
> 1. **Entity Relations** (e.g. `Candidate`, `Job`, `Employer`, `Skill`) became primary **Graph Nodes** with descriptive labels and properties.
> 2. **Associative / Bridge Relations** (e.g. `Applies`, `Requires`, `Has`, `Company_Employer`) with foreign keys became **Native Directed Relationships** (`[:APPLIED_TO]`, `[:REQUIRES]`, `[:HAS_SKILL]`, `[:POSTED]`), with former junction attributes (e.g. `min_experience`, `proficiency_level`) stored directly on the relationships as properties.
> 3. **Decomposed Lookup Tables** (e.g. `Candidate_Address`, `Candidate_Phone`, `Job_Details`) were folded into the core node as properties or mapped into clean 1:N graph patterns without redundant join keys.

#### Q5: What happens if the Neo4j instance is offline?
> **Answer:** The application implements graceful degradation. When the Neo4j driver detects that the database container is offline, the backend returns clear HTTP 503 Service Unavailable notifications without exposing internal connection strings or stack traces. Additionally, the frontend features an in-memory academic fallback pre-loaded with the exact seed dataset, ensuring uninterrupted demonstration availability during academic evaluations.

---

## Contributors & License

- **Course:** Database Management Systems (DBMS DA1 / DA2)
- **Modernization Architecture:** Academic DBMS Modernization Project
- **License:** MIT License — educational and academic use permitted.
