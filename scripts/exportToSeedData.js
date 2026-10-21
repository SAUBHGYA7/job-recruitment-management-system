import oracledb from 'oracledb';
import fs from 'fs';

async function exportFullData() {
  const conn = await oracledb.getConnection({
    user: 'system',
    password: 'oracle',
    connectString: 'localhost:1521/FREEPDB1'
  });

  const tablesRes = await conn.execute(
    `SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  const tableNames = tablesRes.rows.map(r => r.TABLE_NAME);
  console.log(`Found ${tableNames.length} tables in Oracle.`);

  const fullData = {};

  for (const tName of tableNames) {
    try {
      const res = await conn.execute(
        `SELECT * FROM "${tName}"`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      fullData[tName] = res.rows;
      console.log(`Table ${tName}: ${res.rows.length} rows`);
    } catch (err) {
      console.warn(`Could not query table ${tName}:`, err.message);
      fullData[tName] = [];
    }
  }

  await conn.close();

  // Also include added records from the previous test session:
  // Candidate 126: Vikramaditya Rao
  // Job 21: Lead AI Engineer
  // Employer: EMP016 / Apex Technologies
  // Application: APP026
  // Interview: INT026
  // Skill: Next.js

  // Check if 126 already exists in CANDIDATE
  if (!fullData.CANDIDATE.some(c => c.CAND_ID === 126)) {
    fullData.CANDIDATE.push({
      CAND_ID: 126,
      FNAME: "Vikramaditya",
      MNAME: "",
      LNAME: "Rao",
      DOB: "1998-05-15",
      GENDER: "Male",
      REG_DATE: "2026-09-04",
      EDU_ID: "ED026",
      APP_ID: "APP026",
      DEP_ID: "D026",
      INT_ID: "INT026"
    });
    fullData.CANDIDATE_ADDRESS.push({
      CAND_ID: 126,
      HOUSE_NO: "42",
      CITY: "Bengaluru",
      STREET: "Koramangala 5th Block"
    });
    fullData.CANDIDATE_PHONE.push({
      CAND_ID: 126,
      PHONE: "9876543210"
    });
    fullData.CANDIDATE_EMAIL.push({
      CAND_ID: 126,
      EMAIL: "vikramaditya.rao@techmail.com"
    });
  }

  // Employer EMP016
  if (!fullData.EMPLOYER.some(e => e.EMP_ID === 'EMP016')) {
    fullData.EMPLOYER.push({
      EMP_ID: "EMP016",
      COMPANY_NAME: "Apex Technologies",
      FOUNDED_YEAR: 2018
    });
    fullData.EMPLOYER_DETAILS.push({
      EMP_ID: "EMP016",
      COMPANY_MAIL: "contact@apextech.io",
      WEBSITE: "https://apextech.io",
      HEADQUARTER: "Bengaluru"
    });
    fullData.EMPLOYER_PHONE.push({
      EMP_ID: "EMP016",
      PHONE_NO: "9876543219"
    });
  }

  // Job 21
  if (!fullData.JOB.some(j => j.JOB_KEY === 21)) {
    fullData.JOB.push({
      JOB_KEY: 21,
      JOB_ID: "J021",
      JOB_STATUS: "Open",
      SALARY: 145000
    });
    fullData.JOB_DETAILS.push({
      JOB_KEY: 21,
      JOB_TITLE: "Lead AI Engineer",
      DESCRIPTIVE: "Lead cutting-edge generative AI, LLM systems, and ML pipeline development.",
      APP_ID: "APP026"
    });
    fullData.JOB_POSTING.push({
      JOB_TITLE: "Lead AI Engineer",
      CLOSING_DATE: "2026-12-31",
      POSTED_DATE: "2026-09-01"
    });
  }

  // Application APP026
  if (!fullData.APPLICATION.some(a => a.APP_ID === 'APP026')) {
    fullData.APPLICATION.push({
      APP_ID: "APP026",
      APP_STATUS: "Shortlisted",
      FINAL_RESULT: "Selected"
    });
    fullData.APPLICATION_INFO.push({
      APP_ID: "APP026",
      APP_DATE: "2026-09-02"
    });
    fullData.APPLICATION_DATE.push({
      APP_DATE: "2026-09-02",
      OFFER_LETTER: "OFFER_APP026.pdf",
      FINAL_RESULT: "Selected"
    });
  }

  // Interview INT026
  if (!fullData.INTERVIEW.some(i => i.INT_ID === 'INT026')) {
    fullData.INTERVIEW.push({
      INT_ID: "INT026",
      INT_DATE: "2026-09-05",
      INT_TIME: "11:00"
    });
    fullData.INTERVIEW_DETAILS.push({
      INT_ID: "INT026",
      INT_MODE: "Online",
      LOCATION: "Bengaluru",
      INT_STATUS: "Completed",
      SCORE: 96,
      FEEDBACK: "Exceptional architecture skills and mastery of full-stack AI development."
    });
  }

  // Skill SK016
  if (!fullData.SKILL.some(s => s.SKILL_ID === 'SK016')) {
    fullData.SKILL.push({
      SKILL_ID: "SK016",
      SKILL_NAME: "Next.js"
    });
    fullData.SKILL_DETAILS.push({
      SKILL_NAME: "Next.js",
      SKILL_CATEGORY: "Frontend & Full Stack",
      DESCRIPTION: "React full stack framework with server components and edge rendering"
    });
  }

  // Also write to live Oracle so local Oracle DB has these records as well!
  try {
    const conn2 = await oracledb.getConnection({
      user: 'system',
      password: 'oracle',
      connectString: 'localhost:1521/FREEPDB1'
    });
    // Insert if not exists in Oracle
    const candCheck = await conn2.execute(`SELECT COUNT(*) AS CNT FROM CANDIDATE WHERE CAND_ID = 126`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    if (candCheck.rows[0].CNT === 0) {
      await conn2.execute(`INSERT INTO CANDIDATE (CAND_ID, FNAME, MNAME, LNAME, DOB, GENDER, REG_DATE, EDU_ID, APP_ID, DEP_ID, INT_ID) VALUES (126, 'Vikramaditya', '', 'Rao', TO_DATE('1998-05-15','YYYY-MM-DD'), 'Male', TO_DATE('2026-09-04','YYYY-MM-DD'), 'ED026', 'APP026', 'D026', 'INT026')`);
      await conn2.execute(`INSERT INTO CANDIDATE_ADDRESS (CAND_ID, HOUSE_NO, CITY, STREET) VALUES (126, '42', 'Bengaluru', 'Koramangala 5th Block')`);
      await conn2.execute(`INSERT INTO CANDIDATE_PHONE (CAND_ID, PHONE) VALUES (126, '9876543210')`);
      await conn2.execute(`INSERT INTO CANDIDATE_EMAIL (CAND_ID, EMAIL) VALUES (126, 'vikramaditya.rao@techmail.com')`);
      console.log('Inserted Vikramaditya Rao into local Oracle DB.');
    }
    const empCheck = await conn2.execute(`SELECT COUNT(*) AS CNT FROM EMPLOYER WHERE EMP_ID = 'EMP016'`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    if (empCheck.rows[0].CNT === 0) {
      await conn2.execute(`INSERT INTO EMPLOYER (EMP_ID, COMPANY_NAME, FOUNDED_YEAR) VALUES ('EMP016', 'Apex Technologies', 2018)`);
      await conn2.execute(`INSERT INTO EMPLOYER_DETAILS (EMP_ID, COMPANY_MAIL, WEBSITE, HEADQUARTER) VALUES ('EMP016', 'contact@apextech.io', 'https://apextech.io', 'Bengaluru')`);
      await conn2.execute(`INSERT INTO EMPLOYER_PHONE (EMP_ID, PHONE_NO) VALUES ('EMP016', '9876543219')`);
      console.log('Inserted Apex Technologies into local Oracle DB.');
    }
    const jobCheck = await conn2.execute(`SELECT COUNT(*) AS CNT FROM JOB WHERE JOB_KEY = 21`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    if (jobCheck.rows[0].CNT === 0) {
      await conn2.execute(`INSERT INTO JOB (JOB_KEY, JOB_ID, JOB_STATUS, SALARY) VALUES (21, 'J021', 'Open', 145000)`);
      await conn2.execute(`INSERT INTO JOB_DETAILS (JOB_KEY, JOB_TITLE, DESCRIPTIVE, APP_ID) VALUES (21, 'Lead AI Engineer', 'Lead cutting-edge generative AI, LLM systems, and ML pipeline development.', 'APP026')`);
      await conn2.execute(`INSERT INTO JOB_POSTING (JOB_TITLE, CLOSING_DATE, POSTED_DATE) VALUES ('Lead AI Engineer', TO_DATE('2026-12-31','YYYY-MM-DD'), TO_DATE('2026-09-01','YYYY-MM-DD'))`);
      console.log('Inserted Lead AI Engineer into local Oracle DB.');
    }
    await conn2.commit();
    await conn2.close();
  } catch (err) {
    console.warn('Oracle insert error (skipping if existing):', err.message);
  }

  // Write backend/db/seedData.js cleanly
  const fileContent = `// Auto-synced complete dataset from live Oracle Database 23ai
export const initialSeedData = ${JSON.stringify(fullData, null, 2)};
`;

  fs.writeFileSync('backend/db/seedData.js', fileContent, 'utf8');
  console.log('Successfully wrote backend/db/seedData.js!');
}

exportFullData().catch(err => {
  console.error('Export error:', err);
  process.exit(1);
});
