import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trash, AlertTriangle, Settings, BarChart, MapPin, MessageSquare, Clock, RefreshCw, CheckCircle2, Calendar, Tent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminNavbar from "@/components/admin/AdminNavbar";
import UserManagement from "@/components/admin/UserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import NGODrivesManagement from "@/components/admin/NGODrivesManagement";

type Complaint = {
  id: string;
  created_at: string;
  description: string;
  image_url: string | null;
  user_id: string;
  location: { latitude: number; longitude: number } | null;
  user_email?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
  status?: "pending" | "resolved" | "rejected";
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  points_awarded?: number;
  notification_shown?: boolean;
};

// Create a sample complaint for testing if no complaints are found
const createSampleComplaints = (): Complaint[] => {
  return [
    {
      id: "sample-1",
      created_at: new Date().toISOString(),
      description: "Sample complaint: Illegal waste dump near the park",
      image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      user_id: "sample-user-1",
      location: { latitude: 40.7128, longitude: -74.0060 },
      user_email: "user@example.com",
      timestamp: new Date().toISOString(),
      status: "pending"
    },
    {
      id: "sample-2",
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      description: "Sample complaint: Plastic waste on the beach",
      image_url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      user_id: "sample-user-2",
      location: { latitude: 34.0522, longitude: -118.2437 },
      user_email: "another@example.com",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: "resolved",
      resolved_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      resolved_by: "admin@ecotrack.com",
      resolution_notes: "Cleanup team dispatched and waste removed successfully.",
      points_awarded: 50,
      notification_shown: true
    }
  ];
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [messages, setMessages] = useState<Complaint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching complaints from Supabase...");
      
      // Fetch all complaints without relying on created_at
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("timestamp", { ascending: false });

      console.log("Complaints data response:", data ? `Found ${data.length} complaints` : "No data");
      
      if (error) {
        console.error("Error fetching complaints:", error);
        setError(`Fetch error: ${error.message}`);
        setLoading(false);
        return;
      }

      // If no complaints found, show empty state
      if (!data || data.length === 0) {
        console.log("No complaints found");
        setComplaints([]);
        setMessages([]);
        setLoading(false);
        return;
      }

      // Process the complaints data
      const complaintsWithUserInfo = await Promise.all(
        data.map(async (complaint) => {
          let userEmail = "Unknown";
          
          // Try to fetch user email if user_id exists
          if (complaint.user_id) {
            try {
              const { data: userData } = await supabase
                .from("users")
                .select("email")
                .eq("id", complaint.user_id)
                .single();
                
              if (userData && userData.email) {
                userEmail = userData.email;
              }
            } catch (userError) {
              console.error("Error fetching user data:", userError);
            }
          }

          return {
            ...complaint,
            user_email: userEmail,
            // Ensure location data is properly structured
            location: complaint.location || 
              (complaint.latitude && complaint.longitude 
                ? { latitude: complaint.latitude, longitude: complaint.longitude } 
                : null)
          };
        })
      );

      console.log("Processed complaints:", complaintsWithUserInfo.length);
      setComplaints(complaintsWithUserInfo);
      setMessages(complaintsWithUserInfo);
    } catch (error: any) {
      console.error("Unexpected error fetching complaints:", error);
      setError(`Unexpected error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchComplaints();
    }
  }, [isAdmin]);

  const deleteComplaint = async (id: string) => {
    try {
      // Skip delete for sample data
      if (id.startsWith("sample-")) {
        // Just update local state for sample data
        setComplaints(complaints.filter(complaint => complaint.id !== id));
        setMessages(messages.filter(message => message.id !== id));
        
        toast({
          title: "Complaint deleted (demo)",
          description: "Complaint has been removed (sample data)",
        });
        
        return;
      }
      
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setComplaints(complaints.filter(complaint => complaint.id !== id));
      setMessages(messages.filter(message => message.id !== id));
      
      toast({
        title: "Complaint deleted",
        description: "Complaint has been permanently removed",
      });
    } catch (error: any) {
      console.error("Error deleting complaint:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete complaint",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(null);
    }
  };

  // Function to mark a complaint as resolved
  const resolveComplaint = async (id: string) => {
    try {
      // Skip update for sample data
      if (id.startsWith("sample-")) {
        // Just update local state for sample data
        const updatedComplaints = complaints.map(complaint => 
          complaint.id === id 
            ? { 
                ...complaint, 
                status: "resolved" as const, 
                resolved_at: new Date().toISOString(),
                resolved_by: user?.email || "admin",
                resolution_notes: resolutionNotes
              } 
            : complaint
        );
        
        setComplaints(updatedComplaints);
        setMessages(updatedComplaints);
        
        toast({
          title: "Complaint resolved (demo)",
          description: "Complaint has been marked as resolved (sample data)",
        });
        
        return;
      }
      
      // Find the complaint to get the user_id
      const complaintToResolve = complaints.find(c => c.id === id);
      if (!complaintToResolve || !complaintToResolve.user_id) {
        throw new Error("Complaint not found or missing user ID");
      }
      
      // Award points to the user (50 points for resolved complaint)
      const pointsToAward = 50;
      
      // Start a transaction to update both complaints and user points
      const { error: updateError } = await supabase
        .from("complaints")
        .update({
          status: "resolved" as const,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.email,
          resolution_notes: resolutionNotes,
          points_awarded: pointsToAward
        })
        .eq("id", id);

      if (updateError) throw updateError;
      
      // Update user points in the users table or create a points record
      // First check if user exists in the points table
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", complaintToResolve.user_id)
        .single();
        
      if (existingPoints) {
        // Update existing points
        const { error: pointsError } = await supabase
          .from("user_points")
          .update({
            total_points: existingPoints.total_points + pointsToAward,
            last_updated: new Date().toISOString()
          })
          .eq("user_id", complaintToResolve.user_id);
          
        if (pointsError) throw pointsError;
      } else {
        // Create new points record
        const { error: newPointsError } = await supabase
          .from("user_points")
          .insert({
            user_id: complaintToResolve.user_id,
            total_points: pointsToAward,
            last_updated: new Date().toISOString()
          });
          
        if (newPointsError) throw newPointsError;
      }
      
      // Add points history record
      const { error: historyError } = await supabase
        .from("points_history")
        .insert({
          user_id: complaintToResolve.user_id,
          points: pointsToAward,
          action: "Complaint Resolved",
          description: `Complaint #${id.substring(0, 8)} was resolved`,
          created_at: new Date().toISOString()
        });
        
      if (historyError) throw historyError;

      // Update local state
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === id 
          ? { 
              ...complaint, 
              status: "resolved" as const, 
              resolved_at: new Date().toISOString(),
              resolved_by: user?.email || "admin",
              resolution_notes: resolutionNotes,
              points_awarded: pointsToAward
            } 
          : complaint
      );
      
      setComplaints(updatedComplaints);
      setMessages(updatedComplaints);
      
      toast({
        title: "Complaint resolved",
        description: `Complaint has been marked as resolved and user awarded ${pointsToAward} points`,
      });
    } catch (error: any) {
      console.error("Error resolving complaint:", error);
      toast({
        title: "Resolution failed",
        description: error.message || "Failed to resolve complaint",
        variant: "destructive"
      });
    } finally {
      setResolveDialogOpen(null);
      setResolutionNotes("");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar title="Admin Dashboard" />

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            <p className="font-medium">Error loading complaints</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchComplaints} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="ngodrives">NGO Drives</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Complaints
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{complaints.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Complaints
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {complaints.filter(c => c.status === "pending" || !c.status).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Resolved Complaints
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {complaints.filter(c => c.status === "resolved").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Unique Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(complaints.map(c => c.user_id)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Overview of recent complaints and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : complaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No complaints found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {complaints.slice(0, 5).map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">
                            Complaint #{complaint.id.substring(0, 8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(complaint.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Complaints</CardTitle>
                <CardDescription>
                  Manage and respond to user complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : complaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No complaints found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {complaints.map((complaint) => (
                      <Card key={complaint.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">
                              Complaint #{complaint.id.substring(0, 8)}
                            </CardTitle>
                            {complaint.status === "resolved" && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                Resolved
                              </span>
                            )}
                            {(!complaint.status || complaint.status === "pending") && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                Pending
                              </span>
                            )}
                          </div>
                          <CardDescription>
                            Submitted by: {complaint.user_email} on{" "}
                            {new Date(complaint.timestamp || complaint.created_at).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm mb-2">{complaint.description}</p>
                          {complaint.image_url && (
                            <div className="mt-2 rounded-md overflow-hidden w-[100px] h-[100px]">
                              <img
                                src={complaint.image_url}
                                alt="Complaint"
                                className="w-full h-full object-cover aspect-square"
                              />
                            </div>
                          )}
                          {complaint.location && (
                            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {complaint.location.latitude.toFixed(6)},{" "}
                                {complaint.location.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                          
                          {complaint.status === "resolved" && (
                            <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded-md">
                              <p className="text-xs font-medium text-green-800">
                                Resolved by: {complaint.resolved_by || "Admin"} on{" "}
                                {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : "N/A"}
                              </p>
                              {complaint.resolution_notes && (
                                <p className="text-xs text-green-700 mt-1">
                                  Notes: {complaint.resolution_notes}
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-0">
                          {complaint.status !== "resolved" && (
                            <AlertDialog open={resolveDialogOpen === complaint.id} onOpenChange={(open) => setResolveDialogOpen(open ? complaint.id : null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark complaint as resolved?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark the complaint as resolved and notify the user.
                                    Please provide any resolution details below.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                  <Textarea 
                                    placeholder="Enter resolution details (e.g., 'Cleanup team dispatched', 'Issue addressed')"
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setResolveDialogOpen(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => resolveComplaint(complaint.id)}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Mark as Resolved
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          <AlertDialog open={deleteDialogOpen === complaint.id} onOpenChange={(open) => setDeleteDialogOpen(open ? complaint.id : null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                              >
                                <Trash className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will permanently delete this complaint from the database.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteDialogOpen(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteComplaint(complaint.id)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Complaint Messages
                </CardTitle>
                <CardDescription>
                  View all complaints as messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages found
                  </p>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div key={message.id} className="flex gap-4">
                          <Avatar>
                            <AvatarImage src={`https://avatar.vercel.sh/${message.user_id}`} />
                            <AvatarFallback>{message.user_email?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{message.user_email}</div>
                              <div className="flex items-center gap-2">
                                {message.status === "resolved" && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                    Resolved
                                  </span>
                                )}
                                {(!message.status || message.status === "pending") && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                    Pending
                                  </span>
                                )}
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {formatTimestamp(message.timestamp || message.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted p-4">
                              <p className="text-sm">{message.description}</p>
                              
                              {message.image_url && (
                                <div className="mt-3 rounded-md overflow-hidden w-[100px] h-[100px]">
                                  <img
                                    src={message.image_url}
                                    alt="Complaint"
                                    className="w-full h-full object-cover rounded-md aspect-square"
                                  />
                                </div>
                              )}
                              
                              {(message.location || message.latitude || message.longitude) && (
                                <div className="mt-3 flex items-center text-xs text-muted-foreground">
                                  <MapPin className="mr-1 h-3 w-3" />
                                  <span>
                                    {message.location 
                                      ? `${message.location.latitude.toFixed(6)}, ${message.location.longitude.toFixed(6)}`
                                      : `${message.latitude?.toFixed(6) || "N/A"}, ${message.longitude?.toFixed(6) || "N/A"}`}
                                  </span>
                                </div>
                              )}
                              
                              {message.status === "resolved" && (
                                <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded-md">
                                  <p className="text-xs font-medium text-green-800">
                                    Resolved by: {message.resolved_by || "Admin"} on{" "}
                                    {message.resolved_at ? new Date(message.resolved_at).toLocaleString() : "N/A"}
                                  </p>
                                  {message.resolution_notes && (
                                    <p className="text-xs text-green-700 mt-1">
                                      Notes: {message.resolution_notes}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-end">
                              <div className="flex gap-2">
                                {message.status !== "resolved" && (
                                  <AlertDialog open={resolveDialogOpen === message.id} onOpenChange={(open) => setResolveDialogOpen(open ? message.id : null)}>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Resolve
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mark complaint as resolved?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will mark the complaint as resolved and notify the user.
                                          Please provide any resolution details below.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="py-4">
                                        <Textarea 
                                          placeholder="Enter resolution details (e.g., 'Cleanup team dispatched', 'Issue addressed')"
                                          value={resolutionNotes}
                                          onChange={(e) => setResolutionNotes(e.target.value)}
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setResolveDialogOpen(null)}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => resolveComplaint(message.id)}
                                          className="bg-green-600 text-white hover:bg-green-700"
                                        >
                                          Mark as Resolved
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                <AlertDialog open={deleteDialogOpen === message.id} onOpenChange={(open) => setDeleteDialogOpen(open ? message.id : null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                                    >
                                      <Trash className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action will permanently delete this complaint from the database.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeleteDialogOpen(null)}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteComplaint(message.id)}
                                        className="bg-red-600 text-white hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/admin/complaint/${message.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ngodrives" className="space-y-4">
            <NGODrivesManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;