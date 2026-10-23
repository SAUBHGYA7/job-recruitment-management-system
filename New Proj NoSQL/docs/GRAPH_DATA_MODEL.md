# Neo4j Graph Data Model: Job Recruitment Management System (JRMS)

**Document Version:** 2.0 (Post-Audit Reification & Verification)  
**Date:** 2026-10-14  
**Author:** Senior Full-Stack Software Engineer & Database Architect  
**Target Engine:** Neo4j 5 Community / Enterprise  

---

## 1. Graph Data Model Architecture

The JRMS graph database converts a 43-table BCNF relational schema into an expressive, high-performance property graph. In recruitment, candidates, jobs, employers, skills, and applications naturally form a dense network of relationships. 

### Key Architectural Resolutions:
1. **Reification of `Assessed_For` (Ternary Association):**  
   The source table `Assessed_For` has a 3-part primary key `(cand_id, job_key, skill_id)` with assessment attributes (`match_per`, `ass_date`, `ass_score`). In property graphs, binary relationships connect two nodes. Rather than collapsing this into a binary relationship with a scalar string property, we reify it into an **`(:Assessment)` entity node** connected to `(:Candidate)`, `(:Job)`, and `(:Skill)`. This faithfully preserves the original three-part identity and enables multi-hop traversals from any angle.
2. **Faithful Representation of `Refers` (Single-Endpoint Reality):**  
   The source table `Refers` records `cand_id`, `referral_date`, and `referral_status`. Inspection proves that **no second candidate foreign key exists**. We model this faithfully as an entity node **`(:Referral)`** with `(:Candidate)-[:HAS_REFERRAL]->(:Referral)` rather than inventing a non-existent candidate endpoint.
3. **Application Lifecycle Integration:**  
   The application lifecycle (decomposed in BCNF across `Application`, `Application_Info`, and `Application_Date`) is consolidated onto a first-class **`(:Application)` node** connected via `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)-[:FOR_JOB]->(:Job)`. In addition, direct candidate-to-job applications are preserved via `(:Candidate)-[:APPLIED_FOR]->(:Job)`.

---

## 2. Complete Graph Schema Diagram

```mermaid
graph TD
    %% Core Nodes
    Candidate(["(:Candidate)"])
    Job(["(:Job)"])
    Employer(["(:Employer)"])
    Skill(["(:Skill)"])
    Education(["(:Education)"])
    Experience(["(:Experience)"])
    Interview(["(:Interview)"])
    Application(["(:Application)"])
    Dependent(["(:Dependent)"])
    Location(["(:Location)"])
    Company(["(:Company)"])
    RecruitmentAgency(["(:RecruitmentAgency)"])
    AppUser(["(:AppUser)"])
    AuditLog(["(:AuditLog)"])

    %% Reified Entity Nodes
    Assessment["(:Assessment)"]
    Referral["(:Referral)"]

    %% Subtypes (Multi-labels)
    Freelancer["(:Candidate:Freelancer)"] -.->|Subtype| Candidate
    Fresher["(:Candidate:Fresher)"] -.->|Subtype| Candidate
    Experienced["(:Candidate:Experienced)"] -.->|Subtype| Candidate

    %% Relationships
    Candidate -->|HAS_SKILL {pgd_level, years_of_exp}| Skill
    Job -->|REQUIRES {is_mandatory, min_years}| Skill
    Candidate -->|APPLIED_FOR| Job
    Candidate -->|MATCHED_TO {match_id, match_date}| Job
    
    %% Reified Assessment Connections
    Candidate -->|UNDERWENT| Assessment
    Assessment -->|ASSESSED_FOR_JOB| Job
    Assessment -->|EVALUATED_SKILL| Skill

    %% Reified Referral Connection
    Candidate -->|HAS_REFERRAL| Referral

    %% Lifecycle & Profile Connections
    Candidate -->|HAS_EDUCATION| Education
    Candidate -->|HAS_EXPERIENCE| Experience
    Candidate -->|HAS_INTERVIEW| Interview
    Candidate -->|SUBMITTED_APPLICATION| Application
    Application -->|FOR_JOB| Job
    Candidate -->|HAS_DEPENDENT| Dependent
    Candidate -->|PREFERS_LOCATION| Location

    %% Corporate Connections
    Employer -->|POSTED_JOB| Job
    Employer -->|AFFILIATED_WITH| Company
    Employer -->|CONTRACTS_AGENCY| RecruitmentAgency
```

---

## 3. Node Labels and Property Specifications

