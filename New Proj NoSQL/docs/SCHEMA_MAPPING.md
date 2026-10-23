# Relational-to-Graph Schema Mapping & Verification Matrix

**Project:** Job Recruitment Management System (JRMS)
**Source Database:** Oracle Database 23c Free (43 Tables, 148 Attributes, 769 Seed Rows)
**Target Database:** Neo4j Graph Database 5 (Cypher Property Graph)
**Date:** 2026-10-14

---

## 1. Structural Principles & Schema Corrections

### 1.1 Table Count Reconciliation: 41 Domain Tables vs. 43 Total Tables
- **41 BCNF Relational Tables:** The academic DBMS course project submission (DA1 and DA2) normalized the domain into 41 relations without loss of functional dependencies.
- **2 System & Security Tables:** `APP_USERS` (Bcrypt-hashed credentials and RBAC roles) and `APP_AUDIT_LOG` (audit trail) were added for the web application.
- **Total Count:** Exactly **43 tables** and **148 distinct attributes**.
- **Resolution of `EXPERIENCE_LINK`:** The SQL drop blocks reference `EXPERIENCE_LINK`, but no `CREATE TABLE EXPERIENCE_LINK` statement exists. In the initial DA1 draft, candidate experience was tentatively named `EXPERIENCE_LINK`, but was implemented as `Experience_Candidate(exp_id, cand_id, comp_name, end_date)` and `Experience(exp_id, start_date, job_title)`. It is an obsolete draft reference and is safely resolved.

### 1.2 Critical Model Corrections: `Assessed_For` and `Refers`
1. **`Assessed_For` (Ternary Relationship Reification & Distinct Relationship Naming):**
   - *Source Structure:* Primary key `(cand_id, job_key, skill_id)` with assessment attributes `match_per`, `ass_date`, `ass_score`.
   - *Correction:* Reified into an intermediate **`(:Assessment)` entity node** rather than a binary relationship. This preserves the 3-part primary key identity (`assessment_id: 'ASSESS_' + cand_id + '_' + job_key + '_' + skill_id`), all attributes, and connects: `(:Candidate)-[:UNDERWENT]->(:Assessment)`, `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)`, and `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)`. The edge to `(:Job)` is uniquely named **`[:ASSESSED_FOR_JOB]`** to eliminate collision with `(:Application)-[:FOR_JOB]->(:Job)`.
2. **`Refers` (Single-Endpoint Reality):**
   - *Source Structure:* Primary key `(cand_id, referral_date)` with single foreign key `cand_id -> Candidate(cand_id)` and status attribute `referral_status`.
   - *Correction:* Inspection of both the schema and all 14 seed rows confirms there is **no `referrer_id` column** in the relational database. It records when a candidate was referred and their referral status. We model this faithfully as an entity node **`(:Referral)`** with `(:Candidate)-[:HAS_REFERRAL]->(:Referral {referral_id, referral_date, referral_status})`, without hallucinating a non-existent candidate endpoint.
3. **Application Lifecycle Integration & Discrepancy Reconciliation:**
   - *Source Structure:* 
     - `Application` (25 rows: APP001–APP025)
     - `Application_Info` (25 rows: APP001–APP025 mapped to application dates)
     - `Application_Date` (7 rows: distinct dates mapped to offer letters and final results)
     - `Candidate.app_id` (25 rows: Candidate 101–125 mapped 1:1 to APP001–APP025)
     - `Job_Details.app_id` (20 rows: Jobs 1–20 mapped to APP001–APP020)
     - `Applies` (25 rows: Candidates 101–120 mapped to Jobs 1–20, Candidates 121–125 mapped to Jobs 7, 12, 16, 6, and 10)
   - *The Legacy Oracle Discrepancy:*
     In `backend/controllers/applicationController.js`, the query executes:
     `LEFT JOIN Job_Details jd ON jd.app_id = a.app_id`.
     Because `Job_Details` contains only 20 rows, applications `APP021`–`APP025` match zero rows in `Job_Details`. The legacy system therefore outputs `job: null` for candidates 121–125, despite `Applies` explicitly recording their target jobs!
   - *Graph Reconciliation:*
     In Neo4j, `(:Application)` is modeled as a first-class entity node (25 nodes) containing consolidated status, result, date, and offer letter properties.
     - `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)` (25 edges from `Candidate.app_id`).
     - `(:Candidate)-[:APPLIED_FOR]->(:Job)` (25 edges from `Applies`).
     - `(:Application)-[:FOR_JOB]->(:Job)`: Formally linked to target jobs (25 edges, reconciling the 5 missing links via `Applies`), while the migration verification script logs the 5 unlinked `Job_Details.app_id` source records to a reconciliation audit report.

---

### 1.3 Migration Rules for Complex Relational Structures & Data Integrity

1. **Handling of Relational NULL Values:**
   - In Neo4j's property graph model, null properties do not exist physically on disk; an absent property represents a null value.
   - During migration from Oracle, any `NULL` or empty string column is omitted rather than stored as literal `"null"`, preventing sparse null property overhead and index bloat.
2. **Consolidation of Shared Values & BCNF Lookup Decompositions:**
   - Normalization decompositions such as `State_City` (11 rows) and `Location` (12 rows) are consolidated into unified `(:Location)` nodes with deterministic primary keys (`pincode`).
   - `Education_Degree` (7 rows) and `Education_End` (25 rows) are folded into `(:Education)` nodes (25 rows), eliminating artificial multi-table joins while preserving 100% of the attributes.
3. **Handling of Composite Keys & Multi-Valued Attributes:**
   - Multi-valued attributes (`Candidate_Email`, `Candidate_Phone`, `Employer_Phone`) are stored directly as native Cypher arrays of strings (`c.emails`, `c.phones`, `e.phones`) on the parent node.
   - Composite keys representing relationships (`Requires(job_key, skill_id)`, `Has(cand_id, skill_id)`) are converted to directed relationships with properties (`[:REQUIRES {is_mandatory, min_years}]`, `[:HAS_SKILL {pgd_level, years_of_exp}]`).
   - Composite keys representing ternary associations (`Assessed_For`) are reified into `(:Assessment)` nodes with deterministic IDs (`cand_id + '_' + job_key + '_' + skill_id`).
