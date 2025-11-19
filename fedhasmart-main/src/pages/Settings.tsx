import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2, UserX, Loader2, Pencil, X, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [reportType, setReportType] = useState<'summary' | 'income' | 'expenses' | 'budgets' | 'goals' | 'comprehensive'>('summary');
  const [timePeriod, setTimePeriod] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadProfile();
    }
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPhone(data.phone || '');
      }
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const handlePhoneUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phone || null })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Phone number updated successfully');
      setIsEditingPhone(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPhone(false);
    loadProfile();
  };

  const getDateFilter = () => {
    const now = new Date();
    const filters: Record<typeof timePeriod, Date | null> = {
      'all': null,
      '1month': new Date(now.setMonth(now.getMonth() - 1)),
      '3months': new Date(now.setMonth(now.getMonth() - 3)),
      '6months': new Date(now.setMonth(now.getMonth() - 6)),
      '1year': new Date(now.setFullYear(now.getFullYear() - 1)),
    };
    return filters[timePeriod];
  };

  const generateFinancialReport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const dateFilter = getDateFilter();
      
      // Header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('FEDHASMART FINANCE TRACKER', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`${reportType.toUpperCase()} REPORT`, pageWidth / 2, 28, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
      doc.text(`User: ${user.email}`, pageWidth / 2, 41, { align: 'center' });
      
      const periodLabel = {
        'all': 'All Time',
        '1month': 'Last Month',
        '3months': 'Last 3 Months',
        '6months': 'Last 6 Months',
        '1year': 'Last Year'
      };
      doc.text(`Period: ${periodLabel[timePeriod]}`, pageWidth / 2, 47, { align: 'center' });
      
      let yPosition = 60;

      if (reportType === 'income' || reportType === 'summary' || reportType === 'comprehensive') {
        let query = supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id);
        
        if (dateFilter) {
          query = query.gte('date', dateFilter.toISOString().split('T')[0]);
        }
        
        const { data: incomeData } = await query.order('date', { ascending: false });

        if (incomeData && incomeData.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('INCOME RECORDS', 14, yPosition);
          yPosition += 8;

          const incomeTableData = incomeData.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.source,
            `KSh ${item.amount.toFixed(2)}`,
            item.notes || '-'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Source', 'Amount', 'Notes']],
            body: incomeTableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }
      }

      if (reportType === 'expenses' || reportType === 'summary' || reportType === 'comprehensive') {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        let query = supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id);
        
        if (dateFilter) {
          query = query.gte('date', dateFilter.toISOString().split('T')[0]);
        }
        
        const { data: expensesData } = await query.order('date', { ascending: false });

        if (expensesData && expensesData.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('EXPENSE RECORDS', 14, yPosition);
          yPosition += 8;

          const expensesTableData = expensesData.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.category,
            `KSh ${item.amount.toFixed(2)}`,
            item.notes || '-'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Category', 'Amount', 'Notes']],
            body: expensesTableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }
      }

      if (reportType === 'budgets' || reportType === 'comprehensive') {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        let query = supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);
        
        if (dateFilter) {
          query = query.gte('month', dateFilter.toISOString().split('T')[0]);
        }
        
        const { data: budgetsData } = await query.order('month', { ascending: false });

        if (budgetsData && budgetsData.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('BUDGET RECORDS', 14, yPosition);
          yPosition += 8;

          const budgetsTableData = budgetsData.map(item => [
            item.category,
            item.period,
            new Date(item.month).toLocaleDateString(),
            `KSh ${item.limit_amount.toFixed(2)}`,
            `KSh ${(item.spent_amount || 0).toFixed(2)}`,
            `KSh ${(item.limit_amount - (item.spent_amount || 0)).toFixed(2)}`
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Category', 'Period', 'Month', 'Limit', 'Spent', 'Remaining']],
            body: budgetsTableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 15;
        }
      }

      if (reportType === 'goals' || reportType === 'comprehensive') {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        let query = supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);
        
        if (dateFilter) {
          query = query.gte('created_at', dateFilter.toISOString());
        }
        
        const { data: goalsData } = await query.order('created_at', { ascending: false });

        if (goalsData && goalsData.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('SAVINGS GOALS', 14, yPosition);
          yPosition += 8;

          const goalsTableData = goalsData.map(item => [
            item.name,
            `KSh ${item.target_amount.toFixed(2)}`,
            `KSh ${(item.saved_amount || 0).toFixed(2)}`,
            item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No deadline',
            `${(((item.saved_amount || 0) / item.target_amount) * 100).toFixed(1)}%`
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Goal Name', 'Target', 'Saved', 'Deadline', 'Progress']],
            body: goalsTableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
          });
        }
      }

      doc.save(`FedhaSmart-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      await supabase.auth.signOut();
      
      toast.success('Your account has been deleted');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account preferences</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Update your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-base mt-1">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {!isEditingPhone ? (
                  <div className="flex items-center justify-between">
                    <p className="text-base">{phone || 'Not set'}</p>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingPhone(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1234567890"
                      />
                      <Button onClick={handlePhoneUpdate} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Update
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancelEdit} disabled={loading}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports & Exports
              </CardTitle>
              <CardDescription>
                Download your financial reports and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Financial Summary</SelectItem>
                      <SelectItem value="income">Income Report</SelectItem>
                      <SelectItem value="expenses">Expenses Report</SelectItem>
                      <SelectItem value="budgets">Budget Report</SelectItem>
                      <SelectItem value="goals">Goals Report</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time-period">Time Period</Label>
                  <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
                    <SelectTrigger id="time-period">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="1month">Last Month</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="1year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={generateFinancialReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Profile information</li>
                        <li>Income records</li>
                        <li>Expense records</li>
                        <li>Budgets</li>
                        <li>Financial goals</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete my account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
