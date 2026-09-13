-- ============================================================
-- JOB RECRUITMENT MANAGEMENT SYSTEM - ORACLE SCHEMA
-- Based on DA1 Relational Mapping & Normalization (BCNF Analysis)
-- ============================================================

SET DEFINE OFF;

-- ------------------------------------------------------------
-- 0. CLEANUP (Safe to re-run)
-- ------------------------------------------------------------
BEGIN
  FOR t IN (
    SELECT table_name FROM user_tables
    WHERE table_name IN (
      'APP_AUDIT_LOG','APP_USERS',
      'ASSESSED_FOR','HAS','REFERS','PREFERS','APPLIES','MATCHED_TO','REQUIRES',
      'RECRUITMENT','RECRUITMENT_LICENSE','RECRUITMENT_AGENCY',
      'COMPANY_EMPLOYER','COMPANY',
      'EXPERIENCED','FRESHER','FREELANCER',
      'SKILL_DETAILS','SKILL',
      'EMPLOYER_PHONE','EMPLOYER_DETAILS','EMPLOYER',
      'INTERVIEW_DETAILS','INTERVIEW',
      'DEPENDENT','STATE_CITY','LOCATION',
      'EXPERIENCE_LINK','EXPERIENCE_COMPANY','EXPERIENCE_CANDIDATE','EXPERIENCE',
      'APPLICATION_INFO','APPLICATION_DATE','APPLICATION',
      'EDUCATION_END','EDUCATION_DEGREE','EDUCATION',
      'JOB_POSTING','JOB_DETAILS','JOB',
      'CANDIDATE_PHONE','CANDIDATE_EMAIL','CANDIDATE_ADDRESS','CANDIDATE'
    )
  ) LOOP
    BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END;
/

-- ------------------------------------------------------------
-- 1. CANDIDATE RELATIONS
-- ------------------------------------------------------------
CREATE TABLE Candidate (
    cand_id     NUMBER(5),
    fname       VARCHAR2(30) NOT NULL,
    mname       VARCHAR2(30),
    lname       VARCHAR2(30) NOT NULL,
    dob         DATE,
    gender      VARCHAR2(10),
    reg_date    DATE,
    edu_id      VARCHAR2(10),
    app_id      VARCHAR2(10),
    dep_id      VARCHAR2(10),
    int_id      VARCHAR2(10),
    CONSTRAINT pk_candidate PRIMARY KEY (cand_id)
);

