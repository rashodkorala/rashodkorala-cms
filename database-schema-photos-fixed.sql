-- Create photos table for personal CMS photography section
-- Run this SQL in your Supabase SQL Editor
-- This version handles existing tables safely

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own photos" ON photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- Step 2: Check if table exists and has user_id column
-- If table exists without user_id, we need to handle it
DO $$ 
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'photos'
  ) THEN
    -- Check if user_id column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'photos' 
      AND column_name = 'user_id'
    ) THEN
      -- Add user_id column (nullable first, you'll need to populate it)
      ALTER TABLE photos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added user_id column to existing photos table. Please update existing rows with user IDs.';
    END IF;
  END IF;
END $$;

-- Step 3: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  location TEXT,
  date_taken DATE,
  camera_settings JSONB,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Step 4: Make user_id NOT NULL if it was just added (only if table was empty)
-- Skip this if you have existing data - you'll need to populate user_id first
-- ALTER TABLE photos ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
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

-- Step 7: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS photos_user_id_idx ON photos(user_id);
CREATE INDEX IF NOT EXISTS photos_featured_idx ON photos(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS photos_category_idx ON photos(category);
CREATE INDEX IF NOT EXISTS photos_date_taken_idx ON photos(date_taken);

-- Step 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_photos_updated_at();

