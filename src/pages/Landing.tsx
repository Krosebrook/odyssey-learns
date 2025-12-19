import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Brain, BookOpen, Heart, Sparkles, Users, TrendingUp, Shield, Zap } from "lucide-react";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { PageContainer, PageSection, SectionHeader } from "@/components/ui/page-container";
import { FeatureCard, BenefitItem } from "@/components/ui/feature-card";

const Landing = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Heart,
      title: "Emotional Intelligence",
      description: "Build self-awareness, empathy, and coping strategies through guided activities and reflection.",
      iconColor: "primary" as const,
    },
    {
      icon: BookOpen,
      title: "Academic Excellence",
      description: "Standards-aligned content across all subjects with adaptive difficulty and personalized learning paths.",
      iconColor: "secondary" as const,
    },
    {
      icon: Brain,
      title: "Real-World Life Skills",
      description: "Financial literacy, time management, communication, and problem-solving for real-world success.",
      iconColor: "accent" as const,
    },
  ];

  const benefits = [
    { icon: Sparkles, text: "Age-adaptive gamification that grows with your child" },
    { icon: Users, text: "Parent dashboard with real-time progress insights" },
    { icon: TrendingUp, text: "Personalized learning paths based on performance" },
    { icon: Shield, text: "COPPA compliant with industry-leading privacy" },
    { icon: Zap, text: "Engaging quests and rewards that motivate learning" },
    { icon: Brain, text: "Builds emotional intelligence alongside academics" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <PageContainer className="py-24 sm:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in px-4 pt-28 pb-20">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              🎉 Now in Beta - Join 2,500+ Families
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto text-foreground">
              Transform Learning Into An
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                {" "}Epic
              </span>{" "}
              Adventure
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto border border-info/30 rounded-md p-4 backdrop-blur-sm bg-surface/20">
              The only K-12 platform that combines emotional intelligence, academic excellence, 
              and real-world life skills through engaging, personalized learning journeys.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-cta hover:bg-cta-hover text-cta-foreground font-semibold px-8 py-4 rounded-xl shadow-lg"
              >
                Start Free Beta Access
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/contact")}
                className="px-8 py-4 rounded-xl font-semibold"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
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
        </PageContainer>

        {/* Decorative Elements */}
        <div 
          className="absolute top-1/4 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50" 
          aria-hidden="true" 
        />
        <div 
          className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-50" 
          aria-hidden="true" 
        />
      </section>

      {/* Features Section */}
      <PageSection className="bg-surface/50">
        <PageContainer>
          <SectionHeader
            badge="Our Three Pillars"
            title="A Complete Learning Experience"
            description="We go beyond academics to prepare children for real-world success"
          />
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                iconColor={feature.iconColor}
              />
            ))}
          </div>
        </PageContainer>
      </PageSection>

      {/* Benefits Section */}
      <PageSection>
        <PageContainer>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <SectionHeader
                badge="Why Parents Love Us"
                title="Everything You Need To Support Your Child's Growth"
                description="Inner Odyssey adapts to your child's unique needs, celebrates their progress, and keeps you involved every step of the way."
                align="left"
                className="mb-6"
              />
              
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {benefits.map((benefit, index) => (
                  <BenefitItem key={index} icon={benefit.icon} text={benefit.text} />
                ))}
              </div>

              <Button size="lg" className="mt-6" onClick={() => navigate("/login")}>
                Join Beta Today
              </Button>
            </div>

            <Card className="elevated-card border-2 p-8">
              <div className="space-y-6">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-full bg-surface/90 flex items-center justify-center mb-4">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground">Real-Time Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Monitor your child's learning journey with detailed analytics, emotional intelligence 
                    insights, and personalized recommendations.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </PageContainer>
      </PageSection>

      {/* CTA Section */}
      <PageSection className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <PageContainer maxWidth="lg">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              Limited Beta Spots Available
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready To Start Your Child's Learning Adventure?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our beta program and get lifetime early adopter benefits. 
              No credit card required, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="text-lg h-14 px-8 shadow-xl"
              >
                Start Free Today
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/contact")}
                className="text-lg h-14 px-8"
              >
                Talk To Our Team
              </Button>
            </div>
          </div>
        </PageContainer>
      </PageSection>

      <LandingFooter />
    </div>
  );
};

export default Landing;
