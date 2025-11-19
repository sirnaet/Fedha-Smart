-- Add period column to budgets table
ALTER TABLE public.budgets
ADD COLUMN period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly'));

-- Update the update_budget_spent function to handle weekly and monthly periods
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  budget_period text;
BEGIN
  -- Get the budget period for this category and user
  SELECT period INTO budget_period
  FROM public.budgets
  WHERE user_id = NEW.user_id
  AND category = NEW.category
  AND (
    (period = 'monthly' AND date_trunc('month', month) = date_trunc('month', NEW.date))
    OR
    (period = 'weekly' AND date_trunc('week', month) = date_trunc('week', NEW.date))
  )
  LIMIT 1;

  -- Update budget based on period
  IF budget_period = 'weekly' THEN
    UPDATE public.budgets
    SET spent_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.expenses
      WHERE user_id = NEW.user_id
      AND category = NEW.category
      AND date_trunc('week', date) = date_trunc('week', NEW.date)
    )
    WHERE user_id = NEW.user_id
    AND category = NEW.category
    AND period = 'weekly'
    AND date_trunc('week', month) = date_trunc('week', NEW.date);
  ELSE
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
    AND period = 'monthly'
    AND date_trunc('month', month) = date_trunc('month', NEW.date);
  END IF;
  
  RETURN NEW;
END;
$function$;