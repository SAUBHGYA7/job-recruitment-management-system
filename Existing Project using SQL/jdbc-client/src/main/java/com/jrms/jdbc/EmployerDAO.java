package com.jrms.jdbc;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object implementing Employer-related CRUD via JDBC.
 * Interacts with Employer, Employer_Details, and Employer_Phone tables.
 */
public class EmployerDAO {

    public static class EmployerDTO {
        public String empId;
        public String companyName;
        public int foundedYear;
        public String companyMail;
        public String website;
        public String headquarter;
        public String phones;

        @Override
        public String toString() {
            return String.format("Employer %-5s | %-22s | Founded: %-4d | HQ: %-12s | %s",
                    empId, companyName, foundedYear, (headquarter != null ? headquarter : "N/A"),
                    (companyMail != null ? companyMail : "N/A"));
        }
    }

    public List<EmployerDTO> getAllEmployers() throws SQLException {
        List<EmployerDTO> list = new ArrayList<>();
        String sql = "SELECT e.emp_id, e.company_name, e.founded_year, " +
                     "       ed.company_mail, ed.website, ed.headquarter, " +
                     "       (SELECT LISTAGG(phone_no, ', ') WITHIN GROUP (ORDER BY phone_no) FROM Employer_Phone WHERE emp_id = e.emp_id) AS phones " +
                     "FROM Employer e " +
                     "LEFT JOIN Employer_Details ed ON ed.emp_id = e.emp_id " +
                     "ORDER BY e.emp_id ASC";

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                EmployerDTO dto = new EmployerDTO();
                dto.empId = rs.getString("emp_id");
                dto.companyName = rs.getString("company_name");
                dto.foundedYear = rs.getInt("founded_year");
                dto.companyMail = rs.getString("company_mail");
                dto.website = rs.getString("website");
                dto.headquarter = rs.getString("headquarter");
                dto.phones = rs.getString("phones");
                list.add(dto);
            }
        }
        return list;
    }

    public int insertEmployer(String empId, String companyName, int foundedYear,
                              String companyMail, String website, String headquarter, String phone) throws SQLException {
        String insertEmpSql = "INSERT INTO Employer (emp_id, company_name, founded_year) VALUES (?, ?, ?)";
        String insertDetailsSql = "INSERT INTO Employer_Details (emp_id, company_mail, website, headquarter) VALUES (?, ?, ?, ?)";
        String insertPhoneSql = "INSERT INTO Employer_Phone (emp_id, phone_no) VALUES (?, ?)";

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(insertEmpSql)) {
                    ps.setString(1, empId);
                    ps.setString(2, companyName);
                    ps.setInt(3, foundedYear);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertDetailsSql)) {
                    ps.setString(1, empId);
                    ps.setString(2, companyMail != null ? companyMail : "contact@company.com");
                    ps.setString(3, website != null ? website : "https://company.example.com");
                    ps.setString(4, headquarter != null ? headquarter : "Bengaluru");
                    ps.executeUpdate();
                }

                if (phone != null && !phone.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(insertPhoneSql)) {
                        ps.setString(1, empId);
                        ps.setString(2, phone);
                        ps.executeUpdate();
                    }
                }

                conn.commit();
                return 1;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    public int updateEmployer(String empId, String companyName, int foundedYear, String headquarter) throws SQLException {
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE Employer SET company_name = ?, founded_year = ? WHERE emp_id = ?")) {
                    ps.setString(1, companyName);
                    ps.setInt(2, foundedYear);
                    ps.setString(3, empId);
                    ps.executeUpdate();
                }
                if (headquarter != null) {
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE Employer_Details SET headquarter = ? WHERE emp_id = ?")) {
                        ps.setString(1, headquarter);
                        ps.setString(2, empId);
                        ps.executeUpdate();
                    }
                }
                conn.commit();
                return 1;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    public int deleteEmployer(String empId) throws SQLException {
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Employer_Phone WHERE emp_id = ?")) {
                    ps.setString(1, empId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Employer_Details WHERE emp_id = ?")) {
                    ps.setString(1, empId);
                    ps.executeUpdate();
                }
                int rows;
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Employer WHERE emp_id = ?")) {
                    ps.setString(1, empId);
                    rows = ps.executeUpdate();
                }
                conn.commit();
                return rows;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    public String getNextEmployerId() throws SQLException {
        String sql = "SELECT NVL(MAX(TO_NUMBER(SUBSTR(emp_id, 2))), 0) + 1 AS next_num FROM Employer";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                int nextNum = rs.getInt("next_num");
                return String.format("E%03d", nextNum);
            }
            return "E001";
        }
    }
}
