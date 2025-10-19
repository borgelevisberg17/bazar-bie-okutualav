-- Add 2FA columns to users table
ALTER TABLE users
ADD COLUMN two_factor_secret TEXT,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
