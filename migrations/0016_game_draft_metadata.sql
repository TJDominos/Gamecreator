-- Migration: 0016_game_draft_metadata.sql
-- Scope: Persist creator-editable draft metadata in D1.

ALTER TABLE games ADD COLUMN display_version TEXT;
ALTER TABLE games ADD COLUMN category TEXT;
ALTER TABLE games ADD COLUMN age_rating TEXT;
ALTER TABLE games ADD COLUMN device_support TEXT;