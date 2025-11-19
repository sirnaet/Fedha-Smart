-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount >= 0),
  spent_amount DECIMAL(10, 2) DEFAULT 0 CHECK (spent_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, month, category)
);

-- Enable RLS on budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Budgets policies
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL CHECK (target_amount > 0),
  saved_amount DECIMAL(10, 2) DEFAULT 0 CHECK (saved_amount >= 0),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- Create contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Contributions policies (users can manage contributions for their own goals)
CREATE POLICY "Users can view own contributions"
  ON public.contributions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = contributions.goal_id
    AND goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = contributions.goal_id
    AND goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own contributions"
  ON public.contributions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = contributions.goal_id
    AND goals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own contributions"
  ON public.contributions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = contributions.goal_id
    AND goals.user_id = auth.uid()
  ));

-- Create trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update budget spent amount when expense is added
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.budgets
  SET spent_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.expenses
    WHERE user_id = NEW.user_id
    AND category = NEW.category
    AND date_trunc('month', date) = date_trunc('month', NEW.date)
  )
  WHERE user_id = NEW.user_id
  AND category = NEW.category
  AND date_trunc('month', month) = date_trunc('month', NEW.date);
  RETURN NEW;
END;
$$;

-- Trigger to update budget when expense is added/updated/deleted
CREATE TRIGGER update_budget_on_expense_insert
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent();

CREATE TRIGGER update_budget_on_expense_update
  AFTER UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent();

CREATE TRIGGER update_budget_on_expense_delete
  AFTER DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_spent();

-- Function to update goal saved amount when contribution is added
CREATE OR REPLACE FUNCTION public.update_goal_saved()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.goals
  SET saved_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.contributions
    WHERE goal_id = NEW.goal_id
  )
  WHERE id = NEW.goal_id;
  RETURN NEW;
END;
$$;

-- Trigger to update goal when contribution is added/updated/deleted
CREATE TRIGGER update_goal_on_contribution_insert
  AFTER INSERT ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_saved();

CREATE TRIGGER update_goal_on_contribution_update
  AFTER UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_saved();

CREATE TRIGGER update_goal_on_contribution_delete
  AFTER DELETE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_saved();