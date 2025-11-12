-- Add cover_image_url column to projects table
-- Run this SQL in your Supabase SQL Editor

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE projects ADD COLUMN cover_image_url TEXT;
    RAISE NOTICE 'Added cover_image_url column to projects table';
  END IF;
END $$;

