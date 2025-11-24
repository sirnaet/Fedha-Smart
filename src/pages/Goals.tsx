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
import { Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Goals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [openGoal, setOpenGoal] = useState(false);
  const [openContribution, setOpenContribution] = useState(false);
  
  // State for editing
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpenGoal(isOpen);
    if (!isOpen) {
      setEditingGoal(null);
      setGoalFormData({ name: '', targetAmount: '', deadline: '' });
    }
  };

  const handleEditClick = (goal: any) => {
    setEditingGoal(goal);
    setGoalFormData({
      name: goal.name,
      targetAmount: goal.target_amount.toString(),
      deadline: goal.deadline || '',
    });
    setOpenGoal(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal? This will also delete all contributions history for this goal.")) return;

    const { error } = await supabase.from('goals').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete goal');
    } else {
      toast.success('Goal deleted successfully');
      loadGoals();
    }
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const payload = {
      user_id: user.id,
      name: goalFormData.name,
      target_amount: parseFloat(goalFormData.targetAmount),
      deadline: goalFormData.deadline || null,
    };

    let error;

    if (editingGoal) {
      const { error: updateError } = await supabase
        .from('goals')
        .update(payload)
        .eq('id', editingGoal.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('goals')
        .insert(payload);
      error = insertError;
    }

    if (error) {
      toast.error(editingGoal ? 'Failed to update goal' : 'Failed to create goal');
    } else {
      toast.success(editingGoal ? 'Goal updated successfully' : 'Goal created successfully');
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
      
      // Safety check: treat null saved_amount as 0
      const oldSavedAmount = parseFloat(goal.saved_amount || 0); 
      const contribution = parseFloat(contributionAmount);
      const newSavedAmount = oldSavedAmount + contribution;
      const percentage = (newSavedAmount / parseFloat(goal.target_amount)) * 100;

      if (percentage >= 100) {
        toast.success('🎉 Goal achieved! Congratulations!');
      } else if (percentage >= 75 && oldSavedAmount / parseFloat(goal.target_amount) * 100 < 75) {
        toast.success('🚀 75% milestone reached!');
      } else if (percentage >= 50 && oldSavedAmount / parseFloat(goal.target_amount) * 100 < 50) {
        toast.success('🔥 50% milestone reached!');
      } else if (percentage >= 25 && oldSavedAmount / parseFloat(goal.target_amount) * 100 < 25) {
        toast.success('👍 25% milestone reached!');
      } else {
        toast.success('Contribution added successfully');
      }

      setContributionAmount('');
      setSelectedGoal(null);
      setOpenContribution(false);
      loadGoals();
    }
  };

  // NEW: Helper to get both track (background) and indicator (foreground) colors
  const getMilestoneColors = (percentage: number) => {
    if (percentage >= 100) return { track: 'bg-success/20', indicator: 'bg-success' };
    if (percentage >= 75) return { track: 'bg-chart-3/20', indicator: 'bg-chart-3' };
    if (percentage >= 50) return { track: 'bg-chart-2/20', indicator: 'bg-chart-2' };
    if (percentage >= 25) return { track: 'bg-chart-4/20', indicator: 'bg-chart-4' };
    return { track: 'bg-primary/20', indicator: 'bg-primary' };
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
          
          <Dialog open={openGoal} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Savings Goal'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitGoal} className="space-y-4">
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
                <Button type="submit" className="w-full">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
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
              // FIX: Safely parse and default saved_amount to 0 if null/undefined
              const savedAmount = parseFloat(goal.saved_amount || 0);
              const targetAmount = parseFloat(goal.target_amount);
              
              const percentage = (savedAmount / targetAmount) * 100;
              const isComplete = percentage >= 100;
              const colors = getMilestoneColors(percentage);

              return (
                <Card key={goal.id} className={isComplete ? 'border-success' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {goal.name}
                          {isComplete && <Badge variant="default" className="bg-success hover:bg-success">Completed!</Badge>}
                        </CardTitle>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(goal)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {/* Use the safely parsed amounts for display */}
                          KES {savedAmount.toLocaleString()} / KES {targetAmount.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* UPDATED: Using the new dual-color properties */}
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={colors.track}           // Lighter background
                        indicatorClassName={colors.indicator} // Darker progress bar
                      />
                      
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