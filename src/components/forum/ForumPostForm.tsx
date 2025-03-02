import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { ForumPostType } from './ForumPost';

interface ForumPostFormProps {
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  parentPost?: ForumPostType;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  isReply?: boolean;
}

const ForumPostForm: React.FC<ForumPostFormProps> = ({
  onSubmit,
  parentPost,
  onCancel,
  placeholder = "Share your thoughts with the community...",
  buttonText = "Post",
  isReply = false
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(content, parentPost?.id);
      setContent('');
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">Please sign in to join the discussion</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className={`p-4 rounded-lg border ${isReply ? 'bg-muted/30 ml-8 mt-2' : 'bg-white/80 backdrop-blur-sm mb-6'}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
          <AvatarFallback>
            {user.email?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none border-none bg-transparent focus-visible:ring-0 p-0"
          />
          
          <div className="mt-3 flex justify-between items-center">
            {isReply && onCancel && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            
            <div className={isReply && onCancel ? "" : "ml-auto"}>
              <Button 
                type="submit" 
                disabled={!content.trim() || isSubmitting}
                size="sm"
                className="gap-1"
              >
                <Send className="h-4 w-4" />
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ForumPostForm; 