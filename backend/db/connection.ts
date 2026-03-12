import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;
