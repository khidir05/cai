const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  let connection;
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cai',
    });
    console.log('Connected.');

    // 1. Ensure the 5 desas exist
    const targetDesas = ['Mentasan', 'Jeruklegi', 'Limbangan', 'Cilacap Utara', 'Cilacap Selatan'];
    const desaByName = new Map();

    for (const name of targetDesas) {
      const [rows] = await connection.query('SELECT id FROM desa WHERE LOWER(TRIM(nama_desa)) = LOWER(?)', [name.trim()]);
      if (rows.length > 0) {
        desaByName.set(name.toLowerCase(), rows[0].id);
      } else {
        const [insertRes] = await connection.query('INSERT INTO desa (nama_desa) VALUES (?)', [name]);
        desaByName.set(name.toLowerCase(), insertRes.insertId);
        console.log(`Created desa: ${name}`);
      }
    }

    // 2. Fetch all participants with their kelompok name
    const [pesertaList] = await connection.query(`
      SELECT p.id, p.nama, kl.nama_kelompok 
      FROM peserta p
      LEFT JOIN kelompok kl ON p.kelompok = kl.id
    `);

    console.log(`Processing ${pesertaList.length} participants...`);
    let updateCount = 0;

    for (const p of pesertaList) {
      const k = (p.nama_kelompok || '').toLowerCase().trim();
      let desaName = null;

      if (['mentasan 1', 'mentasan 2', 'mentasan 3', 'kawunganten'].includes(k)) {
        desaName = 'Mentasan';
      } else if (['jeruklegi', 'tritih 3', 'bandara', 'aneka', 'karangkemiri'].includes(k)) {
        desaName = 'Jeruklegi';
      } else if (['limbangan', 'rawabendungan', 'kuripan', 'menganti', 'semampir'].includes(k)) {
        desaName = 'Limbangan';
      } else if (['tritih 1', 'tritih 2', 'tritih 4', 'tritih 5', 'bayur'].includes(k)) {
        desaName = 'Cilacap Utara';
      } else if (['cilacap 1', 'cilacap 2', 'cilacap 3', 'cilacap 4', 'cilacap 5', 'cilacap 6'].includes(k)) {
        desaName = 'Cilacap Selatan';
      }

      if (desaName) {
        const desaId = desaByName.get(desaName.toLowerCase());
        if (desaId) {
          await connection.query('UPDATE peserta SET desa = ? WHERE id = ?', [desaId, p.id]);
          updateCount++;
        }
      }
    }

    console.log(`Successfully updated ${updateCount} participants' desa mapping in-place.`);
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
