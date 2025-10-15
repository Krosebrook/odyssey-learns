import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, UserCheck, X, Check, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Child {
  id: string;
  name: string;
  grade_level: number;
  avatar_config: any;
}

interface Connection {
  id: string;
  peer_id: string;
  status: string;
  children: Child;
}

interface PeerConnectionsUIProps {
  childId: string;
}

export const PeerConnectionsUI = ({ childId }: PeerConnectionsUIProps) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, [childId]);

  const loadConnections = async () => {
    try {
      // Accepted connections
      const { data: accepted } = await supabase
        .from('peer_connections')
        .select('*, children!peer_connections_peer_id_fkey(*)')
        .eq('child_id', childId)
        .eq('status', 'accepted');

      // Pending incoming requests
      const { data: pending } = await supabase
        .from('peer_connections')
        .select('*, children!peer_connections_child_id_fkey(*)')
        .eq('peer_id', childId)
        .eq('status', 'pending');

      setConnections(accepted as any || []);
      setPendingRequests(pending as any || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPeers = async () => {
    if (!searchQuery.trim()) return;

    try {
      const { data } = await supabase
        .from('children')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .neq('id', childId)
        .limit(10);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching peers:', error);
    }
  };

  const sendRequest = async (peerId: string) => {
    try {
      const { error } = await supabase
        .from('peer_connections')
        .insert({
          child_id: childId,
          peer_id: peerId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Request sent! 👋",
        description: "Your connection request has been sent",
      });

      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const handleRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        await supabase
          .from('peer_connections')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', requestId);
      } else {
        await supabase
          .from('peer_connections')
          .delete()
          .eq('id', requestId);
      }

      toast({
        title: accept ? "Connection accepted! 🎉" : "Request declined",
        description: accept ? "You're now connected!" : "Request has been declined",
      });

      loadConnections();
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find Friends
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPeers()}
          />
          <Button onClick={searchPeers}>Search</Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{child.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-xs text-muted-foreground">Grade {child.grade_level}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => sendRequest(child.id)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Connect
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{request.children.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.children.name}</p>
                    <p className="text-xs text-muted-foreground">Grade {request.children.grade_level}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRequest(request.id, false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleRequest(request.id, true)}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connections */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          My Connections ({connections.length})
        </h3>
        {connections.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No connections yet. Search for friends above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                <Avatar>
                  <AvatarFallback>{connection.children.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{connection.children.name}</p>
                  <p className="text-xs text-muted-foreground">Grade {connection.children.grade_level}</p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <UserCheck className="w-3 h-3" />
                  Connected
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
