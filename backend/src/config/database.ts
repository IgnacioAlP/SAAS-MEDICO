import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexiones a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexuscreative_medical',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
});

// Función para verificar la conexión
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL (XAMPP)');
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`🔌 Puerto: ${process.env.DB_PORT}`);
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error);
    throw error;
  }
};

// Función para ejecutar queries
export const query = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T> => {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
};

// Función para transacciones
export const transaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;
