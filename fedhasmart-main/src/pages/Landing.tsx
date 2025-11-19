import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, TrendingUp, PiggyBank, Target, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Track Income",
      description: "Monitor all your income sources in one place with detailed records and insights."
    },
    {
      icon: <PiggyBank className="h-8 w-8" />,
      title: "Manage Expenses",
      description: "Categorize and track your spending to understand where your money goes."
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Set Goals",
      description: "Create financial goals and track your progress towards achieving them."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Budget Planning",
      description: "Set monthly budgets and stay on track with real-time spending alerts."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-3 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">FedhaSmart</span>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Take Control of Your Financial Future
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Smart financial management made simple. Track income, manage expenses, set budgets, and achieve your financial goals with FedhaSmart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-muted-foreground text-lg">
              Powerful features to help you stay on top of your finances
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-shadow"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary/10 rounded-2xl p-12 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of users who are already managing their finances smarter with FedhaSmart.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 FedhaSmart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;