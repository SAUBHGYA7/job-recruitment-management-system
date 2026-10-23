import dotenv from 'dotenv';
import { inMemoryDb } from './inMemoryDb.js';

dotenv.config();

// Force in-memory mode on Vercel and in production
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production';
const isProduction = process.env.NODE_ENV === 'production';
const forceInMemory = process.env.FORCE_IN_MEMORY === 'true' || isVercel || isProduction;

if (forceInMemory) {
  console.log('[OracleDB] Running in in-memory mode (Vercel/production detected)');
}

// Only load oracledb if NOT in forced in-memory mode
let oracledb = null;

async function loadOracleDB() {
  if (forceInMemory) {
    throw new Error('Oracle not available in in-memory mode');
  }
  if (!oracledb) {
    const mod = await import('oracledb');
    oracledb = mod.default || mod;
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    oracledb.autoCommit = true;
  }
  return oracledb;
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

export async function initOraclePool() {
  if (connectionAttempted) return isOracleConnected;
  connectionAttempted = true;

  // Skip Oracle connection entirely if forced to in-memory mode
  if (forceInMemory) {
    isOracleConnected = false;
    console.log('[OracleDB] FORCE_IN_MEMORY=true: Skipping Oracle connection, using Academic In-Memory Database.');
    return false;
  }

  try {
    await loadOracleDB();
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
      await loadOracleDB();
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

// ─── Helper: split comma-separated SQL expressions ignoring commas inside parens/quotes
function splitTopLevelCommas(str) {
  const result = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && str[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (!inQuotes && ch === '(') {
      depth++;
      current += ch;
    } else if (!inQuotes && ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (!inQuotes && depth === 0 && ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) {
    result.push(current.trim());
  }
  return result;
}

// ─── Helper: resolve bind value case-insensitively ───────────────────────────────────
function getBindValue(binds, bindKey) {
  if (!binds || !bindKey) return undefined;
  if (Object.prototype.hasOwnProperty.call(binds, bindKey)) return binds[bindKey];
  const foundKey = Object.keys(binds).find(k => k.toLowerCase() === bindKey.toLowerCase());
  return foundKey !== undefined ? binds[foundKey] : undefined;
}

// ─── Helper: evaluate a SQL value expression (e.g., :bind, TO_DATE(:d,...), NULL, SYSDATE)
function evalSqlExpr(expr, binds) {
  const trimmed = (expr || '').trim();
  if (/^NULL$/i.test(trimmed)) return null;
  if (/^SYSDATE$/i.test(trimmed) || /^SYSTIMESTAMP$/i.test(trimmed)) {
    return new Date().toISOString().split('T')[0];
  }
  // TO_DATE(:bind, 'YYYY-MM-DD') or TO_DATE('2026-01-01', ...)
  const toDateBind = trimmed.match(/^TO_DATE\s*\(\s*:(\w+)/i);
  if (toDateBind) {
    const val = getBindValue(binds, toDateBind[1]);
    return val !== undefined ? val : null;
  }
  const toDateLit = trimmed.match(/^TO_DATE\s*\(\s*'([^']*)'/i);
  if (toDateLit) {
    return toDateLit[1];
  }
  // Simple :bind
  const bindMatch = trimmed.match(/^:(\w+)$/);
  if (bindMatch) {
    const val = getBindValue(binds, bindMatch[1]);
    return val !== undefined ? val : null;
  }
  // String literal
  if (/^'([^']*)'$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  // Number literal
  if (trimmed !== '' && !isNaN(Number(trimmed))) {
    return Number(trimmed);
  }
  // Fallback if expression contains a bind anywhere
  const anyBind = trimmed.match(/:(\w+)/);
  if (anyBind) {
    const val = getBindValue(binds, anyBind[1]);
    return val !== undefined ? val : null;
  }
  return trimmed;
}

// ─── Helper: evaluate WHERE conditions against a row ─────────────────────────────────
function rowMatchesWhere(row, whereClause, binds) {
  if (!whereClause) return true;
  // Split by AND (ignoring ROWNUM conditions which are handled separately)
  const conditions = whereClause.split(/\bAND\b/i).map(c => c.trim()).filter(Boolean);
  for (const cond of conditions) {
    if (/ROWNUM/i.test(cond) || /^1\s*=\s*1$/.test(cond)) continue;

    // Handle col IS NULL / IS NOT NULL
    const isNullMatch = cond.match(/^(?:[\w]+\.)?["']?(\w+)["']?\s+IS\s+NULL$/i);
    if (isNullMatch) {
      const col = isNullMatch[1].toUpperCase();
      if (row[col] !== null && row[col] !== undefined && row[col] !== '') return false;
      continue;
    }
    const isNotNullMatch = cond.match(/^(?:[\w]+\.)?["']?(\w+)["']?\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
      const col = isNotNullMatch[1].toUpperCase();
      if (row[col] === null || row[col] === undefined || row[col] === '') return false;
      continue;
    }

    // Handle col = expr (including LOWER(col) = LOWER(:bind) or UPPER(col) = UPPER(:bind))
    const eqMatch = cond.match(/^(?:(?:LOWER|UPPER)\s*\(\s*)?(?:[\w]+\.)?["']?(\w+)["']?\s*\)?\s*=\s*(.+)$/i);
    if (eqMatch) {
      const col = eqMatch[1].toUpperCase();
      const targetVal = evalSqlExpr(eqMatch[2], binds);
      const rowKey = Object.keys(row).find(k => k.toUpperCase() === col);
      const actualVal = rowKey ? row[rowKey] : undefined;
      if (actualVal === undefined) return false;
      const isCaseInsensitive = /\b(?:LOWER|UPPER)\s*\(/i.test(cond);
      if (isCaseInsensitive) {
        if (String(actualVal).toLowerCase() !== String(targetVal).toLowerCase()) return false;
      } else if (String(actualVal) !== String(targetVal)) {
        return false;
      }
    }
  }
  return true;
}

// ─── Helper: strip parenthesized (SELECT ...) subqueries so top-level FROM/WHERE match outer query
function stripSubqueries(sqlStr) {
  let result = '';
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < sqlStr.length; i++) {
    const ch = sqlStr[i];
    if (ch === "'" && sqlStr[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      if (depth === 0) result += ch;
    } else if (!inQuotes && ch === '(') {
      const rest = sqlStr.slice(i + 1).trimStart();
      if (depth > 0 || /^SELECT\b/i.test(rest)) {
        if (depth === 0) result += '(__SUBQUERY__)';
        depth++;
      } else {
        result += ch;
      }
    } else if (!inQuotes && ch === ')') {
      if (depth > 0) {
        depth--;
      } else {
        result += ch;
      }
    } else if (depth === 0) {
      result += ch;
    }
  }
  return result;
}

// ─── Fallback In-Memory Query Router simulating Oracle views and tables ───────────────
function handleInMemoryQuery(sql, binds = {}) {
  const normalizedSql = sql.trim().toUpperCase();

  // ─── Multi-statement DML handling (separated by ;) ─────────────────────────────────
  if (sql.includes(';') && (normalizedSql.startsWith('INSERT') || normalizedSql.startsWith('UPDATE') || normalizedSql.startsWith('DELETE'))) {
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    if (statements.length > 1) {
      let totalAffected = 0;
      for (const stmt of statements) {
        const result = handleInMemoryQuery(stmt, binds);
        totalAffected += result.rowsAffected || 0;
      }
      return { rows: [], rowsAffected: totalAffected, isOracle: false };
    }
  }

  // ─── SUM(num_rows) across tables (DBA Dashboard) ───────────────────────────────────
  if (normalizedSql.includes('SUM(NUM_ROWS)')) {
    const total = Object.values(inMemoryDb.tables).reduce((acc, arr) => acc + (arr?.length || 0), 0);
    return { rows: [{ TOTAL_ROWS: total }], rowsAffected: 0, isOracle: false };
  }

  const topLevelSql = stripSubqueries(sql);
  const topLevelUpper = topLevelSql.trim().toUpperCase();

  // ─── MAX / NVL helpers for ID generation ───────────────────────────────────────────
  if (topLevelUpper.includes('NVL(MAX(') || topLevelUpper.includes('NVL( MAX(')) {
    const fromMatch = topLevelUpper.match(/FROM\s+"?(\w+)"?/);
    const tableName = fromMatch ? fromMatch[1] : null;
    const tbl = tableName ? resolveTableName(tableName) : null;

    if (tbl && inMemoryDb.tables[tbl]) {
      const rows = inMemoryDb.tables[tbl];
      if (rows.length === 0) {
        return { rows: [{ NEXT_ID: 1, NEXT_NUM: 1, NEXT_KEY: 1, CNT: 0 }], rowsAffected: 0, isOracle: false };
      }
      const sampleRow = rows[0] || {};
      const pkKey = Object.keys(sampleRow)[0];
      if (pkKey && typeof sampleRow[pkKey] === 'number') {
        const maxVal = rows.reduce((mx, r) => Math.max(mx, Number(r[pkKey]) || 0), 0);
        return { rows: [{ NEXT_ID: maxVal + 1, NEXT_NUM: maxVal + 1, NEXT_KEY: maxVal + 1, CNT: rows.length }], rowsAffected: 0, isOracle: false };
      }
      if (pkKey) {
        const maxNum = rows.reduce((mx, r) => {
          const v = parseInt(String(r[pkKey] || '').replace(/\D/g, ''), 10);
          return isNaN(v) ? mx : Math.max(mx, v);
        }, 0);
        return { rows: [{ NEXT_ID: maxNum + 1, NEXT_NUM: maxNum + 1, NEXT_KEY: maxNum + 1, CNT: rows.length }], rowsAffected: 0, isOracle: false };
      }
    }
    return { rows: [{ NEXT_ID: 1, NEXT_NUM: 1, NEXT_KEY: 1, CNT: 0 }], rowsAffected: 0, isOracle: false };
  }

  // ─── COUNT(*) on any regular table ─────────────────────────────────────────────────
  if (topLevelUpper.startsWith('SELECT COUNT(*)') && topLevelUpper.includes('FROM ') && !topLevelUpper.includes('USER_')) {
    const fromMatch = topLevelUpper.match(/FROM\s+"?(\w+)"?/);
    if (fromMatch) {
      const tbl = resolveTableName(fromMatch[1]);
      let rows = tbl ? (inMemoryDb.tables[tbl] || []) : [];
      const whereMatch = topLevelSql.match(/\bWHERE\b\s+([\s\S]+?)(?:\bORDER\s+BY\b|\bGROUP\s+BY\b|$)/i);
      if (whereMatch) {
        rows = rows.filter(r => rowMatchesWhere(r, whereMatch[1], binds));
      }
      const cnt = rows.length;
      return { rows: [{ COUNT: cnt, CNT: cnt }], rowsAffected: 0, isOracle: false };
    }
  }

  // ─── SELECT * / SELECT ... FROM <table> ────────────────────────────────────────────
  if (topLevelUpper.startsWith('SELECT') && topLevelUpper.includes('FROM ')) {
    if (topLevelUpper.includes('FROM USER_TABLES')) {
      let tables = Object.keys(inMemoryDb.tables).map(t => {
        const upper = t.toUpperCase();
        const colCount = inMemoryDb.schemaMetadata.USER_TAB_COLUMNS.filter(c => c.TABLE_NAME === upper).length;
        const pkObj = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.find(c => c.TABLE_NAME === upper && c.CONSTRAINT_TYPE === 'P');
        const fkCount = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.filter(c => c.TABLE_NAME === upper && c.CONSTRAINT_TYPE === 'R').length;
        return {
          TABLE_NAME: upper,
          TABLESPACE_NAME: 'USERS',
          STATUS: 'VALID',
          NUM_ROWS: inMemoryDb.tables[t].length,
          COL_COUNT: colCount,
          PK_NAME: pkObj ? pkObj.CONSTRAINT_NAME : 'NONE',
          FK_COUNT: fkCount,
          EST_ROW_LEN: colCount * 45,
          LAST_ANALYZED: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
      });
      if (binds.tableName || binds.TABLE_NAME) {
        const target = String(binds.tableName || binds.TABLE_NAME).toUpperCase();
        tables = tables.filter(t => t.TABLE_NAME === target);
      }
      if (topLevelUpper.startsWith('SELECT COUNT(*)')) {
        return { rows: [{ COUNT: tables.length, CNT: tables.length }], rowsAffected: 0, isOracle: false };
      }
      tables.sort((a, b) => a.TABLE_NAME.localeCompare(b.TABLE_NAME));
      return { rows: tables, rowsAffected: 0, isOracle: false };
    }

    if (topLevelUpper.includes('FROM USER_TAB_COLUMNS')) {
      let cols = [...inMemoryDb.schemaMetadata.USER_TAB_COLUMNS];
      if (binds.tableName || binds.TABLE_NAME) {
        const target = String(binds.tableName || binds.TABLE_NAME).toUpperCase();
        cols = cols.filter(c => c.TABLE_NAME === target);
      }
      if (binds.tName || binds.TNAME) {
        const target = String(binds.tName || binds.TNAME).toUpperCase();
        cols = cols.filter(c => c.TABLE_NAME === target);
      }
      const litTableMatch = topLevelSql.match(/table_name\s*=\s*'([^']+)'/i);
      if (litTableMatch) {
        const target = litTableMatch[1].toUpperCase();
        cols = cols.filter(c => c.TABLE_NAME === target);
      }
      if (binds.search) {
        const q = String(binds.search).replace(/%/g, '').toLowerCase();
        cols = cols.filter(c =>
          (c.COLUMN_NAME || '').toLowerCase().includes(q) ||
          (c.TABLE_NAME || '').toLowerCase().includes(q)
        );
      }
      if (topLevelUpper.startsWith('SELECT COUNT(*)')) {
        return { rows: [{ COUNT: cols.length, CNT: cols.length }], rowsAffected: 0, isOracle: false };
      }
      return { rows: cols, rowsAffected: 0, isOracle: false };
    }

    if (topLevelUpper.includes('FROM USER_CONSTRAINTS')) {
      let cons = inMemoryDb.schemaMetadata.USER_CONSTRAINTS.map(c => {
        const cols = inMemoryDb.schemaMetadata.USER_CONS_COLUMNS
          .filter(cc => cc.CONSTRAINT_NAME === c.CONSTRAINT_NAME)
          .sort((a, b) => (a.POSITION || 0) - (b.POSITION || 0))
          .map(cc => cc.COLUMN_NAME);

        const refTable = c.R_CONSTRAINT_NAME
          ? inMemoryDb.schemaMetadata.USER_CONSTRAINTS.find(p => p.CONSTRAINT_NAME === c.R_CONSTRAINT_NAME)?.TABLE_NAME || null
          : null;

        return {
          ...c,
          COLUMNS: cols.join(', '),
          COLUMN_NAME: cols[0] || '',
          ALL_COLUMNS: cols,
          REF_TABLE: refTable
        };
      });

      if (binds.rName || binds.RNAME) {
        const targetR = String(binds.rName || binds.RNAME).toUpperCase();
        cons = cons.filter(c => c.CONSTRAINT_NAME === targetR);
      }

      if (binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME) {
        const target = String(binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME).toUpperCase();
        cons = cons.filter(c => c.TABLE_NAME === target);
      }

      if (binds.type || binds.TYPE) {
        const t = String(binds.type || binds.TYPE).toUpperCase();
        if (t !== 'ALL') cons = cons.filter(c => c.CONSTRAINT_TYPE === t);
      } else if (topLevelUpper.includes("CONSTRAINT_TYPE = 'P'") || topLevelUpper.includes("C.CONSTRAINT_TYPE = 'P'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'P');
      } else if (topLevelUpper.includes("CONSTRAINT_TYPE = 'R'") || topLevelUpper.includes("C.CONSTRAINT_TYPE = 'R'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'R');
      } else if (topLevelUpper.includes("CONSTRAINT_TYPE = 'C'") || topLevelUpper.includes("C.CONSTRAINT_TYPE = 'C'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'C');
      } else if (topLevelUpper.includes("CONSTRAINT_TYPE = 'U'") || topLevelUpper.includes("C.CONSTRAINT_TYPE = 'U'")) {
        cons = cons.filter(c => c.CONSTRAINT_TYPE === 'U');
      }

      if (topLevelUpper.startsWith('SELECT COUNT(*)')) {
        return { rows: [{ COUNT: cons.length, CNT: cons.length }], rowsAffected: 0, isOracle: false };
      }

      // If joining user_cons_columns to get individual COLUMN_NAME rows (e.g. getTableDetails)
      if (topLevelUpper.includes('JOIN USER_CONS_COLUMNS')) {
        const expanded = [];
        cons.forEach(c => {
          (c.ALL_COLUMNS || []).forEach(colName => {
            expanded.push({ ...c, COLUMN_NAME: colName });
          });
        });
        return { rows: expanded, rowsAffected: 0, isOracle: false };
      }

      return { rows: cons, rowsAffected: 0, isOracle: false };
    }

    if (topLevelUpper.includes('FROM USER_CONS_COLUMNS')) {
      let consCols = [...inMemoryDb.schemaMetadata.USER_CONS_COLUMNS];
      if (binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME) {
        const target = String(binds.tableName || binds.TABLE_NAME || binds.tName || binds.TNAME).toUpperCase();
        consCols = consCols.filter(c => c.TABLE_NAME === target);
      }
      return { rows: consCols, rowsAffected: 0, isOracle: false };
    }

    if (topLevelUpper.includes('FROM USER_INDEXES')) {
      const idxs = inMemoryDb.schemaMetadata.USER_INDEXES || [];
      if (topLevelUpper.startsWith('SELECT COUNT(*)')) {
        return { rows: [{ COUNT: idxs.length, CNT: idxs.length }], rowsAffected: 0, isOracle: false };
      }
      return { rows: idxs, rowsAffected: 0, isOracle: false };
    }

    if (topLevelUpper.includes('FROM USER_OBJECTS')) {
      let objs = [...(inMemoryDb.schemaMetadata.USER_OBJECTS || [])];
      if (binds.type || binds.TYPE) {
        const t = String(binds.type || binds.TYPE).toUpperCase();
        if (t !== 'ALL') objs = objs.filter(o => o.OBJECT_TYPE === t);
      }
      if (topLevelUpper.includes('GROUP BY OBJECT_TYPE')) {
        const counts = {};
        objs.forEach(o => {
          counts[o.OBJECT_TYPE] = (counts[o.OBJECT_TYPE] || 0) + 1;
        });
        const grouped = Object.entries(counts)
          .map(([OBJECT_TYPE, COUNT]) => ({ OBJECT_TYPE, COUNT }))
          .sort((a, b) => b.COUNT - a.COUNT);
        return { rows: grouped, rowsAffected: 0, isOracle: false };
      }
      return { rows: objs, rowsAffected: 0, isOracle: false };
    }

    const fromMatch = topLevelUpper.match(/FROM\s+"?(\w+)"?/);
    if (fromMatch) {
      const tbl = resolveTableName(fromMatch[1]);
      if (tbl) {
        const hasJoin = topLevelUpper.includes('JOIN ');
        const whereMatch = topLevelSql.match(/\bWHERE\b\s+([\s\S]+?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bFETCH\s+FIRST\b|$)/i);
        const whereClause = whereMatch ? whereMatch[1] : null;

        // Handle GROUP BY aggregations (UserDashboard & SQL Console)
        if (topLevelUpper.includes('GROUP BY')) {
          if (tbl === 'Application' && topLevelUpper.includes('APP_STATUS')) {
            const counts = {};
            (inMemoryDb.tables.Application || []).forEach(a => {
              const st = a.APP_STATUS || 'Pending';
              counts[st] = (counts[st] || 0) + 1;
            });
            const rows = Object.entries(counts)
              .map(([STATUS, COUNT]) => ({ STATUS, APP_STATUS: STATUS, COUNT }))
              .sort((a, b) => b.COUNT - a.COUNT);
            return { rows, rowsAffected: 0, isOracle: false };
          }
          if (tbl === 'Job' && topLevelUpper.includes('JOB_STATUS')) {
            const counts = {};
            (inMemoryDb.tables.Job || []).forEach(j => {
              const st = j.JOB_STATUS || 'Open';
              counts[st] = (counts[st] || 0) + 1;
            });
            const rows = Object.entries(counts)
              .map(([STATUS, COUNT]) => ({ STATUS, JOB_STATUS: STATUS, COUNT }))
              .sort((a, b) => b.COUNT - a.COUNT);
            return { rows, rowsAffected: 0, isOracle: false };
          }
          if (tbl === 'Interview_Details' && topLevelUpper.includes('INT_STATUS')) {
            const counts = {};
            (inMemoryDb.tables.Interview_Details || []).forEach(i => {
              const st = i.INT_STATUS || 'Scheduled';
              counts[st] = (counts[st] || 0) + 1;
            });
            const rows = Object.entries(counts)
              .map(([STATUS, COUNT]) => ({ STATUS, INT_STATUS: STATUS, COUNT }))
              .sort((a, b) => b.COUNT - a.COUNT);
            return { rows, rowsAffected: 0, isOracle: false };
          }
          if (tbl === 'Requires' && topLevelUpper.includes('SKILL_NAME')) {
            const counts = {};
            (inMemoryDb.tables.Requires || []).forEach(r => {
              const s = (inMemoryDb.tables.Skill || []).find(sk => String(sk.SKILL_ID) === String(r.SKILL_ID));
              const name = s ? s.SKILL_NAME : r.SKILL_ID;
              counts[name] = (counts[name] || 0) + 1;
            });
            const rows = Object.entries(counts)
              .map(([SKILL, DEMAND]) => ({ SKILL, SKILL_NAME: SKILL, DEMAND, COUNT: DEMAND }))
              .sort((a, b) => b.DEMAND - a.DEMAND);
            return { rows, rowsAffected: 0, isOracle: false };
          }
        }

        // If the query uses JOINs (controller entity queries), return enriched/joined view
        if (hasJoin) {
          if (tbl === 'Job') {
            let rows = (inMemoryDb.tables.Job || []).map(j => {
              const jd = (inMemoryDb.tables.Job_Details || []).find(d => String(d.JOB_KEY) === String(j.JOB_KEY)) || {};
              const jp = (inMemoryDb.tables.Job_Posting || []).find(p => p.JOB_TITLE === jd.JOB_TITLE) || {};
              const appCount = (inMemoryDb.tables.Applies || []).filter(a => String(a.JOB_KEY) === String(j.JOB_KEY)).length;
              return { ...j, ...jd, ...jp, APPLICANT_COUNT: appCount };
            });
            const targetKey = binds.id ?? binds.jobKey ?? binds.JOBKEY;
            if (targetKey !== undefined) {
              rows = rows.filter(r => String(r.JOB_KEY) === String(targetKey));
            }
            if (binds.status) {
              rows = rows.filter(r => (r.JOB_STATUS || '').toLowerCase() === String(binds.status).toLowerCase());
            }
            if (binds.title) {
              const q = String(binds.title).replace(/%/g, '').toLowerCase();
              rows = rows.filter(r =>
                (r.JOB_TITLE || '').toLowerCase().includes(q) ||
                (r.JOB_ID || '').toLowerCase().includes(q) ||
                (r.DESCRIPTIVE || '').toLowerCase().includes(q)
              );
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Candidate') {
            let rows = (inMemoryDb.tables.Candidate || []).map(c => {
              const ca = (inMemoryDb.tables.Candidate_Address || []).find(a => String(a.CAND_ID) === String(c.CAND_ID)) || {};
              const ce = (inMemoryDb.tables.Candidate_Email || []).filter(e => String(e.CAND_ID) === String(c.CAND_ID)).map(e => e.EMAIL).join(', ');
              const cp = (inMemoryDb.tables.Candidate_Phone || []).filter(p => String(p.CAND_ID) === String(c.CAND_ID)).map(p => p.PHONE).join(', ');
              const edu = (inMemoryDb.tables.Education || []).find(e => e.EDU_ID === c.EDU_ID) || {};
              const app = (inMemoryDb.tables.Application || []).find(a => a.APP_ID === c.APP_ID) || {};
              const ap = (inMemoryDb.tables.Applies || []).find(x => String(x.CAND_ID) === String(c.CAND_ID));
              const jdByApp = (inMemoryDb.tables.Job_Details || []).find(d => String(d.APP_ID) === String(c.APP_ID));
              const targetJobKey = ap?.JOB_KEY ?? jdByApp?.JOB_KEY ?? 1;
              const job = (inMemoryDb.tables.Job || []).find(j => String(j.JOB_KEY) === String(targetJobKey)) || {};
              const jd = (inMemoryDb.tables.Job_Details || []).find(d => String(d.JOB_KEY) === String(targetJobKey)) || jdByApp || {};
              return {
                ...c,
                ...ca,
                CANDIDATE_NAME: `${c.FNAME || ''} ${c.LNAME || ''}`.trim(),
                EMAILS: ce,
                PHONES: cp,
                CGPA: edu.CGPA,
                SPECIALIZATION: edu.SPECIALIZATION,
                DEGREE_ID: edu.DEGREE_ID,
                UNIVERSITY_ID: edu.UNIVERSITY_ID,
                GRADUATION_YEAR: edu.GRADUATION_YEAR,
                GRADE_SCALE: edu.GRADE_SCALE,
                APP_STATUS: app.APP_STATUS,
                FINAL_RESULT: app.FINAL_RESULT,
                JOB_ID: job.JOB_ID || 'J001',
                JOB_TITLE: jd.JOB_TITLE || 'Software Engineer'
              };
            });
            const targetId = binds.id ?? binds.candId ?? binds.CANDID;
            if (targetId !== undefined) {
              rows = rows.filter(r => String(r.CAND_ID) === String(targetId));
            }
            if (binds.gender) {
              rows = rows.filter(r => (r.GENDER || '').toLowerCase() === String(binds.gender).toLowerCase());
            }
            if (binds.search) {
              const q = String(binds.search).replace(/%/g, '').toLowerCase();
              rows = rows.filter(r =>
                `${r.FNAME || ''} ${r.LNAME || ''}`.toLowerCase().includes(q) ||
                (r.CITY || '').toLowerCase().includes(q) ||
                String(r.CAND_ID || '').includes(q) ||
                (r.SPECIALIZATION || '').toLowerCase().includes(q) ||
                (r.EMAILS || '').toLowerCase().includes(q)
              );
            }
            const fetchMatch = topLevelUpper.match(/FETCH\s+FIRST\s+(\d+)\s+ROWS/i);
            if (fetchMatch) {
              rows = rows.slice(0, Number(fetchMatch[1]));
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Interview') {
            let rows = (inMemoryDb.tables.Interview || []).map(i => {
              const id = (inMemoryDb.tables.Interview_Details || []).find(d => String(d.INT_ID) === String(i.INT_ID)) || {};
              const cand = (inMemoryDb.tables.Candidate || []).find(c => String(c.INT_ID) === String(i.INT_ID));
              return { ...i, ...id, CAND_ID: cand?.CAND_ID, CANDIDATE_NAME: cand ? `${cand.FNAME} ${cand.LNAME}` : null };
            });
            const targetIntId = binds.intId ?? binds.INTID ?? binds.id;
            const targetCandId = binds.candId ?? binds.CANDID;
            if (targetCandId !== undefined || topLevelUpper.includes('C.CAND_ID =')) {
              const cid = targetCandId ?? targetIntId;
              rows = rows.filter(r => String(r.CAND_ID) === String(cid));
            } else if (targetIntId !== undefined) {
              rows = rows.filter(r => String(r.INT_ID) === String(targetIntId));
            }
            if (binds.mode) {
              rows = rows.filter(r => (r.INT_MODE || '').toLowerCase() === String(binds.mode).toLowerCase());
            }
            if (binds.search) {
              const q = String(binds.search).replace(/%/g, '').toLowerCase();
              rows = rows.filter(r =>
                (r.INT_ID || '').toLowerCase().includes(q) ||
                (r.CANDIDATE_NAME || '').toLowerCase().includes(q) ||
                (r.LOCATION || '').toLowerCase().includes(q) ||
                (r.FEEDBACK || '').toLowerCase().includes(q)
              );
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Employer') {
            let rows = (inMemoryDb.tables.Employer || []).map(e => {
              const ed = (inMemoryDb.tables.Employer_Details || []).find(d => String(d.EMP_ID) === String(e.EMP_ID)) || {};
              const phones = (inMemoryDb.tables.Employer_Phone || []).filter(p => String(p.EMP_ID) === String(e.EMP_ID)).map(p => p.PHONE_NO).join(', ');
              const rl = (inMemoryDb.tables.Recruitment_License || []).find(l => String(l.EMP_ID) === String(e.EMP_ID));
              const rec = (inMemoryDb.tables.Recruitment || []).find(r => String(r.EMP_ID) === String(e.EMP_ID));
              const ra = rec ? (inMemoryDb.tables.Recruitment_Agency || []).find(a => String(a.AGENCY_NO) === String(rec.AGENCY_NO)) : null;
              const ce = (inMemoryDb.tables.Company_Employer || []).find(c => String(c.EMP_ID) === String(e.EMP_ID));
              const co = ce ? (inMemoryDb.tables.Company || []).find(c => String(c.COMP_ID) === String(ce.COMP_ID)) : null;
              return {
                ...e,
                ...ed,
                PHONES: phones,
                LIC_NO: rl?.LIC_NO || 'LIC-2026',
                AGENCY_NAME: ra?.AGENCY_NAME || 'Direct',
                COMP_TYPE: co?.COMP_TYPE || 'Private Enterprise'
              };
            });
            const targetId = binds.id ?? binds.empId ?? binds.EMPID;
            if (targetId !== undefined) {
              rows = rows.filter(r => String(r.EMP_ID) === String(targetId));
            }
            if (binds.search) {
              const q = String(binds.search).replace(/%/g, '').toLowerCase();
              rows = rows.filter(r =>
                (r.COMPANY_NAME || '').toLowerCase().includes(q) ||
                (r.HEADQUARTER || '').toLowerCase().includes(q) ||
                (r.COMPANY_MAIL || '').toLowerCase().includes(q)
              );
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Skill') {
            let rows = (inMemoryDb.tables.Skill || []).map(s => {
              const sd = (inMemoryDb.tables.Skill_Details || []).find(d => d.SKILL_NAME === s.SKILL_NAME) || {};
              const reqCount = (inMemoryDb.tables.Requires || []).filter(r => String(r.SKILL_ID) === String(s.SKILL_ID)).length;
              const hasCount = (inMemoryDb.tables.Has || []).filter(h => String(h.SKILL_ID) === String(s.SKILL_ID)).length;
              return { ...s, ...sd, DEMAND_COUNT: reqCount, CANDIDATE_COUNT: hasCount };
            });
            const targetId = binds.id ?? binds.skillId ?? binds.SKILLID;
            if (targetId !== undefined) {
              rows = rows.filter(r => String(r.SKILL_ID) === String(targetId));
            }
            if (binds.category) {
              rows = rows.filter(r => (r.SKILL_CATEGORY || '').toLowerCase() === String(binds.category).toLowerCase());
            }
            if (binds.search) {
              const q = String(binds.search).replace(/%/g, '').toLowerCase();
              rows = rows.filter(r =>
                (r.SKILL_NAME || '').toLowerCase().includes(q) ||
                (r.SKILL_CATEGORY || '').toLowerCase().includes(q) ||
                (r.DESCRIPTION || '').toLowerCase().includes(q)
              );
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Application') {
            let rows = (inMemoryDb.tables.Application || []).map(a => {
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
                JOB_KEY: job?.JOB_KEY || jd?.JOB_KEY,
                JOB_ID: job?.JOB_ID,
                JOB_TITLE: jd?.JOB_TITLE
              };
            });
            const targetId = binds.id ?? binds.appId ?? binds.APPID;
            if (targetId !== undefined) {
              rows = rows.filter(r => String(r.APP_ID) === String(targetId));
            }
            if (binds.status) {
              rows = rows.filter(r => (r.APP_STATUS || '').toLowerCase() === String(binds.status).toLowerCase());
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Has') {
            let rows = (inMemoryDb.tables.Has || []).map(h => {
              const s = (inMemoryDb.tables.Skill || []).find(sk => String(sk.SKILL_ID) === String(h.SKILL_ID)) || {};
              const sd = (inMemoryDb.tables.Skill_Details || []).find(d => d.SKILL_NAME === s.SKILL_NAME) || {};
              return { ...h, ...s, ...sd };
            });
            const targetId = binds.candId ?? binds.CANDID ?? binds.id;
            if (targetId !== undefined) {
              rows = rows.filter(r => String(r.CAND_ID) === String(targetId));
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Requires') {
            let rows = (inMemoryDb.tables.Requires || []).map(r => {
              const s = (inMemoryDb.tables.Skill || []).find(sk => String(sk.SKILL_ID) === String(r.SKILL_ID)) || {};
              const sd = (inMemoryDb.tables.Skill_Details || []).find(d => d.SKILL_NAME === s.SKILL_NAME) || {};
              return { ...r, ...s, ...sd };
            });
            const targetKey = binds.jobKey ?? binds.JOBKEY ?? binds.id;
            if (targetKey !== undefined) {
              rows = rows.filter(r => String(r.JOB_KEY) === String(targetKey));
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Experience_Candidate') {
            let rows = (inMemoryDb.tables.Experience_Candidate || []).map(ec => {
              const exp = (inMemoryDb.tables.Experience || []).find(e => String(e.EXP_ID) === String(ec.EXP_ID)) || {};
              return { ...ec, ...exp };
            });
            const targetId = binds.candId ?? binds.CANDID ?? binds.id;
            if (targetId !== undefined) {
              rows = rows.filter(r => String(r.CAND_ID) === String(targetId));
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }

          if (tbl === 'Applies') {
            let rows = (inMemoryDb.tables.Applies || []).map(ap => {
              const j = (inMemoryDb.tables.Job || []).find(jb => String(jb.JOB_KEY) === String(ap.JOB_KEY)) || {};
              const jd = (inMemoryDb.tables.Job_Details || []).find(d => String(d.JOB_KEY) === String(ap.JOB_KEY)) || {};
              const c = (inMemoryDb.tables.Candidate || []).find(cd => String(cd.CAND_ID) === String(ap.CAND_ID)) || {};
              const app = (inMemoryDb.tables.Application || []).find(a => a.APP_ID === c.APP_ID) || {};
              return {
                ...ap,
                ...j,
                ...jd,
                CAND_ID: c.CAND_ID ?? ap.CAND_ID,
                FNAME: c.FNAME,
                LNAME: c.LNAME,
                GENDER: c.GENDER,
                APP_STATUS: app.APP_STATUS,
                FINAL_RESULT: app.FINAL_RESULT
              };
            });
            const targetCandId = binds.candId ?? binds.CANDID;
            const targetJobKey = binds.jobKey ?? binds.JOBKEY;
            if (targetCandId !== undefined) {
              rows = rows.filter(r => String(r.CAND_ID) === String(targetCandId));
            } else if (targetJobKey !== undefined) {
              rows = rows.filter(r => String(r.JOB_KEY) === String(targetJobKey));
            } else if (binds.id !== undefined) {
              if (topLevelUpper.includes('CAND_ID')) {
                rows = rows.filter(r => String(r.CAND_ID) === String(binds.id));
              } else if (topLevelUpper.includes('JOB_KEY')) {
                rows = rows.filter(r => String(r.JOB_KEY) === String(binds.id));
              }
            }
            return { rows, rowsAffected: 0, isOracle: false };
          }
        }

        // Raw table SELECT (no JOIN): filter by WHERE clause and ROWNUM / FETCH FIRST limit
        let rawRows = [...(inMemoryDb.tables[tbl] || [])];
        if (whereClause) {
          rawRows = rawRows.filter(r => rowMatchesWhere(r, whereClause, binds));
        }
        if (tbl === 'APP_AUDIT_LOG' && topLevelUpper.includes('ORDER BY LOG_ID DESC')) {
          rawRows.sort((a, b) => (Number(b.LOG_ID) || 0) - (Number(a.LOG_ID) || 0));
        }
        const rownumBind = binds.limit || binds.LIMIT;
        const rownumLiteralMatch = whereClause ? whereClause.match(/ROWNUM\s*<=\s*(\d+)/i) : null;
        const fetchFirstMatch = topLevelUpper.match(/FETCH\s+FIRST\s+(\d+)\s+ROWS/i);
        const maxRows = rownumBind
          ? Number(rownumBind)
          : rownumLiteralMatch
          ? Number(rownumLiteralMatch[1])
          : fetchFirstMatch
          ? Number(fetchFirstMatch[1])
          : null;
        if (maxRows && !isNaN(maxRows)) {
          rawRows = rawRows.slice(0, maxRows);
        }
        return { rows: rawRows, rowsAffected: 0, isOracle: false };
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

      // Parse column names and value expressions from SQL respecting nested parens (e.g. TO_DATE)
      const insertMatch = sql.match(/INSERT\s+INTO\s+[\w"]+\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)\s*$/i);
      if (insertMatch) {
        const cols = splitTopLevelCommas(insertMatch[1]).map(c => c.replace(/["']/g, '').trim().toUpperCase());
        const vals = splitTopLevelCommas(insertMatch[2]);
        cols.forEach((col, idx) => {
          const valExpr = vals[idx] !== undefined ? vals[idx] : '';
          newRow[col] = evalSqlExpr(valExpr, binds);
        });
      } else {
        // Fallback if no explicit column list
        for (const [k, v] of Object.entries(binds)) {
          newRow[k.toUpperCase()] = v;
        }
      }

      inMemoryDb.tables[tbl].push(newRow);
      console.log(`[InMemoryDB] INSERT into ${tbl}: row added (total ${inMemoryDb.tables[tbl].length})`);
      return { rows: [], rowsAffected: 1, isOracle: false };
    }
    return { rows: [], rowsAffected: 0, isOracle: false };
  }

  // ─── UPDATE <table> ────────────────────────────────────────────────────────────────
  if (normalizedSql.startsWith('UPDATE')) {
    const tblName = extractTableFromDML(sql);
    const tbl = tblName ? resolveTableName(tblName) : null;
    if (tbl && inMemoryDb.tables[tbl]) {
      const updateMatch = sql.match(/UPDATE\s+[\w"]+\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (!updateMatch) {
        return { rows: [], rowsAffected: 0, isOracle: false };
      }
      const setClause = updateMatch[1].trim();
      const whereClause = updateMatch[2] ? updateMatch[2].trim() : null;
      const assignments = splitTopLevelCommas(setClause);

      let affectedCount = 0;
      inMemoryDb.tables[tbl] = inMemoryDb.tables[tbl].map(row => {
        if (rowMatchesWhere(row, whereClause, binds)) {
          affectedCount++;
          const updated = { ...row };
          for (const assign of assignments) {
            const eqIdx = assign.indexOf('=');
            if (eqIdx !== -1) {
              const colName = assign.slice(0, eqIdx).replace(/["']/g, '').trim().toUpperCase();
              const valExpr = assign.slice(eqIdx + 1).trim();
              updated[colName] = evalSqlExpr(valExpr, binds);
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
      const whereMatch = sql.match(/\bWHERE\b\s+([\s\S]+)$/i);
      const whereClause = whereMatch ? whereMatch[1].trim() : null;
      const beforeLen = inMemoryDb.tables[tbl].length;

      if (whereClause) {
        inMemoryDb.tables[tbl] = inMemoryDb.tables[tbl].filter(row => !rowMatchesWhere(row, whereClause, binds));
      } else {
        const bindValues = Object.values(binds).map(v => String(v));
        inMemoryDb.tables[tbl] = inMemoryDb.tables[tbl].filter(row =>
          !Object.values(row).some(v => bindValues.includes(String(v)))
        );
      }

      const affected = beforeLen - inMemoryDb.tables[tbl].length;
      console.log(`[InMemoryDB] DELETE from ${tbl}: ${affected} row(s) removed`);
      return { rows: [], rowsAffected: affected, isOracle: false };
    }
    return { rows: [], rowsAffected: 0, isOracle: false };
  }

  return { rows: [], rowsAffected: 0, isOracle: false };
}

