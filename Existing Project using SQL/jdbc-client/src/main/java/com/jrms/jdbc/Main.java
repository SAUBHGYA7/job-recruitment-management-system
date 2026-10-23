package com.jrms.jdbc;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.List;
import java.util.Scanner;

/**
 * Main Entry Point for JRMS Oracle JDBC Client.
 * Demonstrates:
 * 1. Oracle JDBC Driver registration and thin connection pool.
 * 2. Database metadata introspection (Product Name, Version, Driver).
 * 3. Interactive CLI for CRUD operations across Candidates, Jobs, Employers, Skills.
 * 4. Data dictionary explorer and SQL Query Console via JDBC.
 */
public class Main {

    private static final CandidateDAO candidateDAO = new CandidateDAO();
    private static final JobDAO jobDAO = new JobDAO();
    private static final EmployerDAO employerDAO = new EmployerDAO();
    private static final SkillDAO skillDAO = new SkillDAO();
    private static final SchemaDAO schemaDAO = new SchemaDAO();

    public static void main(String[] args) {
        System.out.println("==================================================================");
        System.out.println("   Job Recruitment Management System (JRMS) - Oracle JDBC Client   ");
        System.out.println("   Academic Relational Database Management System (DA1 / DA2)      ");
        System.out.println("==================================================================");

        // Test connection on startup
        try (Connection conn = DatabaseManager.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            System.out.println("[JDBC SUCCESS] Connected to Oracle Database successfully!");
            System.out.println("  * JDBC URL:        " + DatabaseManager.getJdbcUrl());
            System.out.println("  * Database User:   " + DatabaseManager.getUsername());
            System.out.println("  * RDBMS Product:   " + meta.getDatabaseProductName() + " " + meta.getDatabaseProductVersion());
            System.out.println("  * JDBC Driver:     " + meta.getDriverName() + " (v" + meta.getDriverVersion() + ")");
            System.out.println("==================================================================\n");
        } catch (SQLException e) {
            System.err.println("[JDBC ERROR] Failed to connect to Oracle Database: " + e.getMessage());
            System.err.println("Please ensure Oracle Database is running on " + DatabaseManager.getJdbcUrl());
            System.err.println("Continuing in offline test mode...\n");
        }

        // If automated arguments passed (e.g. for testing)
        if (args.length > 0 && "--test".equalsIgnoreCase(args[0])) {
            runAutomatedSelfTest();
            return;
        }

        Scanner scanner = new Scanner(System.in);
        while (true) {
            printMainMenu();
            System.out.print("Enter selection (1-8, 0 to exit): ");
            String input = scanner.nextLine().trim();

            if ("0".equals(input) || "exit".equalsIgnoreCase(input) || "q".equalsIgnoreCase(input)) {
                System.out.println("Exiting JRMS JDBC Client. Goodbye!");
                break;
            }

            try {
                switch (input) {
                    case "1":
                        handleCandidateMenu(scanner);
                        break;
                    case "2":
                        handleJobMenu(scanner);
                        break;
                    case "3":
                        handleEmployerMenu(scanner);
                        break;
                    case "4":
                        handleSkillMenu(scanner);
                        break;
                    case "5":
                        handleSchemaCatalog();
                        break;
                    case "6":
                        handleSqlConsole(scanner);
                        break;
                    case "7":
                        runAutomatedSelfTest();
                        break;
                    case "8":
                        testConnectionOnly();
                        break;
                    default:
                        System.out.println("Invalid selection. Please choose an option between 0 and 8.");
                }
            } catch (Exception e) {
                System.err.println("[Operation Error] " + e.getMessage());
            }
            System.out.println();
        }
    }

