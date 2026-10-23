-- ============================================================
-- DA2 : JOB RECRUITMENT DATABASE
-- Oracle SQL*Plus
--
-- Hybrid design:
--   * Relations are decomposed only where the DA1 FD/normalization
--     analysis identifies a dependency problem.
--   * Relations already acceptable are kept together.
--   * Sample data is based on DA1 pages 2-9.
-- ============================================================

SET DEFINE OFF;

-- ------------------------------------------------------------
-- 0. CLEANUP (safe to re-run)
-- ------------------------------------------------------------
BEGIN
  FOR t IN (
    SELECT table_name FROM user_tables
    WHERE table_name IN (
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
-- 1. CANDIDATE
-- Candidate keeps the core candidate attributes.
-- Address is separated because DA1 identifies the address dependency.
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
        REFERENCES Candidate(cand_id)
);

-- These are already separate multi-valued relations in DA1.
CREATE TABLE Candidate_Email (
    cand_id NUMBER(5),
    email   VARCHAR2(100),
    CONSTRAINT pk_candidate_email PRIMARY KEY (cand_id, email),
    CONSTRAINT fk_cemail_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

CREATE TABLE Candidate_Phone (
    cand_id NUMBER(5),
    phone   VARCHAR2(15),
    CONSTRAINT pk_candidate_phone PRIMARY KEY (cand_id, phone),
    CONSTRAINT fk_cphone_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

-- ------------------------------------------------------------
-- 2. JOB
-- Job is decomposed because DA1 identifies partial dependencies.
-- job_key is a technical PK so the original DA1 job_id values can
-- be retained even when the handwritten sample repeats them.
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
        REFERENCES Job(job_key)
);

CREATE TABLE Job_Posting (
    job_title    VARCHAR2(60),
    closing_date DATE,
    posted_date  DATE,
    CONSTRAINT pk_job_posting PRIMARY KEY (job_title)
);

-- ------------------------------------------------------------
-- 3. EDUCATION
-- Decomposed because DA1 identifies partial dependencies.
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
        REFERENCES Education(edu_id),
    CONSTRAINT fk_eduend_degree FOREIGN KEY (degree)
        REFERENCES Education_Degree(degree)
);

-- ------------------------------------------------------------
-- 4. APPLICATION
-- Decomposed because DA1 identifies partial dependencies.
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
        REFERENCES Application(app_id),
    CONSTRAINT fk_appinfo_date FOREIGN KEY (app_date)
        REFERENCES Application_Date(app_date)
);

-- ------------------------------------------------------------
-- 5. EXPERIENCE
-- Decomposed because DA1 identifies partial dependencies.
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
        REFERENCES Experience(exp_id),
    CONSTRAINT fk_expc_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

CREATE TABLE Experience_Company (
    comp_name VARCHAR2(60),
    job_title VARCHAR2(60),
    end_date  DATE,
    CONSTRAINT pk_exp_company PRIMARY KEY (comp_name, job_title, end_date)
);

-- ------------------------------------------------------------
-- 6. LOCATION
-- Decomposed because DA1 identifies state -> city.
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
-- 7. DEPENDENT
-- DA1 treats Dependent as an entity relation; keep it intact.
-- ------------------------------------------------------------
CREATE TABLE Dependent (
    dep_id       VARCHAR2(10),
    dob          DATE,
    relationship VARCHAR2(30),
    CONSTRAINT pk_dependent PRIMARY KEY (dep_id)
);

-- ------------------------------------------------------------
-- 8. INTERVIEW
-- Decomposed because DA1 identifies dependencies in the analysis.
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
        REFERENCES Interview(int_id)
);

-- ------------------------------------------------------------
-- 9. EMPLOYER
-- Decompose the dependency identified by DA1; phone remains a
-- separate multi-valued relation.
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
        REFERENCES Employer(emp_id)
);

CREATE TABLE Employer_Phone (
    emp_id   VARCHAR2(10),
    phone_no VARCHAR2(15),
    CONSTRAINT pk_employer_phone PRIMARY KEY (emp_id, phone_no),
    CONSTRAINT fk_empphone_employer FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id)
);

