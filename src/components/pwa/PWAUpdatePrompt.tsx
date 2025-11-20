import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export const PWAUpdatePrompt = () => {
  const { needRefresh, updateServiceWorker } = usePWA();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-top-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Update Available</h3>
            <p className="text-xs text-muted-foreground mb-3">
              A new version is available. Refresh to get the latest features and fixes.
            </p>
            <Button size="sm" onClick={() => updateServiceWorker(true)} className="w-full">
              Refresh Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
