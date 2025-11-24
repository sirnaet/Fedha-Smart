import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LockKeyhole } from 'lucide-react';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Safety check: Ensure we actually have a session token in the URL hash
    // Supabase automatically puts the token in the URL when redirecting from email
    const hash = location.hash;
    if (!hash || !hash.includes('access_token')) {
      // If no token, this might be an accidental visit. 
      // However, sometimes the session is already set by the time this component mounts.
      // We can check if we have a session:
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            toast.error('Invalid or expired reset link.');
            navigate('/auth');
        }
      });
    }
  }, [location, navigate]);

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success('Password updated successfully! You are now logged in.');
      navigate('/dashboard');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <LockKeyhole className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter a new secure password for your account.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
            <div className="text-center">
                <Button variant="link" className="text-sm text-muted-foreground" onClick={() => navigate('/auth')}>
                    Back to Sign In
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}