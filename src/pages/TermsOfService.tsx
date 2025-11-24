import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-primary">FedhaSmart</Link>
          <Button asChild size="sm" variant="outline"><Link to="/">Back to Home</Link></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose dark:prose-invert space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using FedhaSmart, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. Nature of Service</h2>
            <p className="text-muted-foreground">
              FedhaSmart is a personal finance management tool designed for informational and organizational purposes only. <strong>We are not a financial institution or a certified financial advisor.</strong> The insights provided by the app should not be interpreted as professional financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. User Responsibilities</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. You are also responsible for the accuracy of the data you input into the system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the service, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these terms at any time. We will notify users of any significant changes. Your continued use of FedhaSmart after such changes constitutes your acceptance of the new Terms of Service.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}