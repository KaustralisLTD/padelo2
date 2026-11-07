import type { Pool } from 'mysql2/promise';

export async function ensureSentEmailsTable(pool: Pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resend_id VARCHAR(255) UNIQUE,
      from_email VARCHAR(255) NOT NULL,
      to_email TEXT NOT NULL,
      subject VARCHAR(500),
      html_content TEXT,
      text_content TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_from_email (from_email),
      INDEX idx_sent_at (sent_at),
      INDEX idx_resend_id (resend_id)
    )
  `);
}
