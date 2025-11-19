import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Goals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [openGoal, setOpenGoal] = useState(false);
  const [openContribution, setOpenContribution] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [goalFormData, setGoalFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });
  const [contributionAmount, setContributionAmount] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load goals');
    } else {
      setGoals(data || []);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      name: goalFormData.name,
      target_amount: parseFloat(goalFormData.targetAmount),
      deadline: goalFormData.deadline || null,
    });

    if (error) {
      toast.error('Failed to create goal');
    } else {
      toast.success('Goal created successfully');
      setGoalFormData({ name: '', targetAmount: '', deadline: '' });
      setOpenGoal(false);
      loadGoals();
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGoal) return;

    const { error } = await supabase.from('contributions').insert({
      goal_id: selectedGoal,
      amount: parseFloat(contributionAmount),
      date: new Date().toISOString().split('T')[0],
    });

    if (error) {
      toast.error('Failed to add contribution');
    } else {
      const goal = goals.find((g) => g.id === selectedGoal);
      const newSavedAmount = parseFloat(goal.saved_amount) + parseFloat(contributionAmount);
      const percentage = (newSavedAmount / parseFloat(goal.target_amount)) * 100;

      // Check milestones
      if (percentage >= 100) {
        toast.success('🎉 Goal achieved! Congratulations!');
      } else if (percentage >= 75 && parseFloat(goal.saved_amount) / parseFloat(goal.target_amount) * 100 < 75) {
        toast.success('🎯 75% milestone reached!');
      } else if (percentage >= 50 && parseFloat(goal.saved_amount) / parseFloat(goal.target_amount) * 100 < 50) {
        toast.success('🎯 50% milestone reached!');
      } else if (percentage >= 25 && parseFloat(goal.saved_amount) / parseFloat(goal.target_amount) * 100 < 25) {
        toast.success('🎯 25% milestone reached!');
      } else {
        toast.success('Contribution added successfully');
      }

      setContributionAmount('');
      setSelectedGoal(null);
      setOpenContribution(false);
      loadGoals();
    }
  };

  const getMilestoneColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-chart-3';
    if (percentage >= 50) return 'bg-chart-2';
    if (percentage >= 25) return 'bg-chart-4';
    return 'bg-primary';
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
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <Dialog open={openGoal} onOpenChange={setOpenGoal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Savings Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Emergency Fund"
                    value={goalFormData.name}
                    onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target Amount (KES)</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={goalFormData.targetAmount}
                    onChange={(e) => setGoalFormData({ ...goalFormData, targetAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={goalFormData.deadline}
                    onChange={(e) => setGoalFormData({ ...goalFormData, deadline: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No savings goals yet. Create your first goal to start saving!</p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => {
              const percentage = (parseFloat(goal.saved_amount) / parseFloat(goal.target_amount)) * 100;
              const isComplete = percentage >= 100;

              return (
                <Card key={goal.id} className={isComplete ? 'border-success' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      {isComplete && <Badge variant="default" className="bg-success">Completed!</Badge>}
                    </div>
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          KES {parseFloat(goal.saved_amount).toLocaleString()} / KES {parseFloat(goal.target_amount).toLocaleString()}
                        </span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% saved
                      </p>
                    </div>

                    {!isComplete && (
                      <Button
                        onClick={() => {
                          setSelectedGoal(goal.id);
                          setOpenContribution(true);
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Add Contribution
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={openContribution} onOpenChange={setOpenContribution}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contribution</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContribution} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contribution">Amount (KES)</Label>
                <Input
                  id="contribution"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Add Contribution</Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
