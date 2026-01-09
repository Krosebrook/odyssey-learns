import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Settings as SettingsIcon, Volume2, Zap, User, LogOut, Camera, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProfilePicture } from "@/hooks/useProfilePicture";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Settings = () => {
  const { childId, isValidating } = useValidatedChild();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, deleting, uploadProfilePicture, deleteProfilePicture } = useProfilePicture();
  
  // Settings state
  const [challengeMode, setChallengeMode] = useState(false);
  const [screenTimeLimit, setScreenTimeLimit] = useState([60]);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidating && childId) {
      loadSettings();
    }
  }, [childId, isValidating]);

  const loadSettings = async () => {
    if (!childId) return;

    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (data) {
      setChild(data);
      setChallengeMode(data.challenge_mode_enabled || false);
      setScreenTimeLimit([data.daily_screen_time_limit_minutes || 60]);
      setWeeklyReportEnabled(data.weekly_report_enabled !== false);
      setProfilePictureUrl(data.profile_picture_url || null);
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    if (!childId) return;
    setSaving(true);

    const { error } = await supabase
      .from('children')
      .update({
        challenge_mode_enabled: challengeMode,
        daily_screen_time_limit_minutes: screenTimeLimit[0],
        weekly_report_enabled: weeklyReportEnabled,
      })
      .eq('id', childId);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully!");
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !childId) return;

    // Optimistic update - show selected image immediately
    const tempUrl = URL.createObjectURL(file);
    setProfilePictureUrl(tempUrl);

    // Upload the file
    const newUrl = await uploadProfilePicture(file, childId);
    
    // Clean up temp URL
    URL.revokeObjectURL(tempUrl);
    
    if (newUrl) {
      setProfilePictureUrl(newUrl);
      // Reload child data to get updated info
      loadSettings();
    } else {
      // Revert optimistic update on failure
      setProfilePictureUrl(child?.profile_picture_url || null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!childId) return;

    const success = await deleteProfilePicture(childId, profilePictureUrl);
    if (success) {
      setProfilePictureUrl(null);
      // Reload child data to confirm deletion
      loadSettings();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (isValidating || loading) {
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

          {/* Profile Picture Section */}
          <div className="space-y-3">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={profilePictureUrl || undefined} 
                  alt={child?.name || 'Profile picture'}
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
                  {child?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={uploading || deleting}
                    className="hover-scale"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  
                  {profilePictureUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteProfilePicture}
                      disabled={uploading || deleting}
                      className="text-destructive hover:text-destructive hover-scale"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting ? 'Removing...' : 'Remove'}
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or WebP. Max 5MB. Min 100x100px.
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </div>
            </div>
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
