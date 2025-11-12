-- Migration script for existing photos table with data
-- This safely adds missing columns without losing data

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own photos" ON photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- Step 2: Add missing columns one by one
-- Add user_id column (nullable first, we'll populate it)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE photos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column';
  END IF;
END $$;

-- Add location column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE photos ADD COLUMN location TEXT;
    RAISE NOTICE 'Added location column';
  END IF;
END $$;

-- Add date_taken column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'date_taken'
  ) THEN
    ALTER TABLE photos ADD COLUMN date_taken DATE;
    RAISE NOTICE 'Added date_taken column';
  END IF;
END $$;

-- Add camera_settings column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'camera_settings'
  ) THEN
    ALTER TABLE photos ADD COLUMN camera_settings JSONB;
    RAISE NOTICE 'Added camera_settings column';
  END IF;
END $$;

-- Add tags column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE photos ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added tags column';
  END IF;
END $$;

-- Add featured column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'featured'
  ) THEN
    ALTER TABLE photos ADD COLUMN featured BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added featured column';
  END IF;
END $$;

-- Step 3: IMPORTANT - Update existing rows with user_id
-- You need to set user_id for existing photos
-- Option A: Set all existing photos to your user ID (replace with your actual user ID)
-- UPDATE photos SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;

-- Option B: Set all existing photos to the first authenticated user
-- This assumes you're the only user or want all photos assigned to the first user
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the first user ID from auth.users
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Update all photos without user_id to the first user
    UPDATE photos SET user_id = first_user_id WHERE user_id IS NULL;
    RAISE NOTICE 'Updated existing photos with user_id: %', first_user_id;
  ELSE
    RAISE NOTICE 'No users found. Please manually update photos with user_id.';
  END IF;
END $$;

-- Step 4: Make user_id NOT NULL (only after all rows have user_id)
-- Uncomment this after you've verified all rows have user_id
-- ALTER TABLE photos ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Ensure image_url is NOT NULL (if it's not already)
DO $$ 
BEGIN
  -- Check current constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'image_url'
    AND is_nullable = 'YES'
  ) THEN
    -- Only set NOT NULL if all rows have image_url
    UPDATE photos SET image_url = '' WHERE image_url IS NULL;
    ALTER TABLE photos ALTER COLUMN image_url SET NOT NULL;
    RAISE NOTICE 'Made image_url NOT NULL';
  END IF;
END $$;

-- Step 6: Ensure title is NOT NULL (if it's not already)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'title'
    AND is_nullable = 'YES'
  ) THEN
    UPDATE photos SET title = 'Untitled' WHERE title IS NULL;
    ALTER TABLE photos ALTER COLUMN title SET NOT NULL;
    RAISE NOTICE 'Made title NOT NULL';
  END IF;
END $$;

-- Step 7: Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Step 8: Create policies
CREATE POLICY "Users can view their own photos"
  ON photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (auth.uid() = user_id);

-- Step 9: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS photos_user_id_idx ON photos(user_id);
CREATE INDEX IF NOT EXISTS photos_featured_idx ON photos(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS photos_category_idx ON photos(category);
CREATE INDEX IF NOT EXISTS photos_date_taken_idx ON photos(date_taken);

-- Step 10: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_photos_updated_at();

-- Step 12: Verify the migration
-- Run this to check if everything is set up correctly:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'photos' 
-- ORDER BY ordinal_position;

