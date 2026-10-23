package com.jrms.jdbc;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Manages JDBC connections to Oracle Database for JRMS.
 * Reads configuration from environment variables or backend/.env file.
 */
public class DatabaseManager {

    private static String host = "localhost";
    private static int port = 1521;
    private static String serviceName = "FREEPDB1";
    private static String username = "system";
    private static String password = "oracle";

    static {
        loadConfiguration();
    }

    private static void loadConfiguration() {
        // 1. Try reading from backend/.env if available
        Path envPath = Paths.get("backend", ".env");
        if (!Files.exists(envPath)) {
            envPath = Paths.get("..", "backend", ".env");
        }
        if (Files.exists(envPath)) {
            try {
                for (String line : Files.readAllLines(envPath)) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;
                    int eq = line.indexOf('=');
                    if (eq > 0) {
                        String key = line.substring(0, eq).trim();
                        String val = line.substring(eq + 1).trim();
                        switch (key) {
                            case "ORACLE_USER":
                                username = val;
                                break;
                            case "ORACLE_PASSWORD":
                                password = val;
                                break;
                            case "ORACLE_CONNECT_STRING":
                                parseConnectString(val);
                                break;
                        }
                    }
                }
            } catch (IOException e) {
                System.err.println("[JDBC Warning] Could not parse .env file: " + e.getMessage());
            }
        }

        // 2. Override with system environment variables if set
        if (System.getenv("ORACLE_USER") != null) username = System.getenv("ORACLE_USER");
        if (System.getenv("ORACLE_PASSWORD") != null) password = System.getenv("ORACLE_PASSWORD");
        if (System.getenv("ORACLE_CONNECT_STRING") != null) parseConnectString(System.getenv("ORACLE_CONNECT_STRING"));
        if (System.getenv("ORACLE_HOST") != null) host = System.getenv("ORACLE_HOST");
        if (System.getenv("ORACLE_PORT") != null) {
            try { port = Integer.parseInt(System.getenv("ORACLE_PORT")); } catch (NumberFormatException ignored) {}
        }
        if (System.getenv("ORACLE_SERVICE") != null) serviceName = System.getenv("ORACLE_SERVICE");
    }

    private static void parseConnectString(String connStr) {
        if (connStr == null || connStr.isEmpty()) return;
        try {
            // Format: host:port/serviceName or host:port:sid
            if (connStr.contains("/")) {
                String[] parts = connStr.split("/");
                serviceName = parts[1];
                if (parts[0].contains(":")) {
                    String[] hostPort = parts[0].split(":");
                    host = hostPort[0];
                    port = Integer.parseInt(hostPort[1]);
                } else {
                    host = parts[0];
                }
            } else if (connStr.contains(":")) {
                String[] parts = connStr.split(":");
                if (parts.length >= 3) {
                    host = parts[0];
                    port = Integer.parseInt(parts[1]);
                    serviceName = parts[2];
                }
            }
        } catch (Exception e) {
            System.err.println("[JDBC Warning] Error parsing connect string '" + connStr + "': " + e.getMessage());
        }
    }

    /**
     * Constructs the standard Oracle JDBC Thin connection URL:
     * jdbc:oracle:thin:@//host:port/serviceName
     */
    public static String getJdbcUrl() {
        return "jdbc:oracle:thin:@//" + host + ":" + port + "/" + serviceName;
    }

    public static String getUsername() {
        return username;
    }

    /**
     * Obtains a new JDBC Connection from Oracle Driver.
     */
    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("oracle.jdbc.OracleDriver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Oracle JDBC Driver (oracle.jdbc.OracleDriver) not found on classpath", e);
        }

        return DriverManager.getConnection(getJdbcUrl(), username, password);
    }
}
