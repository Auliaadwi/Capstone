import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : null;

export const isDatabaseEnabled = Boolean(pool);

export const getDb = () => pool;

export const saveCvAnalysis = async ({ fileName, extractedSkills, skillGap, recommendation, confidence }) => {
  if (!pool) {
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Demo User', 'demo@skillmap.local']
    );

    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO cvs (user_id, file_url, file_name)
       VALUES ($1, $2, $3)`,
      [userId, `/uploads/${fileName}`, fileName]
    );

    await client.query(
      `INSERT INTO learning_paths (user_id, recommendation)
       VALUES ($1, $2)`,
      [userId, { extractedSkills, skillGap, recommendation, confidence }]
    );

    await client.query('COMMIT');
    return { userId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const saveQuizResult = async ({ score, result }) => {
  if (!pool) {
    return null;
  }

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Demo User', 'demo@skillmap.local']
    );

    const userId = userResult.rows[0].id;
    await client.query(
      `INSERT INTO quiz_attempts (user_id, score, result)
       VALUES ($1, $2, $3)`,
      [userId, score, result]
    );
  } finally {
    client.release();
  }
};
