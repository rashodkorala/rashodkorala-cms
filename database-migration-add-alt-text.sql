-- Add alt_text column to photos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'alt_text'
  ) THEN
    ALTER TABLE photos ADD COLUMN alt_text TEXT;
    RAISE NOTICE 'Added alt_text column to photos table';
  END IF;
END $$;