-- ------------------------------------------------------------
-- 10. SKILL
-- Skill is decomposed only where the DA1 FD analysis requires it.
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
-- 11. SUBTYPES
-- These are kept intact.
-- ------------------------------------------------------------
CREATE TABLE Freelancer (
    cand_id       NUMBER(5),
    hourly_rate   NUMBER(10,2),
    portfolio_url VARCHAR2(150),
    CONSTRAINT pk_freelancer PRIMARY KEY (cand_id),
    CONSTRAINT fk_freelancer_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

CREATE TABLE Fresher (
    cand_id          NUMBER(5),
    grad_year        NUMBER(4),
    internship_count NUMBER(3),
    CONSTRAINT pk_fresher PRIMARY KEY (cand_id),
    CONSTRAINT fk_fresher_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

CREATE TABLE Experienced (
    cand_id         NUMBER(5),
    total_exp       NUMBER(4,1),
    current_company VARCHAR2(60),
    CONSTRAINT pk_experienced PRIMARY KEY (cand_id),
    CONSTRAINT fk_experienced_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

-- ------------------------------------------------------------
-- 12. COMPANY
-- DA1 identifies a dependency, so split company data.
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
        REFERENCES Company(comp_id),
    CONSTRAINT fk_company_employer_emp FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id)
);

-- ------------------------------------------------------------
-- 13. RECRUITMENT
-- Split agency and license information where DA1 requires it.
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
        REFERENCES Employer(emp_id)
);

CREATE TABLE Recruitment (
    emp_id    VARCHAR2(10),
    agency_no VARCHAR2(10),
    CONSTRAINT pk_recruitment PRIMARY KEY (emp_id, agency_no),
    CONSTRAINT fk_recruit_emp FOREIGN KEY (emp_id)
        REFERENCES Employer(emp_id),
    CONSTRAINT fk_recruit_agency FOREIGN KEY (agency_no)
        REFERENCES Recruitment_Agency(agency_no)
);

-- ------------------------------------------------------------
-- 14. RELATIONSHIP TABLES
-- ------------------------------------------------------------
CREATE TABLE Requires (
    job_key      NUMBER(5),
    skill_id     VARCHAR2(10),
    is_mandatory CHAR(1),
    min_years    NUMBER(3),
    CONSTRAINT pk_requires PRIMARY KEY (job_key, skill_id),
    CONSTRAINT fk_requires_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key),
    CONSTRAINT fk_requires_skill FOREIGN KEY (skill_id)
        REFERENCES Skill(skill_id),
    CONSTRAINT ck_requires_mandatory CHECK (is_mandatory IN ('Y','N'))
);

CREATE TABLE Matched_To (
    cand_id   NUMBER(5),
    job_key   NUMBER(5),
    match_id  VARCHAR2(10),
    match_date DATE,
    CONSTRAINT pk_matched_to PRIMARY KEY (match_id),
    CONSTRAINT fk_matched_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id),
    CONSTRAINT fk_matched_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key)
);

CREATE TABLE Applies (
    cand_id NUMBER(5),
    job_key NUMBER(5),
    CONSTRAINT pk_applies PRIMARY KEY (cand_id, job_key),
    CONSTRAINT fk_applies_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id),
    CONSTRAINT fk_applies_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key)
);

CREATE TABLE Prefers (
    pincode NUMBER(6),
    cand_id NUMBER(5),
    CONSTRAINT pk_prefers PRIMARY KEY (pincode, cand_id),
    CONSTRAINT fk_prefers_location FOREIGN KEY (pincode)
        REFERENCES Location(pincode),
    CONSTRAINT fk_prefers_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
);

CREATE TABLE Refers (
    cand_id         NUMBER(5),
    referral_date   DATE,
    referral_status VARCHAR2(20),
    CONSTRAINT pk_refers PRIMARY KEY (cand_id, referral_date),
    CONSTRAINT fk_refers_candidate FOREIGN KEY (cand_id)
        REFERENCES Candidate(cand_id)
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
        REFERENCES Candidate(cand_id),
    CONSTRAINT fk_assess_job FOREIGN KEY (job_key)
        REFERENCES Job(job_key),
    CONSTRAINT fk_assess_skill FOREIGN KEY (skill_id)
        REFERENCES Skill(skill_id),
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
        REFERENCES Candidate(cand_id),
    CONSTRAINT fk_has_skill FOREIGN KEY (skill_id)
        REFERENCES Skill(skill_id)
);

