import oracledb from 'oracledb';
import fs from 'fs';
import { initialSeedData } from '../backend/db/seedData.js';

async function setupFollows() {
  console.log('Connecting to local Oracle DB to create FOLLOWS table if not exists...');
  try {
    const conn = await oracledb.getConnection({
      user: 'system',
      password: 'oracle',
      connectString: 'localhost:1521/FREEPDB1'
    });

    const checkRes = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM USER_TABLES WHERE TABLE_NAME = 'FOLLOWS'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (checkRes.rows[0].CNT === 0) {
      await conn.execute(`
        CREATE TABLE FOLLOWS (
          CAND_ID NUMBER(5) NOT NULL,
          EMP_ID VARCHAR2(10) NOT NULL,
          FOLLOW_DATE DATE DEFAULT SYSDATE,
          CONSTRAINT PK_FOLLOWS PRIMARY KEY (CAND_ID, EMP_ID),
          CONSTRAINT FK_FOLLOWS_CAND FOREIGN KEY (CAND_ID) REFERENCES CANDIDATE(CAND_ID) ON DELETE CASCADE,
          CONSTRAINT FK_FOLLOWS_EMP FOREIGN KEY (EMP_ID) REFERENCES EMPLOYER(EMP_ID) ON DELETE CASCADE
        )
      `);
      console.log('Created FOLLOWS table in Oracle DB.');

      // Insert initial seed records
      const seedFollows = [
        { CAND_ID: 101, EMP_ID: 'E001', FOLLOW_DATE: '2026-08-01' },
        { CAND_ID: 101, EMP_ID: 'E006', FOLLOW_DATE: '2026-08-05' },
        { CAND_ID: 102, EMP_ID: 'E002', FOLLOW_DATE: '2026-08-02' },
        { CAND_ID: 103, EMP_ID: 'E003', FOLLOW_DATE: '2026-08-03' },
        { CAND_ID: 104, EMP_ID: 'E004', FOLLOW_DATE: '2026-08-04' },
        { CAND_ID: 105, EMP_ID: 'E005', FOLLOW_DATE: '2026-08-05' },
        { CAND_ID: 106, EMP_ID: 'E006', FOLLOW_DATE: '2026-08-06' },
        { CAND_ID: 107, EMP_ID: 'E007', FOLLOW_DATE: '2026-08-07' },
        { CAND_ID: 108, EMP_ID: 'E008', FOLLOW_DATE: '2026-08-08' },
        { CAND_ID: 109, EMP_ID: 'E009', FOLLOW_DATE: '2026-08-09' },
        { CAND_ID: 110, EMP_ID: 'E010', FOLLOW_DATE: '2026-08-10' },
        { CAND_ID: 126, EMP_ID: 'EMP016', FOLLOW_DATE: '2026-09-02' }
      ];

      for (const f of seedFollows) {
        await conn.execute(
          `INSERT INTO FOLLOWS (CAND_ID, EMP_ID, FOLLOW_DATE) VALUES (:candId, :empId, TO_DATE(:fDate, 'YYYY-MM-DD'))`,
          { candId: f.CAND_ID, empId: f.EMP_ID, fDate: f.FOLLOW_DATE }
        );
      }
      await conn.commit();
      console.log(`Seeded ${seedFollows.length} records into FOLLOWS table in Oracle.`);
    } else {
      console.log('FOLLOWS table already exists in Oracle DB.');
    }

    await conn.close();
  } catch (err) {
    console.warn('Oracle FOLLOWS setup note:', err.message);
  }

  // Also ensure seedData.js has FOLLOWS
  if (!initialSeedData.FOLLOWS) {
    initialSeedData.FOLLOWS = [
      { CAND_ID: 101, EMP_ID: 'E001', FOLLOW_DATE: '2026-08-01' },
      { CAND_ID: 101, EMP_ID: 'E006', FOLLOW_DATE: '2026-08-05' },
      { CAND_ID: 102, EMP_ID: 'E002', FOLLOW_DATE: '2026-08-02' },
      { CAND_ID: 103, EMP_ID: 'E003', FOLLOW_DATE: '2026-08-03' },
      { CAND_ID: 104, EMP_ID: 'E004', FOLLOW_DATE: '2026-08-04' },
      { CAND_ID: 105, EMP_ID: 'E005', FOLLOW_DATE: '2026-08-05' },
      { CAND_ID: 106, EMP_ID: 'E006', FOLLOW_DATE: '2026-08-06' },
      { CAND_ID: 107, EMP_ID: 'E007', FOLLOW_DATE: '2026-08-07' },
      { CAND_ID: 108, EMP_ID: 'E008', FOLLOW_DATE: '2026-08-08' },
      { CAND_ID: 109, EMP_ID: 'E009', FOLLOW_DATE: '2026-08-09' },
      { CAND_ID: 110, EMP_ID: 'E010', FOLLOW_DATE: '2026-08-10' },
      { CAND_ID: 126, EMP_ID: 'EMP016', FOLLOW_DATE: '2026-09-02' }
    ];

    const content = `// Auto-synced complete dataset from live Oracle Database 23ai
export const initialSeedData = ${JSON.stringify(initialSeedData, null, 2)};
`;
    fs.writeFileSync('backend/db/seedData.js', content, 'utf8');
    console.log('Added FOLLOWS table to backend/db/seedData.js!');
  }
}

setupFollows().catch(console.error);
