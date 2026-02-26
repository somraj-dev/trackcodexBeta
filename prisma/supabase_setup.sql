-- 1. Enable RLS on the public.User table
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows users to see their own profile
CREATE POLICY "Users can view own profile" 
ON public."User" 
FOR SELECT 
USING (auth.uid()::text = id);

-- 3. Create a policy that allows users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public."User" 
FOR UPDATE 
USING (auth.uid()::text = id);

-- 4. Create a function to handle new user registration in Supabase Auth
-- This will automatically create a row in public."User"
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (
    id, 
    email, 
    name, 
    avatar, 
    "emailVerified", 
    role, 
    "createdAt", 
    "updatedAt"
  )
  VALUES (
    new.id::text, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    true,
    'user',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a trigger that calls the function whenever a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
