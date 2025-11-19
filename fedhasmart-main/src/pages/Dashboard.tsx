import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CreditCard,
  TrendingUp,
  Activity,
  ArrowUpCircle,
  PiggyBank,
  Calculator,
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    remainingBudget: 0,
    savingsProgress: 0,
    totalContributions: 0,
    goalCount: 0,
    netBalance: 0,
    savingsRate: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);

      // Fetch all expenses for current month
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, date')
        .gte('date', currentMonth.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const totalExpenses =
        expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      // Fetch total income
      const { data: income } = await supabase
        .from('income')
        .select('amount')
        .gte('date', currentMonth.toISOString().split('T')[0]);

      const totalIncome =
        income?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;

      // Fetch goals and contributions
      const { data: goals } = await supabase.from('goals').select('*');
      const savingsProgress =
        goals?.reduce((sum, g) => sum + Number(g.saved_amount), 0) || 0;

      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount, date')
        .gte('date', currentMonth.toISOString().split('T')[0]);

      const totalContributions =
        contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Compute stats
      const netBalance = totalIncome - totalExpenses - totalContributions;
      const savingsRate =
        totalIncome > 0
          ? ((totalIncome - totalExpenses - totalContributions) / totalIncome) *
            100
          : 0;

      setStats({
        totalIncome,
        totalExpenses,
        remainingBudget: totalIncome - totalExpenses,
        savingsProgress,
        totalContributions,
        goalCount: goals?.length || 0,
        netBalance,
        savingsRate,
      });

      // Group expenses by category for Pie chart
      const categoryMap = new Map();
      expenses?.forEach((exp) => {
        const current = categoryMap.get(exp.category) || 0;
        categoryMap.set(exp.category, current + Number(exp.amount));
      });
      const categoryData = Array.from(categoryMap.entries()).map(
        ([name, value]) => ({ name, value })
      );
      setExpensesByCategory(categoryData);

      // Group expenses by day for line chart
      const dailyMap = new Map();
      expenses?.forEach((exp) => {
        const day = exp.date.split('T')[0];
        const current = dailyMap.get(day) || 0;
        dailyMap.set(day, current + Number(exp.amount));
      });

      const dailyData = Array.from(dailyMap.entries())
        .map(([day, amount]) => ({ day, amount }))
        .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

      setDailyExpenses(dailyData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const getHealthStatus = () => {
    if (stats.savingsRate >= 80) return { label: 'Excellent', color: 'text-success' };
    if (stats.savingsRate >= 60) return { label: 'Good', color: 'text-primary' };
    if (stats.savingsRate >= 40) return { label: 'Fair', color: 'text-warning' };
    return { label: 'Poor', color: 'text-destructive' };
  };

  const healthStatus = getHealthStatus();

  if (authLoading)
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* ======= Summary Cards ======= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Income */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {stats.totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Balance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.netBalance >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                KES {stats.netBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {stats.totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          {/* Remaining Budget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Remaining Budget
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.remainingBudget >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                KES {stats.remainingBudget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          {/* Savings Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Savings Progress
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KES {stats.savingsProgress.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                KES {stats.totalContributions.toLocaleString()} contributed this month
              </p>
            </CardContent>
          </Card>

          {/* Financial Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Financial Health
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${healthStatus.color}`}>
                {healthStatus.label}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.savingsRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ======= Charts ======= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `KES ${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Spending Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={dailyExpenses.map((d) => ({
                      ...d,
                      date: new Date(d.day).getTime(),
                    }))}
                  >
                    <XAxis
                     dataKey="date"
                     type="number"
                     scale="time"
                     domain={["dataMin - 8640000", "dataMax + 8640000"]} // adds 1-day padding before & after
                     tickFormatter={(timestamp) =>
                     new Date(timestamp).toLocaleDateString("en-KE", {
                       month: "short",
                       day: "numeric",
                      })
                    }
                    tickMargin={10}
                  />

                    <YAxis />
                    <Tooltip
                      labelFormatter={(timestamp) =>
                        new Date(timestamp).toLocaleDateString('en-KE', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                      formatter={(value: number) =>
                        `KES ${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Spending"
                      dot={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No daily data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