### 3.1 `(:Candidate)`
- **Labels:** `:Candidate` (plus optional subtype labels `:Freelancer`, `:Fresher`, `:Experienced`)
- **Primary Identifier:** `cand_id` (Integer, Unique Constraint)
- **Properties:**
  - `cand_id`: Integer (Mandatory, Unique)
  - `fname`: String (Mandatory)
  - `mname`: String (Optional)
  - `lname`: String (Mandatory)
  - `dob`: Date / ISO String (Optional)
  - `gender`: String (Optional)
  - `reg_date`: Date / ISO String (Optional)
  - `house_no`: String (Optional, from `Candidate_Address`)
  - `city`: String (Optional, from `Candidate_Address`)
  - `street`: String (Optional, from `Candidate_Address`)
  - `emails`: List of Strings (from `Candidate_Email`)
  - `phones`: List of Strings (from `Candidate_Phone`)
- **Subtype Properties:**
  - `:Freelancer`: `hourly_rate` (Float), `portfolio_url` (String)
  - `:Fresher`: `grad_year` (Integer), `internship_count` (Integer)
  - `:Experienced`: `total_exp` (Float), `current_company` (String)

---

### 3.2 `(:Assessment)` (Reified from `Assessed_For`)
- **Label:** `:Assessment`
- **Primary Identifier:** `assessment_id` (String, Unique Constraint, formatted as `'ASSESS_' + cand_id + '_' + job_key + '_' + skill_id`)
- **Properties:**
  - `assessment_id`: String (Mandatory, Unique)
  - `cand_id`: Integer (Mandatory)
  - `job_key`: Integer (Mandatory)
  - `skill_id`: String (Mandatory)
  - `match_per`: Float (e.g. `92.00`)
  - `ass_date`: Date / ISO String (e.g. `'2026-08-15'`)
  - `ass_score`: Float (e.g. `90.00`)
- **Connected Relationships:**
  - `(:Candidate)-[:UNDERWENT]->(:Assessment)`
  - `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)`
  - `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)`

---

### 3.3 `(:Referral)` (Reified from `Refers`)
- **Label:** `:Referral`
- **Primary Identifier:** `referral_id` (String, Unique Constraint, formatted as `'REF_' + cand_id + '_' + referral_date`)
- **Properties:**
  - `referral_id`: String (Mandatory, Unique)
  - `cand_id`: Integer (Mandatory)
  - `referral_date`: Date / ISO String (e.g. `'2025-08-05'`)
  - `referral_status`: String (`'Accepted'`, `'Pending'`, `'Rejected'`)
- **Connected Relationship:**
  - `(:Candidate)-[:HAS_REFERRAL]->(:Referral)`

---

### 3.4 `(:Job)`
- **Label:** `:Job`
- **Primary Identifier:** `job_key` (Integer, Unique Constraint)
- **Properties:**
  - `job_key`: Integer (Mandatory, Unique)
  - `job_id`: String (e.g. `'J001'`, Indexed)
  - `job_status`: String (`'Open'`, `'Closed'`, `'Interviewing'`)
  - `salary`: Float (Annual compensation)
  - `job_title`: String (from `Job_Details`)
  - `descriptive`: String (from `Job_Details`)
  - `closing_date`: Date / ISO String (from `Job_Posting`)
  - `posted_date`: Date / ISO String (from `Job_Posting`)

---

### 3.5 `(:Employer)`
- **Label:** `:Employer`
- **Primary Identifier:** `emp_id` (String, Unique Constraint)
- **Properties:**
  - `emp_id`: String (Mandatory, Unique, e.g. `'E001'`)
  - `company_name`: String (e.g. `'Nexus Technologies'`)
  - `founded_year`: Integer (e.g. `2015`)
  - `company_mail`: String (from `Employer_Details`)
  - `website`: String (from `Employer_Details`)
  - `headquarter`: String (from `Employer_Details`)
  - `license_no`: String (from `Recruitment_License`)
  - `phones`: List of Strings (from `Employer_Phone`)

---

### 3.6 `(:Skill)`
- **Label:** `:Skill`
- **Primary Identifier:** `skill_id` (String, Unique Constraint)
- **Properties:**
  - `skill_id`: String (Mandatory, Unique, e.g. `'S001'`)
  - `skill_name`: String (Mandatory, Indexed, e.g. `'React.js'`)
  - `skill_category`: String (from `Skill_Details`)
  - `description`: String (from `Skill_Details`)

---

### 3.7 `(:Application)`
- **Label:** `:Application`
- **Primary Identifier:** `app_id` (String, Unique Constraint)
- **Properties:**
  - `app_id`: String (Mandatory, Unique, e.g. `'APP001'`)
  - `app_status`: String (`'Selected'`, `'Pending'`, `'Rejected'`)
  - `final_result`: String (`'Selected'`, `'Pending'`, `'Rejected'`)
  - `app_date`: Date / ISO String (from `Application_Info`)
  - `offer_letter`: String (from `Application_Date`)