4. **Association Identity Keys to Prevent Silent Record Collapsing:**
   - *Inspection of `Matched_To(match_id)`:* The relational table defines `match_id` as the primary key (`CONSTRAINT pk_matched_to PRIMARY KEY (match_id)`), **not** the composite pair `(cand_id, job_key)`.
   - *Collapse Prevention Rule:* The migration identity key for `Matched_To` must be `match_id` on the relationship:
     ```cypher
     MERGE (c)-[r:MATCHED_TO {match_id: row.match_id}]->(j)
     SET r.match_date = row.match_date
     ```
     This ensures that if a candidate is matched to the same job multiple times across different dates or algorithms, Neo4j preserves them as parallel edges rather than silently collapsing them into a single relationship.
   - *Recorded Unverified Case:* The current 20 seed rows in `database/seed.sql` all connect distinct `(cand_id, job_key)` pairs. Future dataset imports or production updates containing duplicate endpoints are safeguarded by this rule and flagged for parity testing.
5. **Idempotency & Repeated Relationship Migration:**
   - All migration queries utilize Cypher `MERGE` statements on uniquely constrained identifiers (`cand_id`, `job_key`, `emp_id`, `skill_id`, `assessment_id`, `referral_id`, `match_id`).
   - Re-running migration scripts produces zero duplicate nodes or duplicate edges.
6. **Orphan & Unmatched Record Detection:**
   - Pre-migration verification scripts perform referential integrity scans across all source tables.
   - For `Job_Details.app_id` missing `APP021`–`APP025`, reconciliation via `Applies` ensures no application node is orphaned, and all discrepancies are flagged in the migration log.

---

## 2. Complete Verification Matrix (43 Tables)

This matrix maps every single source table and primary key to its target graph element, multiplicity, attribute handling, and automated validation rule:

| Source Table | PK Definition | Seed Rows | Target Graph Element | Mapped Properties / Edges | Verification Check |
| :--- | :--- | :-: | :--- | :--- | :--- |
| `Candidate` | `cand_id` | 25 | Node `(:Candidate)` | `cand_id`, `fname`, `mname`, `lname`, `dob`, `gender`, `reg_date` | `count(c:Candidate) == 25`, unique `cand_id` |
| `Candidate_Address` | `cand_id` | 25 | Node Properties on `(:Candidate)` | `house_no`, `city`, `street` | Consolidated 1:1 on Candidate; check `c.city IS NOT NULL` |
| `Candidate_Email` | `cand_id, email` | 25 | Node Property on `(:Candidate)` | `emails` (List of Strings) | `size(c.emails) >= 1` for all 25 candidates |
| `Candidate_Phone` | `cand_id, phone` | 25 | Node Property on `(:Candidate)` | `phones` (List of Strings) | `size(c.phones) >= 1` for all 25 candidates |
| `Job` | `job_key` | 20 | Node `(:Job)` | `job_key`, `job_id`, `job_status`, `salary` | `count(j:Job) == 20`, unique `job_key` |
| `Job_Details` | `job_key` | 20 | Node Properties on `(:Job)` | `job_title`, `descriptive` | Consolidated 1:1 on Job; check `j.job_title IS NOT NULL` |
| `Job_Posting` | `job_title` | 18 | Node Properties on `(:Job)` | `closing_date`, `posted_date` | Consolidated onto Job; check `j.closing_date IS NOT NULL` |
| `Education` | `edu_id` | 25 | Node `(:Education)` | `edu_id`, `cgpa`, `specialization` | `count(ed:Education) == 25`, unique `edu_id` |
| `Education_Degree` | `degree` | 7 | Node Properties on `(:Education)` | `degree`, `university`, `start_year` | Resolved via `Education_End`; check `ed.degree IS NOT NULL` |
| `Education_End` | `edu_id` | 25 | Node Properties on `(:Education)` | `end_year` | Consolidated on Education; check `ed.end_year IS NOT NULL` |
| `Application` | `app_id` | 25 | Node `(:Application)` | `app_id`, `app_status`, `final_result` | `count(a:Application) == 25`, unique `app_id` |
| `Application_Date` | `app_date` | 7 | Node Properties on `(:Application)`| `offer_letter` | Resolved via `Application_Info`; check `a.offer_letter IS NOT NULL` |
| `Application_Info` | `app_id` | 25 | Node Properties on `(:Application)`| `app_date` | Consolidated on Application; check `a.app_date IS NOT NULL` |
| `Experience` | `exp_id` | 25 | Node `(:Experience)` | `exp_id`, `job_title`, `start_date` | `count(ex:Experience) == 25`, unique `exp_id` |
| `Experience_Candidate`| `exp_id` | 25 | Edge `[:HAS_EXPERIENCE]` & Props | `comp_name`, `end_date` on `(:Experience)` | `count(()-[:HAS_EXPERIENCE]->()) == 25` |
| `Experience_Company` | `comp_name, job_title, end_date` | 10 | Consolidated Properties | `comp_name`, `job_title`, `end_date` | Preserved on `(:Experience)` |
| `Location` | `pincode` | 12 | Node `(:Location)` | `pincode`, `country`, `state` | `count(l:Location) == 12`, unique `pincode` |
| `State_City` | `state` | 11 | Node Property on `(:Location)` | `city` | Consolidated 1:1 on Location; check `l.city IS NOT NULL` |
| `Dependent` | `dep_id` | 25 | Node `(:Dependent)` | `dep_id`, `dob`, `relationship` | `count(d:Dependent) == 25`, unique `dep_id` |
| `Interview` | `int_id` | 25 | Node `(:Interview)` | `int_id`, `int_date`, `int_time` | `count(i:Interview) == 25`, unique `int_id` |
| `Interview_Details` | `int_id` | 25 | Node Properties on `(:Interview)` | `int_mode`, `location`, `int_status`, `score`, `feedback` | Consolidated 1:1 on Interview; check `i.score IS NOT NULL` |
| `Employer` | `emp_id` | 15 | Node `(:Employer)` | `emp_id`, `company_name`, `founded_year` | `count(e:Employer) == 15`, unique `emp_id` |
| `Employer_Details` | `emp_id` | 15 | Node Properties on `(:Employer)` | `company_mail`, `website`, `headquarter` | Consolidated 1:1 on Employer; check `e.website IS NOT NULL` |
| `Employer_Phone` | `emp_id, phone_no` | 15 | Node Property on `(:Employer)` | `phones` (List of Strings) | `size(e.phones) >= 1` for all 15 employers |
| `Skill` | `skill_id` | 15 | Node `(:Skill)` | `skill_id`, `skill_name` | `count(s:Skill) == 15`, unique `skill_id` |
| `Skill_Details` | `skill_name` | 15 | Node Properties on `(:Skill)` | `skill_category`, `description` | Consolidated 1:1 on Skill; check `s.skill_category IS NOT NULL` |
| `Freelancer` | `cand_id` | 10 | Multi-label `:Freelancer` | `hourly_rate`, `portfolio_url` | `count(c:Candidate:Freelancer) == 10` |
| `Fresher` | `cand_id` | 12 | Multi-label `:Fresher` | `grad_year`, `internship_count` | `count(c:Candidate:Fresher) == 12` |
| `Experienced` | `cand_id` | 13 | Multi-label `:Experienced` | `total_exp`, `current_company` | `count(c:Candidate:Experienced) == 13` |
| `Company` | `comp_id` | 8 | Node `(:Company)` | `comp_id`, `comp_type`, `emp_count` | `count(co:Company) == 8`, unique `comp_id` |
| `Company_Employer` | `comp_id, emp_id` | 15 | Edge `[:AFFILIATED_WITH]` | None | `count((:Employer)-[:AFFILIATED_WITH]->(:Company)) == 15` |
| `Recruitment_Agency` | `agency_no` | 5 | Node `(:RecruitmentAgency)` | `agency_no`, `agency_name` | `count(ra:RecruitmentAgency) == 5`, unique `agency_no` |
| `Recruitment_License` | `emp_id` | 15 | Node Property on `(:Employer)` | `license_no` (`lic_no`) | Preserved 1:1 on Employer; check `e.license_no IS NOT NULL` |
| `Recruitment` | `emp_id, agency_no` | 15 | Edge `[:CONTRACTS_AGENCY]` | None | `count((:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)) == 15` |
| `Requires` | `job_key, skill_id` | 27 | Edge `[:REQUIRES]` | `is_mandatory` (Boolean), `min_years` (Integer) | `count((:Job)-[:REQUIRES]->(:Skill)) == 27` |
| `Matched_To` | `match_id` | 20 | Edge `[:MATCHED_TO]` | `match_id` (String), `match_date` (Date) | `count((:Candidate)-[:MATCHED_TO]->(:Job)) == 20` |
| `Applies` | `cand_id, job_key` | 25 | Edge `[:APPLIED_FOR]` | None | `count((:Candidate)-[:APPLIED_FOR]->(:Job)) == 25` |
| `Prefers` | `pincode, cand_id` | 25 | Edge `[:PREFERS_LOCATION]` | None | `count((:Candidate)-[:PREFERS_LOCATION]->(:Location)) == 25` |
| `Refers` | `cand_id, referral_date` | 14 | Node `(:Referral)` & Edge | `referral_id`, `referral_date`, `referral_status` | `count(r:Referral) == 14`, `count(()-[:HAS_REFERRAL]->()) == 14` |
| `Assessed_For` | `cand_id, job_key, skill_id` | 20 | Node `(:Assessment)` & 3 Edges | `assessment_id`, `match_per`, `ass_date`, `ass_score` | `count(a:Assessment) == 20`, 3 edges per assessment |
| `Has` | `cand_id, skill_id` | 35 | Edge `[:HAS_SKILL]` | `pgd_level` (String), `years_of_exp` (Float) | `count((:Candidate)-[:HAS_SKILL]->(:Skill)) == 35` |
| `APP_USERS` | `user_id` | 3 | Node `(:AppUser)` | `user_id`, `username`, `password_hash`, `role`, etc. | `count(u:AppUser) == 3`, unique `username` |
| `APP_AUDIT_LOG` | `log_id` | 2 | Node `(:AuditLog)` | `log_id`, `username`, `role`, `action`, `details`, etc. | `count(al:AuditLog) == 2`, unique `log_id` |

