import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Brain, BookOpen, Heart, Sparkles, Users, TrendingUp, Shield, Zap } from "lucide-react";
const Landing = () => {
  const navigate = useNavigate();
  const features = [{
    icon: Heart,
    title: "Emotional Intelligence",
    description: "Build self-awareness, empathy, and coping strategies through guided activities and reflection.",
    color: "text-primary"
  }, {
    icon: BookOpen,
    title: "Academic Excellence",
    description: "Standards-aligned content across all subjects with adaptive difficulty and personalized learning paths.",
    color: "text-secondary"
  }, {
    icon: Brain,
    title: "Real-World Life Skills",
    description: "Financial literacy, time management, communication, and problem-solving for real-world success.",
    color: "text-accent"
  }];
  const benefits = [{
    icon: Sparkles,
    text: "Age-adaptive gamification that grows with your child"
  }, {
    icon: Users,
    text: "Parent dashboard with real-time progress insights"
  }, {
    icon: TrendingUp,
    text: "Personalized learning paths based on performance"
  }, {
    icon: Shield,
    text: "COPPA compliant with industry-leading privacy"
  }, {
    icon: Zap,
    text: "Engaging quests and rewards that motivate learning"
  }, {
    icon: Brain,
    text: "Builds emotional intelligence alongside academics"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-primary-foreground">IO</span>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">Inner Odyssey</span>
                <span className="text-xs text-muted-foreground ml-2">by Flashfusion</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/login')} className="shadow-lg">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in px-4 pt-28 pb-20">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              🎉 Now in Beta - Join 2,500+ Families
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
              Transform Learning Into An
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"> Epic Adventure</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The only K-12 platform that combines emotional intelligence, academic excellence, 
              and real-world life skills through engaging, personalized learning journeys.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" onClick={() => navigate('/login')} className="text-lg h-14 px-8 shadow-xl hover-scale">
                Start Free Beta Access
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="text-lg h-14 px-8">
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>COPPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-secondary" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>Free During Beta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="text-sm">Our Three Pillars</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              A Complete Learning Experience
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We go beyond academics to prepare children for real-world success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="elevated-card hover-scale transition-all duration-300 border-2">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-sm">Why Parents Love Us</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Everything You Need To Support Your Child's Growth
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Inner Odyssey adapts to your child's unique needs, celebrates their progress, 
                and keeps you involved every step of the way.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {benefits.map((benefit, index) => <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed pt-1">{benefit.text}</p>
                  </div>)}
              </div>

              <Button size="lg" className="mt-6" onClick={() => navigate('/login')}>
                Join Beta Today
              </Button>
            </div>

            <Card className="elevated-card border-2 p-8">
              <div className="space-y-6">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-full bg-background/90 flex items-center justify-center mb-4">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Real-Time Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Monitor your child's learning journey with detailed analytics, emotional intelligence 
                    insights, and personalized recommendations.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            Limited Beta Spots Available
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready To Start Your Child's Learning Adventure?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our beta program and get lifetime early adopter benefits. 
            No credit card required, cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate('/login')} className="text-lg h-14 px-8 shadow-xl">
              Start Free Today
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="text-lg h-14 px-8">
              Talk To Our Team
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">IO</span>
                </div>
                <span className="font-bold">Inner Odyssey</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering every child through emotional intelligence, academic excellence, and life skills.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/beta-program" className="hover:text-foreground transition-colors">Beta Program</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/discord" className="hover:text-foreground transition-colors">Discord Community</a></li>
                <li><a href="/support" className="hover:text-foreground transition-colors">Support</a></li>
                <li><a href="/beta-feedback" className="hover:text-foreground transition-colors">Beta Feedback</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Flashfusion, Inc. | Inner Odyssey is a product of Flashfusion. All rights reserved. COPPA Compliant.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;