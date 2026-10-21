package com.jrms.jdbc;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object implementing Candidate-related CRUD and queries via JDBC.
 * Handles Candidate and decomposed BCNF tables (Candidate_Address, Candidate_Email, Candidate_Phone).
 */
public class CandidateDAO {

    public static class CandidateDTO {
        public int candId;
        public String fname;
        public String mname;
        public String lname;
        public String dob;
        public String gender;
        public String regDate;
        public String city;
        public String email;
        public String phone;

        @Override
        public String toString() {
            return String.format("Candidate #%-3d | %-20s | %-6s | %-10s | %-15s | %s",
                    candId, fname + " " + (mname != null ? mname + " " : "") + lname,
                    gender, dob, (city != null ? city : "N/A"), (email != null ? email : "N/A"));
        }
    }

    /**
     * Retrieves all candidates joining decomposed BCNF tables via JDBC PreparedStatement.
     */
    public List<CandidateDTO> getAllCandidates() throws SQLException {
        List<CandidateDTO> list = new ArrayList<>();
        String sql = "SELECT c.cand_id, c.fname, c.mname, c.lname, " +
                     "       TO_CHAR(c.dob, 'YYYY-MM-DD') AS dob_str, c.gender, " +
                     "       TO_CHAR(c.reg_date, 'YYYY-MM-DD') AS reg_date_str, " +
                     "       ca.city, ce.email, cp.phone " +
                     "FROM Candidate c " +
                     "LEFT JOIN Candidate_Address ca ON ca.cand_id = c.cand_id " +
                     "LEFT JOIN (SELECT cand_id, MIN(email) AS email FROM Candidate_Email GROUP BY cand_id) ce ON ce.cand_id = c.cand_id " +
                     "LEFT JOIN (SELECT cand_id, MIN(phone) AS phone FROM Candidate_Phone GROUP BY cand_id) cp ON cp.cand_id = c.cand_id " +
                     "ORDER BY c.cand_id ASC";

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                CandidateDTO dto = new CandidateDTO();
                dto.candId = rs.getInt("cand_id");
                dto.fname = rs.getString("fname");
                dto.mname = rs.getString("mname");
                dto.lname = rs.getString("lname");
                dto.dob = rs.getString("dob_str");
                dto.gender = rs.getString("gender");
                dto.regDate = rs.getString("reg_date_str");
                dto.city = rs.getString("city");
                dto.email = rs.getString("email");
                dto.phone = rs.getString("phone");
                list.add(dto);
            }
        }
        return list;
    }

    /**
     * Inserts a candidate record using parameterized JDBC PreparedStatement.
     */
    public int insertCandidate(int candId, String fname, String mname, String lname,
                               String dob, String gender, String city, String email, String phone) throws SQLException {
        String insertCandSql = "INSERT INTO Candidate (cand_id, fname, mname, lname, dob, gender, reg_date) " +
                              "VALUES (?, ?, ?, ?, TO_DATE(?, 'YYYY-MM-DD'), ?, SYSDATE)";
        String insertAddrSql = "INSERT INTO Candidate_Address (cand_id, city) VALUES (?, ?)";
        String insertEmailSql = "INSERT INTO Candidate_Email (cand_id, email) VALUES (?, ?)";
        String insertPhoneSql = "INSERT INTO Candidate_Phone (cand_id, phone) VALUES (?, ?)";

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(insertCandSql)) {
                    ps.setInt(1, candId);
                    ps.setString(2, fname);
                    ps.setString(3, mname != null && !mname.isEmpty() ? mname : null);
                    ps.setString(4, lname);
                    ps.setString(5, dob);
                    ps.setString(6, gender);
                    ps.executeUpdate();
                }

                if (city != null && !city.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(insertAddrSql)) {
                        ps.setInt(1, candId);
                        ps.setString(2, city);
                        ps.executeUpdate();
                    }
                }

                if (email != null && !email.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(insertEmailSql)) {
                        ps.setInt(1, candId);
                        ps.setString(2, email);
                        ps.executeUpdate();
                    }
                }

                if (phone != null && !phone.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(insertPhoneSql)) {
                        ps.setInt(1, candId);
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

    /**
     * Updates candidate details via parameterized JDBC statement.
     */
    public int updateCandidate(int candId, String fname, String lname, String gender) throws SQLException {
        String sql = "UPDATE Candidate SET fname = ?, lname = ?, gender = ? WHERE cand_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fname);
            ps.setString(2, lname);
            ps.setString(3, gender);
            ps.setInt(4, candId);
            return ps.executeUpdate();
        }
    }

    /**
     * Deletes candidate and cascades cleanup on decomposed tables.
     */
    public int deleteCandidate(int candId) throws SQLException {
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Candidate_Email WHERE cand_id = ?")) {
                    ps.setInt(1, candId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Candidate_Phone WHERE cand_id = ?")) {
                    ps.setInt(1, candId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Candidate_Address WHERE cand_id = ?")) {
                    ps.setInt(1, candId);
                    ps.executeUpdate();
                }
                int rows;
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Candidate WHERE cand_id = ?")) {
                    ps.setInt(1, candId);
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

    /**
     * Fetches the next available cand_id via JDBC.
     */
    public int getNextCandidateId() throws SQLException {
        String sql = "SELECT NVL(MAX(cand_id), 100) + 1 AS next_id FROM Candidate";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getInt("next_id");
            }
            return 101;
        }
    }
}