---

## 3. Table-by-Table Detailed Mapping Catalog (All 43 Tables, 148 Attributes)

### APP_AUDIT_LOG
- **Original Table:** `APP_AUDIT_LOG` (Seed rows: **2**)
- **Primary Key:** `log_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `log_id` | `NUMBER(10)` | Yes | PK | Node `(:AuditLog).log_id` | Preserved on node; Unique constraint on log_id |
| `username` | `VARCHAR2(50)` | No | Attribute | Node `(:AuditLog).username` | Preserved on node; Unique constraint on log_id |
| `role` | `VARCHAR2(30)` | No | Attribute | Node `(:AuditLog).role` | Preserved on node; Unique constraint on log_id |
| `action` | `VARCHAR2(100)` | No | Attribute | Node `(:AuditLog).action` | Preserved on node; Unique constraint on log_id |
| `details` | `VARCHAR2(500)` | Yes | Attribute | Node `(:AuditLog).details` | Preserved on node; Unique constraint on log_id |
| `ip_address` | `VARCHAR2(50)` | Yes | Attribute | Node `(:AuditLog).ip_address` | Preserved on node; Unique constraint on log_id |
| `created_at` | `DATE` | No | Attribute | Node `(:AuditLog).created_at` | Preserved on node; Unique constraint on log_id |

### APP_USERS
- **Original Table:** `APP_USERS` (Seed rows: **3**)
- **Primary Key:** `user_id`
- **Check Constraints:** `ck_app_users_role`: `role IN ('USER', 'DATABASE_DESIGNER', 'DBA'`
- **Unique Constraints:** `uq_app_users_username` (`username`)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `user_id` | `NUMBER(6)` | Yes | PK | Node `(:AppUser).user_id` | Preserved on node; Unique constraints on user_id and username |
| `username` | `VARCHAR2(50)` | No | Attribute | Node `(:AppUser).username` | Preserved on node; Unique constraints on user_id and username |
| `password_hash` | `VARCHAR2(255)` | No | Attribute | Node `(:AppUser).password_hash` | Preserved on node; Unique constraints on user_id and username |
| `full_name` | `VARCHAR2(100)` | No | Attribute | Node `(:AppUser).full_name` | Preserved on node; Unique constraints on user_id and username |
| `email` | `VARCHAR2(100)` | No | Attribute | Node `(:AppUser).email` | Preserved on node; Unique constraints on user_id and username |
| `role` | `VARCHAR2(30)` | No | Attribute | Node `(:AppUser).role` | Preserved on node; Unique constraints on user_id and username |
| `is_active` | `NUMBER(1)` | No | Attribute | Node `(:AppUser).is_active` | Preserved on node; Unique constraints on user_id and username |
| `created_at` | `DATE` | No | Attribute | Node `(:AppUser).created_at` | Preserved on node; Unique constraints on user_id and username |

### Application
- **Original Table:** `Application` (Seed rows: **25**)
- **Primary Key:** `app_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `app_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Application).app_id` | Preserved on node; Unique constraint on app_id |
| `app_status` | `VARCHAR2(30)` | Yes | Attribute | Node `(:Application).app_status` | Preserved on node; Unique constraint on app_id |
| `final_result` | `VARCHAR2(30)` | Yes | Attribute | Node `(:Application).final_result` | Preserved on node; Unique constraint on app_id |

### Application_Date
- **Original Table:** `Application_Date` (Seed rows: **7**)
- **Primary Key:** `app_date`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `app_date` | `DATE` | Yes | PK | Node `(:Application).app_date` | Consolidated from BCNF table onto Application node; nulls omitted |
| `offer_letter` | `VARCHAR2(200)` | Yes | Attribute | Node `(:Application).offer_letter` | Consolidated from BCNF table onto Application node; nulls omitted |
| `final_result` | `VARCHAR2(30)` | Yes | Attribute | Node `(:Application).final_result` | Consolidated from BCNF table onto Application node; nulls omitted |

### Application_Info
- **Original Table:** `Application_Info` (Seed rows: **25**)
- **Primary Key:** `app_id`
- **Foreign Keys:** `app_id` -> `Application(app_id)` (CASCADE); `app_date` -> `Application_Date(app_date)` (NO ACTION)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `app_id` | `VARCHAR2(10)` | Yes | PK / FK | Node `(:Application).app_id` | Consolidated from BCNF table onto Application node; nulls omitted |
| `app_date` | `DATE` | Yes | FK | Node `(:Application).app_date` | Consolidated from BCNF table onto Application node; nulls omitted |

### Applies
- **Original Table:** `Applies` (Seed rows: **25**)
- **Primary Key:** `cand_id, job_key`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE); `job_key` -> `Job(job_key)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Relationship `(:Candidate)-[:APPLIED_FOR]->(:Job)` | M:N junction table converted to direct relationship |
| `job_key` | `NUMBER(5)` | Yes | PK / FK | Relationship `(:Candidate)-[:APPLIED_FOR]->(:Job)` | M:N junction table converted to direct relationship |

### Assessed_For
- **Original Table:** `Assessed_For` (Seed rows: **20**)
- **Primary Key:** `cand_id, job_key, skill_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE); `job_key` -> `Job(job_key)` (CASCADE); `skill_id` -> `Skill(skill_id)` (CASCADE)
- **Check Constraints:** `ck_assess_match`: `match_per BETWEEN 0 AND 100`; `ck_assess_score`: `ass_score BETWEEN 0 AND 100`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Connected Edges `[:UNDERWENT]`, `[:ASSESSED_FOR_JOB]`, `[:EVALUATED_SKILL]` | Ternary endpoints connected to intermediate `(:Assessment)` node |
| `job_key` | `NUMBER(5)` | Yes | PK / FK | Connected Edges `[:UNDERWENT]`, `[:ASSESSED_FOR_JOB]`, `[:EVALUATED_SKILL]` | Ternary endpoints connected to intermediate `(:Assessment)` node |
| `skill_id` | `VARCHAR2(10)` | Yes | PK / FK | Connected Edges `[:UNDERWENT]`, `[:ASSESSED_FOR_JOB]`, `[:EVALUATED_SKILL]` | Ternary endpoints connected to intermediate `(:Assessment)` node |
| `match_per` | `NUMBER(5,2)` | Yes | Attribute | Node `(:Assessment).match_per` | Preserved on (:Assessment) node (match_per, ass_date, ass_score) |
| `ass_date` | `DATE` | Yes | Attribute | Node `(:Assessment).ass_date` | Preserved on (:Assessment) node (match_per, ass_date, ass_score) |
| `ass_score` | `NUMBER(5,2)` | Yes | Attribute | Node `(:Assessment).ass_score` | Preserved on (:Assessment) node (match_per, ass_date, ass_score) |

