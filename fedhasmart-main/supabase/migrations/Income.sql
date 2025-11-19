-- Create income table for tracking user income
CREATE TABLE public.income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for income
CREATE POLICY "Users can view own income" 
ON public.income 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income" 
ON public.income 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income" 
ON public.income 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income" 
ON public.income 
FOR DELETE 
USING (auth.uid() = user_id);