-- ------------------------------------------------------------
-- 15. CANDIDATE FKs FROM THE ORIGINAL RELATIONAL MAPPING
-- Added after all referenced tables exist.
-- ------------------------------------------------------------
ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_edu
    FOREIGN KEY (edu_id) REFERENCES Education(edu_id);

ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_app
    FOREIGN KEY (app_id) REFERENCES Application(app_id);

ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_dep
    FOREIGN KEY (dep_id) REFERENCES Dependent(dep_id);

ALTER TABLE Candidate ADD CONSTRAINT fk_candidate_int
    FOREIGN KEY (int_id) REFERENCES Interview(int_id);

-- ============================================================
-- SAMPLE DATA
-- Based on DA1 pages 2-9.
-- Repeated handwritten job/application rows are represented by
-- one consistent row per entity; job_key preserves the original
-- job_id text while allowing actual PK/FK enforcement.
-- ============================================================

-- Candidates
INSERT INTO Candidate VALUES
(101,'Ram','Kumar','Mishra',DATE '2004-04-19','Male',DATE '2025-04-25','ED001','APP001','D001','INT001');
INSERT INTO Candidate VALUES
(102,'Om','Kumar','Pandey',DATE '2001-01-20','Male',DATE '2025-04-26','ED002','APP002','D002','INT002');
INSERT INTO Candidate VALUES
(103,'Ojas','Prakash','Dwivedi',DATE '2000-08-02','Male',DATE '2025-04-24','ED003','APP003','D003','INT003');
INSERT INTO Candidate VALUES
(104,'Sita','Krishan','Awasthi',DATE '2001-12-18','Female',DATE '2025-04-22','ED004','APP004','D004','INT004');
INSERT INTO Candidate VALUES
(105,'Pilu','Lata','Yadav',DATE '1999-06-15','Female',DATE '2025-04-20','ED005','APP005','D005','INT005');

INSERT INTO Candidate_Address VALUES (101,'83','Jaipur','Malroad');
INSERT INTO Candidate_Address VALUES (102,'122','Kochi','GandhiGT');
INSERT INTO Candidate_Address VALUES (103,'016','Jaipur','Malroad');
INSERT INTO Candidate_Address VALUES (104,'115','Mumbai','Canal');
INSERT INTO Candidate_Address VALUES (105,'104','Kochi','GandhiGT');

INSERT INTO Candidate_Email VALUES (101,'xyz@gmail.com');
INSERT INTO Candidate_Email VALUES (102,'ab@gmail.com');
INSERT INTO Candidate_Email VALUES (103,'12@gmail.com');
INSERT INTO Candidate_Email VALUES (104,'gst@gmail.com');
INSERT INTO Candidate_Email VALUES (105,'bst@gmail.com');

INSERT INTO Candidate_Phone VALUES (101,'9412515249');
INSERT INTO Candidate_Phone VALUES (102,'7084708400');
INSERT INTO Candidate_Phone VALUES (103,'9415941546');
INSERT INTO Candidate_Phone VALUES (104,'9795386666');
INSERT INTO Candidate_Phone VALUES (105,'9415363621');

-- Education
INSERT INTO Education VALUES ('ED001',8.4,'CS');
INSERT INTO Education VALUES ('ED002',9.0,'IT');
INSERT INTO Education VALUES ('ED003',8.6,'CS');
INSERT INTO Education VALUES ('ED004',8.9,'CS');
INSERT INTO Education VALUES ('ED005',8.6,'CS');

INSERT INTO Education_Degree VALUES ('BTech','Anna University',2019);
INSERT INTO Education_Degree VALUES ('MTech','Delhi University',2020);
INSERT INTO Education_Degree VALUES ('MBA','Anna University',2020);

