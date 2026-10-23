# Oracle Database Scripts - Job Recruitment Management System

This directory contains the Oracle SQL DDL and DML scripts strictly based on the DA1 relational mapping, functional dependency analysis, and BCNF decomposition decisions.

## Files

1. **`schema.sql`**
   - Safe drop cleanup for all relations.
   - Contains all **41 normalized relations** (Candidate, Job, Education, Application, Experience, Location, Dependent, Interview, Employer, Skill, Subtypes, Company, Recruitment, M:N Relationship tables).
   - Enforces Primary Keys, Foreign Keys with `ON DELETE CASCADE` / `ON DELETE SET NULL`, and Check Constraints (e.g., `is_mandatory IN ('Y', 'N')`, `match_per BETWEEN 0 AND 100`).
   - Includes Security tables `APP_USERS` (with BCrypt password storage) and `APP_AUDIT_LOG` (with auto-incrementing triggers and sequences).

2. **`seed.sql`**
   - Sample data populated directly from DA1 pages 2–9.
   - Preserves candidate entries, education degrees, jobs, applications, interviews, employer contacts, and skill ratings.
   - Seeds default role accounts (`recruiter`, `designer`, `dba_admin`).

## How to Run in Oracle SQL*Plus / SQL Developer

### Option A: Using SQL*Plus CLI
```bash
# Connect to your Oracle database instance
sqlplus system/oracle@localhost:1521/XE

# Run schema creation script
@schema.sql;

# Run sample data seed script
@seed.sql;
```

### Option B: Using Oracle SQL Developer
1. Open Oracle SQL Developer.
2. Create a database connection to your local Oracle instance.
3. Open `database/schema.sql` and click **Run Script (F5)**.
4. Open `database/seed.sql` and click **Run Script (F5)**.
5. Verify tables by running:
   ```sql
   SELECT table_name, num_rows FROM user_tables ORDER BY table_name;
   ```
