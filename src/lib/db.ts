import mysql from 'mysql2/promise';

/**
 * MySQL Connection Pool for Next.js
 * Supports Cloud Database (Aiven, PlanetScale, Clever Cloud) or Localhost
 */
// Atur limit koneksi pool: kecil (1–5) untuk Vercel serverless agar tidak
// memboroskan koneksi DB cloud; besar (10+) nyaman untuk Node.js di hosting custom.
const connectionLimit = Number(process.env.DB_CONN_LIMIT) || (process.env.VERCEL ? 5 : 10);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : '',
  database: process.env.DB_NAME || 'hadir_tadz',
  port: Number(process.env.DB_PORT) || 3306,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // DB cloud (Vercel: TiDB/Aiven/Clever Cloud) wajib TLS. Set DB_SSL=true.
  ...(process.env.DB_SSL === 'true'
    ? { ssl: { rejectUnauthorized: process.env.DB_SSL_VERIFY !== 'false' } }
    : {}),
});

export default pool;
