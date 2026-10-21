package com.jrms.jdbc;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object implementing Skill-related CRUD via JDBC.
 * Interacts with Skill and Skill_Details relations.
 */
public class SkillDAO {

    public static class SkillDTO {
        public String skillId;
        public String skillName;
        public String skillCategory;
        public String description;
        public int demandCount;
        public int candidateCount;

        @Override
        public String toString() {
            return String.format("Skill %-5s | %-18s | %-16s | Demand: %-2d jobs | Candidates: %-2d",
                    skillId, skillName, (skillCategory != null ? skillCategory : "General"),
                    demandCount, candidateCount);
        }
    }

    public List<SkillDTO> getAllSkills() throws SQLException {
        List<SkillDTO> list = new ArrayList<>();
        String sql = "SELECT s.skill_id, s.skill_name, " +
                     "       sd.skill_category, sd.description, " +
                     "       (SELECT COUNT(*) FROM Requires WHERE skill_id = s.skill_id) AS demand_count, " +
                     "       (SELECT COUNT(*) FROM Has WHERE skill_id = s.skill_id) AS candidate_count " +
                     "FROM Skill s " +
                     "LEFT JOIN Skill_Details sd ON sd.skill_name = s.skill_name " +
                     "ORDER BY s.skill_id ASC";

        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                SkillDTO dto = new SkillDTO();
                dto.skillId = rs.getString("skill_id");
                dto.skillName = rs.getString("skill_name");
                dto.skillCategory = rs.getString("skill_category");
                dto.description = rs.getString("description");
                dto.demandCount = rs.getInt("demand_count");
                dto.candidateCount = rs.getInt("candidate_count");
                list.add(dto);
            }
        }
        return list;
    }

    public int insertSkill(String skillId, String skillName, String skillCategory, String description) throws SQLException {
        String insertSkillSql = "INSERT INTO Skill (skill_id, skill_name) VALUES (?, ?)";
        String mergeDetailSql = "MERGE INTO Skill_Details sd " +
                                "USING (SELECT ? AS sn, ? AS sc, ? AS d FROM dual) src " +
                                "ON (sd.skill_name = src.sn) " +
                                "WHEN MATCHED THEN UPDATE SET sd.skill_category = src.sc, sd.description = src.d " +
                                "WHEN NOT MATCHED THEN INSERT (skill_name, skill_category, description) VALUES (src.sn, src.sc, src.d)";

        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(insertSkillSql)) {
                    ps.setString(1, skillId);
                    ps.setString(2, skillName);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps = conn.prepareStatement(mergeDetailSql)) {
                    ps.setString(1, skillName);
                    ps.setString(2, skillCategory != null ? skillCategory : "General");
                    ps.setString(3, description != null ? description : "Technical skill definition");
                    ps.executeUpdate();
                }

                conn.commit();
                return 1;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    public int updateSkill(String skillId, String newName, String newCategory) throws SQLException {
        String sql = "UPDATE Skill SET skill_name = ? WHERE skill_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newName);
            ps.setString(2, skillId);
            return ps.executeUpdate();
        }
    }

    public int deleteSkill(String skillId) throws SQLException {
        try (Connection conn = DatabaseManager.getConnection()) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Requires WHERE skill_id = ?")) {
                    ps.setString(1, skillId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Has WHERE skill_id = ?")) {
                    ps.setInt(1, Integer.parseInt(skillId.replace("S", "")));
                } catch (Exception ignored) {}

                int rows;
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Skill WHERE skill_id = ?")) {
                    ps.setString(1, skillId);
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

    public String getNextSkillId() throws SQLException {
        String sql = "SELECT NVL(MAX(TO_NUMBER(SUBSTR(skill_id, 2))), 0) + 1 AS next_num FROM Skill";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                int nextNum = rs.getInt("next_num");
                return String.format("S%03d", nextNum);
            }
            return "S001";
        }
    }
}