CREATE TABLE Candidate_Address (
    cand_id     NUMBER(5),
    house_no    VARCHAR2(20),
    city        VARCHAR2(40),
    street      VARCHAR2(60),
    CONSTRAINT pk_candidate_address PRIMARY KEY (cand_id),
    CONSTRAINT fk_caddr_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Candidate_Email (
    cand_id NUMBER(5),
    email   VARCHAR2(100),
    CONSTRAINT pk_candidate_email PRIMARY KEY (cand_id, email),
    CONSTRAINT fk_cemail_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Candidate_Phone (
    cand_id NUMBER(5),
    phone   VARCHAR2(15),
    CONSTRAINT pk_candidate_phone PRIMARY KEY (cand_id, phone),
    CONSTRAINT fk_cphone_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 2. JOB RELATIONS (Decomposed per DA1 FD analysis)
-- ------------------------------------------------------------
CREATE TABLE Job (
    job_key     NUMBER(5),
    job_id      VARCHAR2(10),
    job_status  VARCHAR2(20),
    salary      NUMBER(10,2),
    CONSTRAINT pk_job PRIMARY KEY (job_key)
);

CREATE TABLE Job_Details (
    job_key      NUMBER(5),
    job_title    VARCHAR2(60),
    descriptive  VARCHAR2(200),
    app_id       VARCHAR2(10),
    CONSTRAINT pk_job_details PRIMARY KEY (job_key),
    CONSTRAINT fk_jobdetails_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key) ON DELETE CASCADE
);

CREATE TABLE Job_Posting (
    job_title    VARCHAR2(60),
    closing_date DATE,
    posted_date  DATE,
    CONSTRAINT pk_job_posting PRIMARY KEY (job_title)
);

-- ------------------------------------------------------------
-- 3. EDUCATION RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Education (
    edu_id         VARCHAR2(10),
    cgpa           NUMBER(3,2),
    specialization VARCHAR2(60),
    CONSTRAINT pk_education PRIMARY KEY (edu_id)
);

CREATE TABLE Education_Degree (
    degree     VARCHAR2(40),
    university VARCHAR2(100),
    start_year NUMBER(4),
    CONSTRAINT pk_education_degree PRIMARY KEY (degree)
);

CREATE TABLE Education_End (
    edu_id   VARCHAR2(10),
    degree   VARCHAR2(40),
    end_year NUMBER(4),
    CONSTRAINT pk_education_end PRIMARY KEY (edu_id),
    CONSTRAINT fk_eduend_edu FOREIGN KEY (edu_id)
        REFERENCES Education(edu_id) ON DELETE CASCADE,
    CONSTRAINT fk_eduend_degree FOREIGN KEY (degree)
        REFERENCES Education_Degree(degree)
);

-- ------------------------------------------------------------
-- 4. APPLICATION RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Application (
    app_id       VARCHAR2(10),
    app_status   VARCHAR2(30),
    final_result VARCHAR2(30),
    CONSTRAINT pk_application PRIMARY KEY (app_id)
);

CREATE TABLE Application_Date (
    app_date     DATE,
    offer_letter VARCHAR2(200),
    final_result VARCHAR2(30),
    CONSTRAINT pk_application_date PRIMARY KEY (app_date)
);

CREATE TABLE Application_Info (
    app_id   VARCHAR2(10),
    app_date DATE,
    CONSTRAINT pk_application_info PRIMARY KEY (app_id),
    CONSTRAINT fk_appinfo_application FOREIGN KEY (app_id)
        REFERENCES Application(app_id) ON DELETE CASCADE,
    CONSTRAINT fk_appinfo_date FOREIGN KEY (app_date)
        REFERENCES Application_Date(app_date)
);

-- ------------------------------------------------------------
-- 5. EXPERIENCE RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Experience (
    exp_id     VARCHAR2(10),
    start_date DATE,
    job_title  VARCHAR2(60),
    CONSTRAINT pk_experience PRIMARY KEY (exp_id)
);

CREATE TABLE Experience_Candidate (
    exp_id    VARCHAR2(10),
    cand_id   NUMBER(5),
    comp_name VARCHAR2(60),
    end_date  DATE,
    CONSTRAINT pk_exp_candidate PRIMARY KEY (exp_id),
    CONSTRAINT fk_expc_exp FOREIGN KEY (exp_id)
        REFERENCES Experience(exp_id) ON DELETE CASCADE,
    CONSTRAINT fk_expc_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Experience_Company (
    comp_name VARCHAR2(60),
    job_title VARCHAR2(60),
    end_date  DATE,
    CONSTRAINT pk_exp_company PRIMARY KEY (comp_name, job_title, end_date)
);

-- ------------------------------------------------------------
-- 6. LOCATION RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Location (
    pincode NUMBER(6),
    country VARCHAR2(40),
    state   VARCHAR2(40),
    CONSTRAINT pk_location PRIMARY KEY (pincode)
);

CREATE TABLE State_City (
    state VARCHAR2(40),
    city  VARCHAR2(40),
    CONSTRAINT pk_state_city PRIMARY KEY (state)
);

-- ------------------------------------------------------------
-- 7. DEPENDENT RELATION
-- ------------------------------------------------------------
CREATE TABLE Dependent (
    dep_id       VARCHAR2(10),
    dob          DATE,
    relationship VARCHAR2(30),
    CONSTRAINT pk_dependent PRIMARY KEY (dep_id)
);

-- ------------------------------------------------------------
-- 8. INTERVIEW RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Interview (
    int_id   VARCHAR2(10),
    int_date DATE,
    int_time VARCHAR2(10),
    CONSTRAINT pk_interview PRIMARY KEY (int_id)
);

CREATE TABLE Interview_Details (
    int_id     VARCHAR2(10),
    int_mode   VARCHAR2(20),
    location   VARCHAR2(50),
    int_status VARCHAR2(20),
    score      NUMBER(5,2),
    feedback   VARCHAR2(200),
    CONSTRAINT pk_interview_details PRIMARY KEY (int_id),
    CONSTRAINT fk_intdetails_interview FOREIGN KEY (int_id)
        REFERENCES Interview(int_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 9. EMPLOYER RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Employer (
    emp_id       VARCHAR2(10),
    company_name VARCHAR2(60),
    founded_year NUMBER(4),
    CONSTRAINT pk_employer PRIMARY KEY (emp_id)
);

CREATE TABLE Employer_Details (
    emp_id       VARCHAR2(10),
    company_mail VARCHAR2(100),
    website      VARCHAR2(100),
    headquarter  VARCHAR2(60),
    CONSTRAINT pk_employer_details PRIMARY KEY (emp_id),
    CONSTRAINT fk_empdetails_employer FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id) ON DELETE CASCADE
);

CREATE TABLE Employer_Phone (
    emp_id   VARCHAR2(10),
    phone_no VARCHAR2(15),
    CONSTRAINT pk_employer_phone PRIMARY KEY (emp_id, phone_no),
    CONSTRAINT fk_empphone_employer FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 10. SKILL RELATIONS (Decomposed per DA1)
-- ------------------------------------------------------------
CREATE TABLE Skill (
    skill_id   VARCHAR2(10),
    skill_name VARCHAR2(50),
    CONSTRAINT pk_skill PRIMARY KEY (skill_id)
);

CREATE TABLE Skill_Details (
    skill_name     VARCHAR2(50),
    skill_category VARCHAR2(50),
    description    VARCHAR2(200),
    CONSTRAINT pk_skill_details PRIMARY KEY (skill_name)
);

-- ------------------------------------------------------------
-- 11. SUBTYPES (CANDIDATE SPECIALIZATION)
-- ------------------------------------------------------------
CREATE TABLE Freelancer (
    cand_id       NUMBER(5),
    hourly_rate   NUMBER(10,2),
    portfolio_url VARCHAR2(150),
    CONSTRAINT pk_freelancer PRIMARY KEY (cand_id),
    CONSTRAINT fk_freelancer_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Fresher (
    cand_id          NUMBER(5),
    grad_year        NUMBER(4),
    internship_count NUMBER(3),
    CONSTRAINT pk_fresher PRIMARY KEY (cand_id),
    CONSTRAINT fk_fresher_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Experienced (
    cand_id         NUMBER(5),
    total_exp       NUMBER(4,1),
    current_company VARCHAR2(60),
    CONSTRAINT pk_experienced PRIMARY KEY (cand_id),
    CONSTRAINT fk_experienced_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 12. COMPANY RELATIONS
-- ------------------------------------------------------------
CREATE TABLE Company (
    comp_id   VARCHAR2(10),
    comp_type VARCHAR2(40),
    emp_count NUMBER(8),
    CONSTRAINT pk_company PRIMARY KEY (comp_id)
);

CREATE TABLE Company_Employer (
    comp_id VARCHAR2(10),
    emp_id  VARCHAR2(10),
    CONSTRAINT pk_company_employer PRIMARY KEY (comp_id, emp_id),
    CONSTRAINT fk_company_employer_company FOREIGN KEY (comp_id)
        REFERENCES Company(comp_id) ON DELETE CASCADE,
    CONSTRAINT fk_company_employer_emp FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 13. RECRUITMENT RELATIONS
-- ------------------------------------------------------------
CREATE TABLE Recruitment_Agency (
    agency_no   VARCHAR2(10),
    agency_name VARCHAR2(80),
    CONSTRAINT pk_recruitment_agency PRIMARY KEY (agency_no)
);

CREATE TABLE Recruitment_License (
    emp_id VARCHAR2(10),
    lic_no VARCHAR2(20),
    CONSTRAINT pk_recruitment_license PRIMARY KEY (emp_id),
    CONSTRAINT fk_recruit_license_emp FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id) ON DELETE CASCADE
);

CREATE TABLE Recruitment (
    emp_id    VARCHAR2(10),
    agency_no VARCHAR2(10),
    CONSTRAINT pk_recruitment PRIMARY KEY (emp_id, agency_no),
    CONSTRAINT fk_recruit_emp FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id) ON DELETE CASCADE,
    CONSTRAINT fk_recruit_agency FOREIGN KEY (agency_no)
        REFERENCES Recruitment_Agency(agency_no) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 14. RELATIONSHIP TABLES (M:N and Associative Entities)
-- ------------------------------------------------------------
CREATE TABLE Requires (
    job_key      NUMBER(5),
    skill_id     VARCHAR2(10),
    is_mandatory CHAR(1),
    min_years    NUMBER(3),
    CONSTRAINT pk_requires PRIMARY KEY (job_key, skill_id),
    CONSTRAINT fk_requires_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key) ON DELETE CASCADE,
    CONSTRAINT fk_requires_skill FOREIGN KEY (skill_id)
        REFERENCES Skill(skill_id) ON DELETE CASCADE,
    CONSTRAINT ck_requires_mandatory CHECK (is_mandatory IN ('Y','N'))
);

CREATE TABLE Matched_To (
    cand_id    NUMBER(5),
    job_key    NUMBER(5),
    match_id   VARCHAR2(10),
    match_date DATE,
    CONSTRAINT pk_matched_to PRIMARY KEY (match_id),
    CONSTRAINT fk_matched_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE,
    CONSTRAINT fk_matched_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key) ON DELETE CASCADE
);

CREATE TABLE Applies (
    cand_id NUMBER(5),
    job_key NUMBER(5),
    CONSTRAINT pk_applies PRIMARY KEY (cand_id, job_key),
    CONSTRAINT fk_applies_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE,
    CONSTRAINT fk_applies_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key) ON DELETE CASCADE
);

CREATE TABLE Prefers (
    pincode NUMBER(6),
    cand_id NUMBER(5),
    CONSTRAINT pk_prefers PRIMARY KEY (pincode, cand_id),
    CONSTRAINT fk_prefers_location FOREIGN KEY (pincode)
        REFERENCES Location(pincode) ON DELETE CASCADE,
    CONSTRAINT fk_prefers_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Refers (
    cand_id         NUMBER(5),
    referral_date   DATE,
    referral_status VARCHAR2(20),
    CONSTRAINT pk_refers PRIMARY KEY (cand_id, referral_date),
    CONSTRAINT fk_refers_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE
);

CREATE TABLE Assessed_For (
    cand_id   NUMBER(5),
    job_key   NUMBER(5),
    skill_id  VARCHAR2(10),
    match_per NUMBER(5,2),
    ass_date  DATE,
    ass_score NUMBER(5,2),
    CONSTRAINT pk_assessed_for PRIMARY KEY (cand_id, job_key, skill_id),
    CONSTRAINT fk_assess_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE,
    CONSTRAINT fk_assess_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key) ON DELETE CASCADE,
    CONSTRAINT fk_assess_skill FOREIGN KEY (skill_id)
        REFERENCES Skill(skill_id) ON DELETE CASCADE,
    CONSTRAINT ck_assess_match CHECK (match_per BETWEEN 0 AND 100),
    CONSTRAINT ck_assess_score CHECK (ass_score BETWEEN 0 AND 100)
);

CREATE TABLE Has (
    cand_id      NUMBER(5),
    skill_id     VARCHAR2(10),
    pgd_level    VARCHAR2(30),
    years_of_exp NUMBER(4,1),
    CONSTRAINT pk_has PRIMARY KEY (cand_id, skill_id),
    CONSTRAINT fk_has_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id) ON DELETE CASCADE,
    CONSTRAINT fk_has_skill FOREIGN KEY (skill_id)
        REFERENCES Skill(skill_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 15. CANDIDATE FOREIGN KEYS
-- ------------------------------------------------------------
ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_edu
    FOREIGN KEY (edu_id) REFERENCES Education(edu_id) ON DELETE SET NULL;

ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_app
    FOREIGN KEY (app_id) REFERENCES Application(app_id) ON DELETE SET NULL;

ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_dep
    FOREIGN KEY (dep_id) REFERENCES Dependent(dep_id) ON DELETE SET NULL;

ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_int
    FOREIGN KEY (int_id) REFERENCES Interview(int_id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 16. APPLICATION USERS & RBAC SECURITY TABLES
-- ------------------------------------------------------------
CREATE TABLE APP_USERS (
    user_id       NUMBER(6),
    username      VARCHAR2(50) NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    full_name     VARCHAR2(100) NOT NULL,
    email         VARCHAR2(100) NOT NULL,
    role          VARCHAR2(30) NOT NULL,
    is_active     NUMBER(1) DEFAULT 1 NOT NULL,
    created_at    DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_app_users PRIMARY KEY (user_id),
    CONSTRAINT uq_app_users_username UNIQUE (username),
    CONSTRAINT ck_app_users_role CHECK (role IN ('USER', 'DATABASE_DESIGNER', 'DBA'))
);

CREATE SEQUENCE seq_app_users START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER trg_app_users_id
BEFORE INSERT ON APP_USERS
FOR EACH ROW
WHEN (new.user_id IS NULL)
BEGIN
  :new.user_id := seq_app_users.NEXTVAL;
END;
/

CREATE TABLE APP_AUDIT_LOG (
    log_id        NUMBER(10),
    username      VARCHAR2(50) NOT NULL,
    role          VARCHAR2(30) NOT NULL,
    action        VARCHAR2(100) NOT NULL,
    details       VARCHAR2(500),
    ip_address    VARCHAR2(50),
    created_at    DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_app_audit_log PRIMARY KEY (log_id)
);

CREATE SEQUENCE seq_app_audit_log START WITH 1 INCREMENT BY 1 NOCACHE;

CREATE OR REPLACE TRIGGER trg_app_audit_log_id
BEFORE INSERT ON APP_AUDIT_LOG
FOR EACH ROW
WHEN (new.log_id IS NULL)
BEGIN
  :new.log_id := seq_app_audit_log.NEXTVAL;
END;
/