    private static void printMainMenu() {
        System.out.println("------------------------- MAIN MENU -------------------------");
        System.out.println("  1. Candidate Management (JDBC CRUD)");
        System.out.println("  2. Job Postings Management (JDBC CRUD)");
        System.out.println("  3. Employer & Company Directory (JDBC CRUD)");
        System.out.println("  4. Skill Taxonomy Management (JDBC CRUD)");
        System.out.println("  5. Database Schema Catalog (USER_TABLES via JDBC)");
        System.out.println("  6. DBA SQL Console (Execute SELECT via JDBC)");
        System.out.println("  7. Run Full Automated JDBC Verification Test");
        System.out.println("  8. Test Oracle JDBC Connection Status");
        System.out.println("  0. Exit");
        System.out.println("-------------------------------------------------------------");
    }

    private static void handleCandidateMenu(Scanner scanner) throws SQLException {
        System.out.println("\n--- CANDIDATE MANAGEMENT (JDBC) ---");
        System.out.println("1. List All Candidates");
        System.out.println("2. Add New Candidate");
        System.out.println("3. Update Candidate");
        System.out.println("4. Delete Candidate");
        System.out.print("Option: ");
        String op = scanner.nextLine().trim();

        if ("1".equals(op)) {
            List<CandidateDAO.CandidateDTO> list = candidateDAO.getAllCandidates();
            System.out.println("\nFound " + list.size() + " candidates in Oracle:");
            for (CandidateDAO.CandidateDTO c : list) {
                System.out.println("  " + c);
            }
        } else if ("2".equals(op)) {
            int nextId = candidateDAO.getNextCandidateId();
            System.out.println("Adding candidate with generated ID: " + nextId);
            System.out.print("First Name: "); String fname = scanner.nextLine().trim();
            System.out.print("Middle Name (optional): "); String mname = scanner.nextLine().trim();
            System.out.print("Last Name: "); String lname = scanner.nextLine().trim();
            System.out.print("DOB (YYYY-MM-DD): "); String dob = scanner.nextLine().trim();
            System.out.print("Gender (Male/Female): "); String gender = scanner.nextLine().trim();
            System.out.print("City: "); String city = scanner.nextLine().trim();
            System.out.print("Email: "); String email = scanner.nextLine().trim();
            System.out.print("Phone: "); String phone = scanner.nextLine().trim();

            int rows = candidateDAO.insertCandidate(nextId, fname, mname, lname, dob, gender, city, email, phone);
            System.out.println("[JDBC Success] Inserted candidate #" + nextId + " (" + rows + " row(s) affected).");
        } else if ("3".equals(op)) {
            System.out.print("Enter Candidate ID to update: ");
            int id = Integer.parseInt(scanner.nextLine().trim());
            System.out.print("New First Name: "); String fname = scanner.nextLine().trim();
            System.out.print("New Last Name: "); String lname = scanner.nextLine().trim();
            System.out.print("New Gender: "); String gender = scanner.nextLine().trim();

            int rows = candidateDAO.updateCandidate(id, fname, lname, gender);
            System.out.println("[JDBC Success] Candidate #" + id + " updated (" + rows + " row(s) affected).");
        } else if ("4".equals(op)) {
            System.out.print("Enter Candidate ID to delete: ");
            int id = Integer.parseInt(scanner.nextLine().trim());
            int rows = candidateDAO.deleteCandidate(id);
            System.out.println("[JDBC Success] Candidate #" + id + " deleted (" + rows + " row(s) affected).");
        }
    }

