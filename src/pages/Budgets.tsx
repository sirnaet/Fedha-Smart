import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, AlertCircle, Pencil, Trash2 } from 'lucide-react'; // Added icons
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addDays, startOfMonth, endOfMonth, areIntervalsOverlapping, parseISO } from 'date-fns';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

export default function Budgets() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  
  // State to track if we are editing a budget
  const [editingBudget, setEditingBudget] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    limitAmount: '',
    month: new Date().toISOString().substring(0, 10),
    period: 'monthly' as 'weekly' | 'monthly',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBudgets();
    }
  }, [user]);

  const loadBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      toast.error('Failed to load budgets');
    } else {
      setBudgets(data || []);
    }
  };

  const getBudgetRange = (dateStr: string, period: 'weekly' | 'monthly') => {
    const start = parseISO(dateStr);
    let end;
    if (period === 'weekly') {
      end = addDays(start, 6);
    } else {
      end = endOfMonth(start);
    }
    const checkStart = period === 'monthly' ? startOfMonth(start) : start;
    return { start: checkStart, end };
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when dialog closes
      setEditingBudget(null);
      setFormData({ 
        category: '', 
        limitAmount: '', 
        month: new Date().toISOString().substring(0, 10), 
        period: 'monthly' 
      });
    }
  };

  const handleEditClick = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      limitAmount: budget.limit_amount.toString(),
      month: budget.month,
      period: budget.period,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    const { error } = await supabase.from('budgets').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete budget');
    } else {
      toast.success('Budget deleted successfully');
      loadBudgets();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedDate = formData.month;
    const selectedPeriod = formData.period;
    const { start: newStart, end: newEnd } = getBudgetRange(selectedDate, selectedPeriod);

    // 1. CLIENT-SIDE CONFLICT CHECK
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', formData.category);
    
    // If editing, exclude the current budget from conflict check
    if (editingBudget) {
      query = query.neq('id', editingBudget.id);
    }

    const { data: existingBudgets } = await query;

    if (existingBudgets && existingBudgets.length > 0) {
      const hasOverlap = existingBudgets.some((b) => {
        const { start: exStart, end: exEnd } = getBudgetRange(b.month, b.period);
        return areIntervalsOverlapping(
          { start: newStart, end: newEnd },
          { start: exStart, end: exEnd }
        );
      });

      if (hasOverlap) {
        toast.error(`A '${formData.category}' budget already exists for this time period.`);
        return;
      }
    }

    // 2. INSERT OR UPDATE BUDGET
    const payload = {
      user_id: user.id,
      category: formData.category,
      limit_amount: parseFloat(formData.limitAmount),
      month: selectedDate,
      period: formData.period,
    };

    let error;
    
    if (editingBudget) {
      // Update existing budget
      const { error: updateError } = await supabase
        .from('budgets')
        .update(payload)
        .eq('id', editingBudget.id);
      error = updateError;
    } else {
      // Create new budget
      const { error: insertError } = await supabase
        .from('budgets')
        .insert(payload);
      error = insertError;
    }

    if (error) {
      if (error.code === '23505') {
        toast.error('Budget already exists for this category and date');
      } else {
        toast.error(editingBudget ? 'Failed to update budget' : 'Failed to create budget');
      }
    } else {
      toast.success(editingBudget ? 'Budget updated successfully' : 'Budget created successfully');
      setOpen(false);
      loadBudgets();
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-warning';
    return 'bg-success';
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Budgets</h1>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Edit Budget' : 'Set New Budget'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Budget Period</Label>
                  <Select value={formData.period} onValueChange={(value: 'weekly' | 'monthly') => setFormData({ ...formData, period: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Start Date</Label>
                  <Input
                    id="month"
                    type="date"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit">Budget Limit (KES)</Label>
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.limitAmount}
                    onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingBudget ? 'Update Budget' : 'Set Budget'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No budgets set. Create your first budget to get started!</p>
              </CardContent>
            </Card>
          ) : (
            budgets.map((budget) => {
              const percentage = (parseFloat(budget.spent_amount) / parseFloat(budget.limit_amount)) * 100;
              const periodLabel = budget.period === 'weekly' 
                ? `Week of ${new Date(budget.month).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : new Date(budget.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{budget.category}</CardTitle>
                        <p className="text-sm text-muted-foreground">{periodLabel} ({budget.period})</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {/* Show Alert Icon if over budget */}
                        {percentage >= 80 && (
                          <AlertCircle className={`h-5 w-5 ${percentage >= 100 ? 'text-destructive' : 'text-warning'}`} />
                        )}
                        
                        {/* Edit Button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(budget)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        
                        {/* Delete Button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(budget.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">
                          KES {parseFloat(budget.spent_amount).toLocaleString()} / KES {parseFloat(budget.limit_amount).toLocaleString()}
                        </span>
                      </div>
                      <Progress value={percentage} className={getProgressColor(percentage)} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% used
                      </p>
                    </div>

                    {percentage >= 100 && (
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          Budget exceeded by KES {(parseFloat(budget.spent_amount) - parseFloat(budget.limit_amount)).toLocaleString()}
                        </AlertDescription>
                      </Alert>
                    )}

                    {percentage >= 80 && percentage < 100 && (
                      <Alert>
                        <AlertDescription className="text-xs">
                          Approaching budget limit! KES {(parseFloat(budget.limit_amount) - parseFloat(budget.spent_amount)).toLocaleString()} remaining
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}