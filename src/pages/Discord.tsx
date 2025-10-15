import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { MessageSquare, Users, Heart } from "lucide-react";

const Discord = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://discord.gg/innerodyssey";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <BackButton to="/" />
        
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <Badge variant="secondary" className="mx-auto">Beta Community</Badge>
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Join Our Discord Community!</CardTitle>
            <CardDescription className="text-base">
              Redirecting you to our Discord server...
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Connect With Parents</h3>
                <p className="text-xs text-muted-foreground">
                  Share experiences and tips with other beta families
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-sm">Direct Feedback</h3>
                <p className="text-xs text-muted-foreground">
                  Chat directly with our product team
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-sm">Early Access</h3>
                <p className="text-xs text-muted-foreground">
                  Get sneak peeks of upcoming features
                </p>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>If you're not redirected automatically, use this link:</p>
              <a href="https://discord.gg/innerodyssey" className="text-primary hover:underline font-medium">
                https://discord.gg/innerodyssey
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Discord;
