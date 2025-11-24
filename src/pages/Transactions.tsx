import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Filter, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
const INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

export default function Transactions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // FIX: New state for month filtering (Default to current month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Reload when user or selectedMonth changes
  useEffect(() => {
    if (user) loadTransactions();
  }, [user, selectedMonth]); 

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Calculate start and end of the selected month
      const dateObj = new Date(selectedMonth);
      const startDate = format(startOfMonth(dateObj), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(dateObj), 'yyyy-MM-dd');

      // Fetch Income (Filtered by Date)
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startDate) // Start of month
        .lte('date', endDate)   // End of month
        .order('date', { ascending: false });
      
      if (incomeError) throw incomeError;

      // Fetch Expenses (Filtered by Date)
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startDate) // Start of month
        .lte('date', endDate)   // End of month
        .order('date', { ascending: false });

      if (expenseError) throw expenseError;

      const formattedIncome: Transaction[] = (incomeData || []).map(i => ({
        id: i.id,
        type: 'income',
        amount: Number(i.amount),
        category: i.source,
        date: i.date,
        notes: i.notes
      }));

      const formattedExpenses: Transaction[] = (expenseData || []).map(e => ({
        id: e.id,
        type: 'expense',
        amount: Number(e.amount),
        category: e.category,
        date: e.date,
        notes: e.notes
      }));

      const merged = [...formattedIncome, ...formattedExpenses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(merged);
    } catch (error: any) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const table = formType === 'income' ? 'income' : 'expenses';
      const payload = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes || null,
        ...(formType === 'income' ? { source: formData.category } : { category: formData.category }),
      };

      const { error } = await supabase.from(table).insert(payload);

      if (error) throw error;

      toast.success(`${formType === 'income' ? 'Income' : 'Expense'} added successfully`);
      setFormData({ 
        amount: '', 
        category: '', 
        date: new Date().toISOString().split('T')[0], 
        notes: '' 
      });
      setOpen(false);
      loadTransactions();

    } catch (error: any) {
      toast.error(`Failed to add ${formType}`);
    }
  };

  const handleDelete = async (id: string, type: TransactionType) => {
    try {
      const table = type === 'income' ? 'income' : 'expenses';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;

      toast.success('Transaction deleted');
      loadTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filterType);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            {/* FIX: Month Picker for Performance */}
            <Input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-[160px]"
            />

            <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="expense" onValueChange={(val) => setFormType(val as TransactionType)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="expense">Expense</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount (KES)</Label>
                      <Input
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
                      <Label>{formType === 'income' ? 'Source' : 'Category'}</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${formType === 'income' ? 'source' : 'category'}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(formType === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES).map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Optional notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Save {formType === 'income' ? 'Income' : 'Expense'}
                    </Button>
                  </form>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category / Source</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center text-muted-foreground">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading transactions...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow key={`${t.type}-${t.id}`}>
                        <TableCell>{format(new Date(t.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {t.type === 'income' ? (
                            <span className="flex items-center text-success text-sm font-medium">
                              <ArrowUpCircle className="w-4 h-4 mr-1" /> Income
                            </span>
                          ) : (
                            <span className="flex items-center text-destructive text-sm font-medium">
                              <ArrowDownCircle className="w-4 h-4 mr-1" /> Expense
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{t.notes || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-success' : ''}`}>
                          {t.type === 'income' ? '+' : '-'} KES {t.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(t.id, t.type)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}