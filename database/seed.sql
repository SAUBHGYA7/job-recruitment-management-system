-- ============================================================
-- JOB RECRUITMENT MANAGEMENT SYSTEM - COMPREHENSIVE SEED DATA
-- Fully Populated Dataset for Academic Project Demonstration (25+ Records per table)
-- Topologically Ordered to Respect All Oracle Foreign Key Constraints
-- ============================================================

SET DEFINE OFF;

-- ------------------------------------------------------------
-- 1. EDUCATION DATA (ED001 - ED025)
-- ------------------------------------------------------------
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED001', 8.4, 'CS');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED002', 9.0, 'IT');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED003', 8.6, 'CS');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED004', 8.9, 'CS');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED005', 8.6, 'CS');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED006', 9.2, 'Data Science');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED007', 8.1, 'AI & ML');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED008', 7.9, 'Software Engineering');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED009', 8.8, 'Cybersecurity');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED010', 9.4, 'Computer Systems');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED011', 8.3, 'Cloud Computing');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED012', 7.8, 'Information Technology');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED013', 8.7, 'Database Systems');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED014', 9.1, 'Computer Science');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED015', 8.5, 'AI & Robotics');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED016', 7.6, 'Business Analytics');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED017', 8.9, 'Computer Networks');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED018', 9.0, 'Software Architecture');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED019', 8.2, 'Distributed Systems');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED020', 8.0, 'Informatics');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED021', 9.3, 'CS & Engineering');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED022', 8.4, 'Information Security');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED023', 8.7, 'Enterprise Computing');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED024', 9.5, 'Machine Learning');
INSERT INTO Education (edu_id, cgpa, specialization) VALUES ('ED025', 8.0, 'Information Systems');

INSERT INTO Education_Degree (degree, university, start_year) VALUES ('BTech', 'Anna University', 2019);
INSERT INTO Education_Degree (degree, university, start_year) VALUES ('MTech', 'Delhi University', 2020);
INSERT INTO Education_Degree (degree, university, start_year) VALUES ('MBA', 'Anna University', 2020);
INSERT INTO Education_Degree (degree, university, start_year) VALUES ('BCA', 'Bangalore University', 2018);
INSERT INTO Education_Degree (degree, university, start_year) VALUES ('MCA', 'Pune University', 2021);
INSERT INTO Education_Degree (degree, university, start_year) VALUES ('BSc CS', 'Mumbai University', 2019);
INSERT INTO Education_Degree (degree, university, start_year) VALUES ('MS CS', 'BITS Pilani', 2021);

INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED001', 'BTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED002', 'BTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED003', 'MBA', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED004', 'MTech', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED005', 'MBA', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED006', 'MTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED007', 'BTech', 2024);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED008', 'BCA', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED009', 'MS CS', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED010', 'BTech', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED011', 'MCA', 2024);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED012', 'BSc CS', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED013', 'MTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED014', 'BTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED015', 'MS CS', 2024);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED016', 'MBA', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED017', 'BTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED018', 'MTech', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED019', 'MS CS', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED020', 'BCA', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED021', 'BTech', 2024);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED022', 'MTech', 2023);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED023', 'BTech', 2022);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED024', 'MS CS', 2024);
INSERT INTO Education_End (edu_id, degree, end_year) VALUES ('ED025', 'MCA', 2023);

-- ------------------------------------------------------------
-- 2. APPLICATION DATA (APP001 - APP025)
-- ------------------------------------------------------------
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP001', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP002', 'Shortlisted', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP003', 'Shortlisted', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP004', 'Shortlisted', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP005', 'Rejected', 'Rejected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP006', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP007', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP008', 'In Review', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP009', 'In Review', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP010', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP011', 'Rejected', 'Rejected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP012', 'Shortlisted', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP013', 'In Review', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP014', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP015', 'On Hold', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP016', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP017', 'Rejected', 'Rejected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP018', 'In Review', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP019', 'Shortlisted', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP020', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP021', 'In Review', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP022', 'Rejected', 'Rejected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP023', 'Shortlisted', 'Selected');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP024', 'Shortlisted', 'Pending');
INSERT INTO Application (app_id, app_status, final_result) VALUES ('APP025', 'In Review', 'Pending');

INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-10', 'JD application offer', 'Selected');
INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-13', 'DA application letter', 'Pending');
INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-12', 'US application rejection', 'Rejected');
INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-15', 'Cloud architect offer', 'Selected');
INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-18', 'Backend developer offer', 'Selected');
INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-20', 'Evaluation in review', 'Pending');
INSERT INTO Application_Date (app_date, offer_letter, final_result) VALUES (DATE '2026-08-22', 'Candidate disqualified', 'Rejected');

INSERT INTO Application_Info (app_id, app_date) VALUES ('APP001', DATE '2026-08-10');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP002', DATE '2026-08-13');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP003', DATE '2026-08-13');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP004', DATE '2026-08-13');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP005', DATE '2026-08-12');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP006', DATE '2026-08-15');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP007', DATE '2026-08-18');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP008', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP009', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP010', DATE '2026-08-15');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP011', DATE '2026-08-22');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP012', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP013', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP014', DATE '2026-08-18');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP015', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP016', DATE '2026-08-15');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP017', DATE '2026-08-22');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP018', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP019', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP020', DATE '2026-08-18');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP021', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP022', DATE '2026-08-22');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP023', DATE '2026-08-15');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP024', DATE '2026-08-20');
INSERT INTO Application_Info (app_id, app_date) VALUES ('APP025', DATE '2026-08-20');

-- ------------------------------------------------------------
-- 3. DEPENDENT DATA (D001 - D025)
-- ------------------------------------------------------------
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D001', DATE '1995-05-12', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D002', DATE '2015-08-10', 'Son');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D003', DATE '2015-08-10', 'Son');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D004', DATE '1998-11-10', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D005', DATE '2012-06-25', 'Son');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D006', DATE '1996-03-14', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D007', DATE '1975-09-21', 'Mother');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D008', DATE '2018-04-05', 'Daughter');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D009', DATE '1970-12-30', 'Father');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D010', DATE '1997-07-19', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D011', DATE '2016-10-11', 'Son');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D012', DATE '1999-01-22', 'Sister');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D013', DATE '1974-08-17', 'Mother');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D014', DATE '1995-12-03', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D015', DATE '2019-02-18', 'Daughter');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D016', DATE '1972-05-11', 'Father');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D017', DATE '1998-09-08', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D018', DATE '2017-11-29', 'Son');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D019', DATE '1976-06-04', 'Mother');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D020', DATE '1996-10-15', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D021', DATE '2020-01-09', 'Son');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D022', DATE '1973-04-27', 'Father');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D023', DATE '1997-02-14', 'Spouse');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D024', DATE '2018-08-20', 'Daughter');
INSERT INTO Dependent (dep_id, dob, relationship) VALUES ('D025', DATE '1999-11-05', 'Brother');

