import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const memoryStore = {
  cvAnalyses: [],
  quizAttempts: [],
  leads: []
};

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  if (rawUrl.startsWith('postgres://')) {
    return rawUrl.replace('postgres://', 'postgresql://');
  }

  if (rawUrl.startsWith('postgresql+psycopg://')) {
    return rawUrl.replace('postgresql+psycopg://', 'postgresql://');
  }

  if (rawUrl.startsWith('postgresql+psycopg2://')) {
    return rawUrl.replace('postgresql+psycopg2://', 'postgresql://');
  }

  return rawUrl;
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    })
  : null;

export function isDatabaseEnabled() {
  return Boolean(pool);
}

export async function initDatabase() {
  if (!pool || !['1', 'true', 'yes'].includes(String(process.env.AUTO_CREATE_TABLES ?? 'true').toLowerCase())) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cvs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency SMALLINT NOT NULL DEFAULT 1,
      source VARCHAR(40) NOT NULL DEFAULT 'cv',
      PRIMARY KEY (user_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS learning_paths (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recommendation JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score SMALLINT NOT NULL,
      result JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      target_role VARCHAR(120),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function getOrCreateDemoUser(client) {
  const email = 'demo@skillmap.local';
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
    ['Demo User', email]
  );

  return created.rows[0].id;
}

async function getOrCreateSkill(client, skillName) {
  const existing = await client.query('SELECT id FROM skills WHERE name = $1', [skillName]);

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query('INSERT INTO skills (name) VALUES ($1) RETURNING id', [skillName]);
  return created.rows[0].id;
}

export async function saveCvAnalysis({ fileName, fileSize = 0, analysis }) {
  const record = {
    id: memoryStore.cvAnalyses.length + 1,
    fileName,
    fileSize,
    analysis,
    createdAt: new Date().toISOString()
  };

  memoryStore.cvAnalyses.push(record);

  if (!pool) {
    return record;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = await getOrCreateDemoUser(client);
    const cvResult = await client.query(
      'INSERT INTO cvs (user_id, file_url, file_name) VALUES ($1, $2, $3) RETURNING id',
      [userId, `/uploads/${fileName}`, fileName]
    );

    for (const skillName of analysis.extractedSkills || []) {
      const skillId = await getOrCreateSkill(client, skillName);
      await client.query(
        `
          INSERT INTO user_skills (user_id, skill_id, proficiency, source)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, skill_id)
          DO UPDATE SET proficiency = EXCLUDED.proficiency, source = EXCLUDED.source
        `,
        [userId, skillId, 2, 'cv']
      );
    }

    await client.query('INSERT INTO learning_paths (user_id, recommendation) VALUES ($1, $2)', [
      userId,
      JSON.stringify(analysis)
    ]);
    await client.query('COMMIT');

    return { ...record, userId, cvId: cvResult.rows[0].id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveQuizResult({ score, result }) {
  const record = {
    id: memoryStore.quizAttempts.length + 1,
    score,
    result,
    createdAt: new Date().toISOString()
  };

  memoryStore.quizAttempts.push(record);

  if (!pool) {
    return record;
  }

  const client = await pool.connect();
  try {
    const userId = await getOrCreateDemoUser(client);
    await client.query('INSERT INTO quiz_attempts (user_id, score, result) VALUES ($1, $2, $3)', [
      userId,
      score,
      JSON.stringify(result)
    ]);
    return { ...record, userId };
  } finally {
    client.release();
  }
}

export async function saveLead({ email, targetRole }) {
  const record = {
    id: memoryStore.leads.length + 1,
    email,
    targetRole,
    createdAt: new Date().toISOString()
  };

  memoryStore.leads.push(record);

  if (!pool) {
    return record;
  }

  await pool.query('INSERT INTO leads (email, target_role) VALUES ($1, $2)', [email, targetRole || null]);
  return record;
}

export async function getLatestActivity() {
  if (!pool) {
    return {
      cvAnalyses: memoryStore.cvAnalyses.slice(-5).reverse(),
      quizAttempts: memoryStore.quizAttempts.slice(-5).reverse(),
      leads: memoryStore.leads.slice(-5).reverse()
    };
  }

  const [cvAnalyses, quizAttempts, leads] = await Promise.all([
    pool.query('SELECT id, file_name AS "fileName", created_at AS "createdAt" FROM cvs ORDER BY created_at DESC LIMIT 5'),
    pool.query('SELECT id, score, result, created_at AS "createdAt" FROM quiz_attempts ORDER BY created_at DESC LIMIT 5'),
    pool.query('SELECT id, email, target_role AS "targetRole", created_at AS "createdAt" FROM leads ORDER BY created_at DESC LIMIT 5')
  ]);

  return {
    cvAnalyses: cvAnalyses.rows,
    quizAttempts: quizAttempts.rows,
    leads: leads.rows
  };
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
  }
}
