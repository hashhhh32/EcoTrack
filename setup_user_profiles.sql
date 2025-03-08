-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    address TEXT,
    bio TEXT,
    date_of_birth DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Grant access to authenticated users
GRANT ALL ON public.user_profiles TO authenticated;

-- Create a trigger function to create profile and sync email on user signup/update
CREATE OR REPLACE FUNCTION public.handle_user_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Create new profile
        INSERT INTO public.user_profiles (id, email)
        VALUES (NEW.id, NEW.email);
    ELSIF TG_OP = 'UPDATE' AND OLD.email <> NEW.email THEN
        -- Update email in profile if it changes in auth.users
        UPDATE public.user_profiles
        SET email = NEW.email
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for insert and update
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_change();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_change();

-- Create a function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id UUID,
    full_name TEXT DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    phone_number TEXT DEFAULT NULL,
    address TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL
)
RETURNS public.user_profiles AS $$
DECLARE
    profile public.user_profiles;
BEGIN
    UPDATE public.user_profiles
    SET
        full_name = COALESCE(update_user_profile.full_name, user_profiles.full_name),
        avatar_url = COALESCE(update_user_profile.avatar_url, user_profiles.avatar_url),
        phone_number = COALESCE(update_user_profile.phone_number, user_profiles.phone_number),
        address = COALESCE(update_user_profile.address, user_profiles.address),
        bio = COALESCE(update_user_profile.bio, user_profiles.bio),
        date_of_birth = COALESCE(update_user_profile.date_of_birth, user_profiles.date_of_birth),
        updated_at = timezone('utc'::text, now())
    WHERE id = user_id
    RETURNING * INTO profile;
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync existing users
INSERT INTO public.user_profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email; 