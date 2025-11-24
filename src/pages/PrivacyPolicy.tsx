import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-primary">FedhaSmart</Link>
          <Button asChild size="sm" variant="outline"><Link to="/">Back to Home</Link></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose dark:prose-invert space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect only the information necessary to provide our financial tracking services. This includes your email address, authentication credentials, and the financial data you voluntarily input (income, expenses, budgets, and goals).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Data</h2>
            <p className="text-muted-foreground">
              Your data is used solely for the purpose of providing you with personal financial insights and dashboards. <strong>We do not sell, rent, or share your personal information with third parties for marketing purposes.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Data Security</h2>
            <p className="text-muted-foreground">
              We take security seriously. Your data is stored securely using <strong>Supabase</strong>, an enterprise-grade database provider. All data transmission happens over secure, encrypted connections (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Your Rights</h2>
            <p className="text-muted-foreground">
              You retain full ownership of your data. You may export your financial reports at any time. Furthermore, you have the right to permanently delete your account and all associated data instantly through the Settings page of our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at bsmemusi@gmail.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}