-- ------------------------------------------------------------
-- 4. INTERVIEW DATA (INT001 - INT025)
-- ------------------------------------------------------------
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT001', DATE '2026-08-20', '10:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT002', DATE '2026-08-21', '11:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT003', DATE '2026-08-22', '14:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT004', DATE '2026-08-23', '15:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT005', DATE '2026-08-24', '10:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT006', DATE '2026-08-25', '09:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT007', DATE '2026-08-25', '11:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT008', DATE '2026-08-26', '14:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT009', DATE '2026-08-26', '16:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT010', DATE '2026-08-27', '10:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT011', DATE '2026-08-27', '11:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT012', DATE '2026-08-28', '14:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT013', DATE '2026-08-28', '15:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT014', DATE '2026-08-29', '10:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT015', DATE '2026-08-29', '11:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT016', DATE '2026-08-30', '14:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT017', DATE '2026-08-30', '15:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT018', DATE '2026-08-31', '10:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT019', DATE '2026-08-31', '11:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT020', DATE '2026-09-01', '14:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT021', DATE '2026-09-01', '15:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT022', DATE '2026-09-02', '10:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT023', DATE '2026-09-02', '11:30');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT024', DATE '2026-09-03', '14:00');
INSERT INTO Interview (int_id, int_date, int_time) VALUES ('INT025', DATE '2026-09-03', '15:30');

INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT001', 'Online', 'Bengaluru', 'Scheduled', NULL, 'Interview pending technical round evaluation');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT002', 'Online', 'Mumbai', 'Completed', 85.00, 'Strong problem solving skills and solid SQL understanding');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT003', 'Offline', 'Delhi', 'Scheduled', NULL, 'In-person coding interview scheduled with Tech Lead');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT004', 'Online', 'Chennai', 'Completed', 78.50, 'Good communication and clear UI design concepts');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT005', 'Offline', 'Kolkata', 'Completed', 90.00, 'Exceptional database schema knowledge and query optimization');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT006', 'Online', 'Hyderabad', 'Completed', 92.50, 'Mastery in cloud architecture and microservices');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT007', 'Online', 'Pune', 'Completed', 88.00, 'Very knowledgeable in data pipelines and analytics');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT008', 'Offline', 'Bengaluru', 'Scheduled', NULL, 'System design whiteboarding evaluation pending');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT009', 'Online', 'Gurugram', 'Scheduled', NULL, 'First round technical screening');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT010', 'Online', 'Noida', 'Completed', 86.00, 'Passed algorithm and data structures assessment');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT011', 'Offline', 'Ahmedabad', 'Completed', 65.00, 'Lacks depth in advanced relational normalization');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT012', 'Online', 'Kochi', 'Scheduled', NULL, 'Full stack web development panel interview');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT013', 'Online', 'Jaipur', 'Scheduled', NULL, 'DevOps CI/CD evaluation round');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT014', 'Offline', 'Bengaluru', 'Completed', 94.00, 'Outstanding candidate with extensive Oracle tuning experience');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT015', 'Online', 'Mumbai', 'Scheduled', NULL, 'Leadership and team culture round');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT016', 'Online', 'Pune', 'Completed', 89.00, 'Solid full stack proficiency in React and Node.js');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT017', 'Offline', 'Delhi', 'Completed', 62.00, 'Does not meet the minimum concurrency requirements');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT018', 'Online', 'Chennai', 'Scheduled', NULL, 'QA Automation testing technical interview');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT019', 'Online', 'Hyderabad', 'Scheduled', NULL, 'Security auditing and threat modeling assessment');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT020', 'Offline', 'Kolkata', 'Completed', 91.00, 'Excellent problem solving and database indexing knowledge');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT021', 'Online', 'Bengaluru', 'Scheduled', NULL, 'Product management case study interview');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT022', 'Offline', 'Mumbai', 'Completed', 70.00, 'Adequate skills but communication needs polishing');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT023', 'Online', 'Delhi', 'Completed', 87.50, 'Strong analytical thinking and clean code architecture');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT024', 'Online', 'Pune', 'Scheduled', NULL, 'Machine learning modeling round');
INSERT INTO Interview_Details (int_id, int_mode, location, int_status, score, feedback) VALUES ('INT025', 'Offline', 'Gurugram', 'Scheduled', NULL, 'Technical discussion with VP of Engineering');

