-- Migration: 0011_user_roles.sql
-- Store independent portal identities so one user can be both creator and admin.

ALTER TABLE users ADD COLUMN roles TEXT NOT NULL DEFAULT '["player"]';

UPDATE users
SET roles = CASE role
  WHEN 'admin' THEN '["admin"]'
  WHEN 'creator' THEN '["creator"]'
  ELSE '["player"]'
END
WHERE roles = '["player"]' AND role IN ('admin', 'creator');