    private static void handleJobMenu(Scanner scanner) throws SQLException {
        System.out.println("\n--- JOB POSTINGS MANAGEMENT (JDBC) ---");
        System.out.println("1. List All Jobs");
        System.out.println("2. Create New Job");
        System.out.println("3. Update Job Status / Salary");
        System.out.println("4. Delete Job");
        System.out.print("Option: ");
        String op = scanner.nextLine().trim();

        if ("1".equals(op)) {
            List<JobDAO.JobDTO> list = jobDAO.getAllJobs();
            System.out.println("\nFound " + list.size() + " jobs in Oracle:");
            for (JobDAO.JobDTO j : list) {
                System.out.println("  " + j);
            }
        } else if ("2".equals(op)) {
            int nextKey = jobDAO.getNextJobKey();
            String jobId = "J" + String.format("%03d", nextKey);
            System.out.print("Job Title: "); String title = scanner.nextLine().trim();
            System.out.print("Status (Open/Closed): "); String status = scanner.nextLine().trim();
            System.out.print("Salary (INR): "); double salary = Double.parseDouble(scanner.nextLine().trim());
            System.out.print("Description: "); String desc = scanner.nextLine().trim();
            System.out.print("Closing Date (YYYY-MM-DD): "); String closing = scanner.nextLine().trim();

            jobDAO.insertJob(nextKey, jobId, status, salary, title, desc, closing);
            System.out.println("[JDBC Success] Job #" + nextKey + " (" + jobId + ") created successfully.");
        } else if ("3".equals(op)) {
            System.out.print("Enter Job Key to update: ");
            int key = Integer.parseInt(scanner.nextLine().trim());
            System.out.print("New Status (Open/Closed): "); String status = scanner.nextLine().trim();
            System.out.print("New Salary: "); double salary = Double.parseDouble(scanner.nextLine().trim());

            int rows = jobDAO.updateJobStatusAndSalary(key, status, salary);
            System.out.println("[JDBC Success] Job #" + key + " updated (" + rows + " row(s) affected).");
        } else if ("4".equals(op)) {
            System.out.print("Enter Job Key to delete: ");
            int key = Integer.parseInt(scanner.nextLine().trim());
            int rows = jobDAO.deleteJob(key);
            System.out.println("[JDBC Success] Job #" + key + " deleted (" + rows + " row(s) affected).");
        }
    }

    private static void handleEmployerMenu(Scanner scanner) throws SQLException {
        System.out.println("\n--- EMPLOYER DIRECTORY (JDBC) ---");
        System.out.println("1. List All Employers");
        System.out.println("2. Add New Employer");
        System.out.println("3. Update Employer");
        System.out.println("4. Delete Employer");
        System.out.print("Option: ");
        String op = scanner.nextLine().trim();

        if ("1".equals(op)) {
            List<EmployerDAO.EmployerDTO> list = employerDAO.getAllEmployers();
            System.out.println("\nFound " + list.size() + " employers in Oracle:");
            for (EmployerDAO.EmployerDTO e : list) {
                System.out.println("  " + e);
            }
        } else if ("2".equals(op)) {
            String nextId = employerDAO.getNextEmployerId();
            System.out.print("Company Name: "); String name = scanner.nextLine().trim();
            System.out.print("Founded Year: "); int year = Integer.parseInt(scanner.nextLine().trim());
            System.out.print("Headquarter City: "); String hq = scanner.nextLine().trim();
            System.out.print("Email: "); String email = scanner.nextLine().trim();
            System.out.print("Website: "); String web = scanner.nextLine().trim();
            System.out.print("Phone: "); String phone = scanner.nextLine().trim();

            employerDAO.insertEmployer(nextId, name, year, email, web, hq, phone);
            System.out.println("[JDBC Success] Employer #" + nextId + " (" + name + ") created.");
        } else if ("3".equals(op)) {
            System.out.print("Enter Employer ID (e.g. E001): "); String id = scanner.nextLine().trim();
            System.out.print("New Company Name: "); String name = scanner.nextLine().trim();
            System.out.print("New Founded Year: "); int year = Integer.parseInt(scanner.nextLine().trim());
            System.out.print("New Headquarter City: "); String hq = scanner.nextLine().trim();

            int rows = employerDAO.updateEmployer(id, name, year, hq);
            System.out.println("[JDBC Success] Employer " + id + " updated (" + rows + " row(s) affected).");
        } else if ("4".equals(op)) {
            System.out.print("Enter Employer ID to delete (e.g. E001): "); String id = scanner.nextLine().trim();
            int rows = employerDAO.deleteEmployer(id);
            System.out.println("[JDBC Success] Employer " + id + " deleted (" + rows + " row(s) affected).");
        }
    }

