CREATE TABLE IF NOT EXISTS `password_reset_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  `attempt_count` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_password_reset_codes_user_active` (`user_id`, `used_at`, `created_at`),
  CONSTRAINT `fk_password_reset_codes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
