import oracledb from 'oracledb';
import dotenv from 'dotenv';
import { inMemoryDb } from './inMemoryDb.js';

dotenv.config();

// Force in-memory mode (for Vercel/serverless where Oracle is not accessible)
const forceInMemory = process.env.FORCE_IN_MEMORY === 'true' 
  || (process.env.VERCEL && process.env.VERCEL !== '0')
  || process.env.VERCEL_ENV === 'production'
  || process.env.NODE_ENV === 'production';

// If forced in-memory, skip Oracle entirely - don't even configure oracledb
if (!forceInMemory) {
  // Enable object output format
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.autoCommit = true;
} else {
  console.log('[OracleDB] FORCE_IN_MEMORY=true: Skipping Oracle entirely, using Academic In-Memory Database.');
}

const dbConfig = {
  user: process.env.ORACLE_USER || 'system',
  password: process.env.ORACLE_PASSWORD || 'oracle',
  connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/FREEPDB1',
  poolMin: parseInt(process.env.ORACLE_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.ORACLE_POOL_MAX || '10', 10),
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '2', 10),
};

let pool = null;
let isOracleConnected = false;
let connectionAttempted = false;
  if (connectionAttempted) return isOracleConnected;
  connectionAttempted = true;

  // Skip Oracle connection entirely if forced to in-memory mode
  if (forceInMemory) {
    isOracleConnected = false;
    console.log('[OracleDB] FORCE_IN_MEMORY=true: Skipping Oracle connection, using Academic In-Memory Database.');
    return false;
  }

  try {
    console.log(`[OracleDB] Attempting connection to Oracle DB at: ${dbConfig.connectString} (User: ${dbConfig.user})...`);
    
    // Connect with a very short timeout guard for fast fail
    const poolPromise = oracledb.createPool(dbConfig);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 2000ms')), 2000)
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
  // If forced in-memory mode, never attempt Oracle
  if (forceInMemory) {
    return handleInMemoryQuery(sql, binds);
  }

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

// ─── Helper: resolve actual table name from the in-memory DB (case-insensitive) ─────
function resolveTableName(name) {
  const upper = name.trim().toUpperCase();
  return Object.keys(inMemoryDb.tables).find(k => k.toUpperCase() === upper) || null;
}

// ─── Helper: extract table name from a simple DML statement ──────────────────────────
function extractTableFromDML(normalizedSql) {
  // INSERT INTO <table>
  let m = normalizedSql.match(/INSERT\s+INTO\s+["']?(\w+)["']?/i);
  if (m) return m[1];
  // UPDATE <table>
  m = normalizedSql.match(/UPDATE\s+["']?(\w+)["']?/i);
  if (m) return m[1];
  // DELETE FROM <table>
  m = normalizedSql.match(/DELETE\s+FROM\s+["']?(\w+)["']?/i);
  if (m) return m[1];
  return null;
}

// ─── Fallback In-Memory Query Router simulating Oracle views and tables ───────────────
function handleInMemoryQuery(sql, binds = {}) {
  const normalizedSql = sql.trim().toUpperCase();

  // ─── MAX / NVL helpers for ID generation ───────────────────────────────────────────
  if (normalizedSql.includes('NVL(MAX(') || normalizedSql.includes('NVL( MAX(')) {
    // Detect which table we are querying
    const fromMatch = normalizedSql.match(/FROM\s+(\w+)/);
    const tableName = fromMatch ? fromMatch[1] : null;
    const tbl = tableName ? resolveTableName(tableName) : null;

    if (tbl && inMemoryDb.tables[tbl]) {
      const rows = inMemoryDb.tables[tbl];
      // Return next_id / next_num / next_key – generic approach: find numeric primary key
      const sampleRow = rows[0] || {};
      const numKeys = Object.keys(sampleRow).filter(k => typeof sampleRow[k] === 'number');
      if (numKeys.length > 0) {
        const maxVal = rows.reduce((mx, r) => Math.max(mx, r[numKeys[0]] || 0), 0);
        return { rows: [{ NEXT_ID: maxVal + 1, NEXT_NUM: maxVal + 1, NEXT_KEY: maxVal + 1, CNT: rows.length }], rowsAffected: 0, isOracle: false };
      }
      // String PKs (like APP001, INT001)
      const strKeys = Object.keys(sampleRow).filter(k => typeof sampleRow[k] === 'string');
      const maxNum = rows.reduce((mx, r) => {
        const v = parseInt((r[strKeys[0]] || '').replace(/\D/g, ''), 10);
        return isNaN(v) ? mx : Math.max(mx, v);
      }, 0);
      return { rows: [{ NEXT_ID: maxNum + 1, NEXT_NUM: maxNum + 1, NEXT_KEY: maxNum + 1, CNT: rows.length }], rowsAffected: 0, isOracle: false };
    }
    return { rows: [{ NEXT_ID: 1, NEXT_NUM: 1, NEXT_KEY: 1, CNT: 0 }], rowsAffected: 0, isOracle: false };
  }

  // ─── COUNT(*) on any regular table ─────────────────────────────────────────────────
  if (normalizedSql.startsWith('SELECT COUNT(*)') && normalizedSql.includes('FROM ') && !normalizedSql.includes('USER_')) {
    const fromMatch = normalizedSql.match(/FROM\s+"?(\w+)"?/);
    if (fromMatch) {
      const tbl = resolveTableName(fromMatch[1]);
      const cnt = tbl ? inMemoryDb.tables[tbl]?.length ?? 0 : 0;
      return { rows: [{ COUNT: cnt, CNT: cnt }], rowsAffected: 0, isOracle: false };
    }
  }

  // ─── SELECT * / SELECT ... FROM <table> ────────────────────────────────────────────
  if (normalizedSql.startsWith('SELECT') && normalizedSql.includes('FROM ')) {
    // Oracle dictionary views handled below
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
      if (binds.tName || binds.TNAME) {
        const target = (binds.tName || binds.TNAME).toUpperCase();
        cols = cols.filter(c => c.TABLE_NAME === target);
      }
      return { rows: cols, rowsAffected: 0, isOracle: false };
    }

    if (normalizedSql.includes('FROM USER_CONSTRAINTS')) {
      let cons = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.map(c => {
        const cols = inMemoryDb.schemaMetadata.USER_CONS_COLUMNS
          .filter(cc => cc.CONSTRAINT_NAME === c.CONSTRAINT_NAME)
          .sort((a, b) => (a.POSITION || 0) - (b.POSITION || 0))
          .map(cc => cc.COLUMN_NAME);

        const refTable = c.R_CONSTRAINT_NAME
          ? inMemoryDb.schemaMetadata.USER_CONSTRAINTS.find(p => p.CONSTRAINT_NAME === c.R_CONSTRAINT_NAME)?.TABLE_NAME || null
          : null;

        return { ...c, COLUMNS: cols.join(', '), REF_TABLE: refTable };
      });

      if (binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME) {
        const target = (binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME).toUpperCase();
        cons = cons.filter(c => c.TABLE_NAME === target);
      }

      if (binds.type || binds.TYPE) {
        const t = (binds.type || binds.TYPE).toUpperCase();
        if (t !== 'ALL') cons = cons.filter(c => c.CONSTRAINT_TYPE === t);
      } else if (normalizedSql.includes("CONSTRAINT_TYPE = 'P'") || normalizedSql.includes("C.CONSTRAINT_TYPE = 'P'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'P');
      } else if (normalizedSql.includes("CONSTRAINT_TYPE = 'R'") || normalizedSql.includes("C.CONSTRAINT_TYPE = 'R'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'R');
      } else if (normalizedSql.includes("CONSTRAINT_TYPE = 'C'") || normalizedSql.includes("C.CONSTRAINT_TYPE = 'C'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'C');
      } else if (normalizedSql.includes("CONSTRAINT_TYPE = 'U'") || normalizedSql.includes("C.CONSTRAINT_TYPE = 'U'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'U');
      }

      if (normalizedSql.includes('COUNT(*)')) {
        return { rows: [{ COUNT: cons.length }], rowsAffected: 0, isOracle: false };
      }
      return { rows: cons, rowsAffected: 0, isOracle: false };
    }

    if (normalizedSql.includes('FROM USER_CONS_COLUMNS')) {
      let consCols = inMemoryDb.schemaMetadata.USER_CONS_COLUMNS;
      if (binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME) {
        const target = (binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME).toUpperCase();
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

    // Generic table SELECT — return joined/enriched rows from in-memory tables
    const fromMatch = normalizedSql.match(/FROM\s+"?(\w+)"?/);
    if (fromMatch) {
      const tbl = resolveTableName(fromMatch[1]);
      if (tbl) {
        if (tbl === 'Job') {
          const rows = (inMemoryDb.tables.Job || []).map(j => {
            const jd = (inMemoryDb.tables.Job_Details || []).find(d => String(d.JOB_KEY) === String(j.JOB_KEY)) || {};
            const jp = (inMemoryDb.tables.Job_Posting || []).find(p => p.JOB_TITLE === jd.JOB_TITLE) || {};
            return { ...j, ...jd, ...jp };
          });
          return { rows, rowsAffected: 0, isOracle: false };
        }
        if (tbl === 'Candidate') {
          const rows = (inMemoryDb.tables.Candidate || []).map(c => {
            const ca = (inMemoryDb.tables.Candidate_Address || []).find(a => String(a.CAND_ID) === String(c.CAND_ID)) || {};
            const ce = (inMemoryDb.tables.Candidate_Email || []).filter(e => String(e.CAND_ID) === String(c.CAND_ID)).map(e => e.EMAIL).join(', ');
            const cp = (inMemoryDb.tables.Candidate_Phone || []).filter(p => String(p.CAND_ID) === String(c.CAND_ID)).map(p => p.PHONE).join(', ');
            const edu = (inMemoryDb.tables.Education || []).find(e => e.EDU_ID === c.EDU_ID) || {};
            const app = (inMemoryDb.tables.Application || []).find(a => a.APP_ID === c.APP_ID) || {};
            return {
              ...c,
              ...ca,
              EMAILS: ce,
              PHONES: cp,
              CGPA: edu.CGPA,
              SPECIALIZATION: edu.SPECIALIZATION,
              APP_STATUS: app.APP_STATUS,
              FINAL_RESULT: app.FINAL_RESULT
            };
          });
          return { rows, rowsAffected: 0, isOracle: false };
        }
        if (tbl === 'Interview') {
          const rows = (inMemoryDb.tables.Interview || []).map(i => {
            const id = (inMemoryDb.tables.Interview_Details || []).find(d => String(d.INT_ID) === String(i.INT_ID)) || {};
            const cand = (inMemoryDb.tables.Candidate || []).find(c => String(c.INT_ID) === String(i.INT_ID));
            return { ...i, ...id, CAND_ID: cand?.CAND_ID, CANDIDATE_NAME: cand ? `${cand.FNAME} ${cand.LNAME}` : null };
          });
          return { rows, rowsAffected: 0, isOracle: false };
        }
        if (tbl === 'Employer') {
          const rows = (inMemoryDb.tables.Employer || []).map(e => {
            const ed = (inMemoryDb.tables.Employer_Details || []).find(d => String(d.EMP_ID) === String(e.EMP_ID)) || {};
            const phones = (inMemoryDb.tables.Employer_Phone || []).filter(p => String(p.EMP_ID) === String(e.EMP_ID)).map(p => p.PHONE_NO).join(', ');
            const rl = (inMemoryDb.tables.Recruitment_License || []).find(l => String(l.EMP_ID) === String(e.EMP_ID));
            return { ...e, ...ed, PHONES: phones, LIC_NO: rl?.LIC_NO };
          });
          return { rows, rowsAffected: 0, isOracle: false };
        }
        if (tbl === 'Skill') {
          const rows = (inMemoryDb.tables.Skill || []).map(s => {
            const sd = (inMemoryDb.tables.Skill_Details || []).find(d => d.SKILL_NAME === s.SKILL_NAME) || {};
            const reqCount = (inMemoryDb.tables.Requires || []).filter(r => String(r.SKILL_ID) === String(s.SKILL_ID)).length;
            const hasCount = (inMemoryDb.tables.Has || []).filter(h => String(h.SKILL_ID) === String(s.SKILL_ID)).length;
            return { ...s, ...sd, DEMAND_COUNT: reqCount, CANDIDATE_COUNT: hasCount };
          });
          return { rows, rowsAffected: 0, isOracle: false };
        }
        if (tbl === 'Application') {
          const rows = (inMemoryDb.tables.Application || []).map(a => {
            const ai = (inMemoryDb.tables.Application_Info || []).find(i => String(i.APP_ID) === String(a.APP_ID));
            const ad = (inMemoryDb.tables.Application_Date || []).find(d => d.FINAL_RESULT === a.FINAL_RESULT);
            const cand = (inMemoryDb.tables.Candidate || []).find(c => String(c.APP_ID) === String(a.APP_ID));
            const jd = (inMemoryDb.tables.Job_Details || []).find(j => String(j.APP_ID) === String(a.APP_ID));
            const job = jd ? (inMemoryDb.tables.Job || []).find(j => String(j.JOB_KEY) === String(jd.JOB_KEY)) : null;
            return {
              ...a,
              APP_DATE: ai?.APP_DATE,
              OFFER_LETTER: ad?.OFFER_LETTER,
              CAND_ID: cand?.CAND_ID,
              CANDIDATE_NAME: cand ? `${cand.FNAME} ${cand.LNAME}` : null,
              JOB_KEY: job?.JOB_KEY,
              JOB_ID: job?.JOB_ID,
              JOB_TITLE: jd?.JOB_TITLE
            };
          });
          return { rows, rowsAffected: 0, isOracle: false };
        }

        return { rows: inMemoryDb.tables[tbl] || [], rowsAffected: 0, isOracle: false };
      }
    }

    return { rows: [], rowsAffected: 0, isOracle: false };
  }

  // ─── INSERT INTO <table> ────────────────────────────────────────────────────────────
  if (normalizedSql.startsWith('INSERT INTO')) {
    const tblName = extractTableFromDML(sql);
    const tbl = tblName ? resolveTableName(tblName) : null;
    if (tbl && inMemoryDb.tables[tbl]) {
      const newRow = {};

      // 1. Parse column names and value expressions from SQL
      const insertMatch = sql.match(/INSERT\s+INTO\s+[\w"]+\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+?)\)/i);
      if (insertMatch) {
        const cols = insertMatch[1].split(',').map(c => c.trim().toUpperCase());
        const vals = insertMatch[2].split(',').map(v => v.trim());
        cols.forEach((col, idx) => {
          const valExpr = vals[idx] || '';
          const bindMatch = valExpr.match(/:(\w+)/);
          if (bindMatch) {
            const bindKey = bindMatch[1];
            const foundKey = Object.keys(binds).find(k => k.toLowerCase() === bindKey.toLowerCase());
            newRow[col] = foundKey ? binds[foundKey] : binds[bindKey];
          } else if (/^SYSDATE$/i.test(valExpr)) {
            newRow[col] = new Date().toISOString().split('T')[0];
          } else if (/^NULL$/i.test(valExpr)) {
            newRow[col] = null;
          } else if (/^'([^']*)'$/.test(valExpr)) {
            newRow[col] = valExpr.slice(1, -1);
          } else if (!isNaN(Number(valExpr)) && valExpr !== '') {
            newRow[col] = Number(valExpr);
          }
        });
      }

      // 2. Fallback: also copy all uppercase bind keys
      for (const [k, v] of Object.entries(binds)) {
        if (newRow[k.toUpperCase()] === undefined) {
          newRow[k.toUpperCase()] = v;
        }
      }

      inMemoryDb.tables[tbl].push(newRow);
      console.log(`[InMemoryDB] INSERT into ${tbl}: row added (total ${inMemoryDb.tables[tbl].length})`);
    }
    return { rows: [], rowsAffected: 1, isOracle: false };
  }

  // ─── Multi-statement INSERT handling (e.g., Candidate + Candidate_Address) ──────────
  if (normalizedSql.startsWith('INSERT INTO') && sql.includes(';')) {
    const statements = sql.split(';').filter(s => s.trim().toUpperCase().startsWith('INSERT INTO'));
    let totalAffected = 0;
    for (const stmt of statements) {
      const result = handleInMemoryQuery(stmt.trim(), binds);
      totalAffected += result.rowsAffected || 0;
    }
    return { rows: [], rowsAffected: totalAffected, isOracle: false };
  }

  // ─── UPDATE <table> ────────────────────────────────────────────────────────────────
  if (normalizedSql.startsWith('UPDATE')) {
    const tblName = extractTableFromDML(sql);
    const tbl = tblName ? resolveTableName(tblName) : null;
    if (tbl && inMemoryDb.tables[tbl]) {
      // Parse WHERE condition from binds to find matching rows
      // Strategy: match each bind value against any column value in the row
      let affectedCount = 0;
      inMemoryDb.tables[tbl] = inMemoryDb.tables[tbl].map(row => {
        // Find primary-key-style bind (id, candId, jobKey, etc.)
        const pkBind = Object.entries(binds).find(([k]) =>
          k.toLowerCase().includes('id') || k.toLowerCase().includes('key') || k.toLowerCase().includes('num')
        );
        let rowMatch = false;
        if (pkBind) {
          const pkVal = String(pkBind[1]);
          rowMatch = Object.values(row).some(v => String(v) === pkVal);
        } else {
          // Fallback: try to match any bind value against row values
          const bindValues = Object.values(binds).map(v => String(v));
          rowMatch = Object.values(row).some(v => bindValues.includes(String(v)));
        }
        if (rowMatch) {
          affectedCount++;
          const updated = { ...row };
          for (const [k, v] of Object.entries(binds)) {
            if (!k.toLowerCase().includes('id') && !k.toLowerCase().includes('key') && !k.toLowerCase().includes('num')) {
              updated[k.toUpperCase()] = v;
            }
          }
          return updated;
        }
        return row;
      });
      console.log(`[InMemoryDB] UPDATE ${tbl}: ${affectedCount} row(s) affected`);
      return { rows: [], rowsAffected: affectedCount, isOracle: false };
    }
    return { rows: [], rowsAffected: 0, isOracle: false };
  }

  // ─── DELETE FROM <table> ───────────────────────────────────────────────────────────
  if (normalizedSql.startsWith('DELETE')) {
    const tblName = extractTableFromDML(sql);
    const tbl = tblName ? resolveTableName(tblName) : null;
    if (tbl && inMemoryDb.tables[tbl]) {
      const beforeLen = inMemoryDb.tables[tbl].length;
      const bindValues = Object.values(binds).map(v => String(v));
      inMemoryDb.tables[tbl] = inMemoryDb.tables[tbl].filter(row =>
        !Object.values(row).some(v => bindValues.includes(String(v)))
      );
      const affected = beforeLen - inMemoryDb.tables[tbl].length;

      // Clean up child tables to maintain referential integrity in-memory
      const childMap = {
        Job: ['Job_Details', 'Requires', 'Applies', 'Assessed_For'],
        Candidate: ['Candidate_Address', 'Candidate_Email', 'Candidate_Phone', 'Applies', 'Has', 'Refers', 'Assessed_For'],
        Interview: ['Interview_Details'],
        Employer: ['Employer_Details', 'Employer_Phone', 'Company_Employer'],
        Skill: ['Skill_Details', 'Requires', 'Has', 'Assessed_For'],
        Application: ['Application_Info', 'Application_Date']
      };
      if (childMap[tbl]) {
        for (const childTbl of childMap[tbl]) {
          if (inMemoryDb.tables[childTbl]) {
            inMemoryDb.tables[childTbl] = inMemoryDb.tables[childTbl].filter(row =>
              !Object.values(row).some(v => bindValues.includes(String(v)))
            );
          }
        }
      }

      console.log(`[InMemoryDB] DELETE from ${tbl}: ${affected} row(s) removed`);
      return { rows: [], rowsAffected: affected, isOracle: false };
    }
    return { rows: [], rowsAffected: 0, isOracle: false };
  }

  return { rows: [], rowsAffected: 0, isOracle: false };
}

