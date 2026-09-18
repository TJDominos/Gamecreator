-- Migration: 0012_user_avatar.sql
-- Cache the main-site profile image in the Creator Portal shadow user.

ALTER TABLE users ADD COLUMN avatar_url TEXT;