-- ------------------------------------------------------------
-- 5. CANDIDATE DATA (101 - 125)
-- ------------------------------------------------------------
INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (101, 'Ram', 'Kumar', 'Mishra', DATE '2004-04-19', 'Male', DATE '2025-04-25', 'ED001', 'APP001', 'D001', 'INT001');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (102, 'Om', 'Kumar', 'Pandey', DATE '2001-01-20', 'Male', DATE '2025-04-26', 'ED002', 'APP002', 'D002', 'INT002');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (103, 'Ojas', 'Prakash', 'Dwivedi', DATE '2000-08-02', 'Male', DATE '2025-04-24', 'ED003', 'APP003', 'D003', 'INT003');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (104, 'Sita', 'Krishan', 'Awasthi', DATE '2001-12-18', 'Female', DATE '2025-04-22', 'ED004', 'APP004', 'D004', 'INT004');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (105, 'Pilu', 'Lata', 'Yadav', DATE '1999-06-15', 'Female', DATE '2025-04-20', 'ED005', 'APP005', 'D005', 'INT005');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (106, 'Aarav', 'Sundar', 'Rao', DATE '1998-03-25', 'Male', DATE '2025-05-01', 'ED006', 'APP006', 'D006', 'INT006');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (107, 'Ananya', 'Devi', 'Sharma', DATE '2000-11-12', 'Female', DATE '2025-05-02', 'ED007', 'APP007', 'D007', 'INT007');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (108, 'Vikram', 'Pratap', 'Singh', DATE '1997-09-08', 'Male', DATE '2025-05-03', 'ED008', 'APP008', 'D008', 'INT008');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (109, 'Pooja', 'Rani', 'Nair', DATE '2001-07-22', 'Female', DATE '2025-05-04', 'ED009', 'APP009', 'D009', 'INT009');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (110, 'Karthik', 'Gopal', 'Iyer', DATE '1996-01-30', 'Male', DATE '2025-05-05', 'ED010', 'APP010', 'D010', 'INT010');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (111, 'Meera', 'Mohan', 'Menon', DATE '2002-04-14', 'Female', DATE '2025-05-06', 'ED011', 'APP011', 'D011', 'INT011');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (112, 'Rohan', 'Rajesh', 'Verma', DATE '1999-10-05', 'Male', DATE '2025-05-07', 'ED012', 'APP012', 'D012', 'INT012');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (113, 'Sneha', 'Kumari', 'Patel', DATE '2000-05-18', 'Female', DATE '2025-05-08', 'ED013', 'APP013', 'D013', 'INT013');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (114, 'Aditya', 'Shekhar', 'Gupta', DATE '1995-12-11', 'Male', DATE '2025-05-09', 'ED014', 'APP014', 'D014', 'INT014');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (115, 'Divya', 'Shree', 'Kulkarni', DATE '2001-02-28', 'Female', DATE '2025-05-10', 'ED015', 'APP015', 'D015', 'INT015');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (116, 'Siddharth', 'Narayan', 'Joshi', DATE '1998-08-16', 'Male', DATE '2025-05-11', 'ED016', 'APP016', 'D016', 'INT016');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (117, 'Kavita', 'Bai', 'Reddy', DATE '2002-06-09', 'Female', DATE '2025-05-12', 'ED017', 'APP017', 'D017', 'INT017');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (118, 'Arjun', 'Dev', 'Chopra', DATE '1997-04-03', 'Male', DATE '2025-05-13', 'ED018', 'APP018', 'D018', 'INT018');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (119, 'Tanvi', 'Anand', 'Deshmukh', DATE '2000-09-24', 'Female', DATE '2025-05-14', 'ED019', 'APP019', 'D019', 'INT019');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (120, 'Manish', 'Babu', 'Bhatt', DATE '1996-07-15', 'Male', DATE '2025-05-15', 'ED020', 'APP020', 'D020', 'INT020');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (121, 'Ritu', 'Prabha', 'Saxena', DATE '2001-03-19', 'Female', DATE '2025-05-16', 'ED021', 'APP021', 'D021', 'INT021');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (122, 'Nikhil', 'Chandra', 'Banerjee', DATE '1998-11-07', 'Male', DATE '2025-05-17', 'ED022', 'APP022', 'D022', 'INT022');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (123, 'Ishita', 'Laxmi', 'Dhar', DATE '1999-08-31', 'Female', DATE '2025-05-18', 'ED023', 'APP023', 'D023', 'INT023');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (124, 'Harsh', 'Vardhan', 'Mehta', DATE '1995-05-27', 'Male', DATE '2025-05-19', 'ED024', 'APP024', 'D024', 'INT024');

INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id)
VALUES (125, 'Shreya', 'Anu', 'Ghosh', DATE '2002-01-10', 'Female', DATE '2025-05-20', 'ED025', 'APP025', 'D025', 'INT025');

-- Addresses
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (101, '83', 'Jaipur', 'Malroad');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (102, '122', 'Kochi', 'GandhiGT');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (103, '016', 'Jaipur', 'Malroad');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (104, '115', 'Mumbai', 'Canal');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (105, '104', 'Kochi', 'GandhiGT');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (106, '24A', 'Bengaluru', 'Indiranagar 100ft Rd');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (107, '512', 'New Delhi', 'Connaught Place');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (108, '88', 'Pune', 'FC Road');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (109, '12B', 'Chennai', 'Anna Salai');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (110, '301', 'Hyderabad', 'Hitec City');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (111, '45', 'Kochi', 'Marine Drive');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (112, '17', 'Mumbai', 'Bandra West');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (113, '99', 'Ahmedabad', 'SG Highway');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (114, '410', 'Bengaluru', 'Koramangala 4th Block');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (115, '205', 'Pune', 'Viman Nagar');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (116, '67', 'Jaipur', 'C-Scheme');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (117, '802', 'Hyderabad', 'Gachibowli');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (118, '14', 'New Delhi', 'Hauz Khas');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (119, '33C', 'Mumbai', 'Andheri East');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (120, '155', 'Kolkata', 'Park Street');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (121, '72', 'Noida', 'Sector 62');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (122, '18A', 'Kolkata', 'Salt Lake Sector V');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (123, '409', 'Bengaluru', 'Whitefield Main Rd');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (124, '21', 'Gurugram', 'Cyber City DLF');
INSERT INTO Candidate_Address (cand_id, house_no, city, street) VALUES (125, '604', 'Chennai', 'OMR IT Corridor');

