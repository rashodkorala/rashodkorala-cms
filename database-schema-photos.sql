-- Create photos table for personal CMS photography section
-- Run this SQL in your Supabase SQL Editor

-- IMPORTANT: If you get an error about user_id not existing, 
-- the table was created incorrectly. Run this first to start fresh:
-- DROP TABLE IF EXISTS photos CASCADE;

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own photos" ON photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

-- Step 2: Create photos table (this will only create if it doesn't exist)
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

-- Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own photos
CREATE POLICY "Users can view their own photos"
  ON photos FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own photos
CREATE POLICY "Users can insert their own photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update their own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
  ON photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS photos_user_id_idx ON photos(user_id);
CREATE INDEX IF NOT EXISTS photos_featured_idx ON photos(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS photos_category_idx ON photos(category);
CREATE INDEX IF NOT EXISTS photos_date_taken_idx ON photos(date_taken);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_photos_updated_at();

