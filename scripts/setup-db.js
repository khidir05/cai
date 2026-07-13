const mysql = require('mysql2/promise');
const fs = require('fs');
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

    // 1. Create database
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

    // 2. Create Table desa
    console.log('Creating table: desa...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS desa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_desa VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 3. Create Table kategori
    console.log('Creating table: kategori...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kategori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kategori VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 4. Create Table kelompok
    console.log('Creating table: kelompok...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kelompok (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kelompok VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 5. Create Table peserta
    console.log('Creating table: peserta...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS peserta (
        id VARCHAR(50) PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kategori INT,
        desa INT,
        kelompok INT,
        kelamin TINYINT COMMENT '1 laki2, 2 perempuan',
        telp VARCHAR(20),
        ukuran_baju VARCHAR(50),
        FOREIGN KEY (kategori) REFERENCES kategori(id) ON DELETE SET NULL,
        FOREIGN KEY (desa) REFERENCES desa(id) ON DELETE SET NULL,
        FOREIGN KEY (kelompok) REFERENCES kelompok(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 6. Create Table sesi
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

    // 7. Create Table kehadiran
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

    // 8. Create Table saran
    console.log('Creating table: saran...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS saran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pesan TEXT,
        kesan TEXT
      ) ENGINE=InnoDB;
    `);

    // 9. Create Table settings
    console.log('Creating table: settings...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        \`value\` VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 10. Create Table scanner_sessions
    console.log('Creating table: scanner_sessions...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scanner_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    console.log('All tables checked/created successfully.');

    // 11. Seeding Lookup Tables (if empty)
    console.log('Seeding table: desa...');
    await connection.query(`
      INSERT INTO desa (nama_desa) VALUES 
      ('Cilacap Kota'), 
      ('Cilacap Selatan'), 
      ('Cilacap Tengah'), 
      ('Cilacap Utara')
    `);

    console.log('Seeding table: kategori...');
    await connection.query(`
      INSERT INTO kategori (nama_kategori) VALUES 
      ('Kiriman'), 
      ('KI'), 
      ('4S'), 
      ('MT'), 
      ('Pondok')
    `);

    console.log('Seeding table: kelompok...');
    await connection.query(`
      INSERT INTO kelompok (nama_kelompok) VALUES 
      ('Cilacap 1'), 
      ('Cilacap 2'), 
      ('Cilacap 3'), 
      ('Cilacap 4'), 
      ('Cilacap 5')
    `);

    console.log('Seeding table: settings...');
    await connection.query(`
      INSERT INTO settings (\`key\`, \`value\`) VALUES 
      ('max_scanners', '5')
    `);

    // 12. Seeding Peserta
    console.log('Seeding table: peserta...');
    const [desas] = await connection.query('SELECT id, nama_desa FROM desa');
    const [kategoris] = await connection.query('SELECT id, nama_kategori FROM kategori');
    const [kelompoks] = await connection.query('SELECT id, nama_kelompok FROM kelompok');

    const getDesaId = (name) => desas.find(d => d.nama_desa === name)?.id;
    const getKatId = (name) => kategoris.find(k => k.nama_kategori === name)?.id;
    const getKelId = (name) => kelompoks.find(k => k.nama_kelompok === name)?.id;

    // Seeding matches the names in the PDF screenshot (Page 2 & Page 3)
    const mockPeserta = [
      ['PES-001', 'Nabila Syakieb', getKatId('Kiriman'), getDesaId('Cilacap Kota'), getKelId('Cilacap 1'), 2, '081234567890', 'M'],
      ['PES-002', 'Ibrahim', getKatId('KI'), getDesaId('Cilacap Kota'), getKelId('Cilacap 2'), 1, '081234567891', 'XXL'],
      ['PES-003', 'Hasan Abdullah', getKatId('Kiriman'), getDesaId('Cilacap Kota'), getKelId('Cilacap 3'), 1, '081234567892', 'L'],
      ['PES-004', 'Bintang Kejora', getKatId('KI'), getDesaId('Cilacap Kota'), getKelId('Cilacap 4'), 1, '081234567893', 'L'],
      ['PES-005', 'Muti\'atun', getKatId('Kiriman'), getDesaId('Cilacap Kota'), getKelId('Cilacap 5'), 2, '081234567894', 'M'],
      ['PES-006', 'Ahmad Fauzi', getKatId('4S'), getDesaId('Cilacap Selatan'), getKelId('Cilacap 1'), 1, '081234567895', 'XL'],
      ['PES-007', 'Citra Lestari', getKatId('MT'), getDesaId('Cilacap Tengah'), getKelId('Cilacap 2'), 2, '081234567896', 'S'],
      ['PES-008', 'Dedi Wijaya', getKatId('Pondok'), getDesaId('Cilacap Utara'), getKelId('Cilacap 3'), 1, '081234567897', 'XXL'],
    ];

    for (const p of mockPeserta) {
      await connection.query(
        'INSERT INTO peserta (id, nama, kategori, desa, kelompok, kelamin, telp, ukuran_baju) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
    console.log(`Seeded ${mockPeserta.length} mock participants.`);

    // 13. Seeding 1 Active Session
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

