import { executeQuery, getDbStatus } from '../db/oracle.js';

export async function getDesignerDashboard(req, res, next) {
  try {
    const tableRes = await executeQuery('SELECT COUNT(*) AS count FROM user_tables');
    const colRes = await executeQuery('SELECT COUNT(*) AS count FROM user_tab_columns');
    const pkRes = await executeQuery("SELECT COUNT(*) AS count FROM user_constraints WHERE constraint_type = 'P'");
    const fkRes = await executeQuery("SELECT COUNT(*) AS count FROM user_constraints WHERE constraint_type = 'R'");
    const checkRes = await executeQuery("SELECT COUNT(*) AS count FROM user_constraints WHERE constraint_type = 'C'");
    const uniqueRes = await executeQuery("SELECT COUNT(*) AS count FROM user_constraints WHERE constraint_type = 'U'");
    const totalConstRes = await executeQuery("SELECT COUNT(*) AS count FROM user_constraints");

    const totalTables = tableRes.rows[0]?.COUNT ?? 41;
    const totalColumns = colRes.rows[0]?.COUNT ?? 150;
    const totalPrimaryKeys = pkRes.rows[0]?.COUNT ?? 41;
    const totalForeignKeys = fkRes.rows[0]?.COUNT ?? 35;
    const totalCheckConstraints = checkRes.rows[0]?.COUNT ?? 15;
    const totalUniqueConstraints = uniqueRes.rows[0]?.COUNT ?? 5;
    const totalConstraints = totalConstRes.rows[0]?.COUNT ?? 96;

    // Table row counts directly from Oracle
    const tablesListRes = await executeQuery('SELECT table_name FROM user_tables ORDER BY table_name ASC');
    const tableRowCounts = await Promise.all(tablesListRes.rows.slice(0, 15).map(async (r) => {
      let cnt = 0;
      try {
        const countRes = await executeQuery(`SELECT COUNT(*) AS cnt FROM "${r.TABLE_NAME}"`);
        cnt = countRes.rows[0]?.CNT ?? 0;
      } catch {
        cnt = 0;
      }
      return {
        tableName: r.TABLE_NAME,
        rowCount: cnt
      };
    }));

    const normalizationMetrics = {
      decomposedRelations: [
        { original: 'JOB', decomposedInto: ['JOB', 'JOB_DETAILS', 'JOB_POSTING'], reason: 'Eliminated partial FDs: job_title -> closing_date, posted_date into BCNF' },
        { original: 'CANDIDATE', decomposedInto: ['CANDIDATE', 'CANDIDATE_ADDRESS', 'CANDIDATE_PHONE', 'CANDIDATE_EMAIL'], reason: 'Separated multi-valued phone/email & address dependency' },
        { original: 'EDUCATION', decomposedInto: ['EDUCATION', 'EDUCATION_DEGREE', 'EDUCATION_END'], reason: 'Eliminated partial FDs: degree -> university, start_year' },
        { original: 'APPLICATION', decomposedInto: ['APPLICATION', 'APPLICATION_DATE', 'APPLICATION_INFO'], reason: 'Eliminated partial dependency on app_date' },
        { original: 'EXPERIENCE', decomposedInto: ['EXPERIENCE', 'EXPERIENCE_CANDIDATE', 'EXPERIENCE_COMPANY'], reason: 'Separated candidate work history and company job titles' },
        { original: 'LOCATION', decomposedInto: ['LOCATION', 'STATE_CITY'], reason: 'Eliminated transitive FD: state -> city' },
        { original: 'EMPLOYER', decomposedInto: ['EMPLOYER', 'EMPLOYER_DETAILS', 'EMPLOYER_PHONE'], reason: 'Multi-valued phone & employer details separation' },
        { original: 'SKILL', decomposedInto: ['SKILL', 'SKILL_DETAILS'], reason: 'Separated skill description dependency' }
      ],
      intactRelations: [
        { name: 'DEPENDENT', reason: 'Zero non-trivial partial/transitive FDs found in DA1 analysis' },
        { name: 'FREELANCER', reason: 'Candidate Subtype entity with distinct 1:1 attributes' },
        { name: 'FRESHER', reason: 'Candidate Subtype entity with distinct 1:1 attributes' },
        { name: 'EXPERIENCED', reason: 'Candidate Subtype entity with distinct 1:1 attributes' }
      ]
    };

    res.json({
      success: true,
      data: {
        metrics: {
          totalTables,
          totalColumns,
          totalPrimaryKeys,
          totalForeignKeys,
          totalCheckConstraints,
          totalUniqueConstraints,
          totalConstraints
        },
        tableRowCounts,
        normalizationMetrics,
        dbStatus: getDbStatus()
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getTables(req, res, next) {
  try {
    const tablesRes = await executeQuery(`
      SELECT t.table_name, t.tablespace_name,
             (SELECT COUNT(*) FROM user_tab_columns WHERE table_name = t.table_name) AS col_count,
             (SELECT constraint_name FROM user_constraints WHERE table_name = t.table_name AND constraint_type = 'P' AND ROWNUM = 1) AS pk_name,
             (SELECT COUNT(*) FROM user_constraints WHERE table_name = t.table_name AND constraint_type = 'R') AS fk_count
      FROM user_tables t
      ORDER BY t.table_name ASC
    `);

    const tables = await Promise.all(tablesRes.rows.map(async (r) => {
      let cnt = 0;
      try {
        const countRes = await executeQuery(`SELECT COUNT(*) AS cnt FROM "${r.TABLE_NAME}"`);
        cnt = countRes.rows[0]?.CNT ?? 0;
      } catch {
        cnt = 0;
      }

      return {
        tableName: r.TABLE_NAME,
        columnCount: r.COL_COUNT ?? 0,
        primaryKey: r.PK_NAME || 'NONE',
        foreignKeyCount: r.FK_COUNT ?? 0,
        rowCount: cnt,
        tablespace: r.TABLESPACE_NAME || 'USERS',
        status: 'VALID'
      };
    }));

    res.json({ success: true, total: tables.length, data: tables });
  } catch (error) {
    next(error);
  }
}

export async function getTableDetails(req, res, next) {
  try {
    const { tableName } = req.params;

    const checkTable = await executeQuery(
      `SELECT table_name FROM user_tables WHERE UPPER(table_name) = UPPER(:tableName)`,
      { tableName }
    );

    if (checkTable.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Table ${tableName} not found in Oracle schema.` });
    }

    const upper = checkTable.rows[0].TABLE_NAME;

    const colsRes = await executeQuery(`
      SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
      FROM user_tab_columns
      WHERE table_name = :tName
      ORDER BY column_id ASC
    `, { tName: upper });

    const pksRes = await executeQuery(`
      SELECT cc.column_name
      FROM user_constraints c
      JOIN user_cons_columns cc ON cc.constraint_name = c.constraint_name
      WHERE c.table_name = :tName AND c.constraint_type = 'P'
    `, { tName: upper });
    const pkColumns = new Set(pksRes.rows.map(r => r.COLUMN_NAME));

    const fksRes = await executeQuery(`
      SELECT cc.column_name
      FROM user_constraints c
      JOIN user_cons_columns cc ON cc.constraint_name = c.constraint_name
      WHERE c.table_name = :tName AND c.constraint_type = 'R'
    `, { tName: upper });
    const fkColumns = new Set(fksRes.rows.map(r => r.COLUMN_NAME));

    const columns = colsRes.rows.map(c => ({
      COLUMN_NAME: c.COLUMN_NAME,
      DATA_TYPE: c.DATA_TYPE,
      DATA_LENGTH: c.DATA_LENGTH,
      DATA_PRECISION: c.DATA_PRECISION,
      DATA_SCALE: c.DATA_SCALE,
      NULLABLE: c.NULLABLE,
      isPrimaryKey: pkColumns.has(c.COLUMN_NAME),
      isForeignKey: fkColumns.has(c.COLUMN_NAME)
    }));

    const consRes = await executeQuery(`
      SELECT constraint_name, constraint_type, search_condition, r_constraint_name, delete_rule, status
      FROM user_constraints
      WHERE table_name = :tName
      ORDER BY constraint_type ASC
    `, { tName: upper });

    let sampleRows = [];
    try {
      const dataRes = await executeQuery(`SELECT * FROM "${upper}" FETCH FIRST 20 ROWS ONLY`);
      sampleRows = dataRes.rows;
    } catch {
      sampleRows = [];
    }

    res.json({
      success: true,
      data: {
        tableName: upper,
        columns,
        constraints: consRes.rows,
        sampleRows,
        rowCount: sampleRows.length
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getColumns(req, res, next) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT column_name, table_name, data_type, data_length, data_precision, data_scale, nullable
      FROM user_tab_columns
      WHERE 1=1
    `;
    const binds = {};
    if (search) {
      sql += ` AND (LOWER(column_name) LIKE '%' || LOWER(:search) || '%' OR LOWER(table_name) LIKE '%' || LOWER(:search) || '%')`;
      binds.search = search;
    }
    sql += ` ORDER BY table_name, column_id`;

    const result = await executeQuery(sql, binds);
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getPrimaryKeys(req, res, next) {
  try {
    const sql = `
      SELECT c.constraint_name, c.table_name, c.status,
             (SELECT LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY position)
              FROM user_cons_columns WHERE constraint_name = c.constraint_name) AS columns
      FROM user_constraints c
      WHERE c.constraint_type = 'P'
      ORDER BY c.table_name ASC
    `;
    const result = await executeQuery(sql);
    const pks = (result.rows || []).map(r => {
      let cols = [];
      const rawCols = r.COLUMNS !== undefined ? r.COLUMNS : r.columns;
      if (Array.isArray(rawCols)) {
        cols = rawCols.filter(Boolean);
      } else if (typeof rawCols === 'string') {
        cols = rawCols.split(',').map(c => c.trim()).filter(Boolean);
      }
      return {
        constraintName: r.CONSTRAINT_NAME || r.constraintName || '',
        tableName: r.TABLE_NAME || r.tableName || '',
        columns: cols,
        status: r.STATUS || r.status || 'ENABLED'
      };
    });
    res.json({ success: true, total: pks.length, data: pks });
  } catch (error) {
    next(error);
  }
}

export async function getForeignKeys(req, res, next) {
  try {
    const sql = `
      SELECT c.constraint_name, c.table_name, c.r_constraint_name, c.delete_rule, c.status,
             (SELECT LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY position)
              FROM user_cons_columns WHERE constraint_name = c.constraint_name) AS columns,
             (SELECT table_name FROM user_constraints WHERE constraint_name = c.r_constraint_name) AS ref_table
      FROM user_constraints c
      WHERE c.constraint_type = 'R'
      ORDER BY c.table_name ASC
    `;
    const result = await executeQuery(sql);
    const fks = result.rows.map(r => ({
      constraintName: r.CONSTRAINT_NAME,
      tableName: r.TABLE_NAME,
      columns: (r.COLUMNS || '').split(', '),
      referencedTable: r.REF_TABLE || r.R_CONSTRAINT_NAME,
      deleteRule: r.DELETE_RULE || 'NO ACTION',
      status: r.STATUS
    }));
    res.json({ success: true, total: fks.length, data: fks });
  } catch (error) {
    next(error);
  }
}

export async function getConstraints(req, res, next) {
  try {
    const { type } = req.query;
    let sql = `
      SELECT c.constraint_name, c.table_name, c.constraint_type, c.search_condition, c.r_constraint_name, c.status,
             (SELECT LISTAGG(column_name, ', ') WITHIN GROUP (ORDER BY position)
              FROM user_cons_columns WHERE constraint_name = c.constraint_name) AS columns
      FROM user_constraints c
      WHERE 1=1
    `;
    const binds = {};
    if (type && type !== 'ALL') {
      sql += ` AND c.constraint_type = :type`;
      binds.type = type;
    }
    sql += ` ORDER BY c.table_name, c.constraint_type`;

    const result = await executeQuery(sql, binds);
    const typeNames = { P: 'PRIMARY KEY', R: 'FOREIGN KEY', C: 'CHECK', U: 'UNIQUE' };

    const constraints = result.rows.map(r => ({
      constraintName: r.CONSTRAINT_NAME,
      tableName: r.TABLE_NAME,
      type: typeNames[r.CONSTRAINT_TYPE] || r.CONSTRAINT_TYPE,
      typeCode: r.CONSTRAINT_TYPE,
      columns: (r.COLUMNS || '').split(', ').filter(Boolean),
      searchCondition: r.SEARCH_CONDITION,
      rConstraintName: r.R_CONSTRAINT_NAME,
      status: r.STATUS
    }));

    res.json({ success: true, total: constraints.length, data: constraints });
  } catch (error) {
    next(error);
  }
}

export async function getRelationships(req, res, next) {
  try {
    const tablesRes = await executeQuery('SELECT table_name FROM user_tables ORDER BY table_name ASC');
    const fksRes = await executeQuery(`
      SELECT c.constraint_name, c.table_name, c.r_constraint_name,
             (SELECT table_name FROM user_constraints WHERE constraint_name = c.r_constraint_name) AS ref_table
      FROM user_constraints c
      WHERE c.constraint_type = 'R'
    `);

    const nodes = await Promise.all(tablesRes.rows.map(async (t) => {
      const name = t.TABLE_NAME;
      let group = 'entity';
      if (['FREELANCER', 'FRESHER', 'EXPERIENCED'].includes(name)) group = 'subtype';
      else if (['CANDIDATE_ADDRESS', 'CANDIDATE_PHONE', 'CANDIDATE_EMAIL', 'JOB_DETAILS', 'JOB_POSTING', 'EDUCATION_DEGREE', 'EDUCATION_END', 'APPLICATION_DATE', 'APPLICATION_INFO', 'EMPLOYER_DETAILS', 'EMPLOYER_PHONE', 'SKILL_DETAILS', 'STATE_CITY'].includes(name)) group = 'decomposed';
      else if (['REQUIRES', 'MATCHED_TO', 'APPLIES', 'PREFERS', 'REFERS', 'ASSESSED_FOR', 'HAS', 'COMPANY_EMPLOYER', 'RECRUITMENT'].includes(name)) group = 'relationship';
      else if (['APP_USERS', 'APP_AUDIT_LOG'].includes(name)) group = 'security';

      let rowCount = 0;
      try {
        const countRes = await executeQuery(`SELECT COUNT(*) AS cnt FROM "${name}"`);
        rowCount = countRes.rows[0]?.CNT ?? 0;
      } catch {
        rowCount = 0;
      }

      const colsRes = await executeQuery(`SELECT column_name, data_type FROM user_tab_columns WHERE table_name = :tName`, { tName: name });

      return {
        id: name,
        label: name,
        group,
        rowCount,
        columnCount: colsRes.rows.length,
        columns: colsRes.rows.map(c => ({ name: c.COLUMN_NAME, type: c.DATA_TYPE }))
      };
    }));

    const edges = fksRes.rows
      .filter(r => r.REF_TABLE)
      .map(r => ({
        from: r.TABLE_NAME,
        to: r.REF_TABLE,
        label: r.CONSTRAINT_NAME
      }));

    res.json({ success: true, data: { nodes, edges } });
  } catch (error) {
    next(error);
  }
}

export async function getNormalizationGuide(req, res, next) {
  const docs = [
    {
      entity: 'Candidate',
      initialRelation: 'Candidate(cand_id, fname, mname, lname, dob, gender, reg_date, house_no, city, street, email, phone, edu_id, app_id, dep_id, int_id)',
      bcnfStatus: 'Fully Decomposed into BCNF',
      fdList: [
        'cand_id -> fname, mname, lname, dob, gender, reg_date, edu_id, app_id, dep_id, int_id (Primary Superkey)',
        'cand_id ->> phone (Multi-Valued Attribute)',
        'cand_id ->> email (Multi-Valued Attribute)',
        'cand_id -> house_no, city, street (Candidate Address Composite)'
      ],
      problem: 'Candidate Phone and Email are multi-valued attributes violating 1NF/4NF; address composite generates redundant rows for multi-contact candidates.',
      decomposedTables: [
        { name: 'Candidate', schema: 'Candidate(cand_id [PK], fname, mname, lname, dob, gender, reg_date, edu_id [FK], app_id [FK], dep_id [FK], int_id [FK])' },
        { name: 'Candidate_Address', schema: 'Candidate_Address(cand_id [PK, FK], house_no, city, street)' },
        { name: 'Candidate_Phone', schema: 'Candidate_Phone(cand_id [PK, FK], phone [PK])' },
        { name: 'Candidate_Email', schema: 'Candidate_Email(cand_id [PK, FK], email [PK])' }
      ]
    },
    {
      entity: 'Job',
      initialRelation: 'Job(job_key, job_id, job_status, salary, job_title, descriptive, closing_date, posted_date, app_id)',
      bcnfStatus: 'Fully Decomposed into BCNF',
      fdList: [
        'job_key -> job_id, job_status, salary (Primary Key)',
        'job_key -> job_title, descriptive, app_id',
        'job_title -> closing_date, posted_date (Partial Dependency Violation: Non-trivial FD where job_title is not a candidate key)'
      ],
      problem: 'Closing date and posted date depend purely on job_title rather than the job_key instance, introducing update and deletion anomalies in 3NF.',
      decomposedTables: [
        { name: 'Job', schema: 'Job(job_key [PK], job_id [UK], job_status, salary)' },
        { name: 'Job_Details', schema: 'Job_Details(job_key [PK, FK], job_title, descriptive, app_id [FK])' },
        { name: 'Job_Posting', schema: 'Job_Posting(job_title [PK], closing_date, posted_date)' }
      ]
    },
    {
      entity: 'Education',
      initialRelation: 'Education(edu_id, cgpa, specialization, degree, university, start_year, end_year)',
      bcnfStatus: 'Fully Decomposed into BCNF',
      fdList: [
        'edu_id -> cgpa, specialization (Primary Superkey)',
        'degree -> university, start_year (Degree Level Metadata FD)',
        'edu_id, degree -> end_year'
      ],
      problem: 'Degree details (university, start_year) depended on degree rather than edu_id superkey.',
      decomposedTables: [
        { name: 'Education', schema: 'Education(edu_id [PK], cgpa, specialization)' },
        { name: 'Education_Degree', schema: 'Education_Degree(degree [PK], university, start_year)' },
        { name: 'Education_End', schema: 'Education_End(edu_id [PK, FK], degree [PK, FK], end_year)' }
      ]
    },
    {
      entity: 'Location',
      initialRelation: 'Location(pincode, country, state, city)',
      bcnfStatus: 'Fully Decomposed into BCNF',
      fdList: [
        'pincode -> country, state (Primary Superkey)',
        'state -> city (Transitive Functional Dependency)'
      ],
      problem: 'City determination through state violates BCNF condition since state is not a superkey.',
      decomposedTables: [
        { name: 'Location', schema: 'Location(pincode [PK], country, state)' },
        { name: 'State_City', schema: 'State_City(state [PK], city [PK])' }
      ]
    }
  ];

  res.json({ success: true, data: docs });
}

export const getNormalizationOverview = getNormalizationGuide;