-- Emails
INSERT INTO Candidate_Email (cand_id, email) VALUES (101, 'ram.mishra@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (102, 'om.pandey@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (103, 'ojas.dwivedi@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (104, 'sita.awasthi@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (105, 'pilu.yadav@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (106, 'aarav.rao@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (107, 'ananya.sharma@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (108, 'vikram.singh@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (109, 'pooja.nair@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (110, 'karthik.iyer@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (111, 'meera.menon@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (112, 'rohan.verma@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (113, 'sneha.patel@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (114, 'aditya.gupta@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (115, 'divya.kulkarni@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (116, 'siddharth.joshi@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (117, 'kavita.reddy@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (118, 'arjun.chopra@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (119, 'tanvi.deshmukh@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (120, 'manish.bhatt@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (121, 'ritu.saxena@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (122, 'nikhil.banerjee@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (123, 'ishita.dhar@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (124, 'harsh.mehta@example.com');
INSERT INTO Candidate_Email (cand_id, email) VALUES (125, 'shreya.ghosh@example.com');

-- Phones
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (101, '9412515249');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (102, '7084708400');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (103, '9415941546');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (104, '9795386666');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (105, '9415363621');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (106, '9845012345');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (107, '9811098765');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (108, '9822055443');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (109, '9840133221');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (110, '9849077889');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (111, '9447011223');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (112, '9820044556');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (113, '9825066778');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (114, '9886088990');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (115, '9823022334');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (116, '9829044332');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (117, '9848099887');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (118, '9810066554');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (119, '9821088776');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (120, '9830011224');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (121, '9818033445');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (122, '9831055667');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (123, '9880077881');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (124, '9812099002');
INSERT INTO Candidate_Phone (cand_id, phone) VALUES (125, '9841022339');

-- ------------------------------------------------------------
-- 6. JOB DATA (job_key 1 - 20)
-- ------------------------------------------------------------
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (1, 'J001', 'Open', 65000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (2, 'J002', 'Closed', 55000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (3, 'J003', 'Open', 165000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (4, 'J004', 'Closed', 55000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (5, 'J005', 'Closed', 60000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (6, 'J006', 'Open', 125000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (7, 'J007', 'Open', 95000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (8, 'J008', 'Open', 140000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (9, 'J009', 'Closed', 75000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (10, 'J010', 'Open', 180000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (11, 'J011', 'Open', 85000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (12, 'J012', 'Open', 110000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (13, 'J013', 'Closed', 65000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (14, 'J014', 'Open', 150000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (15, 'J015', 'Open', 90000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (16, 'J016', 'Open', 135000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (17, 'J017', 'Closed', 70000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (18, 'J018', 'Open', 160000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (19, 'J019', 'Open', 115000);
INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (20, 'J020', 'Open', 105000);

INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (1, 'S/W Dev', 'Application development engineer in enterprise Java and cloud systems.', 'APP001');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (2, 'Data Analyst', 'Data analyst to model dashboards and SQL pipelines.', 'APP002');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (3, 'Data Analyst', 'Senior analytics and user interface metrics designer.', 'APP003');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (4, 'S/W Dev', 'Software development and backend API services.', 'APP004');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (5, 'Database', 'Database administrator maintaining Oracle schemas and BCNF tables.', 'APP005');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (6, 'Cloud Architect', 'Design resilient AWS/GCP cloud platforms and infrastructure as code.', 'APP006');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (7, 'Frontend Dev', 'React.js and Tailwind CSS responsive interface engineer.', 'APP007');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (8, 'DevOps Engineer', 'Automated CI/CD pipelines, Docker containerization, and Kubernetes.', 'APP008');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (9, 'QA Automation', 'Automated test suite design with Selenium, Cypress, and Jest.', 'APP009');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (10, 'ML Engineer', 'Production machine learning model training and feature extraction.', 'APP010');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (11, 'Cyber Analyst', 'Threat modeling, network perimeter security, and vulnerability audits.', 'APP011');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (12, 'Backend Dev', 'Node.js and Express microservices with relational database pools.', 'APP012');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (13, 'UI/UX Designer', 'Enterprise user workflow wireframing, UX accessibility, and design systems.', 'APP013');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (14, 'System Architect', 'High-throughput distributed systems and concurrency optimization.', 'APP014');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (15, 'Mobile Dev', 'Cross-platform mobile apps using React Native and Flutter.', 'APP015');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (16, 'Full Stack Dev', 'End-to-end full stack development with modern TypeScript frameworks.', 'APP016');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (17, 'Technical Writer', 'API documentation, developer guides, and architecture specifications.', 'APP017');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (18, 'Data Engineer', 'Big data ingestion pipelines with Apache Spark, Kafka, and Snowflake.', 'APP018');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (19, 'Product Specialist', 'Technical product management and feature requirement gathering.', 'APP019');
INSERT INTO Job_Details (job_key, job_title, descriptive, app_id) VALUES (20, 'Site Reliability', 'Zero-downtime operations, Prometheus monitoring, and incident response.', 'APP020');

INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('S/W Dev', DATE '2026-09-30', DATE '2026-08-01');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Data Analyst', DATE '2026-09-25', DATE '2026-08-03');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Database', DATE '2026-08-15', DATE '2026-07-15');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Cloud Architect', DATE '2026-10-15', DATE '2026-08-10');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Frontend Dev', DATE '2026-10-01', DATE '2026-08-12');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('DevOps Engineer', DATE '2026-10-20', DATE '2026-08-14');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('QA Automation', DATE '2026-09-15', DATE '2026-08-05');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('ML Engineer', DATE '2026-11-01', DATE '2026-08-16');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Cyber Analyst', DATE '2026-09-20', DATE '2026-08-08');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Backend Dev', DATE '2026-10-10', DATE '2026-08-15');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('UI/UX Designer', DATE '2026-09-18', DATE '2026-08-02');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('System Architect', DATE '2026-11-15', DATE '2026-08-20');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Mobile Dev', DATE '2026-10-05', DATE '2026-08-11');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Full Stack Dev', DATE '2026-10-25', DATE '2026-08-17');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Technical Writer', DATE '2026-09-10', DATE '2026-08-01');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Data Engineer', DATE '2026-11-10', DATE '2026-08-19');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Product Specialist', DATE '2026-10-12', DATE '2026-08-13');
INSERT INTO Job_Posting (job_title, closing_date, posted_date) VALUES ('Site Reliability', DATE '2026-10-30', DATE '2026-08-18');

-- ------------------------------------------------------------
-- 7. EXPERIENCE DATA (EXP001 - EXP025)
-- ------------------------------------------------------------
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP001', DATE '2021-05-01', 'S/W Dev');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP002', DATE '2022-07-01', 'Senior S/W');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP003', DATE '2022-07-01', 'Senior S/W');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP004', DATE '2022-07-02', 'Data Analyst');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP005', DATE '2022-07-02', 'Data Analyst');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP006', DATE '2020-03-01', 'Cloud Architect');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP007', DATE '2021-06-15', 'Frontend Dev');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP008', DATE '2019-08-01', 'DevOps Engineer');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP009', DATE '2022-01-10', 'QA Automation');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP010', DATE '2018-11-01', 'ML Engineer');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP011', DATE '2021-09-01', 'Cyber Analyst');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP012', DATE '2020-04-15', 'Backend Dev');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP013', DATE '2022-05-01', 'UI/UX Designer');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP014', DATE '2017-02-01', 'System Architect');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP015', DATE '2021-08-10', 'Mobile Dev');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP016', DATE '2020-10-01', 'Full Stack Dev');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP017', DATE '2022-03-15', 'Technical Writer');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP018', DATE '2019-01-15', 'Data Engineer');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP019', DATE '2021-11-01', 'Product Specialist');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP020', DATE '2018-06-01', 'Site Reliability');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP021', DATE '2022-08-01', 'S/W Dev');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP022', DATE '2020-12-01', 'Data Analyst');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP023', DATE '2019-07-01', 'Senior S/W');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP024', DATE '2018-02-15', 'System Architect');
INSERT INTO Experience (exp_id, start_date, job_title) VALUES ('EXP025', DATE '2022-04-01', 'Frontend Dev');

INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP001', 101, 'TCS', DATE '2023-04-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP002', 102, 'Infosys', DATE '2024-06-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP003', 102, 'Infosys', DATE '2024-06-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP004', 101, 'TCS', DATE '2025-05-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP005', 105, 'Infosys', DATE '2025-06-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP006', 106, 'Wipro', DATE '2024-08-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP007', 107, 'Accenture', DATE '2024-05-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP008', 108, 'Cognizant', DATE '2023-12-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP009', 109, 'TCS', DATE '2024-03-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP010', 110, 'Microsoft', DATE '2024-07-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP011', 111, 'Capgemini', DATE '2024-01-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP012', 112, 'Oracle India', DATE '2024-09-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP013', 113, 'Swiggy', DATE '2024-06-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP014', 114, 'Google India', DATE '2024-08-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP015', 115, 'Flipkart', DATE '2024-04-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP016', 116, 'Amazon', DATE '2024-07-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP017', 117, 'Zoho', DATE '2024-02-28');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP018', 118, 'Cisco', DATE '2024-06-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP019', 119, 'Zomato', DATE '2024-05-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP020', 120, 'IBM', DATE '2024-03-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP021', 121, 'HCL Tech', DATE '2024-08-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP022', 122, 'Tech Mahindra', DATE '2024-07-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP023', 123, 'Infosys', DATE '2024-06-30');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP024', 124, 'Intel', DATE '2024-08-31');
INSERT INTO Experience_Candidate (exp_id, cand_id, comp_name, end_date) VALUES ('EXP025', 125, 'Mindtree', DATE '2024-05-31');

INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('TCS', 'S/W Dev', DATE '2023-04-30');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Infosys', 'Senior S/W', DATE '2024-06-30');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Infosys', 'Data Analyst', DATE '2025-06-30');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Wipro', 'Cloud Architect', DATE '2024-08-31');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Accenture', 'Frontend Dev', DATE '2024-05-31');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Cognizant', 'DevOps Engineer', DATE '2023-12-31');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Microsoft', 'ML Engineer', DATE '2024-07-31');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Oracle India', 'Backend Dev', DATE '2024-09-30');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Google India', 'System Architect', DATE '2024-08-31');
INSERT INTO Experience_Company (comp_name, job_title, end_date) VALUES ('Amazon', 'Full Stack Dev', DATE '2024-07-31');

-- ------------------------------------------------------------
-- 8. LOCATION DATA
-- ------------------------------------------------------------
INSERT INTO Location (pincode, country, state) VALUES (560001, 'India', 'Karnataka');
INSERT INTO Location (pincode, country, state) VALUES (110001, 'India', 'Delhi');
INSERT INTO Location (pincode, country, state) VALUES (400001, 'India', 'Maharashtra');
INSERT INTO Location (pincode, country, state) VALUES (360001, 'India', 'Gujarat');
INSERT INTO Location (pincode, country, state) VALUES (600001, 'India', 'Tamil Nadu');
INSERT INTO Location (pincode, country, state) VALUES (700001, 'India', 'W.B');
INSERT INTO Location (pincode, country, state) VALUES (500001, 'India', 'Telangana');
INSERT INTO Location (pincode, country, state) VALUES (411001, 'India', 'Maharashtra');
INSERT INTO Location (pincode, country, state) VALUES (302001, 'India', 'Rajasthan');
INSERT INTO Location (pincode, country, state) VALUES (682001, 'India', 'Kerala');
INSERT INTO Location (pincode, country, state) VALUES (201301, 'India', 'Uttar Pradesh');
INSERT INTO Location (pincode, country, state) VALUES (122001, 'India', 'Haryana');

INSERT INTO State_City (state, city) VALUES ('Karnataka', 'Bengaluru');
INSERT INTO State_City (state, city) VALUES ('Delhi', 'New Delhi');
INSERT INTO State_City (state, city) VALUES ('Maharashtra', 'Mumbai');
INSERT INTO State_City (state, city) VALUES ('Gujarat', 'Rajkot');
INSERT INTO State_City (state, city) VALUES ('Tamil Nadu', 'Chennai');
INSERT INTO State_City (state, city) VALUES ('W.B', 'Kolkata');
INSERT INTO State_City (state, city) VALUES ('Telangana', 'Hyderabad');
INSERT INTO State_City (state, city) VALUES ('Rajasthan', 'Jaipur');
INSERT INTO State_City (state, city) VALUES ('Kerala', 'Kochi');
INSERT INTO State_City (state, city) VALUES ('Uttar Pradesh', 'Noida');
INSERT INTO State_City (state, city) VALUES ('Haryana', 'Gurugram');

-- ------------------------------------------------------------
-- 9. EMPLOYER DATA (E001 - E015)
-- ------------------------------------------------------------
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E001', 'Tech Nova Systems', 2015);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E002', 'DataCore Analytics', 2012);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E003', 'DesignTech Solutions', 2018);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E004', 'CodeCraft Software', 2004);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E005', 'CloudMatrix Infotech', 2014);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E006', 'Apex Global Networks', 2010);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E007', 'CyberShield Labs', 2019);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E008', 'FinTech Dynamics', 2016);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E009', 'Quantum AI Systems', 2021);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E010', 'NexGen HealthTech', 2017);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E011', 'LogiChain Enterprises', 2013);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E012', 'AutoDrive Robotics', 2020);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E013', 'EduSphere Learning', 2015);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E014', 'Solaris Clean Energy', 2018);
INSERT INTO Employer (emp_id, company_name, founded_year) VALUES ('E015', 'HyperScale Cloud Labs', 2019);

INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E001', 'hr@technova.com', 'https://technova.example.com', 'Bengaluru');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E002', 'hr@datacore.com', 'https://datacore.example.com', 'Mumbai');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E003', 'hr@designtech.com', 'https://designtech.example.com', 'New Delhi');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E004', 'hr@codecraft.com', 'https://codecraft.example.com', 'Chennai');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E005', 'hr@cloudmatrix.com', 'https://cloudmatrix.example.com', 'Hyderabad');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E006', 'talent@apexnetworks.com', 'https://apexnetworks.example.com', 'Bengaluru');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E007', 'careers@cybershield.com', 'https://cybershield.example.com', 'Pune');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E008', 'recruitment@fintechdyn.com', 'https://fintechdyn.example.com', 'Mumbai');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E009', 'hr@quantumai.com', 'https://quantumai.example.com', 'Bengaluru');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E010', 'jobs@nexgenhealth.com', 'https://nexgenhealth.example.com', 'Hyderabad');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E011', 'people@logichain.com', 'https://logichain.example.com', 'Gurugram');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E012', 'drive@autodrive.com', 'https://autodrive.example.com', 'Chennai');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E013', 'talent@edusphere.com', 'https://edusphere.example.com', 'Noida');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E014', 'hr@solarisenergy.com', 'https://solarisenergy.example.com', 'Ahmedabad');
INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES ('E015', 'careers@hyperscale.com', 'https://hyperscale.example.com', 'Bengaluru');

INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E001', '9784659312');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E002', '9124658387');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E003', '9877964321');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E004', '9123456789');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E005', '9123022138');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E006', '9845011223');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E007', '9822033445');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E008', '9820055667');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E009', '9886077889');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E010', '9849099001');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E011', '9812011335');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E012', '9840133557');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E013', '9818055779');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E014', '9825077991');
INSERT INTO Employer_Phone (emp_id, phone_no) VALUES ('E015', '9880099113');

