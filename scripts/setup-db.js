const mysql = require('mysql2/promise');
const fs = require('fs');
if (fs.existsSync('.env.local')) {
  const envFile = fs.readFileSync('.env.local', 'utf-8');
  envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

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

    console.log('All tables checked/created successfully.');

    // 9. Seeding Lookup Tables (if empty)
    const [desaCount] = await connection.query('SELECT COUNT(*) as count FROM desa');
    if (desaCount[0].count === 0) {
      console.log('Seeding table: desa...');
      await connection.query(`
        INSERT INTO desa (nama_desa) VALUES 
        ('Sukamaju'), 
        ('Sukasari'), 
        ('Mekarjaya'), 
        ('Bojongsoang'),
        ('Margahayu')
      `);
    }

    const [kategoriCount] = await connection.query('SELECT COUNT(*) as count FROM kategori');
    if (kategoriCount[0].count === 0) {
      console.log('Seeding table: kategori...');
      await connection.query(`
        INSERT INTO kategori (nama_kategori) VALUES 
        ('Peserta'), 
        ('Panitia'), 
        ('Tamu Undangan'), 
        ('Pemateri')
      `);
    }

    const [kelompokCount] = await connection.query('SELECT COUNT(*) as count FROM kelompok');
    if (kelompokCount[0].count === 0) {
      console.log('Seeding table: kelompok...');
      await connection.query(`
        INSERT INTO kelompok (nama_kelompok) VALUES 
        ('Kelompok Al-Farabi'), 
        ('Kelompok Ibnu Sina'), 
        ('Kelompok Al-Khawarizmi'), 
        ('Kelompok Ar-Razi')
      `);
    }

    // 10. Seeding Peserta (if empty)
    const [pesertaCount] = await connection.query('SELECT COUNT(*) as count FROM peserta');
    if (pesertaCount[0].count === 0) {
      console.log('Seeding table: peserta...');
      // We will insert 8 mock participants. We retrieve IDs of Lookup Tables first
      const [desas] = await connection.query('SELECT id FROM desa LIMIT 5');
      const [kategoris] = await connection.query('SELECT id FROM kategori LIMIT 4');
      const [kelompoks] = await connection.query('SELECT id FROM kelompok LIMIT 4');

      const pDesa = (idx) => desas[idx % desas.length].id;
      const pKat = (idx) => kategoris[idx % kategoris.length].id;
      const pKel = (idx) => kelompoks[idx % kelompoks.length].id;

      const mockPeserta = [
        ['PES-001', 'Ahmad Fauzi', pKat(0), pDesa(0), pKel(0), 1, '081234567890'],
        ['PES-002', 'Budi Santoso', pKat(0), pDesa(1), pKel(1), 1, '081234567891'],
        ['PES-003', 'Citra Lestari', pKat(0), pDesa(2), pKel(2), 2, '081234567892'],
        ['PES-004', 'Dedi Wijaya', pKat(1), pDesa(3), pKel(3), 1, '081234567893'],
        ['PES-005', 'Eka Rahmawati', pKat(0), pDesa(4), pKel(0), 2, '081234567894'],
        ['PES-006', 'Fahmi Idris', pKat(2), pDesa(0), pKel(1), 1, '081234567895'],
        ['PES-007', 'Gita Permata', pKat(0), pDesa(1), pKel(2), 2, '081234567896'],
        ['PES-008', 'Hendra Wijaya', pKat(3), pDesa(2), pKel(3), 1, '081234567897'],
      ];

      for (const p of mockPeserta) {
        await connection.query(
          'INSERT INTO peserta (id, nama, kategori, desa, kelompok, kelamin, telp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          p
        );
      }
      console.log('Seeded 8 mock participants.');
    }

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
