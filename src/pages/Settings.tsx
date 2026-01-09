import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { useChildSettings } from "@/hooks/useChildSettings";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Settings as SettingsIcon, Volume2, Zap, User, LogOut } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { childId, isValidating } = useValidatedChild();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // Use React Query hook for better caching and optimistic updates
  const { settings, isLoading, updateSettings } = useChildSettings(childId);
  
  // Local state for form inputs (synced with settings data)
  const [challengeMode, setChallengeMode] = useState(false);
  const [screenTimeLimit, setScreenTimeLimit] = useState([60]);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);

  // Sync form state with fetched settings
  useEffect(() => {
    if (settings) {
      setChallengeMode(settings.challenge_mode_enabled);
      setScreenTimeLimit([settings.daily_screen_time_limit_minutes]);
      setWeeklyReportEnabled(settings.weekly_report_enabled);
    }
  }, [settings]);

  const saveSettings = () => {
    if (!childId) return;
    
    // Trigger mutation with optimistic update
    updateSettings.mutate({
      challenge_mode_enabled: challengeMode,
      daily_screen_time_limit_minutes: screenTimeLimit[0],
      weekly_report_enabled: weeklyReportEnabled,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isValidating || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout childName={child?.name} points={child?.total_points || 0}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <BackButton to="/dashboard" label="Back to Dashboard" />

        <div className="text-center py-6">
          <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mb-4">
            <SettingsIcon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize your learning experience
          </p>
        </div>

        {/* Learning Preferences */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Learning Preferences
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Challenge Mode</Label>
              <p className="text-sm text-muted-foreground">
                Get harder questions for more points
              </p>
            </div>
            <Switch
              checked={challengeMode}
              onCheckedChange={setChallengeMode}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Daily Screen Time Limit</Label>
              <span className="text-sm font-medium">{screenTimeLimit[0]} minutes</span>
            </div>
            <Slider
              value={screenTimeLimit}
              onValueChange={setScreenTimeLimit}
              max={180}
              min={15}
              step={15}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Your parent can adjust this limit
            </p>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Notifications
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Report to Parent</Label>
              <p className="text-sm text-muted-foreground">
                Send a summary of your progress every week
              </p>
            </div>
            <Switch
              checked={weeklyReportEnabled}
              onCheckedChange={setWeeklyReportEnabled}
            />
          </div>
        </Card>

        {/* Account Info */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Information
            </h2>
          </div>

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={child?.name || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label>Grade Level</Label>
            <Input value={`Grade ${child?.grade_level || ''}`} disabled />
          </div>

          <div className="space-y-2">
            <Label>Parent Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>

          <p className="text-sm text-muted-foreground">
            Ask your parent to update your profile information
          </p>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive mt-4"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 hover-scale"
            size="lg"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
