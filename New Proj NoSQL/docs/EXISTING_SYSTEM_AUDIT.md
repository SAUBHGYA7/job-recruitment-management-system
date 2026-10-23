# Existing System Technical Audit: Job Recruitment Management System (JRMS)

**Audit Version:** 3.0 (Comprehensive Source Verification & Discrepancy Reconciliation)  
**Date:** 2026-10-14  
**Auditor:** Senior Full-Stack Software Engineer & Database Architect  
**Project Workspace:** `/Users/divyam/Desktop/Langauges/C++/job-recruitment-management-system`  
**Original GitHub Repository:** [https://github.com/SAUBHGYA7/job-recruitment-management-system](https://github.com/SAUBHGYA7/job-recruitment-management-system) (Strictly Read-Only)  
**Target GitHub Account for Eventual Publication:** `https://github.com/divyamvermadpsv-rgb`

---

## Executive Summary

The **Job Recruitment Management System (JRMS)** is an enterprise academic database system originally modeled for **Oracle Database 23c Free** using Boyce-Codd Normal Form (**BCNF**) relational decomposition, coupled with a full-stack **React 18 + Node.js Express** management application.

This deep audit inspects the exact source files:
- [database/schema.sql](file:///Users/divyam/Desktop/Langauges/C++/job-recruitment-management-system/database/schema.sql) (DDL defining 43 tables and 148 attributes)
- [database/seed.sql](file:///Users/divyam/Desktop/Langauges/C++/job-recruitment-management-system/database/seed.sql) (Comprehensive dataset: 769 rows across 43 tables)
- [DA2_complete_oracle.sql](file:///Users/divyam/Desktop/Langauges/C++/job-recruitment-management-system/DA2_complete_oracle.sql) (Base academic course script: 195 rows across 41 tables)
- Backend routes, controllers, middleware, and frontend services.

---

## 1. Table Count Reconciliation: 41 Domain Tables vs. 43 Total Tables

A central question in the audit was reconciling the project documentation's mention of 41 relations with the 43 `CREATE TABLE` statements found in `database/schema.sql`:

1. **The 41 Academic Domain Tables (DA1 & DA2):**
   In the academic DBMS course project submission, functional dependency (FD) analysis and minimal covers were applied to normalize the domain into **41 BCNF relations**. These represent the pure recruitment domain.
2. **The 2 System & Security Tables:**
   When the database was integrated into a multi-actor web application, two infrastructure tables were added:
   - `APP_USERS`: Stores system user accounts, passwords hashed with Bcrypt, and RBAC roles (`USER`, `DATABASE_DESIGNER`, `DBA`).
   - `APP_AUDIT_LOG`: Stores security event tracking (user, role, action, IP, timestamp).
   Both use Oracle sequences (`seq_app_users`, `seq_app_audit_log`) and `BEFORE INSERT` triggers.
3. **The `EXPERIENCE_LINK` Phantom Reference:**
   The cleanup `DROP TABLE` block in both SQL files lists `EXPERIENCE_LINK`. Detailed AST parsing confirms that **no `CREATE TABLE EXPERIENCE_LINK` statement exists**. In the initial DA1 draft, work history was tentatively named `EXPERIENCE_LINK`, but it was implemented in DA2 as `Experience_Candidate(exp_id, cand_id, comp_name, end_date)`. It is an obsolete draft reference and is safely resolved.

**Conclusion:** The database contains exactly **43 tables** and **148 distinct attributes**.

---

## 2. Actual Seed Data Population & Row Counts

It is critical not to assume that every table has 25 or more records. An automated parse of every `INSERT INTO` statement in `database/seed.sql` and `DA2_complete_oracle.sql` reveals the exact distribution of source data:

| # | Table Name | Category | Primary Key | `seed.sql` Rows | `DA2_complete_oracle.sql` Rows |
| :-: | :--- | :--- | :--- | :-: | :-: |
| 1 | `Candidate` | Core Entity | `cand_id` | **25** (101-125) | **5** (101-105) |
| 2 | `Candidate_Address` | Decomposed (BCNF) | `cand_id` | **25** | **5** |
| 3 | `Candidate_Email` | Multi-valued Attribute | `cand_id, email` | **25** | **5** |
| 4 | `Candidate_Phone` | Multi-valued Attribute | `cand_id, phone` | **25** | **5** |
| 5 | `Job` | Core Entity | `job_key` | **20** (1-20) | **5** (1-5) |
| 6 | `Job_Details` | Decomposed (BCNF) | `job_key` | **20** | **5** |
| 7 | `Job_Posting` | Decomposed (BCNF) | `job_title` | **18** | **3** |
| 8 | `Education` | Core Entity | `edu_id` | **25** (ED001-ED025) | **5** (ED001-ED005) |
| 9 | `Education_Degree` | Decomposed (BCNF) | `degree` | **7** | **3** |
| 10 | `Education_End` | Decomposed (BCNF) | `edu_id` | **25** | **5** |
| 11 | `Application` | Core Entity | `app_id` | **25** (APP001-APP025) | **5** (APP001-APP005) |
| 12 | `Application_Date` | Decomposed (BCNF) | `app_date` | **7** | **3** |
| 13 | `Application_Info` | Decomposed (BCNF) | `app_id` | **25** | **5** |
| 14 | `Experience` | Core Entity | `exp_id` | **25** (EX001-EX025) | **5** (EX001-EX005) |
| 15 | `Experience_Candidate`| Decomposed (BCNF) | `exp_id` | **25** | **5** |
| 16 | `Experience_Company` | Decomposed (BCNF) | `comp_name, job_title, end_date` | **10** | **3** |
| 17 | `Location` | Core Entity | `pincode` | **12** | **6** |
| 18 | `State_City` | Decomposed (BCNF) | `state` | **11** | **4** |
| 19 | `Dependent` | Core Entity | `dep_id` | **25** (D001-D025) | **5** (D001-D005) |
| 20 | `Interview` | Core Entity | `int_id` | **25** (INT001-INT025) | **5** (INT001-INT005) |
| 21 | `Interview_Details` | Decomposed (BCNF) | `int_id` | **25** | **5** |
| 22 | `Employer` | Core Entity | `emp_id` | **15** (E001-E015) | **5** (E001-E005) |
| 23 | `Employer_Details` | Decomposed (BCNF) | `emp_id` | **15** | **5** |
| 24 | `Employer_Phone` | Multi-valued Attribute | `emp_id, phone_no` | **15** | **5** |
| 25 | `Skill` | Core Entity | `skill_id` | **15** (S001-S015) | **5** (S001-S005) |
| 26 | `Skill_Details` | Decomposed (BCNF) | `skill_name` | **15** | **4** |
| 27 | `Freelancer` | Subtype Entity | `cand_id` | **10** | **5** |
| 28 | `Fresher` | Subtype Entity | `cand_id` | **12** | **5** |
| 29 | `Experienced` | Subtype Entity | `cand_id` | **13** | **5** |
| 30 | `Company` | Supporting Entity | `comp_id` | **8** | **4** |
| 31 | `Company_Employer` | Association (M:N) | `comp_id, emp_id` | **15** | **5** |
| 32 | `Recruitment_Agency` | Supporting Entity | `agency_no` | **5** (RA001-RA005) | **3** (RA001-RA003) |
| 33 | `Recruitment_License` | 1:1 Entity | `emp_id` | **15** | **5** |
| 34 | `Recruitment` | Association (M:N) | `emp_id, agency_no` | **15** | **5** |
| 35 | `Requires` | Association (M:N) | `job_key, skill_id` | **27** | **5** |
| 36 | `Matched_To` | Association (M:N) | `match_id` | **20** | **5** |
| 37 | `Applies` | Association (M:N) | `cand_id, job_key` | **25** | **5** |
| 38 | `Prefers` | Association (M:N) | `pincode, cand_id` | **25** | **5** |
| 39 | `Refers` | Association (1:N) | `cand_id, referral_date` | **14** | **5** |
| 40 | `Assessed_For` | Association (Ternary) | `cand_id, job_key, skill_id` | **20** | **5** |
| 41 | `Has` | Association (M:N) | `cand_id, skill_id` | **35** | **7** |
| 42 | `APP_USERS` | System / Security | `user_id` | **3** (`recruiter`, `designer`, `dba_admin`) | 0 |
| 43 | `APP_AUDIT_LOG` | System / Audit | `log_id` | **2** | 0 |
| **Total** | | | | **769 rows** | **195 rows** |

---

## 3. Detailed Investigation of Critical Schema Constructs

### 3.1 Investigation of `Assessed_For` (Ternary Relationship)
- **Table Definition:**
  ```sql
  CREATE TABLE Assessed_For (
      cand_id   NUMBER(5),
      job_key   NUMBER(5),
      skill_id  VARCHAR2(10),
      match_per NUMBER(5,2),
      ass_date  DATE,
      ass_score NUMBER(5,2),
      CONSTRAINT pk_assessed_for PRIMARY KEY (cand_id, job_key, skill_id),
      CONSTRAINT fk_assess_candidate FOREIGN KEY (cand_id) REFERENCES Candidate(cand_id) ON DELETE CASCADE,
      CONSTRAINT fk_assess_job FOREIGN KEY (job_key) REFERENCES Job(job_key) ON DELETE CASCADE,
      CONSTRAINT fk_assess_skill FOREIGN KEY (skill_id) REFERENCES Skill(skill_id) ON DELETE CASCADE,
      CONSTRAINT ck_assess_match CHECK (match_per BETWEEN 0 AND 100),
      CONSTRAINT ck_assess_score CHECK (ass_score BETWEEN 0 AND 100)
  );
  ```
- **Analysis:** This is a genuine ternary association with independent evaluation attributes (`match_per`, `ass_date`, `ass_score`). In property graphs, binary relationships connect two nodes. If we model this as a binary relationship between Candidate and Job with `skill_id` as a scalar string property, we lose direct relationship traversals to the `(:Skill)` node.
- **Resolution:** Reify `Assessed_For` into an intermediate **`(:Assessment)` node**:
  - Unique identifier: `assessment_id` (deterministic string: `'ASSESS_' + cand_id + '_' + job_key + '_' + skill_id`).
  - Attributes: `match_per`, `ass_date`, `ass_score`, `cand_id`, `job_key`, `skill_id`.
  - Directed edges (distinct, unambiguous type names):
    - `(:Candidate)-[:UNDERWENT]->(:Assessment)`
    - `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)` (explicitly named to prevent type collision with `(:Application)-[:FOR_JOB]->(:Job)`)
    - `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)`
  This models the ternary association losslessly and allows native graph traversals from any of the three endpoints.

---

### 3.2 Investigation of `Refers` (Single-Endpoint Limitation)
- **Table Definition:**
  ```sql
  CREATE TABLE Refers (
      cand_id         NUMBER(5),
      referral_date   DATE,
      referral_status VARCHAR2(20),
      CONSTRAINT pk_refers PRIMARY KEY (cand_id, referral_date),
      CONSTRAINT fk_refers_candidate FOREIGN KEY (cand_id) REFERENCES Candidate(cand_id) ON DELETE CASCADE
  );
  ```
- **Analysis:** Inspection of both the schema and all 14 seed rows confirms that `Refers` has **only one Candidate foreign key** (`cand_id`). There is **no `referrer_id` column** in the relational schema.
- **Critical Finding:** The original relational model does not identify *who* referred the candidate; it only tracks that Candidate `cand_id` was referred on date `referral_date` with status `referral_status` (`'Accepted'`, `'Pending'`, `'Rejected'`).
- **Resolution:** We must NOT hallucinate a non-existent candidate endpoint by guessing `(:Candidate)-[:REFERS]->(:Candidate)`. Instead, we model this as a **`(:Referral)` entity node**:
  - `(:Referral {referral_id: 'REF_' + cand_id + '_' + referral_date, cand_id: int, referral_date: string, referral_status: string})`.
  - Directed edge: `(:Candidate)-[:HAS_REFERRAL]->(:Referral)`.
  If the application schema is extended in the future to include a referring candidate, a `[:REFERRED_BY]->(:Candidate)` relationship can connect to this node without altering existing data.

---

### 3.3 Investigation of Application Lifecycle & Decomposed Tables
1. **The Application Triad:**
   - `Application(app_id, app_status, final_result)` (25 rows)
   - `Application_Info(app_id, app_date)` (25 rows)
   - `Application_Date(app_date, offer_letter, final_result)` (7 rows)
   The functional dependencies were decomposed in DA1 to remove transitive dependencies on `app_date, final_result -> offer_letter`.
   In `database/seed.sql`, every `app_id` (APP001 to APP025) has an entry in `Application_Info`, and its `(app_date, final_result)` resolves to an `offer_letter` template in `Application_Date`.

2. **Linkage to Candidate, Job, and Applies (Discrepancy Analysis):**
   - **Candidate Linkage:** In `Candidate`, column `app_id` points to `APP001` through `APP025` for candidates 101 to 125 (exact 1:1 match).
   - **Job_Details Linkage:** In `Job_Details`, column `app_id` points to `APP001` through `APP020` for jobs 1 to 20. There are only 20 rows in `Job_Details`. `APP021` through `APP025` have **no corresponding row** in `Job_Details`.
   - **Applies Junction Table:** In `Applies`, all 25 rows pair `cand_id` with `job_key`:
     - Candidates 101–120 pair 1:1 with Jobs 1–20 (matching `Job_Details.app_id`).
     - Candidates 121–125 pair with Jobs 7, 12, 16, 6, and 10 respectively.
   - **Legacy Application Controller Bug Discovered:**
     In [backend/controllers/applicationController.js](file:///Users/divyam/Desktop/Langauges/C++/job-recruitment-management-system/backend/controllers/applicationController.js), the query joins:
     ```sql
     SELECT a.app_id, a.app_status, a.final_result,
            c.cand_id, c.fname || ' ' || c.lname AS candidate_name,
            jd.job_title, j.job_id, j.job_key
     FROM Application a
     LEFT JOIN Candidate c ON c.app_id = a.app_id
     LEFT JOIN Job_Details jd ON jd.app_id = a.app_id
     LEFT JOIN Job j ON j.job_key = jd.job_key
     ```
     Because `Job_Details` only has 20 rows, `jd.app_id` is `NULL` for `APP021` through `APP025`. As a result, the Oracle API returns `job: null` for candidates 121–125, despite `Applies` recording their target jobs!
     Furthermore, `Job_Details.app_id` reflects an artificial 1:1 relational modeling defect (a job can only hold one `app_id`), preventing multiple applicants from referencing the same job through `Job_Details`.

3. **Resolution & Preservation in Neo4j:**
   - Model `(:Application)` as a first-class node containing:
     `app_id`, `app_status`, `final_result`, `app_date`, `offer_letter`.
   - Directed edges:
     - `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)` (25 edges, 1:1 from `Candidate.app_id`).
     - `(:Candidate)-[:APPLIED_FOR]->(:Job)` (25 edges from `Applies`).
     - `(:Application)-[:FOR_JOB]->(:Job)`: Reconciled via `Applies` (25 edges) while explicitly logging in the migration audit report that in the source database, `APP021`–`APP025` were unlinked in `Job_Details.app_id`.

---

### 3.4 Investigation of Association Primary Keys & Multi-Edge Identifiers
Inspection of the schema reveals associations that define their own independent primary key:
- **`Matched_To(cand_id, job_key, match_id, match_date)`:**
  - *Schema Primary Key:* `CONSTRAINT pk_matched_to PRIMARY KEY (match_id)`.
  - *Critical Insight:* The PK is `match_id`, **not** the composite pair `(cand_id, job_key)`. This means the relational schema structurally allows multiple distinct matches between the same candidate and job over time.
  - *Seed Data Inspection:* In `database/seed.sql`, there are 20 rows (`M001` to `M020`), each currently linking a distinct candidate (101–120) to a distinct job (1–20).
  - *Migration Rule:* To guarantee that multiple matches between the same candidate and job can never silently collapse into a single edge, the migration must use `match_id` as the identity key:
    ```cypher
    MERGE (c)-[r:MATCHED_TO {match_id: row.match_id}]->(j)
    SET r.match_date = row.match_date
    ```
  - *Recorded Unverified Case:* While the current seed data contains no duplicate `(cand_id, job_key)` pairs, production data or future imports could contain multiple matches per pair; merging on `match_id` guarantees parallel edges are preserved without data loss.

---

### 3.5 Investigation of Other Decomposed Tables
- **`State_City` (11 rows) & `Location` (12 rows):**
  In `State_City`, `state` is the primary key (11 states, each mapped to 1 capital/primary city, e.g. Karnataka -> Bengaluru). In `Location`, `pincode` is the primary key. In Neo4j, `(:Location)` consolidates `pincode`, `country`, `state`, and `city` (resolved from `State_City`), preserving all geographic attributes without artificial two-node fragmentation.
- **`Education_Degree` (7 rows) & `Education_End` (25 rows) & `Education` (25 rows):**
  There are 7 distinct degrees (`BTech`, `MTech`, `MBA`, `BCA`, `MCA`, `BSc CS`, `MS CS`) with universities and start years. In Neo4j, each candidate has an `(:Education)` node holding their full education record (`edu_id`, `cgpa`, `specialization`, `degree`, `university`, `start_year`, `end_year`), perfectly preserving the user-facing education view.
- **`Experience_Company` (10 rows):**
  Consolidated onto `(:Experience {exp_id, comp_name, job_title, start_date, end_date})` connected via `(:Candidate)-[:HAS_EXPERIENCE]->(:Experience)`.

---

## 4. Master Canonical Relationship Catalog (18 Distinct Types)

The system defines exactly **18 distinct canonical relationship types**, eliminating name collisions between assessment and application links:

| # | Relationship Type Name | Pattern | Multiplicity | Properties | Seed Edges | Source Relational Origin |
| :-: | :--- | :--- | :---: | :--- | :-: | :--- |
| 1 | `HAS_SKILL` | `(:Candidate)-[:HAS_SKILL]->(:Skill)` | M:N | `pgd_level`, `years_of_exp` | **35** | `Has` table |
| 2 | `REQUIRES` | `(:Job)-[:REQUIRES]->(:Skill)` | M:N | `is_mandatory`, `min_years` | **27** | `Requires` table |
| 3 | `APPLIED_FOR` | `(:Candidate)-[:APPLIED_FOR]->(:Job)` | M:N | None | **25** | `Applies` table |
| 4 | `MATCHED_TO` | `(:Candidate)-[:MATCHED_TO]->(:Job)` | M:N | `match_id`, `match_date` | **20** | `Matched_To` table (merged on `match_id`) |
| 5 | `UNDERWENT` | `(:Candidate)-[:UNDERWENT]->(:Assessment)` | 1:N | None | **20** | `Assessed_For` (Candidate link) |
| 6 | `ASSESSED_FOR_JOB` | `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)` | N:1 | None | **20** | `Assessed_For` (Job link; renamed to avoid collision) |
| 7 | `EVALUATED_SKILL` | `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)` | N:1 | None | **20** | `Assessed_For` (Skill link) |
| 8 | `HAS_REFERRAL` | `(:Candidate)-[:HAS_REFERRAL]->(:Referral)` | 1:N | None | **14** | `Refers` table |
| 9 | `PREFERS_LOCATION` | `(:Candidate)-[:PREFERS_LOCATION]->(:Location)` | M:N | None | **25** | `Prefers` table |
| 10 | `HAS_EDUCATION` | `(:Candidate)-[:HAS_EDUCATION]->(:Education)` | N:1 | None | **25** | `Candidate.edu_id` |
| 11 | `HAS_EXPERIENCE` | `(:Candidate)-[:HAS_EXPERIENCE]->(:Experience)` | 1:N | None | **25** | `Experience_Candidate` |
| 12 | `HAS_INTERVIEW` | `(:Candidate)-[:HAS_INTERVIEW]->(:Interview)` | 1:1 | None | **25** | `Candidate.int_id` |
| 13 | `SUBMITTED_APPLICATION` | `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)` | 1:1 | None | **25** | `Candidate.app_id` |
| 14 | `FOR_JOB` | `(:Application)-[:FOR_JOB]->(:Job)` | N:1 | None | **25** | `Job_Details.app_id` / `Applies` |
| 15 | `HAS_DEPENDENT` | `(:Candidate)-[:HAS_DEPENDENT]->(:Dependent)` | 1:1 | None | **25** | `Candidate.dep_id` |
| 16 | `POSTED_JOB` | `(:Employer)-[:POSTED_JOB]->(:Job)` | 1:N | None | *Domain* | Standardized canonical name (source schema lacks FK) |
| 17 | `AFFILIATED_WITH` | `(:Employer)-[:AFFILIATED_WITH]->(:Company)` | M:N | None | **15** | `Company_Employer` table |
| 18 | `CONTRACTS_AGENCY` | `(:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)` | M:N | None | **15** | `Recruitment` table |

> [!NOTE]
> **Data Preservation Status:** Complete 100% attribute and relationship preservation is a **Design Specification Target**. Empirical verification of zero data loss is pending execution of the automated parity tests in Phase 2.

---

## 5. Security Architecture & Configuration Audit

### 5.1 DBA Console Security Boundary Analysis
- **Current Relational Implementation Flaw:**
  In `backend/controllers/dbaController.js`, SQL console security relies entirely on client/regex string matching (`/\b(DROP|TRUNCATE|ALTER...)\b/i`).
  **Regex filtering is NOT a security boundary:** It can be bypassed by comments, Unicode tricks, subqueries, or unforeseen dialect syntax.
- **Distinguishing Driver Read Mode from Database Permissions:**
  - In the official Neo4j Bolt driver, configuring `defaultAccessMode: neo4j.session.READ` or calling `session.executeRead()` provides **client-side routing intent** (directing queries to read-replicas in a causal cluster).
  - In a single-instance Neo4j Community deployment, the driver connects to the single standalone server. If the connected database account possesses full write privileges, the driver mode alone does **not** constitute an engine-enforced security barrier.
- **Modernized Multi-Layer Security Architecture:**
  1. **Least-Privilege Database User Account:**
     - For production / Neo4j Enterprise: The console connects using a dedicated `neo4j_readonly` database user granted strictly read-only role permissions (`GRANT TRAVERSE ON GRAPH * ... GRANT READ ON GRAPH *`).
     - For Neo4j Community Edition: The backend application server strictly enforces read-only execution by passing queries through an AST-based Cypher parser before dispatch, wrapping queries in `session.executeRead()`, and denying any query containing mutation clauses.
  2. **Removal of Unrestricted APOC Procedures:**
     - Setting `NEO4J_dbms_security_procedures_unrestricted=apoc.*` in container configuration introduces severe vulnerabilities (e.g. `apoc.cypher.run*`, `apoc.export.*`, `apoc.import.*` can access the host filesystem or execute arbitrary commands).
     - **Resolution:** Unrestricted APOC execution is **prohibited**. Only specific, non-destructive utility procedures are whitelisted if required (`apoc.coll.*,apoc.map.*,apoc.date.*`), completely blocking all file access, execution, and export procedures.
  3. **Server-Side RBAC Enforcement:** The route `/api/dba/cypher-console` is strictly guarded by `authenticateToken` and `requireRole('DBA')`.
  4. **Strict Separation of Administrative Writes:** Schema migrations, index creations, and constraint definitions are segregated into separate, non-interactive administrative endpoints requiring explicit confirmation and audited execution.
  5. **No Credential Exposure:** Database URIs, Bolt credentials, and passwords are never exposed to the frontend browser.

### 5.2 Configuration Hardening & Secret Management
- **Audit Findings in Existing Codebase:**
  - `backend/controllers/authController.js` contains hardcoded fallback passwords (`recruiter: 'User@123'`, `designer: 'Designer@123'`, `dba_admin: 'Dba@123'`).
  - `backend/db/oracle.js` falls back to `'oracle'`.
  - `PROPOSED_ARCHITECTURE.md` had an insecure default fallback `${NEO4J_AUTH:-neo4j/ChooseStrongPassword123!}`.
- **Hardening Mandate for Modernization:**
  1. **Zero Usable Fallbacks:** All default and fallback passwords are removed from code and configuration templates.
  2. **Fail-Fast Configuration Validation:** On application and container startup, if `NEO4J_PASSWORD` or `JWT_SECRET` is unset or empty, the backend process immediately terminates with a clear, actionable error message.
  3. **Strict `.gitignore` Enforcement:** Real `.env` files are strictly excluded from Git. Only `.env.example` with non-sensitive variable placeholders is tracked.
  4. **Production Password Hashing:** All users in `APP_USERS` must authenticate solely via Bcrypt password hashes (`bcrypt.compare`). Hardcoded credential bypasses are eliminated.