INSERT INTO Education_End VALUES ('ED001','BTech',2023);
INSERT INTO Education_End VALUES ('ED002','BTech',2023);
INSERT INTO Education_End VALUES ('ED003','MBA',2023);
INSERT INTO Education_End VALUES ('ED004','MTech',2022);
INSERT INTO Education_End VALUES ('ED005','MBA',2023);

-- Applications
INSERT INTO Application VALUES ('APP001','Shortlisted','Selected');
INSERT INTO Application VALUES ('APP002','Shortlisted','Pending');
INSERT INTO Application VALUES ('APP003','Shortlisted','Pending');
INSERT INTO Application VALUES ('APP004','Shortlisted','Pending');
INSERT INTO Application VALUES ('APP005','Rejected','Rejected');

INSERT INTO Application_Date VALUES (DATE '2026-08-10','JD application','Selected');
INSERT INTO Application_Date VALUES (DATE '2026-08-13','DA application','Pending');
INSERT INTO Application_Date VALUES (DATE '2026-08-12','US application','Rejected');

INSERT INTO Application_Info VALUES ('APP001',DATE '2026-08-10');
INSERT INTO Application_Info VALUES ('APP002',DATE '2026-08-13');
INSERT INTO Application_Info VALUES ('APP003',DATE '2026-08-13');
INSERT INTO Application_Info VALUES ('APP004',DATE '2026-08-13');
INSERT INTO Application_Info VALUES ('APP005',DATE '2026-08-12');

-- Jobs
INSERT INTO Job VALUES (1,'J001','Open',65000);
INSERT INTO Job VALUES (2,'J002','Closed',55000);
INSERT INTO Job VALUES (3,'J003','Open',165000);
INSERT INTO Job VALUES (4,'J004','Closed',55000);
INSERT INTO Job VALUES (5,'J005','Closed',60000);

INSERT INTO Job_Details VALUES (1,'S/W Dev','APP dev.','APP001');
INSERT INTO Job_Details VALUES (2,'Data Analyst','Data analyst','APP002');
INSERT INTO Job_Details VALUES (3,'Data Analyst','Interface design','APP003');
INSERT INTO Job_Details VALUES (4,'S/W Dev','Data analyst','APP004');
INSERT INTO Job_Details VALUES (5,'Database','Administration database','APP005');

INSERT INTO Job_Posting VALUES ('S/W Dev',DATE '2026-09-30',DATE '2026-08-01');
INSERT INTO Job_Posting VALUES ('Data Analyst',DATE '2026-09-25',DATE '2026-08-03');
INSERT INTO Job_Posting VALUES ('Database',DATE '2026-08-15',DATE '2026-07-15');

-- Experience
INSERT INTO Experience VALUES ('EXP001',DATE '2021-05-01','S/W Dev');
INSERT INTO Experience VALUES ('EXP002',DATE '2022-07-01','Senior S/W');
INSERT INTO Experience VALUES ('EXP003',DATE '2022-07-01','Senior S/W');
INSERT INTO Experience VALUES ('EXP004',DATE '2022-07-02','Data Analyst');
INSERT INTO Experience VALUES ('EXP005',DATE '2022-07-02','Data Analyst');

INSERT INTO Experience_Candidate VALUES ('EXP001',101,'TCS',DATE '2023-04-30');
INSERT INTO Experience_Candidate VALUES ('EXP002',102,'Infosys',DATE '2024-06-30');
INSERT INTO Experience_Candidate VALUES ('EXP003',102,'Infosys',DATE '2024-06-30');
INSERT INTO Experience_Candidate VALUES ('EXP004',101,'TCS',DATE '2025-05-31');
INSERT INTO Experience_Candidate VALUES ('EXP005',105,'Infosys',DATE '2025-06-30');

INSERT INTO Experience_Company VALUES ('TCS','S/W Dev',DATE '2023-04-30');
INSERT INTO Experience_Company VALUES ('Infosys','Senior S/W',DATE '2024-06-30');
INSERT INTO Experience_Company VALUES ('Infosys','Data Analyst',DATE '2025-06-30');

