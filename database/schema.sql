-- =============================================
-- WhatsApp Bot Reminder - Database Schema
-- =============================================

-- Tabel reminder
CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(100) NOT NULL,
    notes TEXT NOT NULL,
    time VARCHAR(5) NOT NULL,
    schedule_type ENUM('daily', 'specific') NOT NULL,
    days VARCHAR(20) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_triggered DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_id (chat_id),
    INDEX idx_active (is_active)
);

-- Auth state table for Baileys (session creds + keys disimpan di MySQL)
CREATE TABLE IF NOT EXISTS baileys_auth (
    id VARCHAR(255) PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
