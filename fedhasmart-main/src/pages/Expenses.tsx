import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

export default function Expenses() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [timePeriod, setTimePeriod] = useState('all');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to load expenses');
    } else {
      setExpenses(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      notes: formData.notes || null,
    });

    if (error) {
      toast.error('Failed to add expense');
    } else {
      toast.success('Expense added successfully');
      setFormData({ amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setOpen(false);
      loadExpenses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete expense');
    } else {
      toast.success('Expense deleted');
      loadExpenses();
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timePeriod) {
      case '1month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case '3months':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return null;
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory = filterCategory === 'all' || exp.category === filterCategory;
    const dateFilter = getDateFilter();
    const matchesDate = !dateFilter || new Date(exp.date) >= dateFilter;
    return matchesCategory && matchesDate;
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Expenses</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KES)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Add Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-full sm:w-[300px] border-2 border-primary">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredExpenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No expenses found. Add your first expense to get started!
              </div>
            ) : (
              filteredExpenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-2xl font-bold">KES {parseFloat(expense.amount).toLocaleString()}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-secondary/50">
                        {expense.category}
                      </Badge>
                    </div>
                    {expense.notes && (
                      <p className="text-muted-foreground mb-4">{expense.notes}</p>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="w-full touch-target text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