-- ------------------------------------------------------------
-- 10. SKILL DATA (S001 - S015)
-- ------------------------------------------------------------
INSERT INTO Skill (skill_id, skill_name) VALUES ('S001', 'Java');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S002', 'SQL');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S003', 'UI Design');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S004', 'Python');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S005', 'Oracle DB');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S006', 'React.js');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S007', 'Node.js');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S008', 'AWS Cloud');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S009', 'Docker');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S010', 'Kubernetes');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S011', 'TypeScript');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S012', 'Cybersecurity');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S013', 'Machine Learning');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S014', 'Go / Golang');
INSERT INTO Skill (skill_id, skill_name) VALUES ('S015', 'Kafka');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Java', 'Programming', 'Core Java, Spring Boot, OOP principles and JVM optimization');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('SQL', 'Database', 'Relational query construction, Joins, Aggregation, and Normalization');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('UI Design', 'Design', 'Figma wireframing, Responsive UX design, Tailwind CSS styling');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Python', 'Programming', 'Python scripting, Pandas, Data analytics pipelines, REST APIs');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Oracle DB', 'Database Administration', 'Oracle PL/SQL, BCNF schema design, Indexing, and USER metadata inspection');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('React.js', 'Frontend Development', 'Component lifecycle, hooks, state management, and virtual DOM rendering');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Node.js', 'Backend Development', 'Asynchronous event-driven backend architectures and Express REST APIs');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('AWS Cloud', 'Cloud Infrastructure', 'EC2, S3, RDS, Lambda serverless, and IAM security management');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Docker', 'DevOps & Tooling', 'Container images, multi-stage Dockerfiles, and container networking');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Kubernetes', 'Cloud Infrastructure', 'K8s pod orchestration, ingress controllers, config maps, and deployments');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('TypeScript', 'Programming', 'Static typing for modern enterprise JavaScript codebases');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Cybersecurity', 'Security & Audit', 'Penetration testing, encryption standards, OAuth2, and OWASP top 10');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Machine Learning', 'Data Science', 'Scikit-learn, PyTorch, statistical modeling, and inference pipelines');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Go / Golang', 'Programming', 'High-concurrency systems programming, goroutines, and channels');

