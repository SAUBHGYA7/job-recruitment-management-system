# JRMS Neo4j Environment Setup and Migration Guide

**Project:** Job Recruitment Management System (JRMS)  
**Target Engine:** Neo4j Community Edition 5.26.x  
**Deployment Tooling:** Docker Compose v2+  
**Operating Systems Supported:** macOS (Apple Silicon & Intel) and Windows 10/11 (with Docker Desktop / WSL2)

---

## 1. Architecture & Design Principles

The modernized JRMS graph environment is designed for reproducible local development and cloud containerization:

1. **Persistent Storage:** Neo4j data (`/data`) and logs (`/logs`) are mapped to named Docker volumes (`jrms_neo4j_data` and `jrms_neo4j_logs`). Database state persists across container restarts.
2. **Deterministic Memory Sizing:** Configured with 512MB initial heap, 1GB max heap, and 512MB page cache—optimal for local machines without starving host resources.
3. **Restricted APOC Security:** Unrestricted procedure execution (`apoc.*`) is strictly disabled. Only safe collection, map, and date utilities are allowlisted (`apoc.coll.*,apoc.map.*,apoc.date.*`).
4. **Zero Hardcoded Secrets:** Docker Compose and backend drivers enforce secrets via `.env`. A `.env.example` template provides clean placeholders without committing credentials to Git.
5. **Idempotent Data Pipeline:** Schema constraints and data migration scripts use parameterized Cypher `MERGE` statements. Re-running the pipeline produces zero duplicate nodes or relationships.

---

## 2. Prerequisites

