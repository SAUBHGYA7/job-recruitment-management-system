package com.jrms.jdbc;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object implementing Job-related CRUD via JDBC.
 * Interacts with Job, Job_Details, and Job_Posting BCNF relations.
 */
public class JobDAO {

    public static class JobDTO {
        public int jobKey;
        public String jobId;
        public String jobStatus;
        public double salary;
        public String jobTitle;
        public String descriptive;
        public String closingDate;

        @Override
        public String toString() {
            return String.format("Job #%-2d (%-6s) | %-22s | %-8s | ₹%-9.0f | Closes: %s",
                    jobKey, (jobId != null ? jobId : "N/A"), (jobTitle != null ? jobTitle : "General"),
                    jobStatus, salary, (closingDate != null ? closingDate : "N/A"));
        }
    }

    /**
     * Retrieves all jobs with joined BCNF relations via JDBC.
     */
    public List<JobDTO> getAllJobs() throws SQLException {
        List<JobDTO> list = new ArrayList<>();
        String sql = "SELECT j.job_key, j.job_id, j.job_status, j.salary, " +
                     "       jd.job_title, jd.descriptive, " +
                     "       TO_CHAR(jp.closing_date, 'YYYY-MM-DD') AS closing_date_str " +
                     "FROM Job j " +
                     "LEFT JOIN Job_Details jd ON jd.job_key = j.job_key " +
                     "LEFT JOIN Job_Posting jp ON jp.job_title = jd.job_title " +
                     "ORDER BY j.job_key ASC";

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                JobDTO dto = new JobDTO();
                dto.jobKey = rs.getInt("job_key");
                dto.jobId = rs.getString("job_id");
                dto.jobStatus = rs.getString("job_status");
                dto.salary = rs.getDouble("salary");
                dto.jobTitle = rs.getString("job_title");
                dto.descriptive = rs.getString("descriptive");
                dto.closingDate = rs.getString("closing_date_str");
                list.add(dto);
            }
        }
        return list;
    }

    /**
     * Inserts a job across Job, Job_Details, and Job_Posting using JDBC transaction.
     */
    public int insertJob(int jobKey, String jobId, String jobStatus, double salary,
                         String jobTitle, String descriptive, String closingDate) throws SQLException {
        String insertJobSql = "INSERT INTO Job (job_key, job_id, job_status, salary) VALUES (?, ?, ?, ?)";
        String insertDetailsSql = "INSERT INTO Job_Details (job_key, job_title, descriptive) VALUES (?, ?, ?)";
        String mergePostingSql = "MERGE INTO Job_Posting jp " +
                                 "USING (SELECT ? AS jt, TO_DATE(?, 'YYYY-MM-DD') AS cd FROM dual) src " +
                                 "ON (jp.job_title = src.jt) " +
                                 "WHEN MATCHED THEN UPDATE SET jp.closing_date = src.cd " +
                                 "WHEN NOT MATCHED THEN INSERT (job_title, closing_date, posted_date) VALUES (src.jt, src.cd, SYSDATE)";

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(insertJobSql)) {
                    ps.setInt(1, jobKey);
                    ps.setString(2, jobId);
                    ps.setString(3, jobStatus);
                    ps.setDouble(4, salary);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(insertDetailsSql)) {
                    ps.setInt(1, jobKey);
                    ps.setString(2, jobTitle);
                    ps.setString(3, descriptive != null ? descriptive : "");
                    ps.executeUpdate();
                }

                if (closingDate != null && !closingDate.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(mergePostingSql)) {
                        ps.setString(1, jobTitle);
                        ps.setString(2, closingDate);
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
     * Updates job status and salary.
     */
    public int updateJobStatusAndSalary(int jobKey, String jobStatus, double salary) throws SQLException {
        String sql = "UPDATE Job SET job_status = ?, salary = ? WHERE job_key = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, jobStatus);
            ps.setDouble(2, salary);
            ps.setInt(3, jobKey);
            return ps.executeUpdate();
        }
    }

    /**
     * Deletes job record via JDBC.
     */
    public int deleteJob(int jobKey) throws SQLException {
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Requires WHERE job_key = ?")) {
                    ps.setInt(1, jobKey);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Applies WHERE job_key = ?")) {
                    ps.setInt(1, jobKey);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Job_Details WHERE job_key = ?")) {
                    ps.setInt(1, jobKey);
                    ps.executeUpdate();
                }
                int rows;
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Job WHERE job_key = ?")) {
                    ps.setInt(1, jobKey);
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

    public int getNextJobKey() throws SQLException {
        String sql = "SELECT NVL(MAX(job_key), 0) + 1 AS next_key FROM Job";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getInt("next_key");
            }
            return 1;
        }
    }
}
