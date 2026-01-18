-- Initialize Media Scraper Database

-- Use UTF8MB4 for full Unicode support
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create tables will be handled by Sequelize
-- This file is for any additional initialization

-- Enable full-text search
SET GLOBAL innodb_ft_enable_stopword = 0;

-- Optimize for read-heavy workload
SET GLOBAL innodb_buffer_pool_size = 134217728; -- 128MB

-- Log slow queries for debugging
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 2;