| Component | Minimum Version | Installation / Notes |
| :--- | :---: | :--- |
| **Docker Desktop** | 24.0+ / Compose v2 | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| **Node.js** | 18.0+ (Tested on v26) | [nodejs.org](https://nodejs.org) |
| **npm** | 9.0+ | Bundled with Node.js |
| **Available Ports** | 7474, 7687 | Ensure ports are not occupied by existing services |

---

## 3. Quick Start (macOS & Linux)

### Step 1: Clone & Navigate to Working Copy
```bash
cd /path/to/job-recruitment-management-system-neo4j
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create your local `.env` from the template:
```bash
cp .env.example .env
```
Edit `.env` and set a strong database password:
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=YourStrongPasswordHere123!
NEO4J_DATABASE=neo4j

PORT=5000
NODE_ENV=development
JWT_SECRET=YourSecureRandomSecretKeyHere123!
```

### Step 4: Launch Neo4j Container
```bash
docker compose up -d
```
Verify the container is healthy:
```bash
docker ps --filter "name=jrms-neo4j"
```

### Step 5: Access Neo4j Browser
Open [http://localhost:7474](http://localhost:7474) in your web browser:
- **Connection URL:** `bolt://localhost:7687`
- **Username:** `neo4j`
- **Password:** `<NEO4J_PASSWORD from .env>`

### Step 6: Execute Migration
Initialize schema constraints and migrate all 43 tables:
```bash
npm run migrate
```

### Step 7: Run Automated Verification Suite
Run the 9-part test suite asserting count parity, constraint enforcement, multi-edge preservation, and 2nd-run idempotency:
```bash
npm run verify:migration
```

---

## 4. Setup Instructions for Windows 10 / 11

### Step 1: Docker Desktop Configuration
1. Install **Docker Desktop for Windows** with the **WSL 2 backend** enabled.
2. Verify Docker is running in PowerShell:
   ```powershell
   docker --version
   docker compose version
   ```

### Step 2: Configure Environment
In PowerShell or Command Prompt:
```powershell
Copy-Item .env.example .env
```
Edit `.env` using Notepad or VS Code and configure `NEO4J_PASSWORD`.

### Step 3: Install Dependencies & Launch
```powershell
npm install
docker compose up -d
```

### Step 4: Run Migration & Verification
```powershell
npm run migrate
npm run verify:migration
```

---

## 5. Schema Constraints & Relationship Catalog

### 17 Uniqueness Constraints
1. `(c:Candidate) REQUIRE c.cand_id IS UNIQUE`
2. `(j:Job) REQUIRE j.job_key IS UNIQUE`
3. `(s:Skill) REQUIRE s.skill_id IS UNIQUE`
4. `(e:Employer) REQUIRE e.emp_id IS UNIQUE`
5. `(ed:Education) REQUIRE ed.edu_id IS UNIQUE`
6. `(ex:Experience) REQUIRE ex.exp_id IS UNIQUE`
7. `(i:Interview) REQUIRE i.int_id IS UNIQUE`
8. `(a:Application) REQUIRE a.app_id IS UNIQUE`
9. `(d:Dependent) REQUIRE d.dep_id IS UNIQUE`
10. `(l:Location) REQUIRE l.pincode IS UNIQUE`
11. `(co:Company) REQUIRE co.comp_id IS UNIQUE`
12. `(ra:RecruitmentAgency) REQUIRE ra.agency_no IS UNIQUE`
13. `(a:Assessment) REQUIRE a.assessment_id IS UNIQUE`
14. `(r:Referral) REQUIRE r.referral_id IS UNIQUE`
15. `(u:AppUser) REQUIRE u.user_id IS UNIQUE`
16. `(u:AppUser) REQUIRE u.username IS UNIQUE`
17. `(al:AuditLog) REQUIRE al.log_id IS UNIQUE`

### 18 Canonical Relationship Types
1. `(:Candidate)-[:HAS_SKILL {pgd_level, years_of_exp}]->(:Skill)` (35 edges)
2. `(:Job)-[:REQUIRES {is_mandatory, min_years}]->(:Skill)` (27 edges)
3. `(:Candidate)-[:APPLIED_FOR]->(:Job)` (25 edges)
4. `(:Candidate)-[:MATCHED_TO {match_id, match_date}]->(:Job)` (20 edges, preserved via `match_id`)
5. `(:Candidate)-[:UNDERWENT]->(:Assessment)` (20 edges)
6. `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)` (20 edges)
7. `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)` (20 edges)
8. `(:Candidate)-[:HAS_REFERRAL]->(:Referral)` (14 edges)
9. `(:Candidate)-[:PREFERS_LOCATION]->(:Location)` (25 edges)
10. `(:Candidate)-[:HAS_EDUCATION]->(:Education)` (25 edges)
11. `(:Candidate)-[:HAS_EXPERIENCE]->(:Experience)` (25 edges)
12. `(:Candidate)-[:HAS_INTERVIEW]->(:Interview)` (25 edges)
13. `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)` (25 edges)
14. `(:Application)-[:FOR_JOB]->(:Job)` (25 edges: 20 source + 5 reconciled)
15. `(:Candidate)-[:HAS_DEPENDENT]->(:Dependent)` (25 edges)
16. `(:Employer)-[:POSTED_JOB]->(:Job)` (0 in seed data; valid domain relationship)
17. `(:Employer)-[:AFFILIATED_WITH]->(:Company)` (15 edges)
18. `(:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)` (15 edges)

---

## 6. Audited Application Lifecycle Reconciliation

In the legacy Oracle schema, `Job_Details.app_id` contained only 20 rows (`APP001` through `APP020`). Applications `APP021` through `APP025` were omitted from `Job_Details`, causing legacy SQL joins to return null job information.

During migration:
1. `APP001`–`APP020` are connected via `Job_Details.app_id`.
2. `APP021`–`APP025` are reconciled to their intended jobs using the verified candidate applications in `Applies`:
   - `APP021` (Candidate 121) $\rightarrow$ Job 7
   - `APP022` (Candidate 122) $\rightarrow$ Job 12
   - `APP023` (Candidate 123) $\rightarrow$ Job 16
   - `APP024` (Candidate 124) $\rightarrow$ Job 6
   - `APP025` (Candidate 125) $\rightarrow$ Job 10
3. The reconciliation log records these 5 inferred repairs for complete audit transparency.

---

## 7. Troubleshooting

### Port 7474 or 7687 Already in Use
Check what process is listening on the port:
```bash
# macOS
lsof -i :7474
lsof -i :7687

# Windows PowerShell
Get-NetTCPConnection -LocalPort 7474
```
Stop conflicting containers or change the host port mapping in `docker-compose.yml` (e.g. `"7475:7474"`).

### Resetting the Database
To reset the database cleanly to an empty state:
```bash
docker compose down -v
docker compose up -d
npm run migrate
```
*(Warning: `-v` removes persistent named volumes!)*