    private static void handleSkillMenu(Scanner scanner) throws SQLException {
        System.out.println("\n--- SKILL TAXONOMY (JDBC) ---");
        System.out.println("1. List All Skills");
        System.out.println("2. Add New Skill");
        System.out.println("3. Update Skill Name");
        System.out.println("4. Delete Skill");
        System.out.print("Option: ");
        String op = scanner.nextLine().trim();

        if ("1".equals(op)) {
            List<SkillDAO.SkillDTO> list = skillDAO.getAllSkills();
            System.out.println("\nFound " + list.size() + " skills in Oracle:");
            for (SkillDAO.SkillDTO s : list) {
                System.out.println("  " + s);
            }
        } else if ("2".equals(op)) {
            String nextId = skillDAO.getNextSkillId();
            System.out.print("Skill Name: "); String name = scanner.nextLine().trim();
            System.out.print("Category (Programming, Database, Frontend, etc.): "); String cat = scanner.nextLine().trim();
            System.out.print("Description: "); String desc = scanner.nextLine().trim();

            skillDAO.insertSkill(nextId, name, cat, desc);
            System.out.println("[JDBC Success] Skill #" + nextId + " (" + name + ") created.");
        } else if ("3".equals(op)) {
            System.out.print("Enter Skill ID (e.g. S001): "); String id = scanner.nextLine().trim();
            System.out.print("New Skill Name: "); String name = scanner.nextLine().trim();
            System.out.print("New Category: "); String cat = scanner.nextLine().trim();

            int rows = skillDAO.updateSkill(id, name, cat);
            System.out.println("[JDBC Success] Skill " + id + " updated (" + rows + " row(s) affected).");
        } else if ("4".equals(op)) {
            System.out.print("Enter Skill ID to delete (e.g. S001): "); String id = scanner.nextLine().trim();
            int rows = skillDAO.deleteSkill(id);
            System.out.println("[JDBC Success] Skill " + id + " deleted (" + rows + " row(s) affected).");
        }
    }

    private static void handleSchemaCatalog() throws SQLException {
        System.out.println("\n--- ORACLE DATA DICTIONARY (USER_TABLES via JDBC) ---");
        List<SchemaDAO.TableMetadataDTO> tables = schemaDAO.getTablesCatalog();
        System.out.println("Found " + tables.size() + " tables in current Oracle schema:\n");
        for (SchemaDAO.TableMetadataDTO t : tables) {
            System.out.println("  " + t);
        }
    }

    private static void handleSqlConsole(Scanner scanner) throws SQLException {
        System.out.println("\n--- DBA SQL QUERY CONSOLE (JDBC) ---");
        System.out.println("Enter read-only SELECT query (or 'back' to return):");
        System.out.print("SQL> ");
        String sql = scanner.nextLine().trim();
        if ("back".equalsIgnoreCase(sql) || sql.isEmpty()) return;

        long start = System.currentTimeMillis();
        String output = schemaDAO.executeArbitraryQuery(sql);
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("\nQuery Results (" + elapsed + " ms):");
        System.out.println(output);
    }

    private static void testConnectionOnly() {
        System.out.println("\n--- TESTING JDBC CONNECTION ---");
        try (Connection conn = DatabaseManager.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            System.out.println("Status:          CONNECTED");
            System.out.println("URL:             " + DatabaseManager.getJdbcUrl());
            System.out.println("User:            " + DatabaseManager.getUsername());
            System.out.println("Driver Name:     " + meta.getDriverName());
            System.out.println("Driver Version:  " + meta.getDriverVersion());
            System.out.println("Oracle Database: " + meta.getDatabaseProductName() + " " + meta.getDatabaseProductVersion());
        } catch (SQLException e) {
            System.err.println("Status: FAILED - " + e.getMessage());
        }
    }

