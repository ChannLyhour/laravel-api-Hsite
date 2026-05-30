/*
 Navicat Premium Dump SQL

 Source Server         : Books
 Source Server Type    : MySQL
 Source Server Version : 80407 (8.4.7)
 Source Host           : localhost:3306
 Source Schema         : hsite_system_api

 Target Server Type    : MySQL
 Target Server Version : 80407 (8.4.7)
 File Encoding         : 65001

 Date: 31/05/2026 01:40:34
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for banners
-- ----------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of banners
-- ----------------------------
INSERT INTO `banners` VALUES (1, 'banners/1779596966_6034595.jpg', 'The Best Food ❤️', 1, '2026-05-24 11:29:26', '2026-05-24 11:29:39', NULL);

-- ----------------------------
-- Table structure for cache
-- ----------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache`  (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`) USING BTREE,
  INDEX `cache_expiration_index`(`expiration` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cache
-- ----------------------------

-- ----------------------------
-- Table structure for cache_locks
-- ----------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks`  (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`) USING BTREE,
  INDEX `cache_locks_expiration_index`(`expiration` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cache_locks
-- ----------------------------

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2120018 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (2, 'Testing233111', 'Tesing232311', 1, '2026-05-24 11:20:05', '2026-05-29 08:42:33', 1);
INSERT INTO `categories` VALUES (3, 'Rice & Noodles', 'Traditional rice and noodle dishes', 1, '2026-05-24 11:20:05', '2026-05-26 13:55:04', 1);
INSERT INTO `categories` VALUES (4, 'Soups', 'Warm and comforting soups', 1, '2026-05-24 11:20:05', '2026-05-26 13:55:06', 1);
INSERT INTO `categories` VALUES (5, 'Salads', 'Fresh and healthy salad options', 1, '2026-05-24 11:20:05', '2026-05-26 13:55:06', 1);
INSERT INTO `categories` VALUES (6, 'Grilled Specialties', 'Delicious grilled meats and seafood', 1, '2026-05-24 11:20:05', '2026-05-26 13:55:07', 1);
INSERT INTO `categories` VALUES (7, 'Seafood', 'Fresh catch of the day', 1, '2026-05-24 11:20:05', '2026-05-26 13:55:03', 1);
INSERT INTO `categories` VALUES (8, 'Vegetarian', 'Plant-based delicious options', 1, '2026-05-24 11:20:05', '2026-05-24 11:20:05', 1);
INSERT INTO `categories` VALUES (9, 'Desserts', 'Sweet treats to end your meal', 1, '2026-05-24 11:20:05', '2026-05-24 11:20:05', 1);
INSERT INTO `categories` VALUES (30014, 'Testing', 'Tesing', 1, '2026-05-29 06:30:10', '2026-05-29 06:30:10', 2);
INSERT INTO `categories` VALUES (30015, 'Testing1', 'Tesing', 1, '2026-05-29 06:32:45', '2026-05-29 16:31:12', 2);
INSERT INTO `categories` VALUES (2060013, 'Houuus', 'sjdnsjf', 1, '2026-05-29 14:00:20', '2026-05-29 14:00:20', 1);
INSERT INTO `categories` VALUES (2090013, 'Soup Khmer', NULL, 1, '2026-05-29 15:45:45', '2026-05-29 15:45:45', 6);
INSERT INTO `categories` VALUES (2090014, 'Chivorn', 'Hhhd', 1, '2026-05-29 15:54:25', '2026-05-29 15:54:25', 6);
INSERT INTO `categories` VALUES (2120013, 'Pizza', NULL, 1, '2026-05-30 03:21:09', '2026-05-30 03:21:09', 9);
INSERT INTO `categories` VALUES (2120015, 'Khmer Food', NULL, 1, '2026-05-30 18:16:46', '2026-05-30 18:16:46', 9);
INSERT INTO `categories` VALUES (2120016, 'Khmer', 'djbdbjfdf', 1, '2026-05-30 18:18:25', '2026-05-30 18:18:25', 9);
INSERT INTO `categories` VALUES (2120017, 'hbhh', 'jbbbjbj', 1, '2026-05-30 18:21:08', '2026-05-30 18:21:08', 3);

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `city` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `customers_user_id_foreign`(`user_id` ASC) USING BTREE,
  CONSTRAINT `customers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30007 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of customers
-- ----------------------------
INSERT INTO `customers` VALUES (1, 3, 'Chann Lyhour', 'ChannLyhour@gmail.com', '08188182121', '301 Siem Reap, Cambodia', 'Siem Reap', '2026-05-24 11:42:31', '2026-05-24 11:49:38', NULL, NULL);
INSERT INTO `customers` VALUES (4, 2, 'Jane Smith', 'customer@example.com', NULL, NULL, NULL, '2026-05-26 12:25:14', '2026-05-26 12:25:14', NULL, NULL);
INSERT INTO `customers` VALUES (5, 9, 'Testing', 'customer11@example.com', '093778374', 'SR', 'SR', '2026-05-26 12:43:05', '2026-05-26 12:43:05', NULL, NULL);
INSERT INTO `customers` VALUES (30006, 30016, 'John Doe', NULL, '+855 99 999 999', 'Phnom Penh Resident St. 99', NULL, '2026-05-30 07:40:13', '2026-05-30 07:40:13', 30016, NULL);

-- ----------------------------
-- Table structure for failed_jobs
-- ----------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of failed_jobs
-- ----------------------------

-- ----------------------------
-- Table structure for food_items
-- ----------------------------
DROP TABLE IF EXISTS `food_items`;
CREATE TABLE `food_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `price` double NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_available` tinyint(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `food_items_name_index`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of food_items
-- ----------------------------

-- ----------------------------
-- Table structure for job_batches
-- ----------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `cancelled_at` int NULL DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of job_batches
-- ----------------------------

-- ----------------------------
-- Table structure for jobs
-- ----------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED NULL DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `jobs_queue_index`(`queue` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of jobs
-- ----------------------------

-- ----------------------------
-- Table structure for likes
-- ----------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `likeable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `likeable_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_like_unique`(`user_id` ASC, `likeable_id` ASC, `likeable_type` ASC) USING BTREE,
  INDEX `likes_likeable_type_likeable_id_index`(`likeable_type` ASC, `likeable_id` ASC) USING BTREE,
  INDEX `likes_likeable_id_likeable_type_index`(`likeable_id` ASC, `likeable_type` ASC) USING BTREE,
  CONSTRAINT `likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of likes
-- ----------------------------
INSERT INTO `likes` VALUES (1, 3, 'App\\Models\\MenuItem', 99, '2026-05-24 12:46:13', '2026-05-24 12:46:13', NULL);
INSERT INTO `likes` VALUES (2, 3, 'App\\Models\\MenuItem', 98, '2026-05-24 12:46:16', '2026-05-24 12:46:16', NULL);
INSERT INTO `likes` VALUES (3, 3, 'App\\Models\\MenuItem', 3, '2026-05-24 12:46:17', '2026-05-24 12:46:17', NULL);
INSERT INTO `likes` VALUES (9, 8, 'App\\Models\\MenuItem', 4, '2026-05-24 18:10:05', '2026-05-24 18:10:05', NULL);
INSERT INTO `likes` VALUES (10, 8, 'App\\Models\\MenuItem', 5, '2026-05-24 18:10:06', '2026-05-24 18:10:06', NULL);
INSERT INTO `likes` VALUES (14, 8, 'App\\Models\\MenuItem', 6, '2026-05-24 18:10:10', '2026-05-24 18:10:10', NULL);
INSERT INTO `likes` VALUES (15, 8, 'App\\Models\\MenuItem', 3, '2026-05-24 18:11:34', '2026-05-24 18:11:34', NULL);
INSERT INTO `likes` VALUES (18, 8, 'App\\Models\\MenuItem', 8, '2026-05-24 18:12:36', '2026-05-24 18:12:36', NULL);
INSERT INTO `likes` VALUES (19, 8, 'App\\Models\\MenuItem', 95, '2026-05-24 18:12:41', '2026-05-24 18:12:41', NULL);
INSERT INTO `likes` VALUES (20, 8, 'App\\Models\\MenuItem', 93, '2026-05-24 18:12:42', '2026-05-24 18:12:42', NULL);
INSERT INTO `likes` VALUES (22, 8, 'App\\Models\\MenuItem', 7, '2026-05-24 18:14:22', '2026-05-24 18:14:22', NULL);
INSERT INTO `likes` VALUES (28, 8, 'App\\Models\\MenuItem', 99, '2026-05-24 18:15:02', '2026-05-24 18:15:02', NULL);

-- ----------------------------
-- Table structure for menu_item_ratings
-- ----------------------------
DROP TABLE IF EXISTS `menu_item_ratings`;
CREATE TABLE `menu_item_ratings`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `menu_item_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `rating` int UNSIGNED NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `menu_item_ratings_menu_item_id_customer_id_order_id_unique`(`menu_item_id` ASC, `customer_id` ASC, `order_id` ASC) USING BTREE,
  INDEX `menu_item_ratings_customer_id_foreign`(`customer_id` ASC) USING BTREE,
  INDEX `menu_item_ratings_order_id_foreign`(`order_id` ASC) USING BTREE,
  CONSTRAINT `menu_item_ratings_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `menu_item_ratings_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `menu_item_ratings_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of menu_item_ratings
-- ----------------------------

-- ----------------------------
-- Table structure for menu_items
-- ----------------------------
DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` bigint UNSIGNED NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `price` decimal(10, 2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` enum('available','unavailable') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `menu_items_category_id_foreign`(`category_id` ASC) USING BTREE,
  CONSTRAINT `menu_items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 210111 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of menu_items
-- ----------------------------
INSERT INTO `menu_items` VALUES (11, 2, 'Hour Steak', 'Premium beef steak with choice of sides', 24.99, 'menu-items/1780127684_favicon-removebg-preview.png', 'unavailable', '2026-05-24 11:20:05', '2026-05-30 07:55:13', 1);
INSERT INTO `menu_items` VALUES (93, 30015, 'Lemonade', 'Homemade fresh lemonade', 3.99, 'menu-items/1780118700_619ufv8EySL.jpg', 'available', '2026-05-24 11:20:05', '2026-05-30 06:38:39', 2);
INSERT INTO `menu_items` VALUES (94, 30015, 'Milkshake', 'Vanilla, chocolate, or strawberry', 5.99, 'menu-items/1780072255_download.png', 'unavailable', '2026-05-24 11:20:05', '2026-05-30 06:36:00', 2);
INSERT INTO `menu_items` VALUES (90102, 30015, 'Amok', 'kdfmdfkdnvkdnv', 9.00, 'menu-items/1780072290_photo_2026-05-21_22-32-24.jpg', 'available', '2026-05-29 09:37:57', '2026-05-29 16:31:31', 2);
INSERT INTO `menu_items` VALUES (120103, 2090013, 'Soup chicken', 'sdnjbsdjksbkchb', 9.00, 'menu-items/1780072442_IMG_4459.JPG', 'available', '2026-05-29 15:46:12', '2026-05-29 16:34:02', 6);
INSERT INTO `menu_items` VALUES (120104, 2090014, 'Lok Lak', 'jnsbjjbs', 9.00, 'menu-items/1780072449_IMG_4461.JPG', 'available', '2026-05-29 15:56:48', '2026-05-29 16:34:10', 6);
INSERT INTO `menu_items` VALUES (150102, 2120013, 'Pizza Cambodai', NULL, 9.00, 'menu-items/1780129103_download (2).jpg', 'available', '2026-05-30 03:21:41', '2026-05-30 08:18:23', 9);
INSERT INTO `menu_items` VALUES (180102, 30014, 'qqw', 'dsdsdsd', 3.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 'available', '2026-05-30 05:59:54', '2026-05-30 05:59:54', 2);
INSERT INTO `menu_items` VALUES (180103, 30014, 'sdsdsdsd', 'sdsdsd', 1.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 'available', '2026-05-30 06:00:05', '2026-05-30 06:00:05', 2);
INSERT INTO `menu_items` VALUES (180104, 30014, 'sdsdsd', 'sdsdsdsd', 2.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 'available', '2026-05-30 06:00:37', '2026-05-30 06:00:37', 2);
INSERT INTO `menu_items` VALUES (210108, NULL, 'Burger Special', NULL, 12.50, NULL, 'available', NULL, NULL, 30017);
INSERT INTO `menu_items` VALUES (210109, NULL, 'Chilled Iced Latte', NULL, 4.00, NULL, 'available', NULL, NULL, 30017);
INSERT INTO `menu_items` VALUES (210110, 2120017, 'hhhjh', 'jhvvh', 8.00, 'uploads/menu-items/1780165295_paypal-3384015-1280.png', 'available', '2026-05-30 18:21:27', '2026-05-30 18:21:35', 3);

-- ----------------------------
-- Table structure for migrations
-- ----------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of migrations
-- ----------------------------
INSERT INTO `migrations` VALUES (1, '0001_01_01_000000_create_roles_table', 1);
INSERT INTO `migrations` VALUES (2, '0001_01_01_000001_create_users_table', 1);
INSERT INTO `migrations` VALUES (3, '0001_01_01_000002_create_cache_table', 1);
INSERT INTO `migrations` VALUES (4, '0001_01_01_000003_create_jobs_table', 1);
INSERT INTO `migrations` VALUES (5, '0001_01_01_000004_create_personal_access_tokens_table', 1);
INSERT INTO `migrations` VALUES (6, '0001_01_01_000005_create_categories_table', 1);
INSERT INTO `migrations` VALUES (7, '0001_01_01_000006_create_stores_table', 1);
INSERT INTO `migrations` VALUES (8, '0001_01_01_000007_create_menu_items_table', 1);
INSERT INTO `migrations` VALUES (9, '0001_01_01_000008_create_customers_table', 1);
INSERT INTO `migrations` VALUES (10, '0001_01_01_000009_create_orders_table', 1);
INSERT INTO `migrations` VALUES (11, '0001_01_01_000010_create_order_items_table', 1);
INSERT INTO `migrations` VALUES (12, '0001_01_01_000011_create_payments_table', 1);
INSERT INTO `migrations` VALUES (13, '0001_01_01_000012_create_banners_table', 1);
INSERT INTO `migrations` VALUES (14, '0001_01_01_000013_create_likes_table', 1);
INSERT INTO `migrations` VALUES (15, '0001_01_01_000014_create_menu_item_ratings_table', 1);
INSERT INTO `migrations` VALUES (16, '0001_01_01_000015_create_pages_table', 1);
INSERT INTO `migrations` VALUES (17, '0001_01_01_000016_create_posts_table', 1);
INSERT INTO `migrations` VALUES (18, '0001_01_01_000017_create_settings_table', 1);
INSERT INTO `migrations` VALUES (19, '0001_01_01_000018_create_food_items_table', 1);
INSERT INTO `migrations` VALUES (20, '0001_01_01_000019_add_subscription_and_domain_to_stores_table', 1);

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `menu_item_id` bigint UNSIGNED NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10, 2) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_items_order_id_foreign`(`order_id` ASC) USING BTREE,
  INDEX `order_items_menu_item_id_foreign`(`menu_item_id` ASC) USING BTREE,
  CONSTRAINT `order_items_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_items
-- ----------------------------
INSERT INTO `order_items` VALUES (1, 30007, 210108, 'Burger Special', 2, 12.50);
INSERT INTO `order_items` VALUES (2, 30007, 210109, 'Chilled Iced Latte', 3, 4.00);

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `order_type` enum('dine_in','takeaway','delivery') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine_in',
  `customer_id` bigint UNSIGNED NULL DEFAULT NULL,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `tax` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  `store_id` bigint UNSIGNED NULL DEFAULT NULL,
  `payment_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unpaid',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cash on Delivery',
  `customer_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `customer_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `customer_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `orders_order_no_unique`(`order_no` ASC) USING BTREE,
  INDEX `orders_customer_id_foreign`(`customer_id` ASC) USING BTREE,
  INDEX `orders_user_id_foreign`(`user_id` ASC) USING BTREE,
  INDEX `orders_store_id_foreign`(`store_id` ASC) USING BTREE,
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `orders_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30008 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, 'ORD-DLFEH3', 'dine_in', NULL, 1, NULL, 'completed', 47.95, 4.80, 52.75, NULL, '2026-05-24 11:26:12', '2026-05-24 11:26:12', NULL, NULL, 'Unpaid', 'Cash on Delivery', NULL, NULL, NULL);
INSERT INTO `orders` VALUES (2, 'ORD-31YD6B', 'delivery', 1, 3, 'hhh', 'completed', 4.99, 0.50, 5.49, NULL, '2026-05-24 11:49:38', '2026-05-24 12:06:32', NULL, NULL, 'Unpaid', 'Cash on Delivery', NULL, NULL, NULL);
INSERT INTO `orders` VALUES (5, 'ORD-HOVOBY', 'delivery', 1, 3, NULL, 'pending', 4.99, 0.00, 4.99, NULL, '2026-05-24 12:51:59', '2026-05-24 12:51:59', NULL, NULL, 'Unpaid', 'Cash on Delivery', NULL, NULL, NULL);
INSERT INTO `orders` VALUES (30007, NULL, 'dine_in', 30006, 30016, 'Extra cheese on burger', 'complete', 0.00, 3.70, 40.70, NULL, '2026-05-30 07:40:14', '2026-05-30 07:40:15', NULL, 30004, 'Paid', 'Cash on Delivery', 'John Doe', '+855 99 999 999', 'Phnom Penh Resident St. 99');

-- ----------------------------
-- Table structure for pages
-- ----------------------------
DROP TABLE IF EXISTS `pages`;
CREATE TABLE `pages`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `pages_slug_unique`(`slug` ASC) USING BTREE,
  INDEX `pages_created_by_foreign`(`created_by` ASC) USING BTREE,
  CONSTRAINT `pages_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of pages
-- ----------------------------

-- ----------------------------
-- Table structure for password_reset_tokens
-- ----------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens`  (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of password_reset_tokens
-- ----------------------------

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `payment_method` enum('cash','card','qr','khqr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `total_amount` decimal(10, 2) NOT NULL,
  `paid_amount` decimal(10, 2) NOT NULL,
  `change_amount` decimal(10, 2) NOT NULL,
  `status` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'paid',
  `khqr_md5` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `khqr_string` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `khqr_transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `khqr_expires_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `payments_order_id_foreign`(`order_id` ASC) USING BTREE,
  CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------
INSERT INTO `payments` VALUES (1, 1, 'cash', 52.75, 60.00, 7.26, 'paid', NULL, NULL, NULL, NULL, '2026-05-24 11:26:12', '2026-05-24 11:26:12', '2026-05-24 11:26:12', NULL);
INSERT INTO `payments` VALUES (2, 2, 'khqr', 5.49, 5.49, 0.00, 'paid', NULL, '00020101021129180006bakong0100020052045812530384054045.495802KH5910Restaurant6010Phnom Penh62140110ORD-31YD6B63043ED8', NULL, '2026-05-24 12:04:48', '2026-05-24 12:06:32', '2026-05-24 11:49:48', '2026-05-24 12:06:32', NULL);
INSERT INTO `payments` VALUES (3, 5, 'cash', 4.99, 0.00, 0.00, 'paid', NULL, NULL, NULL, NULL, NULL, '2026-05-24 12:51:59', '2026-05-24 17:19:50', NULL);

-- ----------------------------
-- Table structure for personal_access_tokens
-- ----------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `personal_access_tokens_token_unique`(`token` ASC) USING BTREE,
  INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type` ASC, `tokenable_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of personal_access_tokens
-- ----------------------------
INSERT INTO `personal_access_tokens` VALUES (1, 'App\\Models\\User', 3, 'auth-token', '83d2b8f2f73420b325047d3297ae3549c50633be9b40687e21dafcfa7f195ba0', '[\"*\"]', '2026-05-30 18:24:18', NULL, '2026-05-30 18:12:24', '2026-05-30 18:24:18');
INSERT INTO `personal_access_tokens` VALUES (2, 'App\\Models\\User', 3, 'auth-token', '9642042a4d8ca4c6b45d84014f787f6354c8fc0409ec71f2b0293433ce4df2db', '[\"*\"]', '2026-05-30 18:28:05', NULL, '2026-05-30 18:25:16', '2026-05-30 18:28:05');
INSERT INTO `personal_access_tokens` VALUES (3, 'App\\Models\\User', 30018, 'auth-token', '8227cac324f2547d79b2d3a4eea1530beadd2c633381c61603ee77ca386b6b6f', '[\"*\"]', NULL, NULL, '2026-05-30 18:26:24', '2026-05-30 18:26:24');

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `featured_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `posts_slug_unique`(`slug` ASC) USING BTREE,
  INDEX `posts_user_id_foreign`(`user_id` ASC) USING BTREE,
  CONSTRAINT `posts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of posts
-- ----------------------------

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `roles_slug_unique`(`slug` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 30004 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of roles
-- ----------------------------
INSERT INTO `roles` VALUES (1, 'Admin', 'admin', NULL, '2026-05-24 11:20:05', '2026-05-24 11:20:05');
INSERT INTO `roles` VALUES (2, 'Customer', 'customer', NULL, '2026-05-24 11:20:05', '2026-05-24 11:20:05');
INSERT INTO `roles` VALUES (30003, 'Owner', 'owner', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sessions_user_id_index`(`user_id` ASC) USING BTREE,
  INDEX `sessions_last_activity_index`(`last_activity` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sessions
-- ----------------------------
INSERT INTO `sessions` VALUES ('kvfY4i4EWEBckyAMeYSoqglkSeH9MsYbyYSsC7YS', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidHZPSUpmS0NWZWMwaWVaMVRhbWJNNWJneVZvWXFhSDFwRWdJSHMxSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1780166267);

-- ----------------------------
-- Table structure for settings
-- ----------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 90025 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of settings
-- ----------------------------
INSERT INTO `settings` VALUES (5, 'logo', 'settings/1779684821_photo_2026-05-21_22-32-24.jpg', '2026-05-24 11:35:03', '2026-05-25 11:53:41', 1);
INSERT INTO `settings` VALUES (6, 'favicon', 'settings/1779684821_photo_2026-05-21_22-32-24.jpg', '2026-05-24 11:35:03', '2026-05-25 11:53:41', 1);
INSERT INTO `settings` VALUES (8, 'weekday_hours', 'Mon-Fri: 10am - 9pm', '2026-05-24 16:29:48', '2026-05-24 16:29:48', 1);
INSERT INTO `settings` VALUES (9, 'weekend_hours', 'Sat-Sun: 11am - 11pm', '2026-05-24 16:29:48', '2026-05-24 16:29:48', 1);
INSERT INTO `settings` VALUES (10, 'footer_description', 'Fine food, delivered with care. From our kitchen to your door.', '2026-05-25 11:53:41', '2026-05-25 11:53:41', 1);
INSERT INTO `settings` VALUES (11, 'footer_copyright', '© 2026 Food Ordering System. All rights reserved.', '2026-05-25 11:53:41', '2026-05-25 11:53:41', 1);
INSERT INTO `settings` VALUES (90024, 'site_maintenance_mode', 'false', NULL, NULL, 1);

-- ----------------------------
-- Table structure for stores
-- ----------------------------
DROP TABLE IF EXISTS `stores`;
CREATE TABLE `stores`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_by` bigint UNSIGNED NOT NULL,
  `store_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `store_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `store_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `store_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `tax_percentage` double NULL DEFAULT NULL,
  `subscription_tier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free',
  `custom_domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `logo_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `social_tiktok` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `social_facebook` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `social_telegram` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT NULL,
  `deleted_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `stores_created_by_foreign`(`created_by` ASC) USING BTREE,
  UNIQUE INDEX `stores_custom_domain_unique`(`custom_domain` ASC) USING BTREE,
  CONSTRAINT `stores_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30005 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of stores
-- ----------------------------
INSERT INTO `stores` VALUES (1, 1, 'Food Ordering System', '09876543', 'brohour00044@gmail.com', 'Siem Reap', 0.01, 'premium', 'foodsystem.com', '', 'https://www.tiktok.com/@fujinstatic', 'https://web.facebook.com/bro.hour.1422409', 'https://t.me/LHor2005', '2026-05-30 03:02:45', '2026-05-30 03:06:48', NULL);
INSERT INTO `stores` VALUES (2, 2, 'Lyhour Store Kh', '068642521', 'Hour@gmail.com', 'Siem Reap', 1, 'standard', NULL, '', 'https://www.tiktok.com/@raaaaaaaaaa715/video/7642162216027852053?is_from_webapp=1&sender_device=pc', 'https://www.tiktok.com/@raaaaaaaaaa715/video/7642162216027852053?is_from_webapp=1&sender_device=pc', 'https://www.tiktok.com/@raaaaaaaaaa715/video/7642162216027852053?is_from_webapp=1&sender_device=pc', '2026-05-30 03:06:48', '2026-05-30 07:09:52', NULL);
INSERT INTO `stores` VALUES (3, 6, 'Chivorn Store kh', '---', '---', '---', 0, 'premium', 'chivornstore.com', '', '#', '#', '#', '2026-05-30 03:06:48', '2026-05-30 03:06:48', NULL);
INSERT INTO `stores` VALUES (4, 9, 'TiTong Store KH', '082838233', 'Tong@gmail.com', 'Siem Reap', 0, 'free', NULL, '', '#', '#', '#', '2026-05-30 03:06:48', '2026-05-30 03:08:20', NULL);
INSERT INTO `stores` VALUES (30004, 30017, 'Integration Test Cafe', '012345678', 'testcafe@example.com', NULL, 10, 'free', NULL, NULL, NULL, NULL, NULL, '2026-05-30 07:40:13', NULL, NULL);

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` bigint UNSIGNED NULL DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `state` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `users_email_unique`(`email` ASC) USING BTREE,
  INDEX `users_role_id_foreign`(`role_id` ASC) USING BTREE,
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30019 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'Super Admin', 1, NULL, 'admin@example.com', NULL, NULL, 'active', 'users/1779600384_photo_2026-05-21_22-30-32.jpg', NULL, '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa', 'ZXS2KVeKCd3mbgovMK3C08uvylMn9LCpOhTHoJUUMzljqkuylaeBheApjWjS', '2026-05-24 11:20:05', '2026-05-24 12:26:24', NULL, NULL);
INSERT INTO `users` VALUES (2, 'Jane Smith', 1, NULL, 'customer@example.com', NULL, NULL, 'active', 'users/1779773100_download.png', NULL, '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa', NULL, '2026-05-24 11:20:05', '2026-05-26 12:25:00', NULL, NULL);
INSERT INTO `users` VALUES (3, 'Chann Lyhour', 30003, NULL, 'ChannLyhour@gmail.com', '', '', 'active', 'users/1779597775_668598681_1402866021867146_1795824876399772923_n.jpg', NULL, '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa', NULL, '2026-05-24 11:42:31', '2026-05-24 11:42:55', NULL, NULL);
INSERT INTO `users` VALUES (6, 'Test', 30003, NULL, 'test@example.com', NULL, NULL, 'active', NULL, NULL, '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa', NULL, '2026-05-24 15:25:44', '2026-05-24 15:25:44', NULL, NULL);
INSERT INTO `users` VALUES (7, 'Hiii', 2, NULL, 'G1@gmail.com', NULL, NULL, 'active', NULL, NULL, '$2y$12$0aPX6uLdfFn13gXSm2fUD.btdc2seBZzBIO7.sV8Ki99bULzS3fKG', NULL, '2026-05-24 15:55:46', '2026-05-24 15:55:46', NULL, NULL);
INSERT INTO `users` VALUES (8, 'Bro hour', 2, NULL, 'info@example.com', NULL, NULL, 'active', 'users/1779620938_favicon.png', NULL, '$2y$12$ubsYQEUZMDsM2EmTeh3dt.6POPnHatL7IgH6myKK7mnE93jj0x7R6', NULL, '2026-05-24 17:58:50', '2026-05-24 18:08:58', NULL, NULL);
INSERT INTO `users` VALUES (9, 'Testing', 30003, '093778374', 'customer11@example.com', 'SR', 'SR', 'active', NULL, NULL, '$2y$12$a8bISyamdJ7bjl4I.pApPuH1Dm/dBsSs8jpI/cfxYfkZXgpqC9mqS', NULL, '2026-05-26 12:43:05', '2026-05-26 12:43:05', NULL, NULL);
INSERT INTO `users` VALUES (30016, 'Test Customer', 2, NULL, 'test_customer@example.com', NULL, NULL, 'active', NULL, NULL, 'hashedpassword', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `users` VALUES (30017, 'Test Owner', 30003, NULL, 'test_owner@example.com', NULL, NULL, 'active', NULL, NULL, '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `users` VALUES (30018, 'sdsdsd', 30003, '09872893', 'sdsd@gmail.com', NULL, NULL, 'active', NULL, NULL, '$2y$12$t5EFcCu5aPSw7RTbEFGAPejKIWAakcdUmZtBihQBXuPt2G3qTKUZy', NULL, '2026-05-30 18:26:24', '2026-05-30 18:26:24', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
