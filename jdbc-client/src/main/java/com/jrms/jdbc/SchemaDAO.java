package com.jrms.jdbc;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object implementing schema introspection via JDBC metadata queries.
 * Queries Oracle dictionary views (USER_TABLES, USER_TAB_COLUMNS, USER_CONSTRAINTS).
 */
public class SchemaDAO {

    public static class TableMetadataDTO {
        public String tableName;
        public int columnCount;
        public int rowCount;
        public String primaryKey;

        @Override
        public String toString() {
            return String.format("%-25s | Columns: %-3d | Rows: %-4d | PK: %s",
                    tableName, columnCount, rowCount, (primaryKey != null ? primaryKey : "NONE"));
        }
    }

    /**
     * Lists all application tables, their column counts, and row counts via JDBC.
     */
    public List<TableMetadataDTO> getTablesCatalog() throws SQLException {
        List<TableMetadataDTO> list = new ArrayList<>();
        String sql = "SELECT t.table_name, " +
                     "       (SELECT COUNT(*) FROM user_tab_columns WHERE table_name = t.table_name) AS col_count, " +
                     "       (SELECT constraint_name FROM user_constraints WHERE table_name = t.table_name AND constraint_type = 'P' AND ROWNUM = 1) AS pk_name " +
                     "FROM user_tables t " +
                     "ORDER BY t.table_name ASC";

        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                TableMetadataDTO dto = new TableMetadataDTO();
                dto.tableName = rs.getString("table_name");
                dto.columnCount = rs.getInt("col_count");
                dto.primaryKey = rs.getString("pk_name");

                // Get row count dynamically for this table
                try (Statement countStmt = conn.createStatement();
                     ResultSet countRs = countStmt.executeQuery("SELECT COUNT(*) AS cnt FROM \"" + dto.tableName + "\"")) {
                    if (countRs.next()) {
                        dto.rowCount = countRs.getInt("cnt");
                    }
                } catch (Exception ignored) {
                    dto.rowCount = -1;
                }

                list.add(dto);
            }
        }
        return list;
    }

    /**
     * Runs custom arbitrary read-only SQL via JDBC and returns formatted tabular output.
     */
    public String executeArbitraryQuery(String sql) throws SQLException {
        if (!sql.trim().toUpperCase().startsWith("SELECT") && !sql.trim().toUpperCase().startsWith("WITH")) {
            throw new SQLException("Security Policy: Only SELECT queries are permitted in this console.");
        }

        StringBuilder sb = new StringBuilder();
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            ResultSetMetaData md = rs.getMetaData();
            int colCount = md.getColumnCount();

            // Print header
            for (int i = 1; i <= colCount; i++) {
                sb.append(String.format("%-20s", md.getColumnName(i)));
                if (i < colCount) sb.append(" | ");
            }
            sb.append("\n");
            for (int i = 1; i <= colCount; i++) {
                sb.append("--------------------");
                if (i < colCount) sb.append("-+-");
            }
            sb.append("\n");

            // Print rows
            int rowCount = 0;
            while (rs.next()) {
                rowCount++;
                for (int i = 1; i <= colCount; i++) {
                    String val = rs.getString(i);
                    sb.append(String.format("%-20s", (val != null ? val : "NULL")));
                    if (i < colCount) sb.append(" | ");
                }
                sb.append("\n");
                if (rowCount >= 100) {
                    sb.append("... [Output truncated at 100 rows]\n");
                    break;
                }
            }
            sb.append("\n(").append(rowCount).append(" rows returned)\n");
        }
        return sb.toString();
    }
}
