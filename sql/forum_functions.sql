-- Create increment function
CREATE OR REPLACE FUNCTION increment(value integer)
RETURNS integer AS $$
BEGIN
  RETURN value + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create decrement function
CREATE OR REPLACE FUNCTION decrement(value integer)
RETURNS integer AS $$
BEGIN
  RETURN value - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts
  SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize likes_count
CREATE OR REPLACE FUNCTION initialize_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.likes_count := 0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_initial_likes_count
  BEFORE INSERT ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_likes_count(); 