---

### 3.8 `(:Education)`, `(:Experience)`, `(:Interview)`, `(:Dependent)`, `(:Location)`, `(:Company)`, `(:RecruitmentAgency)`
- **`(:Education)`**: `edu_id` (PK), `cgpa`, `specialization`, `degree`, `university`, `start_year`, `end_year`.
- **`(:Experience)`**: `exp_id` (PK), `job_title`, `comp_name`, `start_date`, `end_date`.
- **`(:Interview)`**: `int_id` (PK), `int_date`, `int_time`, `int_mode`, `location`, `int_status`, `score`, `feedback`.
- **`(:Dependent)`**: `dep_id` (PK), `dob`, `relationship`.
- **`(:Location)`**: `pincode` (PK), `country`, `state`, `city`.
- **`(:Company)`**: `comp_id` (PK), `comp_type`, `emp_count`.
- **`(:RecruitmentAgency)`**: `agency_no` (PK), `agency_name`.
- **`(:AppUser)`**: `user_id` (PK), `username` (Unique), `password_hash`, `full_name`, `email`, `role`, `is_active`, `created_at`.
- **`(:AuditLog)`**: `log_id` (PK), `username`, `role`, `action`, `details`, `ip_address`, `created_at`.

---

## 4. Master Canonical Relationship Catalog (18 Distinct Types)

| # | Relationship Type Name | Canonical Pattern | Cardinality | Target Edges | Properties | Source Relational Origin |
| :-: | :--- | :--- | :---: | :-: | :--- | :--- |
| 1 | `HAS_SKILL` | `(:Candidate)-[:HAS_SKILL]->(:Skill)` | M:N | **35** | `pgd_level`, `years_of_exp` | `Has` junction table (35 rows) |
| 2 | `REQUIRES` | `(:Job)-[:REQUIRES]->(:Skill)` | M:N | **27** | `is_mandatory`, `min_years` | `Requires` junction table (27 rows) |
| 3 | `APPLIED_FOR` | `(:Candidate)-[:APPLIED_FOR]->(:Job)` | M:N | **25** | None | `Applies` junction table (25 rows) |
| 4 | `MATCHED_TO` | `(:Candidate)-[:MATCHED_TO]->(:Job)` | M:N | **20** | `match_id`, `match_date` | `Matched_To` (merged on `match_id`) |
| 5 | `UNDERWENT` | `(:Candidate)-[:UNDERWENT]->(:Assessment)` | 1:N | **20** | None | `Assessed_For` (Candidate link) |
| 6 | `ASSESSED_FOR_JOB` | `(:Assessment)-[:ASSESSED_FOR_JOB]->(:Job)` | N:1 | **20** | None | `Assessed_For` (Job link; distinct name) |
| 7 | `EVALUATED_SKILL` | `(:Assessment)-[:EVALUATED_SKILL]->(:Skill)` | N:1 | **20** | None | `Assessed_For` (Skill link) |
| 8 | `HAS_REFERRAL` | `(:Candidate)-[:HAS_REFERRAL]->(:Referral)` | 1:N | **14** | None | `Refers` (Candidate referral link) |
| 9 | `PREFERS_LOCATION` | `(:Candidate)-[:PREFERS_LOCATION]->(:Location)` | M:N | **25** | None | `Prefers` junction table (25 rows) |
| 10 | `HAS_EDUCATION` | `(:Candidate)-[:HAS_EDUCATION]->(:Education)` | N:1 | **25** | None | `Candidate.edu_id` foreign key (25 rows) |
| 11 | `HAS_EXPERIENCE` | `(:Candidate)-[:HAS_EXPERIENCE]->(:Experience)` | 1:N | **25** | None | `Experience_Candidate` junction (25 rows) |
| 12 | `HAS_INTERVIEW` | `(:Candidate)-[:HAS_INTERVIEW]->(:Interview)` | 1:1 | **25** | None | `Candidate.int_id` foreign key (25 rows) |
| 13 | `SUBMITTED_APPLICATION` | `(:Candidate)-[:SUBMITTED_APPLICATION]->(:Application)` | 1:1 | **25** | None | `Candidate.app_id` foreign key (25 rows) |
| 14 | `FOR_JOB` | `(:Application)-[:FOR_JOB]->(:Job)` | N:1 | **25** | None | `Job_Details.app_id` (20) + Reconciled via `Applies` (5) |
| 15 | `HAS_DEPENDENT` | `(:Candidate)-[:HAS_DEPENDENT]->(:Dependent)` | 1:1 | **25** | None | `Candidate.dep_id` foreign key (25 rows) |
| 16 | `POSTED_JOB` | `(:Employer)-[:POSTED_JOB]->(:Job)` | 1:N | *Domain* | None | Canonical name; source schema lacks FK (unlinked in seed unless derived) |
| 17 | `AFFILIATED_WITH` | `(:Employer)-[:AFFILIATED_WITH]->(:Company)` | M:N | **15** | None | `Company_Employer` junction (15 rows) |
| 18 | `CONTRACTS_AGENCY` | `(:Employer)-[:CONTRACTS_AGENCY]->(:RecruitmentAgency)` | M:N | **15** | None | `Recruitment` junction table (15 rows) |

