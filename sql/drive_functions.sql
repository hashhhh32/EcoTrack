-- Function to increment the participants count for a drive
CREATE OR REPLACE FUNCTION increment_drive_participants(drive_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ngo_drives
  SET participants_count = participants_count + 1
  WHERE id = drive_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement the participants count for a drive
CREATE OR REPLACE FUNCTION decrement_drive_participants(drive_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ngo_drives
  SET participants_count = GREATEST(0, participants_count - 1)
  WHERE id = drive_id;
END;
$$ LANGUAGE plpgsql;

-- Create the drive_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS drive_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drive_id UUID NOT NULL REFERENCES ngo_drives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE(drive_id, user_id)
);

-- Create the ngo_drives table if it doesn't exist
CREATE TABLE IF NOT EXISTS ngo_drives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  organizer TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  participants_count INTEGER DEFAULT 0
);

-- Add RLS policies for drive_participants
ALTER TABLE drive_participants ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own participations
CREATE POLICY view_own_participations ON drive_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for admins to view all participations
CREATE POLICY admin_view_all_participations ON drive_participants
  FOR SELECT
  USING (auth.email() = 'admin@ecotrack.com');

-- Policy for users to insert their own participations
CREATE POLICY insert_own_participation ON drive_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own participations
CREATE POLICY delete_own_participation ON drive_participants
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for admins to manage all participations
CREATE POLICY admin_manage_all_participations ON drive_participants
  FOR ALL
  USING (auth.email() = 'admin@ecotrack.com');

-- Add RLS policies for ngo_drives
ALTER TABLE ngo_drives ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to view drives
CREATE POLICY view_drives ON ngo_drives
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Policy for admins to manage drives
CREATE POLICY admin_manage_drives ON ngo_drives
  FOR ALL
  USING (auth.email() = 'admin@ecotrack.com'); 