-- Location
INSERT INTO Location VALUES (560001,'India','Karnataka');
INSERT INTO Location VALUES (110001,'India','Delhi');
INSERT INTO Location VALUES (400001,'India','Delhi');
INSERT INTO Location VALUES (360001,'India','Maharashtra');
INSERT INTO Location VALUES (600001,'India','Karnataka');
INSERT INTO Location VALUES (700001,'India','W.B');

INSERT INTO State_City VALUES ('Karnataka','Bengaluru');
INSERT INTO State_City VALUES ('Delhi','New Delhi');
INSERT INTO State_City VALUES ('Maharashtra','Mumbai');
INSERT INTO State_City VALUES ('W.B','Kolkata');

-- Dependents
INSERT INTO Dependent VALUES ('D001',DATE '1995-05-12','Spouse');
INSERT INTO Dependent VALUES ('D002',DATE '2015-08-10','Son');
INSERT INTO Dependent VALUES ('D003',DATE '2015-08-10','Son');
INSERT INTO Dependent VALUES ('D004',DATE '1998-11-10','Spouse');
INSERT INTO Dependent VALUES ('D005',DATE '2012-06-25','Son');

-- Interviews
INSERT INTO Interview VALUES ('INT001',DATE '2026-08-20','10:00');
INSERT INTO Interview VALUES ('INT002',DATE '2026-08-21','11:30');
INSERT INTO Interview VALUES ('INT003',DATE '2026-08-22','14:00');
INSERT INTO Interview VALUES ('INT004',DATE '2026-08-23','15:30');
INSERT INTO Interview VALUES ('INT005',DATE '2026-08-24','10:30');

INSERT INTO Interview_Details VALUES ('INT001','Online','Bengaluru','Scheduled',NULL,'Pending');
INSERT INTO Interview_Details VALUES ('INT002','Online','Mumbai','Completed',85,'Good tech skills');
INSERT INTO Interview_Details VALUES ('INT003','Offline','Delhi','Scheduled',NULL,'Pending');
INSERT INTO Interview_Details VALUES ('INT004','Online','Chennai','Completed',78,'Good communication');
INSERT INTO Interview_Details VALUES ('INT005','Offline','Kolkata','Completed',90,'Excellent');

-- Employers
INSERT INTO Employer VALUES ('E001','Tech Nova',2015);
INSERT INTO Employer VALUES ('E002','DataCore',2012);
INSERT INTO Employer VALUES ('E003','DesignTech',2018);
INSERT INTO Employer VALUES ('E004','CodeCraft',2004);
INSERT INTO Employer VALUES ('E005','CloudM',2014);

INSERT INTO Employer_Details VALUES ('E001','hr@technova.com','tech.com','Bengaluru');
INSERT INTO Employer_Details VALUES ('E002','hr@datacore.com','data.com','Mumbai');
INSERT INTO Employer_Details VALUES ('E003','hr@design.com','design.com','New Delhi');
INSERT INTO Employer_Details VALUES ('E004','hr@cw.com','cw.com','Chennai');
INSERT INTO Employer_Details VALUES ('E005','hr@cm.com','cloudm.com','Hyderabad');

INSERT INTO Employer_Phone VALUES ('E001','9784659312');
INSERT INTO Employer_Phone VALUES ('E002','9124658387');
INSERT INTO Employer_Phone VALUES ('E003','9877964321');
INSERT INTO Employer_Phone VALUES ('E004','9123456789');
INSERT INTO Employer_Phone VALUES ('E005','9123022138');

-- Skills
INSERT INTO Skill VALUES ('S001','Java');
INSERT INTO Skill VALUES ('S002','SQL');
INSERT INTO Skill VALUES ('S003','UI design');
INSERT INTO Skill VALUES ('S004','Python');
INSERT INTO Skill VALUES ('S005','SQL');

INSERT INTO Skill_Details VALUES ('Java','Programming','Java development');
INSERT INTO Skill_Details VALUES ('SQL','Database','Query');
INSERT INTO Skill_Details VALUES ('UI design','Design','UX design');
INSERT INTO Skill_Details VALUES ('Python','Programming','Py dev.');

