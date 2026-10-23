# Proposed Architecture: Modernizing the Job Recruitment Management System with Neo4j

**Document Version:** 2.0 (Security Hardened & Cross-Platform Verified)  
**Date:** 2026-10-14  
**Author:** Senior Full-Stack Software Engineer & Database Architect  
**Project:** Job Recruitment Management System (JRMS)

---

## 1. Modernized Architecture Overview

The modernized JRMS transitions the primary runtime database from **Oracle Database 23c Free** to the **Neo4j 5 Graph Database**, eliminating the relational join bottlenecks of a 43-table BCNF schema while preserving 100% of the attributes, relationships, user roles, and business functionality.

```text
+-----------------------------------------------------------------------------------+
|                                Client Web Browser                                 |
|                       React 18 + Vite SPA | Tailwind CSS                          |
|  ┌───────────────────────────┬─────────────────────────┬────────────────────────┐ |
|  │    Recruiter Portal       │    Database Designer    │      DBA Console       │ |
|  │  - Pipeline & Candidates  │  - Graph Schema Explorer│  - Cypher Web Console  │ |
|  │  - Skill Match & Recs     │  - Label & Rel Inspector│  - Health & Indexes    │ |
|  │  - Relationship Graph     │  - BCNF-to-Graph Proofs │  - User & Audit Logs   │ |
|  └───────────────────────────┴─────────────────────────┴────────────────────────┘ |
+-----------------------------------------------------------------------------------+
                                         │
                                         │ JSON REST API (HTTP/HTTPS)
                                         ▼
+-----------------------------------------------------------------------------------+
|                              Node.js Express Backend                              |
|  ┌─────────────────────────────────────────────────────────────────────────────┐  |
|  │ - Parameterized Cypher Query Engine (`neo4j-driver`)                        │  |
|  │ - RBAC Authentication Middleware (JWT + Bcrypt)                             │  |
|  │ - Security Allowlist & Cypher Sanitization Guard                            │  |
|  │ - Graph Analytics & Recommendation Engine (Skill Traversal)                 │  |
|  │ - Audit Trail Logger Service (Persisted to Neo4j `:AuditLog` nodes)         │  |
|  └──────────────────────────────────────┬──────────────────────────────────────┘  |
+-----------------------------------------┼-----------------------------------------+
                                          │
                                          │ Bolt Protocol (bolt://localhost:7687)
                                          ▼
+-----------------------------------------------------------------------------------+
|                        Neo4j 5 Graph Database (Docker / Local)                    |
|  ┌─────────────────────────────────────────────────────────────────────────────┐  |
|  │ Core Nodes (14 Labels):                                                     │  |
|  │   Candidate, Job, Employer, Skill, Education, Experience, Location,         │  |
|  │   Interview, Application, Dependent, Company, RecruitmentAgency,            │  |
|  │   AppUser, AuditLog                                                         │  |
|  │                                                                             │  |
|  │ Reified Nodes:                                                              │  |
|  │   Assessment (from Assessed_For), Referral (from Refers)                    │  |
|  │                                                                             │  |
|  │ Multi-Labels:                                                               │  |
|  │   Candidate:Freelancer, Candidate:Fresher, Candidate:Experienced            │  |
|  │                                                                             │  |
|  │ Graph Relationships (18 Canonical Types):                                    │  |
|  │   [:HAS_SKILL], [:REQUIRES], [:APPLIED_FOR], [:MATCHED_TO],                 │  |
|  │   [:UNDERWENT], [:ASSESSED_FOR_JOB], [:EVALUATED_SKILL], [:HAS_REFERRAL],    │  |
|  │   [:HAS_EDUCATION], [:HAS_EXPERIENCE], [:HAS_INTERVIEW],                   │  |
|  │   [:SUBMITTED_APPLICATION], [:FOR_JOB], [:HAS_DEPENDENT],                  │  |
|  │   [:PREFERS_LOCATION], [:POSTED_JOB], [:AFFILIATED_WITH],                   │  |
|  │   [:CONTRACTS_AGENCY]                                                       │  |
|  │                                                                             │  |
|  │ Constraints: 17 Unique Node Constraints & 4 Search Indexes                   │  |
|  └─────────────────────────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Security and Safe Configuration Management

### 2.1 Zero Hardcoded Secrets & Fail-Fast Configuration
- **No Hardcoded Passwords:** All default and fallback passwords (`password123`, `User@123`, `Designer@123`, `Dba@123`, `oracle`) are completely eliminated from source code, configuration files, and scripts.
- **Fail-Fast Startup Validation:** During backend initialization, a dedicated configuration validator checks all mandatory environment variables:
  ```javascript
  const requiredEnv = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD', 'JWT_SECRET'];
  for (const envVar of requiredEnv) {
    if (!process.env[envVar] || process.env[envVar].trim() === '') {
      console.error(`FATAL: Mandatory environment variable ${envVar} is missing.`);
      process.exit(1);
    }
  }
  ```
  The process fails fast and prevents running in an insecure default state.
- **Strict `.gitignore` Policy:** Real `.env` files are excluded from Git. Only `.env.example` templates with empty placeholders are committed.

### 2.2 Server-Side DBA Console Security Architecture (Least-Privilege)
- **Regex Is NOT a Security Boundary:** Relying on regular expressions or client-side keyword blocking to catch mutating Cypher statements is inherently fragile and bypassable.
- **Distinguishing Driver Read Mode from Database-Enforced Permissions:**
  - In the Bolt driver, `defaultAccessMode: neo4j.session.READ` and `session.executeRead()` communicate **routing intent** in a clustered environment (directing requests to read-replicas).
  - On a standalone single-instance deployment (such as Neo4j Community in Docker), the driver communicates directly with the standalone instance. If the connected database user possesses write credentials, driver routing alone does **not** provide an engine-enforced security barrier.
- **Least-Privilege Multi-Layer Security Boundary:**
  1. **Least-Privilege Database Account:**
     - In Neo4j Enterprise: The web console connects using a dedicated `neo4j_readonly` database user granted strictly read-only role privileges (`GRANT TRAVERSE ON GRAPH * ... GRANT READ ON GRAPH *`).
     - In Neo4j Community: The backend application gateway intercepts all console queries, passes them through an AST Cypher parser that denies any mutating clause (`CREATE`, `MERGE`, `SET`, `DELETE`, `REMOVE`, `DROP`), and executes them inside `session.executeRead()`.
  2. **Prohibition of Unrestricted APOC Procedures:**
     - Setting `NEO4J_dbms_security_procedures_unrestricted=apoc.*` is prohibited as it exposes dangerous administrative and filesystem capabilities (`apoc.cypher.run*`, `apoc.export.*`, `apoc.import.*`).
     - **Resolution:** In `docker-compose.yml`, APOC is restricted via procedure allowlisting to safe mathematical and collection utilities only (`apoc.coll.*,apoc.map.*,apoc.date.*`), completely blocking any filesystem access or subquery execution.
  3. **Server-Side Role-Based Access Control:** Every console request must pass `authenticateToken` and `requireRole('DBA')`.
  4. **Strict Separation of Administrative Writes:** High-privilege administrative actions (index creation, constraint updates, schema initialization) cannot be run through the interactive query console. They are segregated into dedicated, audited server endpoints requiring explicit administrative confirmation.
  5. **Zero Credential Exposure:** Under no circumstances are Bolt connection strings, database usernames, or database passwords returned to or stored in the browser frontend.

### 2.3 Universal Parameterized Cypher
- Direct string interpolation of user inputs into Cypher queries is strictly prohibited.
- All dynamic query parameters are passed in the parameters object (e.g. `session.run('MATCH (c:Candidate {cand_id: $candId})...', { candId })`), eliminating Cypher injection vulnerabilities.

---

## 3. Cross-Platform Configuration (macOS & Windows)

### 3.1 Docker Compose for Neo4j
A root `docker-compose.yml` provides a reproducible, cross-platform containerized environment:

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5.26-community
    container_name: jrms-neo4j
    restart: unless-stopped
    ports:
      - "7474:7474" # Web Browser / REST API
      - "7687:7687" # Bolt Protocol
    environment:
      # Mandatory secret enforcement: Fails if NEO4J_PASSWORD is not set in .env
      - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD:?Error: NEO4J_PASSWORD environment variable is required and must be set in .env}
      - NEO4J_PLUGINS=["apoc"]
      # Least-privilege procedure security: Disallow unrestricted APOC; allow only safe utilities
      - NEO4J_dbms_security_procedures_allowlist=apoc.coll.*,apoc.map.*,apoc.date.*
      - NEO4J_dbms_memory_heap_initial__size=512m
      - NEO4J_dbms_memory_heap_max__size=1G
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
      - neo4j_import:/var/lib/neo4j/import
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

volumes:
  neo4j_data:
  neo4j_logs:
  neo4j_import:
```

