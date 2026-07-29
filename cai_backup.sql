-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: cai
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_codes`
--

DROP TABLE IF EXISTS `access_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_codes` (
  `code` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_codes`
--

LOCK TABLES `access_codes` WRITE;
/*!40000 ALTER TABLE `access_codes` DISABLE KEYS */;
INSERT INTO `access_codes` VALUES ('SCAN47','Scanner Utama Panitia','2026-07-13 02:20:04');
/*!40000 ALTER TABLE `access_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `desa`
--

DROP TABLE IF EXISTS `desa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `desa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_desa` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `desa`
--

LOCK TABLES `desa` WRITE;
/*!40000 ALTER TABLE `desa` DISABLE KEYS */;
INSERT INTO `desa` VALUES (1,'Mentasan'),(2,'Jeruklegi'),(3,'Limbangan'),(4,'Cilacap Utara'),(5,'Cilacap Selatan');
/*!40000 ALTER TABLE `desa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori`
--

DROP TABLE IF EXISTS `kategori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori`
--

LOCK TABLES `kategori` WRITE;
/*!40000 ALTER TABLE `kategori` DISABLE KEYS */;
INSERT INTO `kategori` VALUES (1,'Pengurus PPG'),(2,'MT'),(3,'Siswa Pondok Tri Sukses'),(4,'Utusan Kelompok'),(5,'Guru PAUD'),(6,'Unsur 4S Daerah'),(7,'KI Desa'),(8,'Panitia');
/*!40000 ALTER TABLE `kategori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kehadiran`
--

DROP TABLE IF EXISTS `kehadiran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kehadiran` (
  `id` varchar(36) NOT NULL,
  `sesi` varchar(36) NOT NULL,
  `peserta` varchar(50) NOT NULL,
  `waktu_scan` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sesi` (`sesi`),
  KEY `peserta` (`peserta`),
  CONSTRAINT `kehadiran_ibfk_1` FOREIGN KEY (`sesi`) REFERENCES `sesi` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kehadiran_ibfk_2` FOREIGN KEY (`peserta`) REFERENCES `peserta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kehadiran`
--

LOCK TABLES `kehadiran` WRITE;
/*!40000 ALTER TABLE `kehadiran` DISABLE KEYS */;
INSERT INTO `kehadiran` VALUES ('3af17fa0-141b-4930-bee8-42169391ce12','c9defd75-427a-43e1-915a-a5d1cef66e06','PES-111','2026-07-29 04:38:41'),('c4a10572-5638-46d8-b156-d5ce5e878088','c9defd75-427a-43e1-915a-a5d1cef66e06','PES-082','2026-07-29 04:39:07');
/*!40000 ALTER TABLE `kehadiran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kelompok`
--

DROP TABLE IF EXISTS `kelompok`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kelompok` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_kelompok` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kelompok`
--

LOCK TABLES `kelompok` WRITE;
/*!40000 ALTER TABLE `kelompok` DISABLE KEYS */;
INSERT INTO `kelompok` VALUES (1,'Cilacap 3'),(2,'Tritih 5'),(3,'Tritih 4'),(4,'Kuripan'),(5,'Cilacap 6'),(6,'Semampir'),(7,'Cilacap 2'),(8,'Menganti'),(9,'Cilacap 5'),(10,'Jeruklegi'),(11,'Cilacap 1'),(12,'Tritih 3'),(13,'Tritih 1'),(14,'Bayur'),(15,'Cilacap 4'),(16,'Limbangan'),(17,'Mentasan 1'),(18,'Rawabendungan'),(19,'Mentasan 3'),(20,'Bandara'),(21,'Kawunganten'),(22,'Mentasan 2'),(23,'Aneka'),(24,'Karang kemiri'),(25,'Tritih 2');
/*!40000 ALTER TABLE `kelompok` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `peserta`
--

DROP TABLE IF EXISTS `peserta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `peserta` (
  `id` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `kategori` int DEFAULT NULL,
  `desa` int DEFAULT NULL,
  `kelompok` int DEFAULT NULL,
  `kelamin` tinyint DEFAULT '1' COMMENT '1 laki2, 2 perempuan',
  `telp` varchar(20) DEFAULT NULL,
  `ukuran_baju` varchar(50) DEFAULT 'L',
  `is_panitia` tinyint(1) DEFAULT '0' COMMENT '0 peserta, 1 panitia',
  PRIMARY KEY (`id`),
  KEY `kategori` (`kategori`),
  KEY `desa` (`desa`),
  KEY `kelompok` (`kelompok`),
  CONSTRAINT `peserta_ibfk_1` FOREIGN KEY (`kategori`) REFERENCES `kategori` (`id`) ON DELETE SET NULL,
  CONSTRAINT `peserta_ibfk_2` FOREIGN KEY (`desa`) REFERENCES `desa` (`id`) ON DELETE SET NULL,
  CONSTRAINT `peserta_ibfk_3` FOREIGN KEY (`kelompok`) REFERENCES `kelompok` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `peserta`
--

LOCK TABLES `peserta` WRITE;
/*!40000 ALTER TABLE `peserta` DISABLE KEYS */;
INSERT INTO `peserta` VALUES ('PES-001','H.Muhammad TS',6,1,NULL,1,NULL,'L',1),('PES-002','H.Abdul Karim',6,1,NULL,1,NULL,'L',1),('PES-003','M. Amin Sodiq',6,4,14,1,NULL,'L',1),('PES-004','Rudy Adi Budiarto',6,4,14,1,NULL,'L',0),('PES-005','Murgito',6,1,NULL,1,NULL,'L',0),('PES-006','M.Syamsugito',6,1,NULL,1,NULL,'L',0),('PES-007','Anton Ade K',6,4,25,1,NULL,'L',1),('PES-008','Ali Nasrun',6,4,2,1,NULL,'L',1),('PES-009','Ramli Safei',6,5,1,1,NULL,'L',1),('PES-010','Sugiran PH.',6,1,NULL,1,NULL,'L',0),('PES-011','Darsono',6,1,NULL,1,NULL,'L',1),('PES-012','Saryono harso',6,1,NULL,1,NULL,'L',0),('PES-013','Ruswan',6,2,12,1,NULL,'L',0),('PES-014','Yusron',6,1,22,1,NULL,'L',0),('PES-015','Siswanto',6,3,16,1,NULL,'L',1),('PES-016','Tri joko',6,4,13,1,NULL,'L',1),('PES-017','Didik w',6,1,17,1,NULL,'L',0),('PES-018','Zainal Arifin',6,1,NULL,1,NULL,'L',1),('PES-019','Erwin s',6,1,NULL,1,NULL,'L',0),('PES-020','Wachidin',6,1,NULL,1,NULL,'L',0),('PES-021','Bagus Aditya',6,5,1,1,NULL,'L',0),('PES-022','Bp. Kaswan',7,5,15,1,NULL,'L',0),('PES-023','Bp. Wahyono',7,4,13,1,NULL,'L',0),('PES-024','Bp Aji Sasongko',7,1,NULL,1,NULL,'L',0),('PES-025','Bp. Sabar',7,1,NULL,1,NULL,'L',0),('PES-026','Bp. Saelan',7,3,16,1,NULL,'L',0),('PES-027','Erwan S',1,1,NULL,1,NULL,'L',1),('PES-028','Sumardi',1,1,NULL,1,NULL,'L',1),('PES-029','Angga',1,5,1,1,NULL,'L',0),('PES-031','Abet',1,1,NULL,1,NULL,'L',0),('PES-032','Wahyutri',1,1,NULL,1,NULL,'L',1),('PES-033','Bu Budi',1,1,NULL,1,NULL,'L',0),('PES-034','Nuryanto',1,1,NULL,1,NULL,'L',0),('PES-035','Mukhlis',1,1,NULL,1,NULL,'L',0),('PES-036','Fajar',1,1,NULL,1,NULL,'L',0),('PES-037','Iman Bawono',1,1,NULL,1,NULL,'L',0),('PES-038','Oki teguh',1,1,NULL,1,NULL,'L',1),('PES-039','Faqih Adhitya',1,5,7,1,NULL,'L',1),('PES-040','David',1,1,NULL,1,NULL,'L',0),('PES-041','Misno',1,5,5,1,NULL,'L',0),('PES-042','Susiana',1,4,13,1,NULL,'L',0),('PES-043','Widoyo',1,4,3,1,NULL,'L',0),('PES-044','Rosa',1,1,NULL,1,NULL,'L',0),('PES-045','Joko W',1,3,16,1,NULL,'L',0),('PES-046','Yahya Birri',1,5,9,1,NULL,'L',0),('PES-047','Ikhsan',1,1,NULL,1,NULL,'L',0),('PES-048','Mivta fauzi',1,5,15,1,NULL,'L',1),('PES-049','Khidir',1,4,14,1,NULL,'L',1),('PES-050','A. Rifki Fauzi',1,1,NULL,1,NULL,'L',0),('PES-051','Mohammad Ibrahim Ardiansyah',1,5,7,1,NULL,'L',1),('PES-052','Muchamad Faizal Bintang',1,5,5,1,NULL,'L',1),('PES-053','Edi Riyanto',1,3,18,1,NULL,'L',0),('PES-054','Rofiq iman Ardiansyah',1,2,12,1,NULL,'L',0),('PES-055','Nana Mistrianasari',1,4,13,1,NULL,'L',0),('PES-056','Ryan jamal',1,4,2,1,NULL,'L',0),('PES-057','Vinda Sovia Rohimaningrum',1,4,2,1,NULL,'L',0),('PES-058','Malina Ulinnuha',1,5,15,1,NULL,'L',0),('PES-059','HABBIB BAHARUDDIN AL AZIZI',1,4,25,1,NULL,'L',1),('PES-060','Wanda Ghoni Latifah',1,5,1,1,NULL,'L',1),('PES-061','Anas Bukhori Ramli',1,5,9,1,NULL,'L',1),('PES-062','Khoirul huda',1,4,2,1,NULL,'L',0),('PES-063','Riki Adrian',1,5,9,1,NULL,'L',1),('PES-064','Sigit Anggara',1,5,1,1,NULL,'L',1),('PES-065','Jahrona Matni Azizah',1,5,9,1,NULL,'L',1),('PES-066','Albaith Zain Pratama',1,5,9,1,NULL,'L',1),('PES-067','FAZA NADENKA CHRISANTIA',1,4,14,1,NULL,'L',1),('PES-068','Adi Sukma Pangestu',1,3,6,1,NULL,'L',0),('PES-069','Kolun Alfisahr',2,5,15,1,NULL,'L',0),('PES-071','MOCHAMAD FAQIH NURUL DZUHA',2,4,3,1,NULL,'L',0),('PES-072','LatifulQolbi',2,5,5,1,NULL,'L',0),('PES-073','MUHAMMAD REKI AL FIRDAUS',2,1,22,1,NULL,'L',0),('PES-074','Muhammad Husaini',2,3,18,1,NULL,'L',0),('PES-075','Fani Fanesa',2,1,17,1,NULL,'L',0),('PES-076','Muti',2,5,9,1,NULL,'L',0),('PES-077','NURHAJI RAHMAD PUTRA',2,1,19,1,NULL,'L',0),('PES-078','NAFSAN NOVENDWIKA YUZAQI',2,3,18,1,NULL,'L',0),('PES-079','Muhammad Royan syawal',2,5,9,1,NULL,'L',0),('PES-080','WARDIYAH PUTRI RINJANI',2,3,8,1,NULL,'L',0),('PES-081','Bagas Nugroho',2,4,13,1,NULL,'L',0),('PES-082','Aabdulloh alhasani',2,5,1,1,NULL,'L',0),('PES-083','Yhudistira Gilang Pratama',2,3,16,1,NULL,'L',0),('PES-084','Halim sakur',2,5,11,1,NULL,'L',0),('PES-085','Fadiya Nova Aziza',2,3,16,1,NULL,'L',0),('PES-086','Akhmad Saifuddin Wafdulloh',2,2,10,1,NULL,'L',0),('PES-087','Aulia purnama heti',2,2,12,1,NULL,'L',0),('PES-088','Abu Usamah',2,4,2,1,NULL,'L',1),('PES-089','Nadia',2,4,2,1,NULL,'L',1),('PES-090','Muh Aditia Syaifulloh',2,4,14,1,NULL,'L',0),('PES-091','Jawara putra pamungkas',2,1,21,1,NULL,'L',0),('PES-092','Reyvaldi Sulthan firdaus',2,4,2,1,NULL,'L',0),('PES-093','Muhammad Rizqi Ardiansyah',2,2,23,1,NULL,'L',0),('PES-094','Achmad zain mashuda',2,3,4,1,NULL,'L',0),('PES-095','Ananda Fitriani',2,2,12,1,NULL,'L',0),('PES-096','sabila agnes ramadhani',2,5,11,1,NULL,'L',0),('PES-097','athaya anindya maheswari',2,5,7,1,NULL,'L',0),('PES-098','M. Yusuf S',2,3,6,1,NULL,'L',0),('PES-099','Witri khasanah',5,4,13,1,NULL,'L',0),('PES-100','Siti basiroh',5,4,3,1,NULL,'L',0),('PES-101','Budi Astuti',5,1,NULL,1,NULL,'L',0),('PES-102','Ika Rahmawati',5,1,NULL,1,NULL,'L',0),('PES-103','Murni Khuri',5,5,1,1,NULL,'L',0),('PES-104','Adinda Sapta',5,5,7,1,NULL,'L',0),('PES-105','Etty Dwi',5,5,5,1,NULL,'L',0),('PES-106','Ade Kurniawati',5,5,5,1,NULL,'L',0),('PES-107','Nicho Bayu Pramana',3,4,13,1,NULL,'L',0),('PES-108','Falisa Unsur',3,4,2,1,NULL,'L',0),('PES-109','Imroatusoliha',3,4,2,1,NULL,'L',0),('PES-110','Ellena',3,4,2,1,NULL,'L',0),('PES-111','Abdilah Azhar',3,4,2,1,NULL,'L',0),('PES-112','INDI CAHYA RATNA AULIYA',3,4,2,1,NULL,'L',0),('PES-113','Yaumi Arofatul Fauziah',3,5,9,1,NULL,'L',0),('PES-114','suci anggun permata',3,4,2,1,NULL,'L',0),('PES-115','Nira Ihsani Hanifah',3,5,5,1,NULL,'L',0),('PES-116','Prety emi yulianti',3,4,2,1,NULL,'L',1),('PES-117','Ibnu Muhamad Firdaus',3,4,2,1,NULL,'L',0),('PES-118','Ubed khoeri',3,3,6,1,NULL,'L',0),('PES-119','Nur Meida Afifatu Sholihah',3,4,3,1,NULL,'L',0),('PES-120','Nadia Bilqis',3,4,13,1,NULL,'L',0),('PES-121','Berliana May Andini Prayitno',3,4,14,1,NULL,'L',0),('PES-122','Zaqi',3,1,24,1,NULL,'L',0),('PES-123','Royan',3,2,10,1,NULL,'L',0),('PES-124','Alivia Esha Rizky',3,4,3,1,NULL,'L',0),('PES-125','NAFIS DYNA AL AUFA',3,4,13,1,NULL,'L',0),('PES-126','Al azmi',4,5,11,1,NULL,'L',0),('PES-127','Faqih Alfian Amrulloh',4,5,11,1,NULL,'L',0),('PES-128','Siti Masithah',4,5,7,1,NULL,'L',0),('PES-129','M. Zaky Anas F',4,5,7,1,NULL,'L',0),('PES-130','Parikesit Luhur Pambudi',4,5,1,1,NULL,'L',1),('PES-131','Ahmad Zuhdan Fauzi',4,5,1,1,NULL,'L',0),('PES-132','M.Fahmi Rosyid',4,5,15,1,NULL,'L',0),('PES-133','Mochamad Ichsan',4,5,15,1,NULL,'L',0),('PES-134','Putri Rahma A',4,5,9,1,NULL,'L',0),('PES-135','Aina Salsabila',4,5,9,1,NULL,'L',0),('PES-136','Faza Fariz Al Hasan',4,5,5,1,NULL,'L',0),('PES-137','Farah Raihana Hasna Qurrota A\'Yun',4,5,5,1,NULL,'L',0),('PES-138','Oby',4,4,13,1,NULL,'L',0),('PES-139','Bahrul rizqi kurniawan',4,4,25,1,NULL,'L',1),('PES-140','ABDUL MALIK ASADULOH',4,4,3,1,NULL,'L',0),('PES-141','Nayla Arvas Nur Aziza',4,5,5,1,NULL,'L',0),('PES-142','Hasan',4,4,13,1,NULL,'L',0),('PES-143','Zahra Putri Inayah',4,4,2,1,NULL,'L',0),('PES-144','Shabrina Dwi Puspitaningtyas',4,4,2,1,NULL,'L',0),('PES-145','Fadila Nur Aini',4,3,16,1,NULL,'L',0),('PES-146','HAFIDH RIZQO WILDANI',4,3,16,1,NULL,'L',0),('PES-147','Iwan Setiyo Rahayu',4,3,18,1,NULL,'L',0),('PES-148','Azka Briliana',4,3,8,1,NULL,'L',0),('PES-149','AGNI KARISMA DINA',4,3,8,1,NULL,'L',0),('PES-150','Wulandari',4,3,4,1,NULL,'L',0),('PES-151','Ubedulloh',4,3,6,1,NULL,'L',0),('PES-152','Ainun',4,3,6,1,NULL,'L',0),('PES-153','Rifqi Nur Diansyah',4,2,23,1,NULL,'L',0),('PES-154','Ainun Ch',4,3,6,1,NULL,'L',0),('PES-155','Muhammad Iman nulloh',4,2,12,1,NULL,'L',0),('PES-156','EM KELANA JAYA',4,2,12,1,NULL,'L',0),('PES-157','Akbar',4,2,10,1,NULL,'L',0),('PES-158','Royan',4,2,10,1,NULL,'L',0),('PES-159','SITAM',4,1,24,1,NULL,'L',0),('PES-160','NINING SUSANTI',4,1,24,1,NULL,'L',0),('PES-161','Habib wafdalloh',4,1,17,1,NULL,'L',0),('PES-162','Reygi Sapta Prayoga',4,1,22,1,NULL,'L',0),('PES-163','MUHAMAD',4,1,22,1,NULL,'L',0),('PES-164','Fania sesilia',4,1,19,1,NULL,'L',0),('PES-165','Unzila Rizka',4,1,19,1,NULL,'L',0),('PES-166','SUNARTO',4,1,21,1,NULL,'L',0),('PES-167','GALUH AFRINAS SETYAWAN',4,2,20,1,NULL,'L',0),('PES-168','FIRDAUS IHSAN RAMADAN',4,2,20,1,NULL,'L',0),('PES-169','Bp. Muchlisin',8,4,2,1,NULL,'L',1),('PES-170','Bp. Kiswadi',8,1,NULL,1,NULL,'L',1),('PES-171','Mas Izza',8,1,NULL,1,NULL,'L',1),('PES-172','Bp. Fattah',8,1,NULL,1,NULL,'L',1),('PES-173','Bp. Suharto',8,1,NULL,1,NULL,'L',1),('PES-174','Bp. Arif',8,1,NULL,1,NULL,'L',1),('PES-175','Bp. Sunanto',8,1,NULL,1,NULL,'L',1),('PES-176','Bp. Warto',8,1,NULL,1,NULL,'L',1),('PES-177','Ibu Warto',8,1,NULL,1,NULL,'L',1),('PES-178','Ibu Sarmini',8,1,NULL,1,NULL,'L',1),('PES-179','Ibu Jamali',8,1,NULL,1,NULL,'L',1),('PES-180','Ibu Resmiyati',8,1,NULL,1,NULL,'L',1),('PES-181','Tri Utomo',8,4,2,1,NULL,'L',1),('PES-182','Mas Riski',8,1,NULL,1,NULL,'L',1),('PES-183','Bp. Jamali',8,1,NULL,1,NULL,'L',1),('PES-184','Mas Azam',8,1,NULL,1,NULL,'L',1),('PES-185','Khoirul Umam',8,5,15,1,NULL,'L',1),('PES-190','WIdya',8,4,13,2,'','L',1),('PES-191','Susilo',8,5,15,1,'','L',1),('PES-192','Karjono',8,3,18,1,'','L',1),('PES-193','Ardi Kusbianto',8,4,13,1,'','L',1),('PES-194','Eka Nurjannah',5,1,19,2,'','L',0),('PES-195','Doni',4,4,3,1,'','L',0),('PES-196','Faiz Sheva',4,4,14,1,'','L',0),('PES-197','Tyas Maharani',4,5,15,2,'','L',0);
/*!40000 ALTER TABLE `peserta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saran`
--

DROP TABLE IF EXISTS `saran`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pesan` text,
  `kesan` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saran`
--

LOCK TABLES `saran` WRITE;
/*!40000 ALTER TABLE `saran` DISABLE KEYS */;
/*!40000 ALTER TABLE `saran` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scanner_sessions`
--

DROP TABLE IF EXISTS `scanner_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scanner_sessions` (
  `session_id` varchar(255) NOT NULL,
  `last_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scanner_sessions`
--

LOCK TABLES `scanner_sessions` WRITE;
/*!40000 ALTER TABLE `scanner_sessions` DISABLE KEYS */;
INSERT INTO `scanner_sessions` VALUES ('ye5y78wli9z1v2l6cymg','2026-07-29 04:39:20');
/*!40000 ALTER TABLE `scanner_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesi`
--

DROP TABLE IF EXISTS `sesi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesi` (
  `id` varchar(36) NOT NULL,
  `nama_sesi` varchar(255) NOT NULL,
  `tanggal` date NOT NULL,
  `buka` timestamp NULL DEFAULT NULL,
  `tutup` timestamp NULL DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0' COMMENT '1 buka',
  `access_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesi`
--

LOCK TABLES `sesi` WRITE;
/*!40000 ALTER TABLE `sesi` DISABLE KEYS */;
INSERT INTO `sesi` VALUES ('b8a49f18-2af9-4f5c-adcb-d30c0c4a3bb5','SESI 1','2026-07-29','2026-07-29 01:52:14','2026-07-29 01:53:10',0,'CAI-SCAN','2026-07-29 01:52:14'),('c9defd75-427a-43e1-915a-a5d1cef66e06','sesi tes','2026-07-29','2026-07-29 04:38:02','2026-07-29 04:39:29',0,'CAI-N5NS','2026-07-29 04:38:02');
/*!40000 ALTER TABLE `sesi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('max_scanners','5');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'cai'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-29 21:30:49
