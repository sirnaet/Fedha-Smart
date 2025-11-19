import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";

interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  notes: string | null;
}

const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"];

export default function Income() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: "",
    source: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchIncome();
    }
  }, [user]);

  const fetchIncome = async () => {
    try {
      const { data, error } = await supabase
        .from("income")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setIncome(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("income").insert([
        {
          user_id: user.id,
          amount: parseFloat(newIncome.amount),
          source: newIncome.source,
          date: newIncome.date,
          notes: newIncome.notes || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Income added successfully",
      });

      setNewIncome({
        amount: "",
        source: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });

      fetchIncome();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      const { error } = await supabase.from("income").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Income deleted successfully",
      });

      fetchIncome();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Income Tracker</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={newIncome.amount}
                  onChange={(e) =>
                    setNewIncome({ ...newIncome, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={newIncome.source}
                  onValueChange={(value) =>
                    setNewIncome({ ...newIncome, source: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={newIncome.date}
                  onChange={(e) =>
                    setNewIncome({ ...newIncome, date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newIncome.notes}
                  onChange={(e) =>
                    setNewIncome({ ...newIncome, notes: e.target.value })
                  }
                  placeholder="Add any additional details..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Income"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {income.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No income recorded yet
                </p>
              ) : (
                income.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          KES {Number(item.amount).toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {item.source}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.date), "MMM dd, yyyy")}
                      </p>
                      {item.notes && (
                        <p className="text-sm mt-1">{item.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIncome(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