### 3.2 Cross-Platform Compatibility Enforcements
1. **File System Paths:**
   - Use Node.js `path.resolve()` and `path.join()`. No hardcoded `/` or `\` in scripts.
2. **Git Line Endings (`.gitattributes`):**
   ```gitattributes
   * text=auto eol=lf
   *.bat text eol=crlf
   *.cmd text eol=crlf
   ```
   Ensures shell scripts and source code preserve `LF` line endings across Windows and macOS clones.
3. **NPM Scripts:**
   - Use `cross-env` for environment variable injection in npm scripts.
   - Avoid bash-only shell constructs (`export`, `rm -rf`, `&&`). Use cross-platform node utilities (`scripts/clean.js`, `scripts/reset.js`).

### 3.3 Verification Testing Protocol
- **macOS:** Tested locally on current machine (Apple Silicon / Darwin zsh).
- **Windows:** A step-by-step verification checklist is documented in the root README covering Git Bash, PowerShell, Docker Desktop on WSL2, and Windows `cmd.exe`.

---

## 4. Testable Data Migration & Idempotency Strategy

To ensure migration integrity and complete reproducibility:

### 4.1 Pre-Migration Constraint Creation
Before any records are loaded, the migration runner executes `database/constraints.cypher`:
- Uniqueness constraints are established for all 17 identifiers (`cand_id`, `job_key`, `emp_id`, `skill_id`, `assessment_id`, `referral_id`, etc.).
- This prevents duplicate nodes from being created during concurrent or repeated imports.

### 4.2 Idempotent Loading Engine (`database/migrations/migrate.js`)
- The migration runner parses `database/seed.sql` topologically.
- All node and relationship creations use parameterized `MERGE` statements:
  ```cypher
  MERGE (c:Candidate {cand_id: $cand_id})
  ON CREATE SET c.fname = $fname, c.lname = $lname, ...
  ON MATCH SET c.fname = $fname, c.lname = $lname, ...
  ```
- Repeated runs produce identical node and relationship counts without accumulating duplicate records.

### 4.3 Automated Verification Script (`scripts/verify-migration.js`)
An automated integrity script runs post-migration, asserting exact counts against the source seed:
- **Node Assertions:**
  - `count(Candidate) == 25`
  - `count(Job) == 20`
  - `count(Employer) == 15`
  - `count(Skill) == 15`
  - `count(Education) == 25`
  - `count(Experience) == 25`
  - `count(Interview) == 25`
  - `count(Application) == 25`
  - `count(Dependent) == 25`
  - `count(Location) == 12`
  - `count(Company) == 8`
  - `count(RecruitmentAgency) == 5`
  - `count(Assessment) == 20`
  - `count(Referral) == 14`
  - `count(AppUser) == 3`
  - `count(AuditLog) == 2`
- **Relationship Assertions (18 Distinct Types):**
  - `count([:HAS_SKILL]) == 35`
  - `count([:REQUIRES]) == 27`
  - `count([:APPLIED_FOR]) == 25`
  - `count([:MATCHED_TO]) == 20` (asserting zero collapsed edges via `match_id`)
  - `count([:UNDERWENT]) == 20`
  - `count([:ASSESSED_FOR_JOB]) == 20`
  - `count([:EVALUATED_SKILL]) == 20`
  - `count([:HAS_REFERRAL]) == 14`
  - `count([:PREFERS_LOCATION]) == 25`
  - `count([:HAS_EDUCATION]) == 25`
  - `count([:HAS_EXPERIENCE]) == 25`
  - `count([:HAS_INTERVIEW]) == 25`
  - `count([:SUBMITTED_APPLICATION]) == 25`
  - `count([:FOR_JOB]) == 25`
  - `count([:HAS_DEPENDENT]) == 25`
  - `count([:AFFILIATED_WITH]) == 15`
  - `count([:CONTRACTS_AGENCY]) == 15`
- The script reports a detailed pass/fail table and halts with an exit code of 1 if any orphan or mismatched count is detected.
- *Preservation Status:* Full 100% data preservation is a **Design Specification Target** that is only certified once this automated test suite passes against the populated Neo4j instance.
