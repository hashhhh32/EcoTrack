import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Flag, MoreHorizontal, Reply } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";

export type ForumPostType = {
  id: string;
  user_id: string;
  user_email: string;
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  parent_id?: string | null;
  is_reply?: boolean;
};

interface ForumPostProps {
  post: ForumPostType;
  onReply: (post: ForumPostType) => void;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  isReply?: boolean;
  isLiked?: boolean;
}

const ForumPost: React.FC<ForumPostProps> = ({
  post,
  onReply,
  onLike,
  onDelete,
  onReport,
  isReply = false,
  isLiked = false
}) => {
  const { user, isAdmin } = useAuth();
  const isAuthor = user?.id === post.user_id;
  
  return (
    <div className={`p-4 rounded-lg border ${isReply ? 'bg-muted/30 ml-8 mt-2' : 'bg-white/80 backdrop-blur-sm mb-4'}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={`https://avatar.vercel.sh/${post.user_email}`} />
          <AvatarFallback>
            {post.user_email?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{post.user_email.split('@')[0]}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
            
            {(isAuthor || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onDelete && (isAuthor || isAdmin) && (
                    <DropdownMenuItem onClick={() => onDelete(post.id)}>
                      Delete
                    </DropdownMenuItem>
                  )}
                  {onReport && !isAuthor && (
                    <DropdownMenuItem onClick={() => onReport(post.id)}>
                      Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="mt-2 text-sm">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
          
          <div className="mt-3 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-primary",
                isLiked && "text-red-500 hover:text-red-600"
              )}
              onClick={() => onLike(post.id)}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span>{post.likes_count || 0}</span>
            </Button>
            
            {!isReply && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
                onClick={() => onReply(post)}
              >
                <Reply className="h-4 w-4" />
                <span>{post.replies_count || 0} {post.replies_count === 1 ? 'Reply' : 'Replies'}</span>
              </Button>
            )}
            
            {!isAuthor && onReport && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-destructive"
                onClick={() => onReport(post.id)}
              >
                <Flag className="h-4 w-4" />
                <span>Report</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost; 