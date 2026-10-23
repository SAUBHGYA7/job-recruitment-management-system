import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Robust tokenizer for SQL value lists, distinguishing quoted strings,
 * numeric literals, DATE literals, and NULLs.
 */
function parseSqlValues(valuesStr) {
  const values = [];
  let current = '';
  let inString = false;
  let wasQuoted = false;
  let i = 0;
  const str = valuesStr.trim();

  while (i < str.length) {
    const ch = str[i];

    if (inString) {
      if (ch === "'") {
        if (i + 1 < str.length && str[i + 1] === "'") {
          current += "'";
          i += 2;
          continue;
        } else {
          inString = false;
          i++;
          continue;
        }
      } else {
        current += ch;
        i++;
        continue;
      }
    }

    if (ch === "'") {
      inString = true;
      wasQuoted = true;
      i++;
      continue;
    }

    if (ch === ',') {
      values.push(cleanToken(current, wasQuoted));
      current = '';
      wasQuoted = false;
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  if (current.trim().length > 0 || str.endsWith(',') || wasQuoted) {
    values.push(cleanToken(current, wasQuoted));
  }

  return values;
}

function cleanToken(raw, wasQuoted) {
  let val = raw.trim();

  // If token is DATE 'YYYY-MM-DD'
  if (val.toUpperCase().startsWith('DATE')) {
    const datePart = val.substring(4).trim().replace(/^['"]|['"]$/g, '');
    return datePart;
  }

  if (!wasQuoted) {
    if (!val || val.toUpperCase() === 'NULL') {
      return null;
    }
    if (!isNaN(val) && val !== '') {
      return val.includes('.') ? parseFloat(val) : parseInt(val, 10);
    }
  }

  return val;
}

export function parseSeedSql(filePath) {
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  const tableData = {};

  const lines = sqlContent.split('\n');
  const cleanLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.startsWith('SET DEFINE')) {
      continue;
    }
    const commentIdx = line.indexOf('--');
    if (commentIdx !== -1) {
      cleanLines.push(line.substring(0, commentIdx));
    } else {
      cleanLines.push(line);
    }
  }

  const statementBlob = cleanLines.join(' ');
  const insertRegex = /INSERT\s+INTO\s+([A-Za-z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^;]+?)\);/gi;

  let match;
  let totalInserts = 0;

  while ((match = insertRegex.exec(statementBlob)) !== null) {
    const rawTable = match[1].trim();
    const colsStr = match[2].trim();
    const valsStr = match[3].trim();

    const cols = colsStr.split(',').map(c => c.trim().toLowerCase());
    const vals = parseSqlValues(valsStr);

    if (cols.length !== vals.length) {
      console.warn(`[Parse Warning] Column/Value count mismatch in ${rawTable}: ${cols.length} cols vs ${vals.length} vals`);
    }

    const row = {};
    for (let c = 0; c < cols.length; c++) {
      row[cols[c]] = vals[c];
    }

    const tableKey = rawTable;
    if (!tableData[tableKey]) {
      tableData[tableKey] = [];
    }
    tableData[tableKey].push(row);
    totalInserts++;
  }

  return { tableData, totalInserts };
}

// CLI check
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const seedPath = path.resolve(__dirname, '../database/seed.sql');
  const { tableData, totalInserts } = parseSeedSql(seedPath);
  console.log(`Parsed ${totalInserts} total inserts across ${Object.keys(tableData).length} tables:\n`);
  const sorted = Object.entries(tableData).sort(([a], [b]) => a.localeCompare(b));
  for (const [tbl, rows] of sorted) {
    console.log(`  - ${tbl.padEnd(25)} : ${rows.length} rows`);
  }
}
