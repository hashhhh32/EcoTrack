-- Create forum_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS forum_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all likes"
ON forum_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can like posts"
ON forum_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON forum_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS forum_likes_post_user_idx ON forum_likes(post_id, user_id); 