### Candidate
- **Original Table:** `Candidate` (Seed rows: **25**)
- **Primary Key:** `cand_id`
- **Foreign Keys:** `edu_id` -> `Education(edu_id)` (SET NULL); `app_id` -> `Application(app_id)` (SET NULL); `dep_id` -> `Dependent(dep_id)` (SET NULL); `int_id` -> `Interview(int_id)` (SET NULL)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK | Node `(:Candidate).cand_id` | Preserved directly on node; Unique constraint on cand_id |
| `fname` | `VARCHAR2(30)` | No | Attribute | Node `(:Candidate).fname` | Preserved directly on node; Unique constraint on cand_id |
| `mname` | `VARCHAR2(30)` | Yes | Attribute | Node `(:Candidate).mname` | Preserved directly on node; Unique constraint on cand_id |
| `lname` | `VARCHAR2(30)` | No | Attribute | Node `(:Candidate).lname` | Preserved directly on node; Unique constraint on cand_id |
| `dob` | `DATE` | Yes | Attribute | Node `(:Candidate).dob` | Preserved directly on node; Unique constraint on cand_id |
| `gender` | `VARCHAR2(10)` | Yes | Attribute | Node `(:Candidate).gender` | Preserved directly on node; Unique constraint on cand_id |
| `reg_date` | `DATE` | Yes | Attribute | Node `(:Candidate).reg_date` | Preserved directly on node; Unique constraint on cand_id |
| `edu_id` | `VARCHAR2(10)` | Yes | FK | Relationship: `[:EDU_FOR]` | Converted to graph relationship to target entity `Edu` node |
| `app_id` | `VARCHAR2(10)` | Yes | FK | Relationship: `[:APP_FOR]` | Converted to graph relationship to target entity `App` node |
| `dep_id` | `VARCHAR2(10)` | Yes | FK | Relationship: `[:DEP_FOR]` | Converted to graph relationship to target entity `Dep` node |
| `int_id` | `VARCHAR2(10)` | Yes | FK | Relationship: `[:INT_FOR]` | Converted to graph relationship to target entity `Int` node |

### Candidate_Address
- **Original Table:** `Candidate_Address` (Seed rows: **25**)
- **Primary Key:** `cand_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Node `(:Candidate).cand_id` | Consolidated from BCNF table onto Candidate node; nulls omitted |
| `house_no` | `VARCHAR2(20)` | Yes | Attribute | Node `(:Candidate).house_no` | Consolidated from BCNF table onto Candidate node; nulls omitted |
| `city` | `VARCHAR2(40)` | Yes | Attribute | Node `(:Candidate).city` | Consolidated from BCNF table onto Candidate node; nulls omitted |
| `street` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Candidate).street` | Consolidated from BCNF table onto Candidate node; nulls omitted |

