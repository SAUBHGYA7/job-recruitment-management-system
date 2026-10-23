// Comprehensive DA1 Seed Data & Schema Structure Definition
export const initialSeedData = {
  Candidate: [
    { CAND_ID: 101, FNAME: 'Ram', MNAME: 'Kumar', LNAME: 'Mishra', DOB: '2004-04-19', GENDER: 'Male', REG_DATE: '2025-04-25', EDU_ID: 'ED001', APP_ID: 'APP001', DEP_ID: 'D001', INT_ID: 'INT001' },
    { CAND_ID: 102, FNAME: 'Om', MNAME: 'Kumar', LNAME: 'Pandey', DOB: '2001-01-20', GENDER: 'Male', REG_DATE: '2025-04-26', EDU_ID: 'ED002', APP_ID: 'APP002', DEP_ID: 'D002', INT_ID: 'INT002' },
    { CAND_ID: 103, FNAME: 'Ojas', MNAME: 'Prakash', LNAME: 'Dwivedi', DOB: '2000-08-02', GENDER: 'Male', REG_DATE: '2025-04-24', EDU_ID: 'ED003', APP_ID: 'APP003', DEP_ID: 'D003', INT_ID: 'INT003' },
    { CAND_ID: 104, FNAME: 'Sita', MNAME: 'Krishan', LNAME: 'Awasthi', DOB: '2001-12-18', GENDER: 'Female', REG_DATE: '2025-04-22', EDU_ID: 'ED004', APP_ID: 'APP004', DEP_ID: 'D004', INT_ID: 'INT004' },
    { CAND_ID: 105, FNAME: 'Pilu', MNAME: 'Lata', LNAME: 'Yadav', DOB: '1999-06-15', GENDER: 'Female', REG_DATE: '2025-04-20', EDU_ID: 'ED005', APP_ID: 'APP005', DEP_ID: 'D005', INT_ID: 'INT005' }
  ],
  Candidate_Address: [
    { CAND_ID: 101, HOUSE_NO: '83', CITY: 'Jaipur', STREET: 'Malroad' },
    { CAND_ID: 102, HOUSE_NO: '122', CITY: 'Kochi', STREET: 'GandhiGT' },
    { CAND_ID: 103, HOUSE_NO: '016', CITY: 'Jaipur', STREET: 'Malroad' },
    { CAND_ID: 104, HOUSE_NO: '115', CITY: 'Mumbai', STREET: 'Canal' },
    { CAND_ID: 105, HOUSE_NO: '104', CITY: 'Kochi', STREET: 'GandhiGT' }
  ],
  Candidate_Email: [
    { CAND_ID: 101, EMAIL: 'ram.mishra@example.com' },
    { CAND_ID: 102, EMAIL: 'om.pandey@example.com' },
    { CAND_ID: 103, EMAIL: 'ojas.dwivedi@example.com' },
    { CAND_ID: 104, EMAIL: 'sita.awasthi@example.com' },
    { CAND_ID: 105, EMAIL: 'pilu.yadav@example.com' }
  ],
  Candidate_Phone: [
    { CAND_ID: 101, PHONE: '9412515249' },
    { CAND_ID: 102, PHONE: '7084708400' },
    { CAND_ID: 103, PHONE: '9415941546' },
    { CAND_ID: 104, PHONE: '9795386666' },
    { CAND_ID: 105, PHONE: '9415363621' }
  ],
  Education: [
    { EDU_ID: 'ED001', CGPA: 8.40, SPECIALIZATION: 'CS' },
    { EDU_ID: 'ED002', CGPA: 9.00, SPECIALIZATION: 'IT' },
    { EDU_ID: 'ED003', CGPA: 8.60, SPECIALIZATION: 'CS' },
    { EDU_ID: 'ED004', CGPA: 8.90, SPECIALIZATION: 'CS' },
    { EDU_ID: 'ED005', CGPA: 8.60, SPECIALIZATION: 'CS' }
  ],
  Education_Degree: [
    { DEGREE: 'BTech', UNIVERSITY: 'Anna University', START_YEAR: 2019 },
    { DEGREE: 'MTech', UNIVERSITY: 'Delhi University', START_YEAR: 2020 },
    { DEGREE: 'MBA', UNIVERSITY: 'Anna University', START_YEAR: 2020 }
  ],
  Education_End: [
    { EDU_ID: 'ED001', DEGREE: 'BTech', END_YEAR: 2023 },
    { EDU_ID: 'ED002', DEGREE: 'BTech', END_YEAR: 2023 },
    { EDU_ID: 'ED003', DEGREE: 'MBA', END_YEAR: 2023 },
    { EDU_ID: 'ED004', DEGREE: 'MTech', END_YEAR: 2022 },
    { EDU_ID: 'ED005', DEGREE: 'MBA', END_YEAR: 2023 }
  ],
  Application: [
    { APP_ID: 'APP001', APP_STATUS: 'Shortlisted', FINAL_RESULT: 'Selected' },
    { APP_ID: 'APP002', APP_STATUS: 'Shortlisted', FINAL_RESULT: 'Pending' },
    { APP_ID: 'APP003', APP_STATUS: 'Shortlisted', FINAL_RESULT: 'Pending' },
    { APP_ID: 'APP004', APP_STATUS: 'Shortlisted', FINAL_RESULT: 'Pending' },
    { APP_ID: 'APP005', APP_STATUS: 'Rejected', FINAL_RESULT: 'Rejected' }
  ],
  Application_Date: [
    { APP_DATE: '2026-08-10', OFFER_LETTER: 'JD application offer', FINAL_RESULT: 'Selected' },
    { APP_DATE: '2026-08-13', OFFER_LETTER: 'DA application letter', FINAL_RESULT: 'Pending' },
    { APP_DATE: '2026-08-12', OFFER_LETTER: 'US application rejection', FINAL_RESULT: 'Rejected' }
  ],
  Application_Info: [
    { APP_ID: 'APP001', APP_DATE: '2026-08-10' },
    { APP_ID: 'APP002', APP_DATE: '2026-08-13' },
    { APP_ID: 'APP003', APP_DATE: '2026-08-13' },
    { APP_ID: 'APP004', APP_DATE: '2026-08-13' },
    { APP_ID: 'APP005', APP_DATE: '2026-08-12' }
  ],
  Job: [
    { JOB_KEY: 1, JOB_ID: 'J001', JOB_STATUS: 'Open', SALARY: 65000 },
    { JOB_KEY: 2, JOB_ID: 'J002', JOB_STATUS: 'Closed', SALARY: 55000 },
    { JOB_KEY: 3, JOB_ID: 'J003', JOB_STATUS: 'Open', SALARY: 165000 },
    { JOB_KEY: 4, JOB_ID: 'J004', JOB_STATUS: 'Closed', SALARY: 55000 },
    { JOB_KEY: 5, JOB_ID: 'J005', JOB_STATUS: 'Closed', SALARY: 60000 }
  ],
  Job_Details: [
    { JOB_KEY: 1, JOB_TITLE: 'S/W Dev', DESCRIPTIVE: 'Application development engineer in enterprise Java and cloud systems.', APP_ID: 'APP001' },
    { JOB_KEY: 2, JOB_TITLE: 'Data Analyst', DESCRIPTIVE: 'Data analyst to model dashboards and SQL pipelines.', APP_ID: 'APP002' },
    { JOB_KEY: 3, JOB_TITLE: 'Data Analyst', DESCRIPTIVE: 'Senior analytics and user interface metrics designer.', APP_ID: 'APP003' },
    { JOB_KEY: 4, JOB_TITLE: 'S/W Dev', DESCRIPTIVE: 'Software development and backend API services.', APP_ID: 'APP004' },
    { JOB_KEY: 5, JOB_TITLE: 'Database', DESCRIPTIVE: 'Database administrator maintaining Oracle schemas and BCNF tables.', APP_ID: 'APP005' }
  ],
  Job_Posting: [
    { JOB_TITLE: 'S/W Dev', CLOSING_DATE: '2026-09-30', POSTED_DATE: '2026-08-01' },
    { JOB_TITLE: 'Data Analyst', CLOSING_DATE: '2026-09-25', POSTED_DATE: '2026-08-03' },
    { JOB_TITLE: 'Database', CLOSING_DATE: '2026-08-15', POSTED_DATE: '2026-07-15' }
  ],
  Experience: [
    { EXP_ID: 'EXP001', START_DATE: '2021-05-01', JOB_TITLE: 'S/W Dev' },
    { EXP_ID: 'EXP002', START_DATE: '2022-07-01', JOB_TITLE: 'Senior S/W' },
    { EXP_ID: 'EXP003', START_DATE: '2022-07-01', JOB_TITLE: 'Senior S/W' },
    { EXP_ID: 'EXP004', START_DATE: '2022-07-02', JOB_TITLE: 'Data Analyst' },
    { EXP_ID: 'EXP005', START_DATE: '2022-07-02', JOB_TITLE: 'Data Analyst' }
  ],
  Experience_Candidate: [
    { EXP_ID: 'EXP001', CAND_ID: 101, COMP_NAME: 'TCS', END_DATE: '2023-04-30' },
    { EXP_ID: 'EXP002', CAND_ID: 102, COMP_NAME: 'Infosys', END_DATE: '2024-06-30' },
    { EXP_ID: 'EXP003', CAND_ID: 102, COMP_NAME: 'Infosys', END_DATE: '2024-06-30' },
    { EXP_ID: 'EXP004', CAND_ID: 101, COMP_NAME: 'TCS', END_DATE: '2025-05-31' },
    { EXP_ID: 'EXP005', CAND_ID: 105, COMP_NAME: 'Infosys', END_DATE: '2025-06-30' }
  ],
  Experience_Company: [
    { COMP_NAME: 'TCS', JOB_TITLE: 'S/W Dev', END_DATE: '2023-04-30' },
    { COMP_NAME: 'Infosys', JOB_TITLE: 'Senior S/W', END_DATE: '2024-06-30' },
    { COMP_NAME: 'Infosys', JOB_TITLE: 'Data Analyst', END_DATE: '2025-06-30' }
  ],
  Location: [
    { PINCODE: 560001, COUNTRY: 'India', STATE: 'Karnataka' },
    { PINCODE: 110001, COUNTRY: 'India', STATE: 'Delhi' },
    { PINCODE: 400001, COUNTRY: 'India', STATE: 'Maharashtra' },
    { PINCODE: 360001, COUNTRY: 'India', STATE: 'Gujarat' },
    { PINCODE: 600001, COUNTRY: 'India', STATE: 'Tamil Nadu' },
    { PINCODE: 700001, COUNTRY: 'India', STATE: 'W.B' }
  ],
  State_City: [
    { STATE: 'Karnataka', CITY: 'Bengaluru' },
    { STATE: 'Delhi', CITY: 'New Delhi' },
    { STATE: 'Maharashtra', CITY: 'Mumbai' },
    { STATE: 'Gujarat', CITY: 'Rajkot' },
    { STATE: 'Tamil Nadu', CITY: 'Chennai' },
    { STATE: 'W.B', CITY: 'Kolkata' }
  ],
  Dependent: [
    { DEP_ID: 'D001', DOB: '1995-05-12', RELATIONSHIP: 'Spouse' },
    { DEP_ID: 'D002', DOB: '2015-08-10', RELATIONSHIP: 'Son' },
    { DEP_ID: 'D003', DOB: '2015-08-10', RELATIONSHIP: 'Son' },
    { DEP_ID: 'D004', DOB: '1998-11-10', RELATIONSHIP: 'Spouse' },
    { DEP_ID: 'D005', DOB: '2012-06-25', RELATIONSHIP: 'Son' }
  ],
  Interview: [
    { INT_ID: 'INT001', INT_DATE: '2026-08-20', INT_TIME: '10:00' },
    { INT_ID: 'INT002', INT_DATE: '2026-08-21', INT_TIME: '11:30' },
    { INT_ID: 'INT003', INT_DATE: '2026-08-22', INT_TIME: '14:00' },
    { INT_ID: 'INT004', INT_DATE: '2026-08-23', INT_TIME: '15:30' },
    { INT_ID: 'INT005', INT_DATE: '2026-08-24', INT_TIME: '10:30' }
  ],
  Interview_Details: [
    { INT_ID: 'INT001', INT_MODE: 'Online', LOCATION: 'Bengaluru', INT_STATUS: 'Scheduled', SCORE: null, FEEDBACK: 'Interview pending technical round evaluation' },
    { INT_ID: 'INT002', INT_MODE: 'Online', LOCATION: 'Mumbai', INT_STATUS: 'Completed', SCORE: 85.00, FEEDBACK: 'Strong problem solving skills and solid SQL understanding' },
    { INT_ID: 'INT003', INT_MODE: 'Offline', LOCATION: 'Delhi', INT_STATUS: 'Scheduled', SCORE: null, FEEDBACK: 'In-person coding interview scheduled with Tech Lead' },
    { INT_ID: 'INT004', INT_MODE: 'Online', LOCATION: 'Chennai', INT_STATUS: 'Completed', SCORE: 78.50, FEEDBACK: 'Good communication and clear UI design concepts' },
    { INT_ID: 'INT005', INT_MODE: 'Offline', LOCATION: 'Kolkata', INT_STATUS: 'Completed', SCORE: 90.00, FEEDBACK: 'Exceptional database schema knowledge and query optimization' }
  ],
  Employer: [
    { EMP_ID: 'E001', COMPANY_NAME: 'Tech Nova Systems', FOUNDED_YEAR: 2015 },
    { EMP_ID: 'E002', COMPANY_NAME: 'DataCore Analytics', FOUNDED_YEAR: 2012 },
    { EMP_ID: 'E003', COMPANY_NAME: 'DesignTech Solutions', FOUNDED_YEAR: 2018 },
    { EMP_ID: 'E004', COMPANY_NAME: 'CodeCraft Software', FOUNDED_YEAR: 2004 },
    { EMP_ID: 'E005', COMPANY_NAME: 'CloudMatrix Infotech', FOUNDED_YEAR: 2014 }
  ],
  Employer_Details: [
    { EMP_ID: 'E001', COMPANY_MAIL: 'hr@technova.com', WEBSITE: 'https://technova.example.com', HEADQUARTER: 'Bengaluru' },
    { EMP_ID: 'E002', COMPANY_MAIL: 'hr@datacore.com', WEBSITE: 'https://datacore.example.com', HEADQUARTER: 'Mumbai' },
    { EMP_ID: 'E003', COMPANY_MAIL: 'hr@designtech.com', WEBSITE: 'https://designtech.example.com', HEADQUARTER: 'New Delhi' },
    { EMP_ID: 'E004', COMPANY_MAIL: 'hr@codecraft.com', WEBSITE: 'https://codecraft.example.com', HEADQUARTER: 'Chennai' },
    { EMP_ID: 'E005', COMPANY_MAIL: 'hr@cloudmatrix.com', WEBSITE: 'https://cloudmatrix.example.com', HEADQUARTER: 'Hyderabad' }
  ],
  Employer_Phone: [
    { EMP_ID: 'E001', PHONE_NO: '9784659312' },
    { EMP_ID: 'E002', PHONE_NO: '9124658387' },
    { EMP_ID: 'E003', PHONE_NO: '9877964321' },
    { EMP_ID: 'E004', PHONE_NO: '9123456789' },
    { EMP_ID: 'E005', PHONE_NO: '9123022138' }
  ],
  Skill: [
    { SKILL_ID: 'S001', SKILL_NAME: 'Java' },
    { SKILL_ID: 'S002', SKILL_NAME: 'SQL' },
    { SKILL_ID: 'S003', SKILL_NAME: 'UI Design' },
    { SKILL_ID: 'S004', SKILL_NAME: 'Python' },
    { SKILL_ID: 'S005', SKILL_NAME: 'Oracle DB' }
  ],
  Skill_Details: [
    { SKILL_NAME: 'Java', SKILL_CATEGORY: 'Programming', DESCRIPTION: 'Core Java, Spring Boot, OOP principles and JVM optimization' },
    { SKILL_NAME: 'SQL', SKILL_CATEGORY: 'Database', DESCRIPTION: 'Relational query construction, Joins, Aggregation, and Normalization' },
    { SKILL_NAME: 'UI Design', SKILL_CATEGORY: 'Design', DESCRIPTION: 'Figma wireframing, Responsive UX design, Tailwind CSS styling' },
    { SKILL_NAME: 'Python', SKILL_CATEGORY: 'Programming', DESCRIPTION: 'Python scripting, Pandas, Data analytics pipelines, REST APIs' },
    { SKILL_NAME: 'Oracle DB', SKILL_CATEGORY: 'Database Administration', DESCRIPTION: 'Oracle PL/SQL, BCNF schema design, Indexing, and USER metadata inspection' }
  ],
  Freelancer: [
    { CAND_ID: 101, HOURLY_RATE: 800.00, PORTFOLIO_URL: 'https://ram.dev' },
    { CAND_ID: 102, HOURLY_RATE: 700.00, PORTFOLIO_URL: 'https://om.dev' },
    { CAND_ID: 103, HOURLY_RATE: 900.00, PORTFOLIO_URL: 'https://ojas.dev' },
    { CAND_ID: 104, HOURLY_RATE: 700.00, PORTFOLIO_URL: 'https://sita.dev' },
    { CAND_ID: 105, HOURLY_RATE: 850.00, PORTFOLIO_URL: 'https://pilu.dev' }
  ],
  Fresher: [
    { CAND_ID: 101, GRAD_YEAR: 2023, INTERNSHIP_COUNT: 4 },
    { CAND_ID: 102, GRAD_YEAR: 2023, INTERNSHIP_COUNT: 4 },
    { CAND_ID: 103, GRAD_YEAR: 2024, INTERNSHIP_COUNT: 2 },
    { CAND_ID: 104, GRAD_YEAR: 2024, INTERNSHIP_COUNT: 2 },
    { CAND_ID: 105, GRAD_YEAR: 2023, INTERNSHIP_COUNT: 4 }
  ],
  Experienced: [
    { CAND_ID: 101, TOTAL_EXP: 5.0, CURRENT_COMPANY: 'Infosys' },
    { CAND_ID: 102, TOTAL_EXP: 3.0, CURRENT_COMPANY: 'TCS' },
    { CAND_ID: 103, TOTAL_EXP: 5.0, CURRENT_COMPANY: 'Infosys' },
    { CAND_ID: 104, TOTAL_EXP: 3.0, CURRENT_COMPANY: 'Wipro' },
    { CAND_ID: 105, TOTAL_EXP: 4.0, CURRENT_COMPANY: 'TCS' }
  ],
  Company: [
    { COMP_ID: 'COMP001', COMP_TYPE: 'IT Services', EMP_COUNT: 500 },
    { COMP_ID: 'COMP002', COMP_TYPE: 'Data Analytics', EMP_COUNT: 300 },
    { COMP_ID: 'COMP003', COMP_TYPE: 'Product Design', EMP_COUNT: 120 },
    { COMP_ID: 'COMP004', COMP_TYPE: 'Enterprise S/W', EMP_COUNT: 450 }
  ],
  Company_Employer: [
    { COMP_ID: 'COMP001', EMP_ID: 'E001' },
    { COMP_ID: 'COMP002', EMP_ID: 'E002' },
    { COMP_ID: 'COMP003', EMP_ID: 'E003' },
    { COMP_ID: 'COMP004', EMP_ID: 'E004' },
    { COMP_ID: 'COMP001', EMP_ID: 'E005' }
  ],
  Recruitment_Agency: [
    { AGENCY_NO: 'AG001', AGENCY_NAME: 'Talent Bridge Global' },
    { AGENCY_NO: 'AG002', AGENCY_NAME: 'Apex Hire Consultants' },
    { AGENCY_NO: 'AG003', AGENCY_NAME: 'CareerPoint Staffing' }
  ],
  Recruitment_License: [
    { EMP_ID: 'E001', LIC_NO: 'LIC-4101-KAR' },
    { EMP_ID: 'E002', LIC_NO: 'LIC-4102-MAH' },
    { EMP_ID: 'E003', LIC_NO: 'LIC-4103-DEL' },
    { EMP_ID: 'E004', LIC_NO: 'LIC-4104-TN' },
    { EMP_ID: 'E005', LIC_NO: 'LIC-4105-TS' }
  ],
  Recruitment: [
    { EMP_ID: 'E001', AGENCY_NO: 'AG001' },
    { EMP_ID: 'E002', AGENCY_NO: 'AG002' },
    { EMP_ID: 'E003', AGENCY_NO: 'AG003' },
    { EMP_ID: 'E004', AGENCY_NO: 'AG001' },
    { EMP_ID: 'E005', AGENCY_NO: 'AG003' }
  ],
  Requires: [
    { JOB_KEY: 1, SKILL_ID: 'S001', IS_MANDATORY: 'Y', MIN_YEARS: 2 },
    { JOB_KEY: 1, SKILL_ID: 'S002', IS_MANDATORY: 'Y', MIN_YEARS: 1 },
    { JOB_KEY: 2, SKILL_ID: 'S002', IS_MANDATORY: 'Y', MIN_YEARS: 2 },
    { JOB_KEY: 3, SKILL_ID: 'S003', IS_MANDATORY: 'Y', MIN_YEARS: 2 },
    { JOB_KEY: 4, SKILL_ID: 'S004', IS_MANDATORY: 'Y', MIN_YEARS: 2 },
    { JOB_KEY: 5, SKILL_ID: 'S005', IS_MANDATORY: 'N', MIN_YEARS: 1 }
  ],
  Matched_To: [
    { CAND_ID: 101, JOB_KEY: 1, MATCH_ID: 'M001', MATCH_DATE: '2026-08-10' },
    { CAND_ID: 102, JOB_KEY: 2, MATCH_ID: 'M002', MATCH_DATE: '2026-08-11' },
    { CAND_ID: 103, JOB_KEY: 3, MATCH_ID: 'M003', MATCH_DATE: '2026-08-12' },
    { CAND_ID: 104, JOB_KEY: 4, MATCH_ID: 'M004', MATCH_DATE: '2026-08-13' },
    { CAND_ID: 105, JOB_KEY: 5, MATCH_ID: 'M005', MATCH_DATE: '2026-08-14' }
  ],
  Applies: [
    { CAND_ID: 101, JOB_KEY: 1 },
    { CAND_ID: 102, JOB_KEY: 2 },
    { CAND_ID: 103, JOB_KEY: 3 },
    { CAND_ID: 104, JOB_KEY: 4 },
    { CAND_ID: 105, JOB_KEY: 5 }
  ],
  Prefers: [
    { PINCODE: 560001, CAND_ID: 101 },
    { PINCODE: 560001, CAND_ID: 102 },
    { PINCODE: 400001, CAND_ID: 103 },
    { PINCODE: 400001, CAND_ID: 104 },
    { PINCODE: 110001, CAND_ID: 105 }
  ],
  Refers: [
    { CAND_ID: 101, REFERRAL_DATE: '2025-08-05', REFERRAL_STATUS: 'Accepted' },
    { CAND_ID: 102, REFERRAL_DATE: '2025-08-06', REFERRAL_STATUS: 'Pending' },
    { CAND_ID: 103, REFERRAL_DATE: '2025-08-07', REFERRAL_STATUS: 'Accepted' },
    { CAND_ID: 104, REFERRAL_DATE: '2025-08-08', REFERRAL_STATUS: 'Accepted' },
    { CAND_ID: 105, REFERRAL_DATE: '2025-08-09', REFERRAL_STATUS: 'Rejected' }
  ],
  Assessed_For: [
    { CAND_ID: 101, JOB_KEY: 1, SKILL_ID: 'S001', MATCH_PER: 92.00, ASS_DATE: '2026-08-15', ASS_SCORE: 90.00 },
    { CAND_ID: 102, JOB_KEY: 2, SKILL_ID: 'S002', MATCH_PER: 85.50, ASS_DATE: '2026-08-16', ASS_SCORE: 82.00 },
    { CAND_ID: 103, JOB_KEY: 3, SKILL_ID: 'S003', MATCH_PER: 88.00, ASS_DATE: '2026-08-17', ASS_SCORE: 86.50 },
    { CAND_ID: 104, JOB_KEY: 4, SKILL_ID: 'S004', MATCH_PER: 79.00, ASS_DATE: '2026-08-18', ASS_SCORE: 78.00 },
    { CAND_ID: 105, JOB_KEY: 5, SKILL_ID: 'S005', MATCH_PER: 75.00, ASS_DATE: '2026-08-19', ASS_SCORE: 74.50 }
  ],
  Has: [
    { CAND_ID: 101, SKILL_ID: 'S001', PGD_LEVEL: 'Advanced', YEARS_OF_EXP: 5.0 },
    { CAND_ID: 101, SKILL_ID: 'S002', PGD_LEVEL: 'Advanced', YEARS_OF_EXP: 4.0 },
    { CAND_ID: 102, SKILL_ID: 'S002', PGD_LEVEL: 'Intermediate', YEARS_OF_EXP: 3.0 },
    { CAND_ID: 103, SKILL_ID: 'S001', PGD_LEVEL: 'Advanced', YEARS_OF_EXP: 5.0 },
    { CAND_ID: 103, SKILL_ID: 'S003', PGD_LEVEL: 'Intermediate', YEARS_OF_EXP: 3.0 },
    { CAND_ID: 104, SKILL_ID: 'S004', PGD_LEVEL: 'Advanced', YEARS_OF_EXP: 3.0 },
    { CAND_ID: 105, SKILL_ID: 'S005', PGD_LEVEL: 'Intermediate', YEARS_OF_EXP: 4.0 }
  ],
  APP_USERS: [
    { USER_ID: 1, USERNAME: 'recruiter', PASSWORD_HASH: '$2a$10$7Z/lFv2w0zU7oQoX1V1Y8.xX7h6Gg8Z2Z2uT7bH6n8mP4rV5xQ5K.', FULL_NAME: 'Alex Mercer (Recruitment Lead)', EMAIL: 'alex.recruiter@jrms.org', ROLE: 'USER', IS_ACTIVE: 1, CREATED_AT: '2026-01-15' },
    { USER_ID: 2, USERNAME: 'designer', PASSWORD_HASH: '$2a$10$7Z/lFv2w0zU7oQoX1V1Y8.xX7h6Gg8Z2Z2uT7bH6n8mP4rV5xQ5K.', FULL_NAME: 'Dr. Elena Rostova (Schema Architect)', EMAIL: 'elena.designer@jrms.org', ROLE: 'DATABASE_DESIGNER', IS_ACTIVE: 1, CREATED_AT: '2026-01-10' },
    { USER_ID: 3, USERNAME: 'dba_admin', PASSWORD_HASH: '$2a$10$7Z/lFv2w0zU7oQoX1V1Y8.xX7h6Gg8Z2Z2uT7bH6n8mP4rV5xQ5K.', FULL_NAME: 'Marcus Vance (Chief DBA)', EMAIL: 'marcus.dba@jrms.org', ROLE: 'DBA', IS_ACTIVE: 1, CREATED_AT: '2026-01-01' }
  ],
  APP_AUDIT_LOG: [
    { LOG_ID: 1, USERNAME: 'SYSTEM', ROLE: 'DBA', ACTION: 'SCHEMA_INITIALIZATION', DETAILS: 'Database schema created with 41 normalized BCNF tables and security tables', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-09-03 23:30:00' },
    { LOG_ID: 2, USERNAME: 'SYSTEM', ROLE: 'DBA', ACTION: 'SEED_DATA_LOADED', DETAILS: 'DA1 sample records loaded across all entity, relationship, and subtype relations', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-09-03 23:30:05' }
  ]
};
