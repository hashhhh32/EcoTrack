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
import { Loader2 } from 'lucide-react';

const ForumContainer: React.FC = () => {
  const [posts, setPosts] = useState<ForumPostType[]>([]);
  const [replyingTo, setReplyingTo] = useState<ForumPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
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
      
      // Refresh posts to get the latest data
      fetchPosts();
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
      // Check if user already liked this post
      const { data: existingLike, error: likeCheckError } = await supabase
        .from('forum_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (likeCheckError && likeCheckError.code !== 'PGRST116') {
        throw likeCheckError;
      }

      if (existingLike) {
        // User already liked, so remove the like
        const { error: deleteLikeError } = await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteLikeError) throw deleteLikeError;

        // Decrement likes count
        const { error: updateError } = await supabase
          .from('forum_posts')
          .update({ likes_count: supabase.rpc('decrement', { x: 1 }) })
          .eq('id', postId);

        if (updateError) throw updateError;
      } else {
        // User hasn't liked, so add a like
        const { error: insertLikeError } = await supabase
          .from('forum_likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (insertLikeError) throw insertLikeError;

        // Increment likes count
        const { error: updateError } = await supabase
          .from('forum_posts')
          .update({ likes_count: supabase.rpc('increment', { x: 1 }) })
          .eq('id', postId);

        if (updateError) throw updateError;
      }

      // Refresh posts to get updated like count
      fetchPosts();
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

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">Community Discussion</h2>
      
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
                <div className="ml-8 mt-2 space-y-2">
                  {/* We would fetch and display replies here */}
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