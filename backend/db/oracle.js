import oracledb from 'oracledb';
import dotenv from 'dotenv';
import { inMemoryDb } from './inMemoryDb.js';

dotenv.config();

let pool = null;
let isOracleConnected = false;
let connectionAttempted = false;

// Enable object output format
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.ORACLE_USER || 'system',
  password: process.env.ORACLE_PASSWORD || 'oracle',
  connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/FREEPDB1',
  poolMin: parseInt(process.env.ORACLE_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.ORACLE_POOL_MAX || '10', 10),
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '2', 10),
};

export async function initOraclePool() {
  if (connectionAttempted) return isOracleConnected;
  connectionAttempted = true;

  try {
    console.log(`[OracleDB] Attempting connection to Oracle DB at: ${dbConfig.connectString} (User: ${dbConfig.user})...`);
    
    // Connect with a 15 second timeout guard
    const poolPromise = oracledb.createPool(dbConfig);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 15000ms')), 15000)
    );

    pool = await Promise.race([poolPromise, timeoutPromise]);
    isOracleConnected = true;
    console.log('[OracleDB] SUCCESS: Connected to live Oracle Database instance with connection pool.');
    return true;
  } catch (err) {
    isOracleConnected = false;
    console.warn(`[OracleDB] Notice: Could not connect to Oracle instance (${err.message}).`);
    console.log('[OracleDB] Active Mode: Academic Relational In-Memory Database (Faithful DA1/DA2 schema & dataset).');
    return false;
  }
}

export async function executeQuery(sql, binds = {}, options = {}) {
  // If connected to live Oracle, run on Oracle pool
  if (isOracleConnected && pool) {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: options.autoCommit !== undefined ? options.autoCommit : true,
        ...options
      });
      return { rows: result.rows || [], rowsAffected: result.rowsAffected || 0, isOracle: true };
    } catch (err) {
      console.error(`[Oracle Query Error] SQL: ${sql} | Error: ${err.message}`);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('[Oracle Connection Close Error]', closeErr);
        }
      }
    }
  }

  // Fallback in-memory query handler
  return handleInMemoryQuery(sql, binds);
}

export function getDbStatus() {
  return {
    isLiveOracle: isOracleConnected,
    connectString: dbConfig.connectString,
    user: dbConfig.user,
    mode: isOracleConnected ? 'ORACLE_LIVE_DATABASE' : 'ORACLE_RELATIONAL_FALLBACK_SIMULATOR',
    tableCount: Object.keys(inMemoryDb.tables).length
  };
}

// Fallback In-Memory Query Router simulating Oracle views and tables
function handleInMemoryQuery(sql, binds = {}) {
  const normalizedSql = sql.trim().toUpperCase();

  if (normalizedSql.includes('FROM USER_TABLES')) {
    const tables = Object.keys(inMemoryDb.tables).map(t => ({
      TABLE_NAME: t.toUpperCase(),
      TABLESPACE_NAME: 'USERS',
      STATUS: 'VALID',
      NUM_ROWS: inMemoryDb.tables[t].length,
      LAST_ANALYZED: '2026-09-03 23:00:00'
    }));
    return { rows: tables, rowsAffected: 0, isOracle: false };
  }

  if (normalizedSql.includes('FROM USER_TAB_COLUMNS')) {
    let cols = inMemoryDb.schemaMetadata.USER_TAB_COLUMNS;
    if (binds.tableName || binds.TABLE_NAME) {
      const target = (binds.tableName || binds.TABLE_NAME).toUpperCase();
      cols = cols.filter(c => c.TABLE_NAME === target);
    }
    return { rows: cols, rowsAffected: 0, isOracle: false };
  }

  if (normalizedSql.includes('FROM USER_CONSTRAINTS')) {
    let cons = inMemoryDb.schemaMetadata.USER_CONSTRAINTS;
    if (binds.tableName || binds.TABLE_NAME) {
      const target = (binds.tableName || binds.TABLE_NAME).toUpperCase();
      cons = cons.filter(c => c.TABLE_NAME === target);
    }
    return { rows: cons, rowsAffected: 0, isOracle: false };
  }

  if (normalizedSql.includes('FROM USER_CONS_COLUMNS')) {
    let consCols = inMemoryDb.schemaMetadata.USER_CONS_COLUMNS;
    if (binds.tableName || binds.TABLE_NAME) {
      const target = (binds.tableName || binds.TABLE_NAME).toUpperCase();
      consCols = consCols.filter(c => c.TABLE_NAME === target);
    }
    return { rows: consCols, rowsAffected: 0, isOracle: false };
  }

  if (normalizedSql.includes('FROM USER_INDEXES')) {
    return { rows: inMemoryDb.schemaMetadata.USER_INDEXES, rowsAffected: 0, isOracle: false };
  }

  if (normalizedSql.includes('FROM USER_OBJECTS')) {
    return { rows: inMemoryDb.schemaMetadata.USER_OBJECTS, rowsAffected: 0, isOracle: false };
  }

  return { rows: [], rowsAffected: 0, isOracle: false };
}
