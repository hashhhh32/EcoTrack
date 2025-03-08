import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import ForumPost, { ForumPostType } from './ForumPost';
import ForumPostForm from './ForumPostForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, MessageSquare } from 'lucide-react';

const ForumContainer: React.FC = () => {
  const [posts, setPosts] = useState<ForumPostType[]>([]);
  const [replyingTo, setReplyingTo] = useState<ForumPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postReplies, setPostReplies] = useState<Record<string, ForumPostType[]>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
    fetchLikedPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch main posts (not replies)
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For each post, fetch its replies
      const postsWithReplies = await Promise.all(
        data.map(async (post) => {
          const { data: replies, error: repliesError } = await supabase
            .from('forum_posts')
            .select('*')
            .eq('parent_id', post.id)
            .order('created_at', { ascending: true });
          
          if (repliesError) throw repliesError;
          
          // Count replies
          post.replies_count = replies?.length || 0;
          
          // Store replies in state
          if (replies && replies.length > 0) {
            setPostReplies(prev => ({
              ...prev,
              [post.id]: replies.map(reply => ({
                ...reply,
                is_reply: true
              }))
            }));
            
            // If there are replies, expand the post by default
            if (replies.length > 0) {
              setExpandedPosts(prev => ({
                ...prev,
                [post.id]: true
              }));
            }
          }
          
          return post;
        })
      );
      
      setPosts(postsWithReplies);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load forum posts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!user) return;

    try {
      const { data: likes, error } = await supabase
        .from('forum_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const likedMap = (likes || []).reduce((acc, like) => {
        acc[like.post_id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setLikedPosts(likedMap);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    }
  };

  const handleCreatePost = async (content: string, parentId?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post in the forum.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPost = {
        user_id: user.id,
        user_email: user.email,
        content,
        parent_id: parentId || null,
        created_at: new Date().toISOString(),
        likes_count: 0,
        replies_count: 0,
      };

      const { data, error } = await supabase
        .from('forum_posts')
        .insert([newPost])
        .select();

      if (error) throw error;

      if (parentId) {
        // If it's a reply, update the parent post's replies count
        const parentPost = posts.find(p => p.id === parentId);
        if (parentPost) {
          parentPost.replies_count = (parentPost.replies_count || 0) + 1;
          
          // Add the reply to the replies state
          setPostReplies(prev => ({
            ...prev,
            [parentId]: [...(prev[parentId] || []), {
              ...data[0],
              is_reply: true
            }]
          }));
          
          // Expand the post to show replies
          setExpandedPosts(prev => ({
            ...prev,
            [parentId]: true
          }));
          
          setPosts([...posts]);
        }
        setReplyingTo(null);
      } else {
        // If it's a new post, add it to the top of the list
        setPosts([data[0], ...posts]);
      }

      toast({
        title: "Success",
        description: parentId ? "Reply posted successfully!" : "Post created successfully!",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like posts.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the post in either main posts or replies to get current likes count
      const post = posts.find(p => p.id === postId) || 
        Object.values(postReplies).flat().find(r => r.id === postId);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Check if user already liked this post
      const { data: likes, error: likeCheckError } = await supabase
        .from('forum_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (likeCheckError) throw likeCheckError;

      const existingLike = likes && likes.length > 0;

      if (existingLike) {
        // User already liked, so remove the like
        const { error: deleteLikeError } = await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteLikeError) throw deleteLikeError;

        // Update likes count
        const newCount = Math.max(0, (post.likes_count || 0) - 1);
        const { error: updateError } = await supabase
          .from('forum_posts')
          .update({ likes_count: newCount })
          .eq('id', postId);

        if (updateError) throw updateError;

        // Update local state
        setPosts(currentPosts => 
          currentPosts.map(p => 
            p.id === postId 
              ? { ...p, likes_count: newCount }
              : p
          )
        );

        // Update replies if the liked post was a reply
        setPostReplies(currentReplies => {
          const newReplies = { ...currentReplies };
          Object.keys(newReplies).forEach(parentId => {
            newReplies[parentId] = newReplies[parentId].map(reply =>
              reply.id === postId
                ? { ...reply, likes_count: newCount }
                : reply
            );
          });
          return newReplies;
        });

        // Update liked status
        setLikedPosts(prev => ({
          ...prev,
          [postId]: false
        }));

      } else {
        // User hasn't liked, so add a like
        const { error: insertLikeError } = await supabase
          .from('forum_likes')
          .insert([{ 
            post_id: postId, 
            user_id: user.id 
          }]);

        if (insertLikeError) throw insertLikeError;

        // Update likes count
        const newCount = (post.likes_count || 0) + 1;
        const { error: updateError } = await supabase
          .from('forum_posts')
          .update({ likes_count: newCount })
          .eq('id', postId);

        if (updateError) throw updateError;

        // Update local state
        setPosts(currentPosts => 
          currentPosts.map(p => 
            p.id === postId 
              ? { ...p, likes_count: newCount }
              : p
          )
        );

        // Update replies if the liked post was a reply
        setPostReplies(currentReplies => {
          const newReplies = { ...currentReplies };
          Object.keys(newReplies).forEach(parentId => {
            newReplies[parentId] = newReplies[parentId].map(reply =>
              reply.id === postId
                ? { ...reply, likes_count: newCount }
                : reply
            );
          });
          return newReplies;
        });

        // Update liked status
        setLikedPosts(prev => ({
          ...prev,
          [postId]: true
        }));
      }

      toast({
        title: "Success",
        description: existingLike ? "Post unliked!" : "Post liked!",
      });
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      // Delete the post
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postToDelete);

      if (error) throw error;

      // Remove post from state
      setPosts(posts.filter(post => post.id !== postToDelete));
      
      // Also remove from replies if it's a reply
      setPostReplies(prev => {
        const newReplies = { ...prev };
        Object.keys(newReplies).forEach(parentId => {
          newReplies[parentId] = newReplies[parentId].filter(reply => reply.id !== postToDelete);
        });
        return newReplies;
      });
      
      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPostToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const handleReportPost = (postId: string) => {
    toast({
      title: "Report Submitted",
      description: "Thank you for reporting this post. Our moderators will review it.",
    });
  };

  const toggleReplies = async (postId: string) => {
    // Toggle expanded state
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // If we're expanding and don't have replies yet, fetch them
    if (!expandedPosts[postId] && (!postReplies[postId] || postReplies[postId].length === 0)) {
      try {
        const { data, error } = await supabase
          .from('forum_posts')
          .select('*')
          .eq('parent_id', postId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setPostReplies(prev => ({
            ...prev,
            [postId]: data.map(reply => ({
              ...reply,
              is_reply: true
            }))
          }));
        }
      } catch (error) {
        console.error('Error fetching replies:', error);
        toast({
          title: "Error",
          description: "Failed to load replies. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <ForumPostForm onSubmit={handleCreatePost} />
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading discussions...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">No discussions yet. Be the first to start a conversation!</p>
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <div key={post.id}>
              <ForumPost
                post={post}
                onReply={setReplyingTo}
                onLike={handleLikePost}
                onDelete={confirmDelete}
                onReport={handleReportPost}
                isLiked={likedPosts[post.id] || false}
              />
              
              {replyingTo?.id === post.id && (
                <ForumPostForm
                  onSubmit={handleCreatePost}
                  parentPost={replyingTo}
                  onCancel={() => setReplyingTo(null)}
                  placeholder="Write a reply..."
                  buttonText="Reply"
                  isReply
                />
              )}
              
              {/* Display replies if any */}
              {post.replies_count > 0 && (
                <div className="ml-8 mt-2">
                  {!expandedPosts[post.id] ? (
                    <button 
                      onClick={() => toggleReplies(post.id)}
                      className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors p-2"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Show {post.replies_count} {post.replies_count === 1 ? 'reply' : 'replies'}
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => toggleReplies(post.id)}
                        className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors p-2"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Hide {post.replies_count} {post.replies_count === 1 ? 'reply' : 'replies'}
                      </button>
                      <div className="space-y-2 mt-2">
                        {postReplies[post.id]?.map(reply => (
                          <ForumPost
                            key={reply.id}
                            post={reply}
                            onReply={() => {}} // No nested replies
                            onLike={handleLikePost}
                            onDelete={confirmDelete}
                            onReport={handleReportPost}
                            isLiked={likedPosts[reply.id] || false}
                            isReply
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForumContainer; 