### Candidate_Email
- **Original Table:** `Candidate_Email` (Seed rows: **25**)
- **Primary Key:** `cand_id, email`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Relationship Target `(:Candidate)` | Foreign key reference linking to Candidate node |
| `email` | `VARCHAR2(100)` | Yes | PK | Node `(:Candidate).emails` | Collected into native list of strings `emails: []` |

### Candidate_Phone
- **Original Table:** `Candidate_Phone` (Seed rows: **25**)
- **Primary Key:** `cand_id, phone`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Relationship Target `(:Candidate)` | Foreign key reference linking to Candidate node |
| `phone` | `VARCHAR2(15)` | Yes | PK | Node `(:Candidate).phones` | Collected into native list of strings `phones: []` |

### Company
- **Original Table:** `Company` (Seed rows: **8**)
- **Primary Key:** `comp_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `comp_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Company).comp_id` | Preserved on node; Unique constraint on comp_id |
| `comp_type` | `VARCHAR2(40)` | Yes | Attribute | Node `(:Company).comp_type` | Preserved on node; Unique constraint on comp_id |
| `emp_count` | `NUMBER(8)` | Yes | Attribute | Node `(:Company).emp_count` | Preserved on node; Unique constraint on comp_id |

### Company_Employer
- **Original Table:** `Company_Employer` (Seed rows: **15**)
- **Primary Key:** `comp_id, emp_id`
- **Foreign Keys:** `comp_id` -> `Company(comp_id)` (CASCADE); `emp_id` -> `Employer(emp_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `comp_id` | `VARCHAR2(10)` | Yes | PK / FK | Relationship `(:Employer)-[:AFFILIATED_WITH]->(:Company)` | M:N junction table converted to direct relationship |
| `emp_id` | `VARCHAR2(10)` | Yes | PK / FK | Relationship `(:Employer)-[:AFFILIATED_WITH]->(:Company)` | M:N junction table converted to direct relationship |

### Dependent
- **Original Table:** `Dependent` (Seed rows: **25**)
- **Primary Key:** `dep_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `dep_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Dependent).dep_id` | Preserved on node; Unique constraint on dep_id |
| `dob` | `DATE` | Yes | Attribute | Node `(:Dependent).dob` | Preserved on node; Unique constraint on dep_id |
| `relationship` | `VARCHAR2(30)` | Yes | Attribute | Node `(:Dependent).relationship` | Preserved on node; Unique constraint on dep_id |

### Education
- **Original Table:** `Education` (Seed rows: **25**)
- **Primary Key:** `edu_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `edu_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Education).edu_id` | Preserved on node; Unique constraint on edu_id |
| `cgpa` | `NUMBER(3,2)` | Yes | Attribute | Node `(:Education).cgpa` | Preserved on node; Unique constraint on edu_id |
| `specialization` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Education).specialization` | Preserved on node; Unique constraint on edu_id |

### Education_Degree
- **Original Table:** `Education_Degree` (Seed rows: **7**)
- **Primary Key:** `degree`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `degree` | `VARCHAR2(40)` | Yes | PK | Node `(:Education).degree` | Consolidated from BCNF table onto Education node; nulls omitted |
| `university` | `VARCHAR2(100)` | Yes | Attribute | Node `(:Education).university` | Consolidated from BCNF table onto Education node; nulls omitted |
| `start_year` | `NUMBER(4)` | Yes | Attribute | Node `(:Education).start_year` | Consolidated from BCNF table onto Education node; nulls omitted |

### Education_End
- **Original Table:** `Education_End` (Seed rows: **25**)
- **Primary Key:** `edu_id`
- **Foreign Keys:** `edu_id` -> `Education(edu_id)` (CASCADE); `degree` -> `Education_Degree(degree)` (NO ACTION)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `edu_id` | `VARCHAR2(10)` | Yes | PK / FK | Node `(:Education).edu_id` | Consolidated from BCNF table onto Education node; nulls omitted |
| `degree` | `VARCHAR2(40)` | Yes | FK | Node `(:Education).degree` | Consolidated from BCNF table onto Education node; nulls omitted |
| `end_year` | `NUMBER(4)` | Yes | Attribute | Node `(:Education).end_year` | Consolidated from BCNF table onto Education node; nulls omitted |

### Employer
- **Original Table:** `Employer` (Seed rows: **15**)
- **Primary Key:** `emp_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `emp_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Employer).emp_id` | Preserved on node; Unique constraint on emp_id |
| `company_name` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Employer).company_name` | Preserved on node; Unique constraint on emp_id |
| `founded_year` | `NUMBER(4)` | Yes | Attribute | Node `(:Employer).founded_year` | Preserved on node; Unique constraint on emp_id |

### Employer_Details
- **Original Table:** `Employer_Details` (Seed rows: **15**)
- **Primary Key:** `emp_id`
- **Foreign Keys:** `emp_id` -> `Employer(emp_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `emp_id` | `VARCHAR2(10)` | Yes | PK / FK | Node `(:Employer).emp_id` | Consolidated onto Employer node |
| `company_mail` | `VARCHAR2(100)` | Yes | Attribute | Node `(:Employer).company_mail` | Consolidated onto Employer node |
| `website` | `VARCHAR2(100)` | Yes | Attribute | Node `(:Employer).website` | Consolidated onto Employer node |
| `headquarter` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Employer).headquarter` | Consolidated onto Employer node |

### Employer_Phone
- **Original Table:** `Employer_Phone` (Seed rows: **15**)
- **Primary Key:** `emp_id, phone_no`
- **Foreign Keys:** `emp_id` -> `Employer(emp_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `emp_id` | `VARCHAR2(10)` | Yes | PK / FK | Relationship Target `(:Employer)` | Foreign key reference linking to Employer node |
| `phone_no` | `VARCHAR2(15)` | Yes | PK | Node `(:Employer).phones` | Collected into native list of strings `phones: []` |

### Experience
- **Original Table:** `Experience` (Seed rows: **25**)
- **Primary Key:** `exp_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `exp_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Experience).exp_id` | Preserved on node; Unique constraint on exp_id |
| `start_date` | `DATE` | Yes | Attribute | Node `(:Experience).start_date` | Preserved on node; Unique constraint on exp_id |
| `job_title` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Experience).job_title` | Preserved on node; Unique constraint on exp_id |

