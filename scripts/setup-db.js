const mysql = require('mysql2/promise');
const fs = require('fs');
const XLSX = require('xlsx');

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const envFile = fs.readFileSync(filePath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
  }
};
loadEnv('.env');
loadEnv('.env.local');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function run() {
  console.log('Connecting to MySQL server...');
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server.');

    const dbName = process.env.DB_DATABASE || 'cai';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" checked/created.`);
    await connection.query(`USE \`${dbName}\``);

    // Drop tables if they exist to start fresh
    console.log('Dropping existing tables to start fresh...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS kehadiran');
    await connection.query('DROP TABLE IF EXISTS peserta');
    await connection.query('DROP TABLE IF EXISTS sesi');
    await connection.query('DROP TABLE IF EXISTS saran');
    await connection.query('DROP TABLE IF EXISTS kelompok');
    await connection.query('DROP TABLE IF EXISTS kategori');
    await connection.query('DROP TABLE IF EXISTS desa');
    await connection.query('DROP TABLE IF EXISTS settings');
    await connection.query('DROP TABLE IF EXISTS scanner_sessions');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 1. Create Table desa
    console.log('Creating table: desa...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS desa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_desa VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 2. Create Table kategori
    console.log('Creating table: kategori...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kategori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kategori VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 3. Create Table kelompok
    console.log('Creating table: kelompok...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kelompok (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kelompok VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 4. Create Table peserta
    console.log('Creating table: peserta...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS peserta (
        id VARCHAR(50) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kategori INT,
        desa INT,
        kelompok INT,
        kelamin TINYINT DEFAULT 1 COMMENT '1 laki2, 2 perempuan',
        telp VARCHAR(20),
        ukuran_baju VARCHAR(50) DEFAULT 'L',
        is_panitia TINYINT(1) DEFAULT 0 COMMENT '0 peserta, 1 panitia',
        FOREIGN KEY (kategori) REFERENCES kategori(id) ON DELETE SET NULL,
        FOREIGN KEY (desa) REFERENCES desa(id) ON DELETE SET NULL,
        FOREIGN KEY (kelompok) REFERENCES kelompok(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 5. Create Table sesi
    console.log('Creating table: sesi...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sesi (
        id VARCHAR(36) PRIMARY KEY,
        nama_sesi VARCHAR(255) NOT NULL,
        tanggal DATE NOT NULL,
        buka TIMESTAMP NULL DEFAULT NULL,
        tutup TIMESTAMP NULL DEFAULT NULL,
        status TINYINT(1) DEFAULT 0 COMMENT '1 buka',
        access_code VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 6. Create Table kehadiran
    console.log('Creating table: kehadiran...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kehadiran (
        id VARCHAR(36) PRIMARY KEY,
        sesi VARCHAR(36) NOT NULL,
        peserta VARCHAR(50) NOT NULL,
        waktu_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sesi) REFERENCES sesi(id) ON DELETE CASCADE,
        FOREIGN KEY (peserta) REFERENCES peserta(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 7. Create Table saran
    console.log('Creating table: saran...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS saran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pesan TEXT,
        kesan TEXT
      ) ENGINE=InnoDB;
    `);

    // 8. Create Table settings
    console.log('Creating table: settings...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        \`value\` VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 9. Create Table scanner_sessions
    console.log('Creating table: scanner_sessions...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scanner_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    console.log('All tables created successfully.');

    // 10. Seeding lookup tables (default values)
    console.log('Seeding table: desa...');
     await connection.query(`
       INSERT INTO desa (nama_desa) VALUES 
       ('Mentasan'), 
       ('Jeruklegi'), 
       ('Limbangan'), 
       ('Cilacap Utara'), 
       ('Cilacap Selatan')
     `);

    console.log('Seeding table: settings...');
    await connection.query(`
      INSERT INTO settings (\`key\`, \`value\`) VALUES 
      ('max_scanners', '5')
    `);

    // 11. Parse data.xlsx and import participants
    console.log('Parsing public/data.xlsx for seeding...');
    if (!fs.existsSync('public/data.xlsx')) {
      throw new Error('public/data.xlsx file not found!');
    }

    const workbook = XLSX.readFile('public/data.xlsx');
    const pesertaMap = new Map();
    const categoriesSet = new Set();
    const kelompoksSet = new Set();

    // Read sheet "Data Peserta Terfilter"
    const sheet1 = workbook.Sheets['Data Peserta Terfilter'];
    if (sheet1) {
      const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
      for (let i = 1; i < data1.length; i++) {
        const row = data1[i];
        if (!row || row.length === 0) continue;
        const id = (row[0] || '').toString().trim();
        const nama = (row[1] || '').toString().trim();
        const kategori = (row[2] || '').toString().trim();
        const kelompok = (row[3] || '').toString().trim();

        if (!id || !nama) continue;

        pesertaMap.set(id, { id, nama, kategori, kelompok, is_panitia: 0 });
        if (kategori) categoriesSet.add(kategori);
        if (kelompok) kelompoksSet.add(kelompok);
      }
    }

    // Read sheet "Panitia"
    const sheet2 = workbook.Sheets['Panitia'];
    if (sheet2) {
      const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
      for (let i = 0; i < data2.length; i++) {
        const row = data2[i];
        if (!row || row.length === 0) continue;
        const id = (row[0] || '').toString().trim();
        const nama = (row[1] || '').toString().trim();
        const kategori = (row[2] || '').toString().trim();
        const kelompok = (row[3] || '').toString().trim();

        if (!id || !nama) continue;

        pesertaMap.set(id, { id, nama, kategori, kelompok, is_panitia: 1 });
        if (kategori) categoriesSet.add(kategori);
        if (kelompok) kelompoksSet.add(kelompok);
      }
    }

    // 12. Dynamic lookup tables seeding
    console.log('Seeding categories dynamically...');
    const kategoriMap = new Map();
    for (const kat of categoriesSet) {
      const [res] = await connection.query('INSERT INTO kategori (nama_kategori) VALUES (?)', [kat]);
      kategoriMap.set(kat.toLowerCase().trim(), res.insertId);
    }

    console.log('Seeding kelompoks dynamically...');
    const kelompokMap = new Map();
    for (const kel of kelompoksSet) {
      const [res] = await connection.query('INSERT INTO kelompok (nama_kelompok) VALUES (?)', [kel]);
      kelompokMap.set(kel.toLowerCase().trim(), res.insertId);
    }

    // 13. Seeding Peserta from data.xlsx
    console.log(`Seeding table: peserta (${pesertaMap.size} records)...`);
     const [desas] = await connection.query('SELECT id, nama_desa FROM desa');
     const desaByName = new Map(desas.map(d => [d.nama_desa.toLowerCase().trim(), d.id]));

     function getDesaIdForParticipant(kelompokName) {
       const k = (kelompokName || '').toLowerCase().trim();
       let desaName = 'Mentasan'; // Default fallback
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
       return desaByName.get(desaName.toLowerCase()) || desas[0]?.id || null;
     }

     for (const p of pesertaMap.values()) {
       const katId = p.kategori ? kategoriMap.get(p.kategori.toLowerCase().trim()) : null;
       const kelId = p.kelompok ? kelompokMap.get(p.kelompok.toLowerCase().trim()) : null;
       const desaId = getDesaIdForParticipant(p.kelompok);

       await connection.query(
         'INSERT INTO peserta (id, nama, kategori, desa, kelompok, kelamin, telp, ukuran_baju, is_panitia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [p.id, p.nama, katId, desaId, kelId, 1, null, 'L', p.is_panitia]
       );
     }
    console.log(`Successfully seeded ${pesertaMap.size} participants.`);

    // 14. Seeding 1 Active Session
    console.log('Seeding initial active session...');
    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    await connection.query(
      'INSERT INTO sesi (id, nama_sesi, tanggal, status, buka, access_code) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?)',
      [sessionId, 'SESI 1', today, 'CAI-SCAN']
    );
    console.log('Active session "SESI 1" with access code "CAI-SCAN" seeded.');

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
