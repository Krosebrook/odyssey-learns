import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Heart, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { logMessageView } from '@/lib/auditLogger';

interface Child {
  id: string;
  name: string;
}

interface Message {
  id: string;
  sender_type: 'parent' | 'child';
  message_type: string;
  message_text: string;
  is_important: boolean;
  read_at: string | null;
  created_at: string;
}

export const ParentChildMessaging = ({ parentId }: { parentId: string }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'encouragement' | 'celebration'>('text');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadChildren();
  }, [parentId]);

  useEffect(() => {
    if (selectedChild) {
      loadMessages();
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name')
        .eq('parent_id', parentId);

      if (error) throw error;
      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0].id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChild) return;

    try {
      const { data, error } = await supabase
        .from('parent_child_messages')
        .select('*')
        .eq('child_id', selectedChild)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);

      // Log access to sensitive messages
      if (data && data.length > 0) {
        data.forEach((msg: any) => {
          logMessageView(msg.id, selectedChild);
        });
      }

      // Mark messages as read
      await supabase
        .from('parent_child_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('child_id', selectedChild)
        .eq('sender_type', 'child')
        .is('read_at', null);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChild) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('parent_child_messages')
        .insert({
          parent_id: parentId,
          child_id: selectedChild,
          sender_type: 'parent',
          message_type: messageType,
          message_text: newMessage.trim(),
          is_important: messageType === 'encouragement' || messageType === 'celebration',
        });

      if (error) throw error;

      toast({
        title: "Message sent! 💌",
        description: "Your child will see this message",
      });

      setNewMessage('');
      setMessageType('text');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const quickMessages = [
    { type: 'encouragement', text: "I'm so proud of you! Keep up the great work! 🌟" },
    { type: 'encouragement', text: "You're doing amazing! I love seeing you learn! ❤️" },
    { type: 'celebration', text: "Wow! That's fantastic! Let's celebrate! 🎉" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Messages</h2>
        <p className="text-sm text-muted-foreground">Send encouragement and stay connected</p>
      </div>

      {children.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No children added yet</p>
        </Card>
      ) : (
        <>
          {/* Child Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChild === child.id ? 'default' : 'outline'}
                onClick={() => setSelectedChild(child.id)}
                className="whitespace-nowrap"
              >
                {child.name}
              </Button>
            ))}
          </div>

          {/* Messages Area */}
          <Card className="p-6">
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'parent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender_type === 'parent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.message_type === 'encouragement' && (
                        <div className="flex items-center gap-1 mb-1">
                          <Heart className="w-3 h-3" />
                          <span className="text-xs font-semibold">Encouragement</span>
                        </div>
                      )}
                      {message.message_type === 'celebration' && (
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-xs font-semibold">Celebration</span>
                        </div>
                      )}
                      <p className="text-sm">{message.message_text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Messages */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick messages:</p>
              <div className="flex flex-wrap gap-2">
                {quickMessages.map((quick, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setNewMessage(quick.text);
                      setMessageType(quick.type as any);
                    }}
                  >
                    {quick.text}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={messageType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('text')}
                >
                  Text
                </Button>
                <Button
                  variant={messageType === 'encouragement' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('encouragement')}
                  className="gap-1"
                >
                  <Heart className="w-3 h-3" />
                  Encourage
                </Button>
                <Button
                  variant={messageType === 'celebration' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('celebration')}
                  className="gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Celebrate
                </Button>
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Send a message to ${selectedChildData?.name}...`}
                  rows={3}
                  maxLength={500}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="gap-2">
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
