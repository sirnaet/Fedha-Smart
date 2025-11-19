-- Add DELETE policy for profiles table to allow users to delete their own data
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);