### Experience_Candidate
- **Original Table:** `Experience_Candidate` (Seed rows: **25**)
- **Primary Key:** `exp_id`
- **Foreign Keys:** `exp_id` -> `Experience(exp_id)` (CASCADE); `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `exp_id` | `VARCHAR2(10)` | Yes | PK / FK | Node `(:Experience).exp_id` | Consolidated on Experience node |
| `cand_id` | `NUMBER(5)` | Yes | FK | Relationship `(:Candidate)-[:HAS_EXPERIENCE]->(:Experience)` | Converted to graph relationship connecting Candidate to Experience |
| `comp_name` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Experience).comp_name` | Consolidated on Experience node |
| `end_date` | `DATE` | Yes | Attribute | Node `(:Experience).end_date` | Consolidated on Experience node |

### Experience_Company
- **Original Table:** `Experience_Company` (Seed rows: **10**)
- **Primary Key:** `comp_name, job_title, end_date`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `comp_name` | `VARCHAR2(60)` | Yes | PK | Node `(:Experience).comp_name` | Consolidated on Experience node |
| `job_title` | `VARCHAR2(60)` | Yes | PK | Node `(:Experience).job_title` | Consolidated on Experience node |
| `end_date` | `DATE` | Yes | PK | Node `(:Experience).end_date` | Consolidated on Experience node |

### Experienced
- **Original Table:** `Experienced` (Seed rows: **13**)
- **Primary Key:** `cand_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Node Label `(:Candidate:Experienced)` | Mapped via multi-label inheritance on Candidate node |
| `total_exp` | `NUMBER(4,1)` | Yes | Attribute | Node `(:Candidate:Experienced).total_exp` | Preserved as subtype property on Candidate node |
| `current_company` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Candidate:Experienced).current_company` | Preserved as subtype property on Candidate node |

### Freelancer
- **Original Table:** `Freelancer` (Seed rows: **10**)
- **Primary Key:** `cand_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Node Label `(:Candidate:Freelancer)` | Mapped via multi-label inheritance on Candidate node |
| `hourly_rate` | `NUMBER(10,2)` | Yes | Attribute | Node `(:Candidate:Freelancer).hourly_rate` | Preserved as subtype property on Candidate node |
| `portfolio_url` | `VARCHAR2(150)` | Yes | Attribute | Node `(:Candidate:Freelancer).portfolio_url` | Preserved as subtype property on Candidate node |

### Fresher
- **Original Table:** `Fresher` (Seed rows: **12**)
- **Primary Key:** `cand_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Node Label `(:Candidate:Fresher)` | Mapped via multi-label inheritance on Candidate node |
| `grad_year` | `NUMBER(4)` | Yes | Attribute | Node `(:Candidate:Fresher).grad_year` | Preserved as subtype property on Candidate node |
| `internship_count` | `NUMBER(3)` | Yes | Attribute | Node `(:Candidate:Fresher).internship_count` | Preserved as subtype property on Candidate node |

