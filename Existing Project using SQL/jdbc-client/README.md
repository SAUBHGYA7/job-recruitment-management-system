# Job Recruitment Management System - Oracle JDBC Client

Enterprise-grade Java JDBC client for the **Job Recruitment Management System (JRMS)**, implementing direct relational connectivity to **Oracle Database 23ai / 23c Free** via the official Oracle Thin Driver (`ojdbc11`).

---

## 📌 Architecture & Design

While the web frontend and API tier use React and Node.js (`oracledb` Thin Driver), this JDBC subsystem provides a dedicated, native Java enterprise persistence module adhering strictly to the BCNF-decomposed 41-table academic schema.

### Key Capabilities
- **Official Oracle JDBC Thin Driver (`ojdbc11`)**: Direct TCP/IP socket connection to Oracle PDB without requiring Oracle Client binaries or OCI native libraries.
- **Data Access Objects (DAOs)**:
  - `CandidateDAO`: Atomic multi-table transactions across `Candidate`, `Candidate_Address`, `Candidate_Email`, `Candidate_Phone`.
  - `JobDAO`: Relational joins and CRUD across `Job`, `Job_Details`, and `Job_Posting`.
  - `EmployerDAO`: Operations across `Employer`, `Employer_Details`, `Employer_Phone`.
  - `SkillDAO`: Operations across `Skill`, `Skill_Details`, `Requires`, and `Has`.
  - `SchemaDAO`: Oracle Data Dictionary introspection (`USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS`) and dynamic read-only SQL execution.
- **ACID Compliance**: Multi-table updates utilize explicit transaction demarcation (`setAutoCommit(false)`, `commit()`, and `rollback()` on exceptions).
- **SQL Injection Prevention**: All queries use parameterized `PreparedStatement` with typed bind variables.
- **Environment Driven**: Automatically loads configuration from `backend/.env` or system environment variables.

---

## 🛠️ Prerequisites

- **Java Development Kit (JDK)**: Java 17 or higher (tested with JDK 26)
- **Apache Maven**: Version 3.8+ (optional, bundled jar execution supported)
- **Oracle Database**: Oracle 23c/23ai Free instance running locally on `localhost:1521/FREEPDB1`

---

## 🚀 How to Run

### Option 1: Automated Verification Suite (Non-interactive)
Runs an end-to-end 7-step test verifying connection, data dictionary catalog, full CRUD lifecycles for Candidates, Jobs, Employers, and Skills, and dynamic SQL querying:

```powershell
# From the project root:
.\run-jdbc.ps1 --test

# Or using npm:
npm run jdbc:test

# Or directly from the jdbc-client directory:
cd jdbc-client
java -cp "target/classes;lib/ojdbc11.jar" com.jrms.jdbc.Main --test
```

### Option 2: Interactive Terminal Console (CLI Menu)
Provides an interactive menu for Recruiters, DB Designers, and DBAs:

```powershell
# From the project root:
.\run-jdbc.ps1

# Or using batch script:
.\run-jdbc.bat

# Or using npm:
npm run jdbc:cli

# Or directly:
cd jdbc-client
java -cp "target/classes;lib/ojdbc11.jar" com.jrms.jdbc.Main
```

### Option 3: Compile with Maven
```powershell
cd jdbc-client
mvn clean compile
mvn exec:java -Dexec.mainClass="com.jrms.jdbc.Main"
```

---

## 📂 Source Code Structure

```
jdbc-client/
├── pom.xml                                      # Maven project configuration
├── README.md                                    # This documentation
├── lib/
│   └── ojdbc11.jar                              # Oracle JDBC Driver 23c (ojdbc11)
└── src/main/java/com/jrms/jdbc/
    ├── DatabaseManager.java                     # Connection manager & .env parser
    ├── CandidateDAO.java                        # Candidate multi-table transactions
    ├── JobDAO.java                              # Job & Job Details DAO
    ├── EmployerDAO.java                         # Employer entity DAO
    ├── SkillDAO.java                            # Skill & Skill Requirements DAO
    ├── SchemaDAO.java                           # Oracle USER_TABLES metadata & SQL runner
    └── Main.java                                # Interactive CLI & automated test suite
```

---

## ⚙️ Connection Configuration

The JDBC driver resolves connection parameters in the following priority:
1. Environment variables (`ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`, etc.)
2. `backend/.env` file
3. Default fallbacks:
   - **URL:** `jdbc:oracle:thin:@//localhost:1521/FREEPDB1`
   - **User:** `system`
   - **Password:** `oracle`