-- Freelancer / Fresher / Experienced
INSERT INTO Freelancer VALUES (101,800,'sahil.dev');
INSERT INTO Freelancer VALUES (102,700,'priya.dev');
INSERT INTO Freelancer VALUES (103,900,'arjun.dev');
INSERT INTO Freelancer VALUES (104,700,'john.dev');
INSERT INTO Freelancer VALUES (105,850,'amit.dev');

INSERT INTO Fresher VALUES (101,2023,4);
INSERT INTO Fresher VALUES (102,2023,4);
INSERT INTO Fresher VALUES (103,2024,2);
INSERT INTO Fresher VALUES (104,2024,2);
INSERT INTO Fresher VALUES (105,2023,4);

INSERT INTO Experienced VALUES (101,5,'Infosys');
INSERT INTO Experienced VALUES (102,3,'TCS');
INSERT INTO Experienced VALUES (103,5,'Infosys');
INSERT INTO Experienced VALUES (104,3,'Wipro');
INSERT INTO Experienced VALUES (105,4,'TCS');

-- Company
INSERT INTO Company VALUES ('COMP001','IT Service',500);
INSERT INTO Company VALUES ('COMP002','Data analyst',300);
INSERT INTO Company VALUES ('COMP003','Design',120);
INSERT INTO Company VALUES ('COMP004','S/W',450);

INSERT INTO Company_Employer VALUES ('COMP001','E001');
INSERT INTO Company_Employer VALUES ('COMP002','E002');
INSERT INTO Company_Employer VALUES ('COMP003','E003');
INSERT INTO Company_Employer VALUES ('COMP004','E004');
INSERT INTO Company_Employer VALUES ('COMP001','E005');

-- Recruitment
INSERT INTO Recruitment_Agency VALUES ('AG001','Talent Bridge');
INSERT INTO Recruitment_Agency VALUES ('AG002','Talent Bridge');
INSERT INTO Recruitment_Agency VALUES ('AG003','CareerPoint');

INSERT INTO Recruitment_License VALUES ('E001','L4101');
INSERT INTO Recruitment_License VALUES ('E002','L4102');
INSERT INTO Recruitment_License VALUES ('E003','L4103');
INSERT INTO Recruitment_License VALUES ('E004','L4104');
INSERT INTO Recruitment_License VALUES ('E005','L4105');

INSERT INTO Recruitment VALUES ('E001','AG001');
INSERT INTO Recruitment VALUES ('E002','AG002');
INSERT INTO Recruitment VALUES ('E003','AG003');
INSERT INTO Recruitment VALUES ('E004','AG001');
INSERT INTO Recruitment VALUES ('E005','AG003');

-- Requires
INSERT INTO Requires VALUES (1,'S001','Y',2);
INSERT INTO Requires VALUES (1,'S002','Y',1);
INSERT INTO Requires VALUES (2,'S002','Y',2);
INSERT INTO Requires VALUES (4,'S004','Y',2);
INSERT INTO Requires VALUES (5,'S005','N',NULL);

-- Matched To
INSERT INTO Matched_To VALUES (101,1,'M001',DATE '2026-08-10');
INSERT INTO Matched_To VALUES (102,2,'M002',DATE '2026-08-11');
INSERT INTO Matched_To VALUES (103,3,'M003',DATE '2026-08-12');
INSERT INTO Matched_To VALUES (104,4,'M004',DATE '2026-08-13');
INSERT INTO Matched_To VALUES (105,5,'M005',DATE '2026-08-14');

-- Applies
INSERT INTO Applies VALUES (101,1);
INSERT INTO Applies VALUES (102,2);
INSERT INTO Applies VALUES (103,3);
INSERT INTO Applies VALUES (104,4);
INSERT INTO Applies VALUES (105,5);

-- Prefers
INSERT INTO Prefers VALUES (560001,101);
INSERT INTO Prefers VALUES (560001,102);
INSERT INTO Prefers VALUES (400001,103);
INSERT INTO Prefers VALUES (400001,104);
INSERT INTO Prefers VALUES (110001,105);