    /**
     * Automated verification test to validate all JDBC operations without manual input.
     */
    public static void runAutomatedSelfTest() {
        System.out.println("\n=======================================================");
        System.out.println("      RUNNING AUTOMATED ORACLE JDBC VERIFICATION TEST    ");
        System.out.println("=======================================================");

        int passed = 0;
        int failed = 0;

        // Test 1: Connect
        try (Connection conn = DatabaseManager.getConnection()) {
            System.out.println(" [TEST 1] JDBC Connection: PASSED (" + conn.getMetaData().getDriverName() + ")");
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 1] JDBC Connection: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        // Test 2: Schema Catalog
        try {
            List<SchemaDAO.TableMetadataDTO> tables = schemaDAO.getTablesCatalog();
            System.out.println(" [TEST 2] Schema USER_TABLES Catalog: PASSED (" + tables.size() + " tables found)");
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 2] Schema USER_TABLES Catalog: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        // Test 3: Candidate CRUD
        try {
            int testId = 999;
            candidateDAO.insertCandidate(testId, "JDBC_Test_First", "M", "JDBC_Test_Last",
                    "2000-01-01", "Male", "TestCity", "jdbc_test@example.com", "9999999999");
            candidateDAO.updateCandidate(testId, "JDBC_Updated_First", "JDBC_Updated_Last", "Female");
            candidateDAO.deleteCandidate(testId);
            System.out.println(" [TEST 3] Candidate JDBC CRUD Lifecycle: PASSED");
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 3] Candidate JDBC CRUD Lifecycle: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        // Test 4: Job CRUD
        try {
            int testKey = 999;
            jobDAO.insertJob(testKey, "J999", "Open", 85000, "JDBC Test Engineer", "JDBC Verification", "2026-12-31");
            jobDAO.updateJobStatusAndSalary(testKey, "Closed", 90000);
            jobDAO.deleteJob(testKey);
            System.out.println(" [TEST 4] Job JDBC CRUD Lifecycle: PASSED");
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 4] Job JDBC CRUD Lifecycle: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        // Test 5: Employer CRUD
        try {
            String testId = "E999";
            employerDAO.insertEmployer(testId, "JDBC Test Corp", 2024, "jdbc@test.com", "https://jdbc.test", "Hyderabad", "8888888888");
            employerDAO.updateEmployer(testId, "JDBC Updated Corp", 2025, "Chennai");
            employerDAO.deleteEmployer(testId);
            System.out.println(" [TEST 5] Employer JDBC CRUD Lifecycle: PASSED");
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 5] Employer JDBC CRUD Lifecycle: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        // Test 6: Skill CRUD
        try {
            String testId = "S999";
            skillDAO.insertSkill(testId, "JDBC_Testing_Skill", "Database", "JDBC verification test skill");
            skillDAO.updateSkill(testId, "JDBC_Testing_Skill_V2", "Database Admin");
            skillDAO.deleteSkill(testId);
            System.out.println(" [TEST 6] Skill JDBC CRUD Lifecycle: PASSED");
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 6] Skill JDBC CRUD Lifecycle: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        // Test 7: Arbitrary Query Execution
        try {
            String output = schemaDAO.executeArbitraryQuery("SELECT COUNT(*) AS total_candidates FROM Candidate");
            System.out.println(" [TEST 7] SQL Query Execution via JDBC: PASSED\n" + output.trim());
            passed++;
        } catch (Exception e) {
            System.err.println(" [TEST 7] SQL Query Execution via JDBC: FAILED (" + e.getMessage() + ")");
            failed++;
        }

        System.out.println("=======================================================");
        System.out.println(" TEST RESULTS: " + passed + " PASSED, " + failed + " FAILED");
        System.out.println("=======================================================");
    }
}