INSERT INTO Skill_Details (skill_name, skill_category, description)
VALUES ('Kafka', 'Data Engineering', 'Distributed streaming event architecture, topic partitions, and consumer groups');

-- ------------------------------------------------------------
-- 11. SUBTYPES DATA (101 - 125)
-- ------------------------------------------------------------
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (101, 800.00, 'https://ram.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (102, 700.00, 'https://om.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (103, 900.00, 'https://ojas.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (104, 700.00, 'https://sita.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (105, 850.00, 'https://pilu.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (106, 1200.00, 'https://aarav.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (107, 950.00, 'https://ananya.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (108, 1100.00, 'https://vikram.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (109, 850.00, 'https://pooja.dev');
INSERT INTO Freelancer (cand_id, hourly_rate, portfolio_url) VALUES (110, 1500.00, 'https://karthik.dev');

INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (101, 2023, 4);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (102, 2023, 4);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (103, 2024, 2);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (104, 2024, 2);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (105, 2023, 4);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (111, 2024, 3);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (112, 2023, 2);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (113, 2024, 2);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (115, 2024, 1);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (117, 2024, 2);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (121, 2024, 3);
INSERT INTO Fresher (cand_id, grad_year, internship_count) VALUES (125, 2024, 2);

INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (101, 5.0, 'Infosys');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (102, 3.0, 'TCS');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (103, 5.0, 'Infosys');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (104, 3.0, 'Wipro');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (105, 4.0, 'TCS');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (106, 6.5, 'Wipro');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (108, 7.0, 'Cognizant');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (110, 8.5, 'Microsoft');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (114, 9.0, 'Google India');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (116, 6.0, 'Amazon');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (118, 7.5, 'Cisco');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (120, 8.0, 'IBM');
INSERT INTO Experienced (cand_id, total_exp, current_company) VALUES (124, 9.5, 'Intel');

-- ------------------------------------------------------------
-- 12. COMPANY DATA (COMP001 - COMP008)
-- ------------------------------------------------------------
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP001', 'IT Services', 500);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP002', 'Data Analytics', 300);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP003', 'Product Design', 120);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP004', 'Enterprise S/W', 450);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP005', 'Cloud Infrastructure', 800);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP006', 'Cybersecurity Solutions', 250);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP007', 'Fintech Products', 350);
INSERT INTO Company (comp_id, comp_type, emp_count) VALUES ('COMP008', 'AI Research Lab', 180);

INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP001', 'E001');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP002', 'E002');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP003', 'E003');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP004', 'E004');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP001', 'E005');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP005', 'E006');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP006', 'E007');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP007', 'E008');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP008', 'E009');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP001', 'E010');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP004', 'E011');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP005', 'E012');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP002', 'E013');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP003', 'E014');
INSERT INTO Company_Employer (comp_id, emp_id) VALUES ('COMP005', 'E015');

-- ------------------------------------------------------------
-- 13. RECRUITMENT AGENCY & LICENSE DATA
-- ------------------------------------------------------------
INSERT INTO Recruitment_Agency (agency_no, agency_name) VALUES ('AG001', 'Talent Bridge Global');
INSERT INTO Recruitment_Agency (agency_no, agency_name) VALUES ('AG002', 'Apex Hire Consultants');
INSERT INTO Recruitment_Agency (agency_no, agency_name) VALUES ('AG003', 'CareerPoint Staffing');
INSERT INTO Recruitment_Agency (agency_no, agency_name) VALUES ('AG004', 'TechElite Search Partners');
INSERT INTO Recruitment_Agency (agency_no, agency_name) VALUES ('AG005', 'CloudStaff Executive');

INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E001', 'LIC-4101-KAR');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E002', 'LIC-4102-MAH');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E003', 'LIC-4103-DEL');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E004', 'LIC-4104-TN');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E005', 'LIC-4105-TS');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E006', 'LIC-4106-KAR');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E007', 'LIC-4107-MAH');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E008', 'LIC-4108-MAH');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E009', 'LIC-4109-KAR');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E010', 'LIC-4110-TS');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E011', 'LIC-4111-HAR');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E012', 'LIC-4112-TN');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E013', 'LIC-4113-UP');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E014', 'LIC-4114-GUJ');
INSERT INTO Recruitment_License (emp_id, lic_no) VALUES ('E015', 'LIC-4115-KAR');

INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E001', 'AG001');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E002', 'AG002');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E003', 'AG003');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E004', 'AG001');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E005', 'AG003');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E006', 'AG004');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E007', 'AG002');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E008', 'AG005');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E009', 'AG004');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E010', 'AG001');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E011', 'AG003');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E012', 'AG002');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E013', 'AG005');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E014', 'AG001');
INSERT INTO Recruitment (emp_id, agency_no) VALUES ('E015', 'AG004');

-- ------------------------------------------------------------
-- 14. RELATIONSHIP DATA (Requires, Matched_To, Applies, Prefers, Refers, Assessed_For, Has)
-- ------------------------------------------------------------
-- Requires
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (1, 'S001', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (1, 'S002', 'Y', 1);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (2, 'S002', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (3, 'S003', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (4, 'S004', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (5, 'S005', 'N', 1);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (6, 'S008', 'Y', 4);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (6, 'S010', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (7, 'S006', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (7, 'S011', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (8, 'S009', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (8, 'S010', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (9, 'S004', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (10, 'S013', 'Y', 4);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (10, 'S004', 'Y', 4);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (11, 'S012', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (12, 'S007', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (12, 'S002', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (13, 'S003', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (14, 'S014', 'Y', 5);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (14, 'S005', 'Y', 4);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (15, 'S006', 'Y', 2);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (16, 'S006', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (16, 'S007', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (18, 'S015', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (18, 'S004', 'Y', 3);
INSERT INTO Requires (job_key, skill_id, is_mandatory, min_years) VALUES (20, 'S008', 'Y', 4);

-- Matched_To
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (101, 1, 'M001', DATE '2026-08-10');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (102, 2, 'M002', DATE '2026-08-11');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (103, 3, 'M003', DATE '2026-08-12');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (104, 4, 'M004', DATE '2026-08-13');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (105, 5, 'M005', DATE '2026-08-14');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (106, 6, 'M006', DATE '2026-08-15');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (107, 7, 'M007', DATE '2026-08-16');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (108, 8, 'M008', DATE '2026-08-17');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (109, 9, 'M009', DATE '2026-08-18');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (110, 10, 'M010', DATE '2026-08-19');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (111, 11, 'M011', DATE '2026-08-20');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (112, 12, 'M012', DATE '2026-08-21');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (113, 13, 'M013', DATE '2026-08-22');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (114, 14, 'M014', DATE '2026-08-23');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (115, 15, 'M015', DATE '2026-08-24');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (116, 16, 'M016', DATE '2026-08-25');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (117, 17, 'M017', DATE '2026-08-26');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (118, 18, 'M018', DATE '2026-08-27');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (119, 19, 'M019', DATE '2026-08-28');
INSERT INTO Matched_To (cand_id, job_key, match_id, match_date) VALUES (120, 20, 'M020', DATE '2026-08-29');

-- Applies
INSERT INTO Applies (cand_id, job_key) VALUES (101, 1);
INSERT INTO Applies (cand_id, job_key) VALUES (102, 2);
INSERT INTO Applies (cand_id, job_key) VALUES (103, 3);
INSERT INTO Applies (cand_id, job_key) VALUES (104, 4);
INSERT INTO Applies (cand_id, job_key) VALUES (105, 5);
INSERT INTO Applies (cand_id, job_key) VALUES (106, 6);
INSERT INTO Applies (cand_id, job_key) VALUES (107, 7);
INSERT INTO Applies (cand_id, job_key) VALUES (108, 8);
INSERT INTO Applies (cand_id, job_key) VALUES (109, 9);
INSERT INTO Applies (cand_id, job_key) VALUES (110, 10);
INSERT INTO Applies (cand_id, job_key) VALUES (111, 11);
INSERT INTO Applies (cand_id, job_key) VALUES (112, 12);
INSERT INTO Applies (cand_id, job_key) VALUES (113, 13);
INSERT INTO Applies (cand_id, job_key) VALUES (114, 14);
INSERT INTO Applies (cand_id, job_key) VALUES (115, 15);
INSERT INTO Applies (cand_id, job_key) VALUES (116, 16);
INSERT INTO Applies (cand_id, job_key) VALUES (117, 17);
INSERT INTO Applies (cand_id, job_key) VALUES (118, 18);
INSERT INTO Applies (cand_id, job_key) VALUES (119, 19);
INSERT INTO Applies (cand_id, job_key) VALUES (120, 20);
INSERT INTO Applies (cand_id, job_key) VALUES (121, 7);
INSERT INTO Applies (cand_id, job_key) VALUES (122, 12);
INSERT INTO Applies (cand_id, job_key) VALUES (123, 16);
INSERT INTO Applies (cand_id, job_key) VALUES (124, 6);
INSERT INTO Applies (cand_id, job_key) VALUES (125, 10);

-- Prefers
INSERT INTO Prefers (pincode, cand_id) VALUES (560001, 101);
INSERT INTO Prefers (pincode, cand_id) VALUES (560001, 102);
INSERT INTO Prefers (pincode, cand_id) VALUES (400001, 103);
INSERT INTO Prefers (pincode, cand_id) VALUES (400001, 104);
INSERT INTO Prefers (pincode, cand_id) VALUES (110001, 105);
INSERT INTO Prefers (pincode, cand_id) VALUES (560001, 106);
INSERT INTO Prefers (pincode, cand_id) VALUES (110001, 107);
INSERT INTO Prefers (pincode, cand_id) VALUES (411001, 108);
INSERT INTO Prefers (pincode, cand_id) VALUES (600001, 109);
INSERT INTO Prefers (pincode, cand_id) VALUES (500001, 110);
INSERT INTO Prefers (pincode, cand_id) VALUES (682001, 111);
INSERT INTO Prefers (pincode, cand_id) VALUES (400001, 112);
INSERT INTO Prefers (pincode, cand_id) VALUES (360001, 113);
INSERT INTO Prefers (pincode, cand_id) VALUES (560001, 114);
INSERT INTO Prefers (pincode, cand_id) VALUES (411001, 115);
INSERT INTO Prefers (pincode, cand_id) VALUES (302001, 116);
INSERT INTO Prefers (pincode, cand_id) VALUES (500001, 117);
INSERT INTO Prefers (pincode, cand_id) VALUES (110001, 118);
INSERT INTO Prefers (pincode, cand_id) VALUES (400001, 119);
INSERT INTO Prefers (pincode, cand_id) VALUES (700001, 120);
INSERT INTO Prefers (pincode, cand_id) VALUES (201301, 121);
INSERT INTO Prefers (pincode, cand_id) VALUES (700001, 122);
INSERT INTO Prefers (pincode, cand_id) VALUES (560001, 123);
INSERT INTO Prefers (pincode, cand_id) VALUES (122001, 124);
INSERT INTO Prefers (pincode, cand_id) VALUES (600001, 125);

-- Refers
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (101, DATE '2025-08-05', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (102, DATE '2025-08-06', 'Pending');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (103, DATE '2025-08-07', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (104, DATE '2025-08-08', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (105, DATE '2025-08-09', 'Rejected');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (106, DATE '2025-08-10', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (107, DATE '2025-08-11', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (108, DATE '2025-08-12', 'Pending');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (110, DATE '2025-08-14', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (114, DATE '2025-08-16', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (116, DATE '2025-08-18', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (118, DATE '2025-08-20', 'Accepted');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (120, DATE '2025-08-22', 'Pending');
INSERT INTO Refers (cand_id, referral_date, referral_status) VALUES (124, DATE '2025-08-24', 'Accepted');

-- Assessed_For
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (101, 1, 'S001', 92.00, DATE '2026-08-15', 90.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (102, 2, 'S002', 85.50, DATE '2026-08-16', 82.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (103, 3, 'S003', 88.00, DATE '2026-08-17', 86.50);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (104, 4, 'S004', 79.00, DATE '2026-08-18', 78.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (105, 5, 'S005', 75.00, DATE '2026-08-19', 74.50);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (106, 6, 'S008', 95.00, DATE '2026-08-20', 94.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (107, 7, 'S006', 91.00, DATE '2026-08-21', 89.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (108, 8, 'S010', 88.50, DATE '2026-08-22', 87.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (109, 9, 'S004', 82.00, DATE '2026-08-23', 80.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (110, 10, 'S013', 96.00, DATE '2026-08-24', 95.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (111, 11, 'S012', 74.00, DATE '2026-08-25', 72.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (112, 12, 'S007', 89.00, DATE '2026-08-26', 88.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (113, 13, 'S003', 86.00, DATE '2026-08-27', 85.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (114, 14, 'S014', 98.00, DATE '2026-08-28', 97.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (115, 15, 'S006', 84.00, DATE '2026-08-29', 83.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (116, 16, 'S007', 93.00, DATE '2026-08-30', 92.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (117, 17, 'S001', 76.00, DATE '2026-08-31', 75.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (118, 18, 'S015', 94.00, DATE '2026-09-01', 93.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (119, 19, 'S002', 87.00, DATE '2026-09-02', 86.00);
INSERT INTO Assessed_For (cand_id, job_key, skill_id, match_per, ass_date, ass_score)
VALUES (120, 20, 'S008', 92.00, DATE '2026-09-03', 91.00);

-- Has (Candidate Skills)
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (101, 'S001', 'Advanced', 5.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (101, 'S002', 'Advanced', 4.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (102, 'S002', 'Intermediate', 3.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (103, 'S001', 'Advanced', 5.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (103, 'S003', 'Intermediate', 3.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (104, 'S004', 'Advanced', 3.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (105, 'S005', 'Intermediate', 4.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (106, 'S008', 'Expert', 6.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (106, 'S010', 'Advanced', 4.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (107, 'S006', 'Advanced', 3.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (107, 'S011', 'Advanced', 3.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (108, 'S009', 'Expert', 5.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (108, 'S010', 'Expert', 5.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (109, 'S004', 'Intermediate', 2.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (110, 'S013', 'Expert', 7.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (110, 'S004', 'Expert', 7.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (111, 'S012', 'Intermediate', 2.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (112, 'S007', 'Advanced', 4.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (112, 'S002', 'Advanced', 4.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (113, 'S003', 'Advanced', 3.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (114, 'S014', 'Expert', 8.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (114, 'S005', 'Expert', 7.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (115, 'S006', 'Intermediate', 2.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (116, 'S006', 'Advanced', 4.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (116, 'S007', 'Advanced', 4.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (117, 'S001', 'Intermediate', 2.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (118, 'S015', 'Expert', 6.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (118, 'S004', 'Advanced', 5.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (119, 'S002', 'Advanced', 3.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (120, 'S008', 'Expert', 7.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (121, 'S006', 'Intermediate', 2.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (122, 'S007', 'Advanced', 4.0);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (123, 'S011', 'Advanced', 3.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (124, 'S008', 'Expert', 8.5);
INSERT INTO Has (cand_id, skill_id, pgd_level, years_of_exp) VALUES (125, 'S013', 'Intermediate', 2.0);

-- ------------------------------------------------------------
-- 15. DEFAULT APPLICATION USERS (BCrypt hashed passwords)
-- recruiter       -> User@123
-- designer        -> Designer@123
-- dba_admin       -> Dba@123
-- ------------------------------------------------------------
INSERT INTO APP_USERS (username, password_hash, full_name, email, role, is_active)
VALUES ('recruiter', '$2a$10$7Z/lFv2w0zU7oQoX1V1Y8.xX7h6Gg8Z2Z2uT7bH6n8mP4rV5xQ5K.', 'Alex Mercer (Recruitment Lead)', 'alex.recruiter@jrms.org', 'USER', 1);

INSERT INTO APP_USERS (username, password_hash, full_name, email, role, is_active)
VALUES ('designer', '$2a$10$7Z/lFv2w0zU7oQoX1V1Y8.xX7h6Gg8Z2Z2uT7bH6n8mP4rV5xQ5K.', 'Dr. Elena Rostova (Schema Architect)', 'elena.designer@jrms.org', 'DATABASE_DESIGNER', 1);

INSERT INTO APP_USERS (username, password_hash, full_name, email, role, is_active)
VALUES ('dba_admin', '$2a$10$7Z/lFv2w0zU7oQoX1V1Y8.xX7h6Gg8Z2Z2uT7bH6n8mP4rV5xQ5K.', 'Marcus Vance (Chief DBA)', 'marcus.dba@jrms.org', 'DBA', 1);

-- Initial Audit Log Entries
INSERT INTO APP_AUDIT_LOG (username, role, action, details, ip_address)
VALUES ('SYSTEM', 'DBA', 'SCHEMA_INITIALIZATION', 'Database schema created with 41 normalized BCNF tables and security tables', '127.0.0.1');

INSERT INTO APP_AUDIT_LOG (username, role, action, details, ip_address)
VALUES ('SYSTEM', 'DBA', 'COMPREHENSIVE_SEED_LOADED', '25 Candidates, 20 Jobs, 25 Applications, 25 Interviews, 15 Employers, 15 Skills loaded into Oracle', '127.0.0.1');

COMMIT;