-- Refers
INSERT INTO Refers VALUES (101,DATE '2025-08-05','Accepted');
INSERT INTO Refers VALUES (102,DATE '2025-08-06','Pending');
INSERT INTO Refers VALUES (103,DATE '2025-08-07','Accepted');
INSERT INTO Refers VALUES (104,DATE '2025-08-08','Accepted');
INSERT INTO Refers VALUES (105,DATE '2025-08-09','Rejected');

-- Assessed For
INSERT INTO Assessed_For VALUES (101,1,'S001',92,DATE '2026-08-15',90);
INSERT INTO Assessed_For VALUES (102,2,'S002',85,DATE '2026-08-16',82);
INSERT INTO Assessed_For VALUES (103,3,'S003',88,DATE '2026-08-17',86);
INSERT INTO Assessed_For VALUES (104,4,'S004',79,DATE '2026-08-18',78);
INSERT INTO Assessed_For VALUES (105,5,'S005',75,DATE '2026-08-19',74);

-- Has
INSERT INTO Has VALUES (101,'S001','Advanced',5);
INSERT INTO Has VALUES (101,'S002','Advanced',4);
INSERT INTO Has VALUES (102,'S002','Intermediate',3);
INSERT INTO Has VALUES (103,'S001','Advanced',5);
INSERT INTO Has VALUES (103,'S003','Intermediate',3);
INSERT INTO Has VALUES (104,'S004','Advanced',3);
INSERT INTO Has VALUES (105,'S005','Intermediate',4);

COMMIT;

-- ============================================================
-- 16. QUICK VERIFICATION
-- ============================================================
SELECT 'CANDIDATE' AS table_name, COUNT(*) AS rows_count FROM Candidate
UNION ALL SELECT 'JOB', COUNT(*) FROM Job
UNION ALL SELECT 'APPLICATION', COUNT(*) FROM Application
UNION ALL SELECT 'EMPLOYER', COUNT(*) FROM Employer
UNION ALL SELECT 'SKILL', COUNT(*) FROM Skill
UNION ALL SELECT 'INTERVIEW', COUNT(*) FROM Interview
UNION ALL SELECT 'APPLIES', COUNT(*) FROM Applies
UNION ALL SELECT 'REQUIRES', COUNT(*) FROM Requires;

-- ============================================================
-- 17. DASHBOARD QUERIES
-- These can later be pasted into Oracle APEX chart/card regions.
-- ============================================================

-- KPI: total candidates
-- SELECT COUNT(*) AS total_candidates FROM Candidate;

-- KPI: total jobs
-- SELECT COUNT(*) AS total_jobs FROM Job;

-- KPI: total applications
-- SELECT COUNT(*) AS total_applications FROM Application;

-- KPI: total interviews
-- SELECT COUNT(*) AS total_interviews FROM Interview;

-- Applications by status
-- SELECT app_status, COUNT(*) AS total
-- FROM Application
-- GROUP BY app_status
-- ORDER BY total DESC;

-- Jobs by status
-- SELECT job_status, COUNT(*) AS total
-- FROM Job
-- GROUP BY job_status
-- ORDER BY total DESC;

-- Interview outcomes
-- SELECT int_status, COUNT(*) AS total
-- FROM Interview_Details
-- GROUP BY int_status
-- ORDER BY total DESC;

-- Most demanded skills
-- SELECT s.skill_name, COUNT(*) AS demand
-- FROM Requires r
-- JOIN Skill s ON s.skill_id = r.skill_id
-- GROUP BY s.skill_name
-- ORDER BY demand DESC;

-- Candidate applications with job information
-- SELECT c.cand_id,
--        c.fname || ' ' || c.lname AS candidate_name,
--        j.job_id,
--        jd.job_title,
--        a.app_status,
--        a.final_result
-- FROM Candidate c
-- JOIN Application a ON a.app_id = c.app_id
-- JOIN Applies ap ON ap.cand_id = c.cand_id
-- JOIN Job j ON j.job_key = ap.job_key
-- JOIN Job_Details jd ON jd.job_key = j.job_key
-- ORDER BY c.cand_id;

-- ============================================================
-- END
-- ============================================================
