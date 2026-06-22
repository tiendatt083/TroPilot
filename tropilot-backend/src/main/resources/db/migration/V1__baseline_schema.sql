-- Tropilot baseline schema for a new MySQL database.
-- Existing databases are baselined at version 1 and start applying changes from V2.
SET FOREIGN_KEY_CHECKS = 0;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5bm1lt4f4eevt8lv2517soakd` (`user_id`),
  CONSTRAINT `FK5bm1lt4f4eevt8lv2517soakd` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `buildings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floors` int NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_rmelgq5kegpd644ap0pxxa97n` (`building_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `equipment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `added_date` date NOT NULL,
  `brand` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condition_status` enum('GOOD','NEEDS_MAINTENANCE','UNDER_MAINTENANCE','BROKEN','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `equipment_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `installation_date` date DEFAULT NULL,
  `last_maintenance_date` date DEFAULT NULL,
  `location_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `next_maintenance_date` date DEFAULT NULL,
  `note` varchar(1200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL,
  `scope` enum('BUILDING','ROOM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `building_id` bigint NOT NULL,
  `room_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_equipment_building_code` (`building_id`,`equipment_code`),
  KEY `FKha4qvopj5gipabhegokka0qo7` (`room_id`),
  CONSTRAINT `FKha4qvopj5gipabhegokka0qo7` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FKik4hxplsgluad9835851rpjlk` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `equipment_maintenance_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `maintenance_date` date NOT NULL,
  `result_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_note` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_id` bigint NOT NULL,
  `maintenance_request_id` bigint NOT NULL,
  `performed_by_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_81cakkgjddms1jlbmxl02egx` (`maintenance_request_id`),
  KEY `FKl4hi72p7hbhqel4a7jbsx3vov` (`equipment_id`),
  KEY `FKl13vu37jbtkhiu8x32pmx4fov` (`performed_by_id`),
  CONSTRAINT `FKft71lngne6rghislkt9wmvmhy` FOREIGN KEY (`maintenance_request_id`) REFERENCES `maintenance_requests` (`id`),
  CONSTRAINT `FKl13vu37jbtkhiu8x32pmx4fov` FOREIGN KEY (`performed_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKl4hi72p7hbhqel4a7jbsx3vov` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(14,2) NOT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expense_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_type` enum('REPAIR','REPLACEMENT','CLEANING','MAINTENANCE','OPERATION','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `maintenance_request_id` bigint DEFAULT NULL,
  `proof_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('VALID','PENDING','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` bigint DEFAULT NULL,
  `created_by_id` bigint NOT NULL,
  `room_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_8b047f7t6u869sya4xh6f8530` (`expense_code`),
  KEY `FK6fhqcptvy3w1t38qfq4a94h4q` (`created_by_id`),
  KEY `FKmgolsf926ppbtpahra7we3mp2` (`room_id`),
  CONSTRAINT `FK6fhqcptvy3w1t38qfq4a94h4q` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKmgolsf926ppbtpahra7we3mp2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `reply` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','RESOLVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('GENERAL','INVOICE_COMPLAINT','CONTRACT_ERROR','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `invoice_id` bigint DEFAULT NULL,
  `replied_by_id` bigint DEFAULT NULL,
  `resident_head_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKr0me3m3glxdct3kv3tm121ahb` (`invoice_id`),
  KEY `FKoowxjn6t3ss0ppfx675asdbt0` (`replied_by_id`),
  KEY `FKsifw8dm2dv4xyso9kcd4tv7jl` (`resident_head_id`),
  KEY `FK5l0wbcl1ckcticannwl5lfywx` (`room_id`),
  CONSTRAINT `FK5l0wbcl1ckcticannwl5lfywx` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FKoowxjn6t3ss0ppfx675asdbt0` FOREIGN KEY (`replied_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKr0me3m3glxdct3kv3tm121ahb` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `FKsifw8dm2dv4xyso9kcd4tv7jl` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(14,2) NOT NULL,
  `item_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `invoice_id` bigint NOT NULL,
  `service_fee_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK46ae0lhu1oqs7cv91fn6y9n7w` (`invoice_id`),
  KEY `FKgjt4jxy40sk7w2k2y8js9jvkp` (`service_fee_id`),
  CONSTRAINT `FK46ae0lhu1oqs7cv91fn6y9n7w` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `FKgjt4jxy40sk7w2k2y8js9jvkp` FOREIGN KEY (`service_fee_id`) REFERENCES `service_fees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `due_date` date NOT NULL,
  `invoice_month` date NOT NULL,
  `status` enum('UNPAID','PENDING_CONFIRMATION','PAID','OVERDUE','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_id` bigint NOT NULL,
  `resident_head_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `invoice_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoices_room_month` (`room_id`,`invoice_month`),
  KEY `FKadipohw5hqtrf2ucqh93du901` (`created_by_id`),
  KEY `FK8n4126vipbf80urjnqnb17tk7` (`resident_head_id`),
  CONSTRAINT `FK8n4126vipbf80urjnqnb17tk7` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKadipohw5hqtrf2ucqh93du901` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdyk9stbe14c67a8x3pcqg6k5f` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_note` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `assigned_to_id` bigint DEFAULT NULL,
  `resident_head_id` bigint DEFAULT NULL,
  `room_id` bigint DEFAULT NULL,
  `building_id` bigint DEFAULT NULL,
  `equipment_id` bigint DEFAULT NULL,
  `requested_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKirs2mjqoaxkdf48bfhheqrgd9` (`assigned_to_id`),
  KEY `FK1bumw485hubx0sjveqtfbocwj` (`resident_head_id`),
  KEY `FKcndie7sbh4o14jhu4yvro53jy` (`room_id`),
  KEY `FKi942xr81qlawt9h23co03tokf` (`building_id`),
  KEY `FKo5dw2bslaxj6sra7lb10psmsb` (`equipment_id`),
  KEY `FKb4g7vyhhdlrwx3calg1ols2j` (`requested_by_id`),
  CONSTRAINT `FK1bumw485hubx0sjveqtfbocwj` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKb4g7vyhhdlrwx3calg1ols2j` FOREIGN KEY (`requested_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKcndie7sbh4o14jhu4yvro53jy` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FKi942xr81qlawt9h23co03tokf` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  CONSTRAINT `FKirs2mjqoaxkdf48bfhheqrgd9` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKo5dw2bslaxj6sra7lb10psmsb` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notification_reads` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `read_at` datetime(6) NOT NULL,
  `notification_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_reads_notification_user` (`notification_id`,`user_id`),
  KEY `FKnlh7pma2y4w8vti9wu17ynqk` (`user_id`),
  CONSTRAINT `FKg4vrpg3nw9pe3fdskpba65rjp` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`),
  CONSTRAINT `FKnlh7pma2y4w8vti9wu17ynqk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notification_target_buildings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `building_id` bigint NOT NULL,
  `notification_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_target_buildings_notification_building` (`notification_id`,`building_id`),
  KEY `FKo97xx6rwkgmei5udtfpmtnjj7` (`building_id`),
  CONSTRAINT `FKjy9chhlm4jysyyebnl1ihwui4` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`),
  CONSTRAINT `FKo97xx6rwkgmei5udtfpmtnjj7` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notification_target_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `notification_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_target_users_notification_user` (`notification_id`,`user_id`),
  KEY `FK33mtmgtgcl2tsxyn6c5wqng4n` (`user_id`),
  CONSTRAINT `FK33mtmgtgcl2tsxyn6c5wqng4n` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKmxunweyvodh6dnwel7f6js16g` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `target_id` bigint DEFAULT NULL,
  `target_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK2bxmxpeaxhk66p3wni8vkmtcv` (`created_by_id`),
  CONSTRAINT `FK2bxmxpeaxhk66p3wni8vkmtcv` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `confirmed_at` datetime(6) DEFAULT NULL,
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `confirmed_by_id` bigint DEFAULT NULL,
  `invoice_id` bigint NOT NULL,
  `resident_head_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgnjvhf6m775ejls5or6p1p5b3` (`confirmed_by_id`),
  KEY `FKrbqec6be74wab8iifh8g3i50i` (`invoice_id`),
  KEY `FKl723y84wu2le0o6xgvvdgg32i` (`resident_head_id`),
  CONSTRAINT `FKgnjvhf6m775ejls5or6p1p5b3` FOREIGN KEY (`confirmed_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKl723y84wu2le0o6xgvvdgg32i` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrbqec6be74wab8iifh8g3i50i` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(14,2) NOT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `receipt_code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('VALID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` bigint NOT NULL,
  `invoice_id` bigint NOT NULL,
  `resident_head_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_t1da02pofk1uv20ldpwr8yhwl` (`receipt_code`),
  KEY `FKsn6hs4rk2wmjfowf6lairrhb8` (`created_by_id`),
  KEY `FK3hmid8b40s5yd0jo2s36684ql` (`invoice_id`),
  KEY `FKbpiy733ppvqr8ka6alk6ebnke` (`resident_head_id`),
  KEY `FKevww45wbno3i4ht4mcefvwjle` (`room_id`),
  CONSTRAINT `FK3hmid8b40s5yd0jo2s36684ql` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `FKbpiy733ppvqr8ka6alk6ebnke` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKevww45wbno3i4ht4mcefvwjle` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FKsn6hs4rk2wmjfowf6lairrhb8` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `rental_contract_file_histories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `replaced_at` datetime(6) NOT NULL,
  `rental_contract_id` bigint NOT NULL,
  `replaced_by_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKktjc5a31sfy9c223bebbtnjmb` (`rental_contract_id`),
  KEY `FK16a30nwme0frqerqp82hx39c5` (`replaced_by_id`),
  CONSTRAINT `FK16a30nwme0frqerqp82hx39c5` FOREIGN KEY (`replaced_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKktjc5a31sfy9c223bebbtnjmb` FOREIGN KEY (`rental_contract_id`) REFERENCES `rental_contracts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `rental_contracts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contract_file_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_status` enum('NOT_UPLOADED','UPLOADED','CONFIRMED','NEED_UPDATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deposit_amount` decimal(12,2) NOT NULL,
  `end_date` date NOT NULL,
  `rental_status` enum('ACTIVE','EXPIRING_SOON','EXPIRED','RENEWED','ENDED','TRANSFERRED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resident_head_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKi2o4092e7dmaj7aave6foh2yf` (`resident_head_id`),
  KEY `FKqu5fgbaa5mpfb8mdvebfko64t` (`room_id`),
  CONSTRAINT `FKi2o4092e7dmaj7aave6foh2yf` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqu5fgbaa5mpfb8mdvebfko64t` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `room_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `end_date` date NOT NULL,
  `start_date` date NOT NULL,
  `status` enum('ACTIVE','ENDED','TRANSFERRED','RENEWED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resident_head_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgsfk48nxf5bv05h03v2n5jbxa` (`resident_head_id`),
  KEY `FKt96wkyclodjlrg52xftxyve1h` (`room_id`),
  CONSTRAINT `FKgsfk48nxf5bv05h03v2n5jbxa` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKt96wkyclodjlrg52xftxyve1h` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `room_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `move_in_date` date NOT NULL,
  `move_out_date` date DEFAULT NULL,
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','LEFT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `resident_head_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKomlx41ppq1iu9ktdrr7t5rxdc` (`resident_head_id`),
  KEY `FK1bbl9rh6ae8v6mebaoq2ilg9g` (`room_id`),
  CONSTRAINT `FK1bbl9rh6ae8v6mebaoq2ilg9g` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FKomlx41ppq1iu9ktdrr7t5rxdc` FOREIGN KEY (`resident_head_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `area` decimal(10,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floor` int NOT NULL,
  `max_occupants` int NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `room_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('EMPTY','OCCUPIED','MAINTENANCE','RESERVED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `building_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_ejc4trkinbxtajwetru2o8kdo` (`room_code`),
  KEY `FKojgn0sxhkfxd7pmmojnem9r4q` (`building_id`),
  CONSTRAINT `FKojgn0sxhkfxd7pmmojnem9r4q` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sepay_payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `bank_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `last_webhook_error` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_amount` decimal(14,2) DEFAULT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_code` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sepay_transaction_id` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `webhook_content` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_7ofntbww9cw8hrpn5q7bh9p11` (`payment_code`),
  UNIQUE KEY `UK_p9vowxntk1w0m44pd1o4tg5bj` (`invoice_id`),
  CONSTRAINT `FK86ka67nybn2fd8d7enm5w6xqa` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `service_fees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calculation_type` enum('FIXED','BY_USAGE','BY_PERSON','BY_QUANTITY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `fee_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fee_type` enum('ROOM','ELECTRICITY','WATER','INTERNET','CLEANING','GARBAGE','PARKING','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `vehicle_type` enum('MOTORBIKE','CAR','BICYCLE','ELECTRIC_BIKE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `building_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_k11xxb1q732j2qch403ff8ufu` (`fee_code`),
  UNIQUE KEY `uk_service_fee_building_code` (`building_id`,`fee_code`),
  CONSTRAINT `FKogrqsfvbt2hul3wq5oiiu7orf` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `system_contact_phones` (
  `system_contact_id` bigint NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL,
  PRIMARY KEY (`system_contact_id`,`display_order`),
  CONSTRAINT `FKpjar71er7vk9bm85dgmymh09j` FOREIGN KEY (`system_contact_id`) REFERENCES `system_contacts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `system_contacts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `office_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `working_hours` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deadline` datetime(6) NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `result_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result_note` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('NEW','IN_PROGRESS','COMPLETED','REJECTED','OVERDUE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_type` enum('METER_READING','INVOICE_CREATION','ROOM_CHECK','MAINTENANCE','VEHICLE_CHECK','FEEDBACK_HANDLING','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `assigned_to_id` bigint NOT NULL,
  `created_by_id` bigint NOT NULL,
  `room_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK4516wfa828r15k9u3iw5er4vi` (`assigned_to_id`),
  KEY `FKmeg3m9hk7eyq7u5kpot87f9ey` (`created_by_id`),
  KEY `FK2qgc49xgrpfaevy9q4d9rm1xo` (`room_id`),
  CONSTRAINT `FK2qgc49xgrpfaevy9q4d9rm1xo` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FK4516wfa828r15k9u3iw5er4vi` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKmeg3m9hk7eyq7u5kpot87f9ey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `must_change_password` bit(1) NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','STAFF','RESIDENT_HEAD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','LOCKED','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `temporary_password_encrypted` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `utility_readings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `edit_reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `electricity_image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reading_month` date NOT NULL,
  `new_electricity` decimal(12,2) NOT NULL,
  `new_water` decimal(12,2) NOT NULL,
  `old_electricity` decimal(12,2) NOT NULL,
  `old_water` decimal(12,2) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `water_image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` bigint NOT NULL,
  `room_id` bigint NOT NULL,
  `reading_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_utility_readings_room_month` (`room_id`,`reading_month`),
  KEY `FKl1kd0es21lavq86k1jwbhg8kw` (`created_by_id`),
  CONSTRAINT `FKdxq1a7bce8t3guxf5g0sl7urn` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `FKl1kd0es21lavq86k1jwbhg8kw` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `brand` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `end_date` date DEFAULT NULL,
  `license_plate` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_type` enum('RESIDENT_HEAD','ROOM_MEMBER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `status` enum('PENDING','ACTIVE','INACTIVE','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `vehicle_type` enum('MOTORBIKE','CAR','BICYCLE','ELECTRIC_BIKE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbh2qqi0l3k98pxw0lm84y223` (`room_id`),
  CONSTRAINT `FKbh2qqi0l3k98pxw0lm84y223` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET FOREIGN_KEY_CHECKS = 1;