### Has
- **Original Table:** `Has` (Seed rows: **35**)
- **Primary Key:** `cand_id, skill_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE); `skill_id` -> `Skill(skill_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Endpoints `(:Candidate)` and `(:Skill)` | Relationship source and target nodes |
| `skill_id` | `VARCHAR2(10)` | Yes | PK / FK | Endpoints `(:Candidate)` and `(:Skill)` | Relationship source and target nodes |
| `pgd_level` | `VARCHAR2(30)` | Yes | Attribute | Relationship Property `[:HAS_SKILL].pgd_level` | Preserved as skill relationship property (proficiency, years) |
| `years_of_exp` | `NUMBER(4,1)` | Yes | Attribute | Relationship Property `[:HAS_SKILL].years_of_exp` | Preserved as skill relationship property (proficiency, years) |

### Interview
- **Original Table:** `Interview` (Seed rows: **25**)
- **Primary Key:** `int_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `int_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Interview).int_id` | Preserved on node; Unique constraint on int_id |
| `int_date` | `DATE` | Yes | Attribute | Node `(:Interview).int_date` | Preserved on node; Unique constraint on int_id |
| `int_time` | `VARCHAR2(10)` | Yes | Attribute | Node `(:Interview).int_time` | Preserved on node; Unique constraint on int_id |

### Interview_Details
- **Original Table:** `Interview_Details` (Seed rows: **25**)
- **Primary Key:** `int_id`
- **Foreign Keys:** `int_id` -> `Interview(int_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `int_id` | `VARCHAR2(10)` | Yes | PK / FK | Node `(:Interview).int_id` | Consolidated onto Interview node |
| `int_mode` | `VARCHAR2(20)` | Yes | Attribute | Node `(:Interview).int_mode` | Consolidated onto Interview node |
| `location` | `VARCHAR2(50)` | Yes | Attribute | Node `(:Interview).location` | Consolidated onto Interview node |
| `int_status` | `VARCHAR2(20)` | Yes | Attribute | Node `(:Interview).int_status` | Consolidated onto Interview node |
| `score` | `NUMBER(5,2)` | Yes | Attribute | Node `(:Interview).score` | Consolidated onto Interview node |
| `feedback` | `VARCHAR2(200)` | Yes | Attribute | Node `(:Interview).feedback` | Consolidated onto Interview node |

### Job
- **Original Table:** `Job` (Seed rows: **20**)
- **Primary Key:** `job_key`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `job_key` | `NUMBER(5)` | Yes | PK | Node `(:Job).job_key` | Preserved directly on node; Unique constraint on job_key |
| `job_id` | `VARCHAR2(10)` | Yes | Attribute | Node `(:Job).job_id` | Preserved directly on node; Unique constraint on job_key |
| `job_status` | `VARCHAR2(20)` | Yes | Attribute | Node `(:Job).job_status` | Preserved directly on node; Unique constraint on job_key |
| `salary` | `NUMBER(10,2)` | Yes | Attribute | Node `(:Job).salary` | Preserved directly on node; Unique constraint on job_key |

### Job_Details
- **Original Table:** `Job_Details` (Seed rows: **20**)
- **Primary Key:** `job_key`
- **Foreign Keys:** `job_key` -> `Job(job_key)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `job_key` | `NUMBER(5)` | Yes | PK / FK | Node `(:Job).job_key` | Consolidated from BCNF table onto Job node; nulls omitted |
| `job_title` | `VARCHAR2(60)` | Yes | Attribute | Node `(:Job).job_title` | Consolidated from BCNF table onto Job node; nulls omitted |
| `descriptive` | `VARCHAR2(200)` | Yes | Attribute | Node `(:Job).descriptive` | Consolidated from BCNF table onto Job node; nulls omitted |
| `app_id` | `VARCHAR2(10)` | Yes | Attribute | Node `(:Job).app_id` | Consolidated from BCNF table onto Job node; nulls omitted |

### Job_Posting
- **Original Table:** `Job_Posting` (Seed rows: **18**)
- **Primary Key:** `job_title`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `job_title` | `VARCHAR2(60)` | Yes | PK | Node `(:Job).job_title` | Consolidated from BCNF table onto Job node; nulls omitted |
| `closing_date` | `DATE` | Yes | Attribute | Node `(:Job).closing_date` | Consolidated from BCNF table onto Job node; nulls omitted |
| `posted_date` | `DATE` | Yes | Attribute | Node `(:Job).posted_date` | Consolidated from BCNF table onto Job node; nulls omitted |

### Location
- **Original Table:** `Location` (Seed rows: **12**)
- **Primary Key:** `pincode`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `pincode` | `NUMBER(6)` | Yes | PK | Node `(:Location).pincode` | Preserved on node; Unique constraint on pincode |
| `country` | `VARCHAR2(40)` | Yes | Attribute | Node `(:Location).country` | Preserved on node; Unique constraint on pincode |
| `state` | `VARCHAR2(40)` | Yes | Attribute | Node `(:Location).state` | Preserved on node; Unique constraint on pincode |

### Matched_To
- **Original Table:** `Matched_To` (Seed rows: **20**)
- **Primary Key:** `match_id`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE); `job_key` -> `Job(job_key)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | FK | Endpoints `(:Candidate)` and `(:Job)` | Relationship source and target nodes |
| `job_key` | `NUMBER(5)` | Yes | FK | Endpoints `(:Candidate)` and `(:Job)` | Relationship source and target nodes |
| `match_id` | `VARCHAR2(10)` | Yes | PK | Relationship Property `[:MATCHED_TO].match_id` | Preserved on relationship; match_id and match_date preserved |
| `match_date` | `DATE` | Yes | Attribute | Relationship Property `[:MATCHED_TO].match_date` | Preserved on relationship; match_id and match_date preserved |

### Prefers
- **Original Table:** `Prefers` (Seed rows: **25**)
- **Primary Key:** `pincode, cand_id`
- **Foreign Keys:** `pincode` -> `Location(pincode)` (CASCADE); `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `pincode` | `NUMBER(6)` | Yes | PK / FK | Relationship `(:Candidate)-[:PREFERS_LOCATION]->(:Location)` | M:N junction table converted to direct relationship |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Relationship `(:Candidate)-[:PREFERS_LOCATION]->(:Location)` | M:N junction table converted to direct relationship |

### Recruitment
- **Original Table:** `Recruitment` (Seed rows: **15**)
- **Primary Key:** `emp_id, agency_no`
- **Foreign Keys:** `emp_id` -> `Employer(emp_id)` (CASCADE); `agency_no` -> `Recruitment_Agency(agency_no)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `emp_id` | `VARCHAR2(10)` | Yes | PK / FK | Relationship `(:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)` | M:N junction table converted to direct relationship |
| `agency_no` | `VARCHAR2(10)` | Yes | PK / FK | Relationship `(:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)` | M:N junction table converted to direct relationship |

### Recruitment_Agency
- **Original Table:** `Recruitment_Agency` (Seed rows: **5**)
- **Primary Key:** `agency_no`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `agency_no` | `VARCHAR2(10)` | Yes | PK | Node `(:RecruitmentAgency).agency_no` | Preserved on node; Unique constraint on agency_no |
| `agency_name` | `VARCHAR2(80)` | Yes | Attribute | Node `(:RecruitmentAgency).agency_name` | Preserved on node; Unique constraint on agency_no |

### Recruitment_License
- **Original Table:** `Recruitment_License` (Seed rows: **15**)
- **Primary Key:** `emp_id`
- **Foreign Keys:** `emp_id` -> `Employer(emp_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `emp_id` | `VARCHAR2(10)` | Yes | PK / FK | Node Target `(:Employer)` | Foreign key reference |
| `lic_no` | `VARCHAR2(20)` | Yes | Attribute | Node `(:Employer).license_no` | Preserved as property on Employer node |

### Refers
- **Original Table:** `Refers` (Seed rows: **14**)
- **Primary Key:** `cand_id, referral_date`
- **Foreign Keys:** `cand_id` -> `Candidate(cand_id)` (CASCADE)

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `cand_id` | `NUMBER(5)` | Yes | PK / FK | Edge `(:Candidate)-[:HAS_REFERRAL]->(:Referral)` | Connecting candidate to their referral record node |
| `referral_date` | `DATE` | Yes | PK | Node `(:Referral).referral_date` | Preserved on (:Referral) node (referral_date, referral_status) |
| `referral_status` | `VARCHAR2(20)` | Yes | Attribute | Node `(:Referral).referral_status` | Preserved on (:Referral) node (referral_date, referral_status) |

### Requires
- **Original Table:** `Requires` (Seed rows: **27**)
- **Primary Key:** `job_key, skill_id`
- **Foreign Keys:** `job_key` -> `Job(job_key)` (CASCADE); `skill_id` -> `Skill(skill_id)` (CASCADE)
- **Check Constraints:** `ck_requires_mandatory`: `is_mandatory IN ('Y','N'`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `job_key` | `NUMBER(5)` | Yes | PK / FK | Endpoints `(:Job)` and `(:Skill)` | Relationship source and target nodes |
| `skill_id` | `VARCHAR2(10)` | Yes | PK / FK | Endpoints `(:Job)` and `(:Skill)` | Relationship source and target nodes |
| `is_mandatory` | `CHAR(1)` | Yes | Attribute | Relationship Property `[:REQUIRES].is_mandatory` | Preserved as relationship attribute (boolean/integer) |
| `min_years` | `NUMBER(3)` | Yes | Attribute | Relationship Property `[:REQUIRES].min_years` | Preserved as relationship attribute (boolean/integer) |

### Skill
- **Original Table:** `Skill` (Seed rows: **15**)
- **Primary Key:** `skill_id`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `skill_id` | `VARCHAR2(10)` | Yes | PK | Node `(:Skill).skill_id` | Preserved on node; Unique constraint on skill_id |
| `skill_name` | `VARCHAR2(50)` | Yes | Attribute | Node `(:Skill).skill_name` | Preserved on node; Unique constraint on skill_id |

### Skill_Details
- **Original Table:** `Skill_Details` (Seed rows: **15**)
- **Primary Key:** `skill_name`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `skill_name` | `VARCHAR2(50)` | Yes | PK | Node `(:Skill).skill_name` | Consolidated onto Skill node |
| `skill_category` | `VARCHAR2(50)` | Yes | Attribute | Node `(:Skill).skill_category` | Consolidated onto Skill node |
| `description` | `VARCHAR2(200)` | Yes | Attribute | Node `(:Skill).description` | Consolidated onto Skill node |

### State_City
- **Original Table:** `State_City` (Seed rows: **11**)
- **Primary Key:** `state`

| Original Column | Data Type | Nullable | Role | Proposed Neo4j Element & Property | Transformation / Preservation Rule |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `state` | `VARCHAR2(40)` | Yes | PK | Node `(:Location).state` | Consolidated onto Location node |
| `city` | `VARCHAR2(40)` | Yes | Attribute | Node `(:Location).city` | Consolidated onto Location node |

---

## 4. Master Canonical Relationship Catalog (18 Distinct Types) & Preservation Target

### 4.1 Master Canonical Relationship Catalog

| # | Relationship Type Name | Canonical Pattern | Multiplicity | Properties | Seed Edges | Originating Relational Source |
| :-: | :--- | :--- | :---: | :--- | :-: | :--- |
| 1 | `HAS_SKILL` | `(:Candidate)-[:HAS_SKILL]->(:Skill)` | M:N | `pgd_level`, `years_of_exp` | **35** | `Has` junction table (35 rows) |
| 2 | `REQUIRES` | `(:Job)-[:REQUIRES]->(:Skill)` | M:N | `is_mandatory`, `min_years` | **27** | `Requires` junction table (27 rows) |
| 3 | `APPLIED_FOR` | `(:Candidate)-[:APPLIED_FOR]->(:Job)` | M:N | None | **25** | `Applies` junction table (25 rows) |
| 4 | `MATCHED_TO` | `(:Candidate)-[:MATCHED_TO]->(:Job)` | M:N | `match_id`, `match_date` | **20** | `Matched_To` table (merged on `match_id`) |
| 5 | `UNDERWENT` | `(:Candidate)-[:UNDERWENT]->(:Assessment)` | 1:N | None | **20** | `Assessed_For` (Candidate endpoint) |
| 6 | `ASSESSED_FOR_JOB` | `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)` | N:1 | None | **20** | `Assessed_For` (Job endpoint; distinct name) |
| 7 | `EVALUATED_SKILL` | `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)` | N:1 | None | **20** | `Assessed_For` (Skill endpoint) |
| 8 | `HAS_REFERRAL` | `(:Candidate)-[:HAS_REFERRAL]->(:Referral)` | 1:N | None | **14** | `Refers` table (14 rows) |
| 9 | `PREFERS_LOCATION` | `(:Candidate)-[:PREFERS_LOCATION]->(:Location)` | M:N | None | **25** | `Prefers` junction table (25 rows) |
| 10 | `HAS_EDUCATION` | `(:Candidate)-[:HAS_EDUCATION]->(:Education)` | N:1 | None | **25** | `Candidate.edu_id` foreign key (25 rows) |
| 11 | `HAS_EXPERIENCE` | `(:Candidate)-[:HAS_EXPERIENCE]->(:Experience)` | 1:N | None | **25** | `Experience_Candidate` table (25 rows) |
| 12 | `HAS_INTERVIEW` | `(:Candidate)-[:HAS_INTERVIEW]->(:Interview)` | 1:1 | None | **25** | `Candidate.int_id` foreign key (25 rows) |
| 13 | `SUBMITTED_APPLICATION` | `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)` | 1:1 | None | **25** | `Candidate.app_id` foreign key (25 rows) |
| 14 | `FOR_JOB` | `(:Application)-[:FOR_JOB]->(:Job)` | N:1 | None | **25** | `Job_Details.app_id` (20) + Reconciled via `Applies` (5) |
| 15 | `HAS_DEPENDENT` | `(:Candidate)-[:HAS_DEPENDENT]->(:Dependent)` | 1:1 | None | **25** | `Candidate.dep_id` foreign key (25 rows) |
| 16 | `POSTED_JOB` | `(:Employer)-[:POSTED_JOB]->(:Job)` | 1:N | None | *Domain* | Standardized canonical name (source schema lacks FK) |
| 17 | `AFFILIATED_WITH` | `(:Employer)-[:AFFILIATED_WITH]->(:Company)` | M:N | None | **15** | `Company_Employer` junction (15 rows) |
| 18 | `CONTRACTS_AGENCY` | `(:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)` | M:N | None | **15** | `Recruitment` junction table (15 rows) |

### 4.2 Data Preservation Status & Verification Categorization

To maintain strict scientific rigor, claims across this project are formally categorized into verified facts, design decisions, and execution-dependent targets:

1. **Empirically Verified Source Facts:**
   - Source DDL defines exactly 43 tables and 148 attributes.
   - `database/seed.sql` contains exactly 769 inserts; `DA2_complete_oracle.sql` contains 195 inserts.
   - `Matched_To` primary key is `match_id` (not `cand_id, job_key`).
   - `Refers` contains no `referrer_id` column in the relational schema.
   - `Job_Details.app_id` contains only 20 rows, leaving `APP021`–`APP025` unlinked in the relational job table.
   - `Employer` and `Job` possess no connecting foreign key or junction table in the relational schema.
2. **Approved Architectural Design Decisions:**
   - Intermediate `(:Assessment)` node reifies `Assessed_For` with 3 distinct edge types: `[:UNDERWENT]`, `[:ASSESSED_FOR_JOB]`, `[:EVALUATED_SKILL]`.
   - `(:Referral)` entity node reifies `Refers` with `[:HAS_REFERRAL]`, avoiding fabricated referrer candidates.
   - Multi-valued attributes consolidated into native arrays (`emails`, `phones`).
   - BCNF lookup tables consolidated into parent nodes (`Location`, `Education`).
   - Migration identity key for `Matched_To` is `match_id` on the relationship to preserve parallel matches.
   - Canonical relationship names standardized as `POSTED_JOB` and `ASSESSED_FOR_JOB`.
3. **Design Specification Targets Requiring Execution Verification in Phase 2:**
   - **100% Data Preservation:** Target to be empirically verified via post-migration automated parity tests comparing source column values to target node/edge properties.
   - **Zero Collapsed Records:** Target to be verified by assertion scripts verifying edge count parity against relational table row counts.
   - **Referential Integrity:** Target to be verified by Cypher automated integrity queries asserting zero orphaned nodes or dangling relationships.