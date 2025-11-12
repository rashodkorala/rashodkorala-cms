-- Migration script to update existing projects table for multiple images
-- Run this if you already have a projects table with a single image_url

-- Step 1: Add website_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE projects ADD COLUMN website_url TEXT;
  END IF;
END $$;

-- Step 2: Convert single image_url to array if it exists as TEXT
DO $$ 
BEGIN
  -- Check if image_url exists and is TEXT (not array)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'image_url' 
    AND data_type = 'text'
  ) THEN
    -- Create temporary column
    ALTER TABLE projects ADD COLUMN image_url_new TEXT[] DEFAULT '{}';
    
    -- Migrate data: convert single URL to array
    UPDATE projects 
    SET image_url_new = CASE 
      WHEN image_url IS NOT NULL AND image_url != '' 
      THEN ARRAY[image_url] 
      ELSE '{}' 
    END;
    
    -- Drop old column
    ALTER TABLE projects DROP COLUMN image_url;
    
    -- Rename new column
    ALTER TABLE projects RENAME COLUMN image_url_new TO image_url;
  END IF;
END $$;

-- Step 3: Ensure image_url is TEXT[] with default
DO $$ 
BEGIN
  -- If column doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_url TEXT[] DEFAULT '{}';
  ELSE
    -- Ensure default is set
    ALTER TABLE projects ALTER COLUMN image_url SET DEFAULT '{}';
  END IF;
END $$;

