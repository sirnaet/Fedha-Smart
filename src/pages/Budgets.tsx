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
import { Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

export default function Budgets() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    limitAmount: '',
    month: new Date().toISOString().substring(0, 7),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // For weekly budgets, use the selected date directly, for monthly add -01
    const monthDate = formData.period === 'weekly' 
      ? formData.month 
      : `${formData.month}-01`;

    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      category: formData.category,
      limit_amount: parseFloat(formData.limitAmount),
      month: monthDate,
      period: formData.period,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Budget already exists for this category and month');
      } else {
        toast.error('Failed to create budget');
      }
    } else {
      toast.success('Budget created successfully');
      setFormData({ category: '', limitAmount: '', month: new Date().toISOString().substring(0, 7), period: 'monthly' });
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Set Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set New Budget</DialogTitle>
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
                  <Label htmlFor="month">{formData.period === 'weekly' ? 'Week Starting' : 'Month'}</Label>
                  <Input
                    id="month"
                    type={formData.period === 'weekly' ? 'date' : 'month'}
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
                <Button type="submit" className="w-full">Set Budget</Button>
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
                      {percentage >= 80 && (
                        <AlertCircle className={percentage >= 100 ? 'text-destructive' : 'text-warning'} />
                      )}
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
