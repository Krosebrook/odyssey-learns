import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollaborativeActivityProps {
  childId: string;
  lessonId: string;
}

export const CollaborativeActivity = ({ childId, lessonId }: CollaborativeActivityProps) => {
  // Validate child ownership server-side (defense in depth)
  const { childId: validatedChildId, isValidating } = useValidatedChild();
  
  const [availableFriends, setAvailableFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadFriends = useCallback(async () => {
    // Get siblings (same parent) as potential collaboration partners
    const { data: child } = await supabase
      .from('children')
      .select('parent_id')
      .eq('id', childId)
      .single();

    if (child) {
      const { data: siblings } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', child.parent_id)
        .neq('id', childId);

      setAvailableFriends(siblings || []);
    }
  }, [childId]);

  const loadRequests = useCallback(async () => {
    const { data } = await supabase
      .from('collaboration_requests')
      .select('*, requester:children!collaboration_requests_requester_child_id_fkey(name), recipient:children!collaboration_requests_recipient_child_id_fkey(name)')
      .or(`requester_child_id.eq.${childId},recipient_child_id.eq.${childId}`)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    setRequests(data || []);
  }, [childId, lessonId]);

  // Effect to load data when dependencies change (childId, validatedChildId, or callbacks update)
  useEffect(() => {
    // Only load data if we have a validated childId
    if (validatedChildId && validatedChildId === childId) {
      loadFriends();
      loadRequests();
    }
  }, [childId, validatedChildId, loadFriends, loadRequests]);

  const sendRequest = async () => {
    if (!selectedFriend) return;

    setLoading(true);
    
    // Generate idempotency key to prevent double-submissions
    const idempotencyKey = `collab-${childId}-${selectedFriend}-${lessonId}-${Date.now()}`;
    
    // Call secure RPC instead of direct insert
    const { data, error } = await supabase.rpc('request_collaboration', {
      p_child_id: childId,
      p_target_child_id: selectedFriend,
      p_lesson_id: lessonId,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      // Network-level error (shouldn't happen with RPC)
      console.error('RPC call failed:', error);
      toast({
        title: "Connection Error",
        description: "Failed to send request. Please check your connection.",
        variant: "destructive",
      });
    } else if (data) {
      // Type guard: ensure data is an object with expected shape
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        // Handle structured errors from RPC
        const errorMessages: Record<string, { title: string; description: string }> = {
          unauthorized: {
            title: "Not Authorized",
            description: "You can only send requests for your own children."
          },
          invalid_target: {
            title: "Invalid Request",
            description: "A child cannot collaborate with themselves."
          },
          duplicate_request: {
            title: "Request Already Sent",
            description: "A collaboration request is already pending for this lesson."
          },
          rate_limit_exceeded: {
            title: "Too Many Requests",
            description: "You've sent too many requests. Please wait 15 minutes and try again."
          },
          concurrent_request: {
            title: "Please Wait",
            description: "Another request is being processed. Please try again in a moment."
          }
        };
        
        const errorConfig = errorMessages[result.error || ''] || {
          title: "Error",
          description: result.message || "An unexpected error occurred."
        };
        
        toast({
          title: errorConfig.title,
          description: errorConfig.description,
          variant: "destructive",
        });
      } else {
        // Success
        toast({
          title: "Request Sent! 🤝",
          description: "Waiting for parent approval...",
        });
        loadRequests();
        setSelectedFriend("");
      }
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  // Show loading while validating
  if (isValidating) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }
  
  // If validation fails or childId mismatch, show error
  if (!validatedChildId || validatedChildId !== childId) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Unable to verify child access. Please refresh the page or select a different child.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Collaborative Learning</h3>
          <p className="text-sm text-muted-foreground">Learn together with friends!</p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-info mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">Parent Safety:</strong> Your parent can see 
            everything you share with friends and must approve all collaboration requests.
          </div>
        </div>
      </div>

      {/* Invite Friends */}
      {availableFriends.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full mb-4 gap-2">
              <Users className="w-4 h-4" />
              Invite a Friend to This Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background z-50">
            <DialogHeader>
              <DialogTitle>Invite a Friend</DialogTitle>
              <DialogDescription>
                Choose a sibling to work with on this lesson. Your parent will review the request.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                <SelectTrigger className="bg-background z-50">
                  <SelectValue placeholder="Select a friend..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {availableFriends.map((friend) => (
                    <SelectItem key={friend.id} value={friend.id} className="cursor-pointer">
                      {friend.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={sendRequest} 
                disabled={!selectedFriend || loading}
                className="w-full"
              >
                {loading ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Collaboration Requests */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Your Collaboration Requests</h4>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No collaboration requests yet
          </p>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {request.requester?.name?.charAt(0) || request.recipient?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {request.requester_child_id === childId 
                        ? `To: ${request.recipient?.name}` 
                        : `From: ${request.requester?.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className="text-xs font-medium capitalize">
                    {request.status}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};
