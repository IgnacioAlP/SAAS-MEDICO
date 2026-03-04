const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importSQL() {
  const sqlFile = 'C:\\Users\\User\\Downloads\\nexuscreative_medical.sql';
  
  console.log('📦 Leyendo archivo SQL...');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Dividir en statements individuales
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📋 ${statements.length} statements encontrados`);

  const connection = await mysql.createConnection({
    host: 'tramway.proxy.rlwy.net',
    port: 11391,
    user: 'root',
    password: 'uerQzfophwWQtjRBmwlNrkVGcUCIOchf',
    database: 'railway',
    multipleStatements: false,
    ssl: { rejectUnauthorized: false }
  });

  console.log('✅ Conectado a Railway MySQL\n');

  let ok = 0, errors = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    try {
      await connection.query(stmt);
      ok++;
      if (ok % 10 === 0) process.stdout.write(`\r⏳ ${ok}/${statements.length} ejecutados...`);
    } catch (err) {
      // Ignorar errores de "ya existe"
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
        ok++;
      } else {
        errors++;
        if (errors <= 5) console.log(`\n⚠️  [${err.code}] ${err.message.substring(0, 80)}`);
      }
    }
  }

  console.log(`\n\n🎉 Importación completada: ${ok} OK, ${errors} errores`);
  await connection.end();
}

importSQL().catch(e => {
  console.error('❌ Error fatal:', e.message);
  process.exit(1);
});
