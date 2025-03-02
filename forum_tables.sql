-- Create forum_posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    CONSTRAINT forum_posts_parent_id_check CHECK (parent_id != id)
);

-- Create forum_likes table
CREATE TABLE IF NOT EXISTS public.forum_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create increment function for likes count
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
BEGIN
    RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- Create decrement function for likes count
CREATE OR REPLACE FUNCTION decrement(x integer)
RETURNS integer AS $$
BEGIN
    RETURN GREATEST(0, x - 1);
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for forum_posts
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts
CREATE POLICY "Anyone can read posts"
ON public.forum_posts
FOR SELECT
USING (true);

-- Allow authenticated users to create posts
CREATE POLICY "Authenticated users can create posts"
ON public.forum_posts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts"
ON public.forum_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.forum_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for forum_likes
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes
CREATE POLICY "Anyone can read likes"
ON public.forum_likes
FOR SELECT
USING (true);

-- Allow authenticated users to create likes
CREATE POLICY "Authenticated users can create likes"
ON public.forum_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.forum_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger to update replies_count when a reply is added or deleted
CREATE OR REPLACE FUNCTION update_parent_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE public.forum_posts
        SET replies_count = replies_count + 1
        WHERE id = NEW.parent_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE public.forum_posts
        SET replies_count = GREATEST(0, replies_count - 1)
        WHERE id = OLD.parent_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_replies_count_trigger
AFTER INSERT OR DELETE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_parent_replies_count(); 