> [!NOTE]
> **Reconciliation & Integrity Notes:**
> - **18 Distinct Relationship Types:** Reconciled with exactly 18 distinct relationship type names; `ASSESSED_FOR_JOB` replaces the reused `FOR_JOB` identifier on assessments to eliminate Cypher pattern ambiguity.
> - **Multi-Edge Preservation (`Matched_To`):** Because `Matched_To` has source PK `match_id` (rather than composite `(cand_id, job_key)`), the migration identity key is `match_id` on the `[:MATCHED_TO]` edge (`MERGE (c)-[r:MATCHED_TO {match_id: row.match_id}]->(j)`). This guarantees parallel match edges are preserved without collapsing identical endpoints.
> - **Target vs. Verified Status:** Complete data preservation is a **Design Specification Target** to be validated empirically by automated test suites in Phase 2.

---

## 5. Cypher Constraints and Indexes

```cypher
// 1. Primary Identifier Uniqueness Constraints (Idempotent Load Prerequisites)
CREATE CONSTRAINT uq_candidate_id IF NOT EXISTS FOR (c:Candidate) REQUIRE c.cand_id IS UNIQUE;
CREATE CONSTRAINT uq_job_key IF NOT EXISTS FOR (j:Job) REQUIRE j.job_key IS UNIQUE;
CREATE CONSTRAINT uq_skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.skill_id IS UNIQUE;
CREATE CONSTRAINT uq_emp_id IF NOT EXISTS FOR (e:Employer) REQUIRE e.emp_id IS UNIQUE;
CREATE CONSTRAINT uq_edu_id IF NOT EXISTS FOR (ed:Education) REQUIRE ed.edu_id IS UNIQUE;
CREATE CONSTRAINT uq_exp_id IF NOT EXISTS FOR (ex:Experience) REQUIRE ex.exp_id IS UNIQUE;
CREATE CONSTRAINT uq_int_id IF NOT EXISTS FOR (i:Interview) REQUIRE i.int_id IS UNIQUE;
CREATE CONSTRAINT uq_app_id IF NOT EXISTS FOR (a:Application) REQUIRE a.app_id IS UNIQUE;
CREATE CONSTRAINT uq_dep_id IF NOT EXISTS FOR (d:Dependent) REQUIRE d.dep_id IS UNIQUE;
CREATE CONSTRAINT uq_location_pincode IF NOT EXISTS FOR (l:Location) REQUIRE l.pincode IS UNIQUE;
CREATE CONSTRAINT uq_company_id IF NOT EXISTS FOR (co:Company) REQUIRE co.comp_id IS UNIQUE;
CREATE CONSTRAINT uq_agency_no IF NOT EXISTS FOR (ra:RecruitmentAgency) REQUIRE ra.agency_no IS UNIQUE;
CREATE CONSTRAINT uq_assessment_id IF NOT EXISTS FOR (a:Assessment) REQUIRE a.assessment_id IS UNIQUE;
CREATE CONSTRAINT uq_referral_id IF NOT EXISTS FOR (r:Referral) REQUIRE r.referral_id IS UNIQUE;
CREATE CONSTRAINT uq_app_user_id IF NOT EXISTS FOR (u:AppUser) REQUIRE u.user_id IS UNIQUE;
CREATE CONSTRAINT uq_app_user_username IF NOT EXISTS FOR (u:AppUser) REQUIRE u.username IS UNIQUE;
CREATE CONSTRAINT uq_audit_log_id IF NOT EXISTS FOR (al:AuditLog) REQUIRE al.log_id IS UNIQUE;

// 2. Performance Search Indexes
CREATE INDEX idx_candidate_names IF NOT EXISTS FOR (c:Candidate) ON (c.lname, c.fname);
CREATE INDEX idx_job_title IF NOT EXISTS FOR (j:Job) ON (j.job_title);
CREATE INDEX idx_skill_name IF NOT EXISTS FOR (s:Skill) ON (s.skill_name);
CREATE INDEX idx_employer_company IF NOT EXISTS FOR (e:Employer) ON (e.company_name);
```
