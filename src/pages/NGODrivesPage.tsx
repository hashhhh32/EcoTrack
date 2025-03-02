import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, User, Clock, ExternalLink, Tent, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MapPinIcon, UsersIcon, ChevronRightIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type NGODrive = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  contact_email: string;
  contact_phone: string;
  image_url: string | null;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
  participants_count: number;
};

// New type for drive participants
type DriveParticipant = {
  id: string;
  drive_id: string;
  user_id: string;
  user_email: string;
  joined_at: string;
  status: "registered" | "attended" | "cancelled";
};

const NGODrivesPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [drives, setDrives] = useState<NGODrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [joinedDrives, setJoinedDrives] = useState<string[]>([]);
  const [joinDialogOpen, setJoinDialogOpen] = useState<string | null>(null);
  const [joiningDrive, setJoiningDrive] = useState(false);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from("ngo_drives")
          .select("*")
          .order("date", { ascending: true });
          
        if (error) {
          console.error("Error fetching NGO drives:", error);
          setError("Failed to load NGO drives");
          return;
        }
        
        setDrives(data || []);
      } catch (err) {
        console.error("Unexpected error fetching NGO drives:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrives();
    
    // If user is logged in, fetch their joined drives
    if (user) {
      fetchUserJoinedDrives();
    }
  }, [user]);

  // Fetch drives that the current user has joined
  const fetchUserJoinedDrives = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("drive_participants")
        .select("drive_id")
        .eq("user_id", user.id)
        .eq("status", "registered");
        
      if (error) {
        console.error("Error fetching joined drives:", error);
        return;
      }
      
      if (data) {
        setJoinedDrives(data.map(item => item.drive_id));
      }
    } catch (err) {
      console.error("Unexpected error fetching joined drives:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filteredDrives = drives.filter(drive => {
    if (activeTab === "all") return true;
    return drive.status === activeTab;
  });

  // Handle joining a drive
  const handleJoinDrive = async (driveId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join this drive",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    try {
      setJoiningDrive(true);
      
      // Check if user has already joined
      if (joinedDrives.includes(driveId)) {
        toast({
          title: "Already joined",
          description: "You have already joined this drive",
        });
        setJoinDialogOpen(null);
        return;
      }
      
      // Add user to drive participants
      const { error } = await supabase.from("drive_participants").insert({
        drive_id: driveId,
        user_id: user.id,
        user_email: user.email,
        joined_at: new Date().toISOString(),
        status: "registered",
      });
      
      if (error) throw error;
      
      // Update participants count in the drive
      const { error: updateError } = await supabase.rpc("increment_drive_participants", {
        drive_id: driveId
      });
      
      if (updateError) {
        console.error("Error updating participant count:", updateError);
      }
      
      // Add to local state
      setJoinedDrives([...joinedDrives, driveId]);
      
      // Update the drives list to reflect the new participant count
      setDrives(drives.map(drive => 
        drive.id === driveId 
          ? { ...drive, participants_count: drive.participants_count + 1 } 
          : drive
      ));
      
      // Award eco points to the user (50 points for joining a drive)
      const pointsToAward = 50;
      
      // Check if user exists in the points table
      const { data: existingPoints } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .single();
        
      if (existingPoints) {
        // Update existing points
        await supabase
          .from("user_points")
          .update({
            total_points: existingPoints.total_points + pointsToAward,
            last_updated: new Date().toISOString()
          })
          .eq("user_id", user.id);
      } else {
        // Create new points record
        await supabase
          .from("user_points")
          .insert({
            user_id: user.id,
            total_points: pointsToAward,
            last_updated: new Date().toISOString()
          });
      }
      
      // Add points history record
      await supabase
        .from("points_history")
        .insert({
          user_id: user.id,
          points: pointsToAward,
          action: "Joined NGO Drive",
          description: `Joined ${drives.find(d => d.id === driveId)?.title || "environmental drive"}`,
          created_at: new Date().toISOString()
        });
      
      toast({
        title: "Successfully joined!",
        description: "You have successfully joined this drive and earned 50 eco points!",
      });
      
      setJoinDialogOpen(null);
    } catch (error: any) {
      console.error("Error joining drive:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join the drive. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningDrive(false);
    }
  };

  // Handle cancelling participation in a drive
  const handleCancelJoin = async (driveId: string) => {
    if (!user) return;
    
    try {
      setJoiningDrive(true);
      
      // Remove user from drive participants
      const { error } = await supabase
        .from("drive_participants")
        .delete()
        .eq("drive_id", driveId)
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      // Update participants count in the drive
      const { error: updateError } = await supabase.rpc("decrement_drive_participants", {
        drive_id: driveId
      });
      
      if (updateError) {
        console.error("Error updating participant count:", updateError);
      }
      
      // Remove from local state
      setJoinedDrives(joinedDrives.filter(id => id !== driveId));
      
      // Update the drives list to reflect the new participant count
      setDrives(drives.map(drive => 
        drive.id === driveId 
          ? { ...drive, participants_count: Math.max(0, drive.participants_count - 1) } 
          : drive
      ));
      
      toast({
        title: "Participation cancelled",
        description: "You have cancelled your participation in this drive",
      });
    } catch (error: any) {
      console.error("Error cancelling drive participation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel participation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningDrive(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b p-4 bg-gradient-to-r from-primary/90 to-secondary/90 text-white">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="mr-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">NGO Drives & Events</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
                {user ? (
                  <Avatar className="h-8 w-8 border border-white/30">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                    <AvatarFallback className="text-xs">
                      {user.email?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user ? `Signed in as ${user.email}` : 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                Home
              </DropdownMenuItem>
              {user && user.email === "admin@ecotrack.com" && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  Admin Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/waste-classification")}>
                Waste Classification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/rewards")}>
                Rewards
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/")}>
                  Sign In
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-4">
        <div className="mb-6">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Tent className="mr-2 h-5 w-5 text-primary" />
                Upcoming NGO Drives & Events
              </CardTitle>
              <CardDescription>Join eco-friendly initiatives in your community</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Participate in local environmental initiatives organized by NGOs and community groups. 
                These events are great opportunities to make a positive impact and earn eco points!
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Drives</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-48 bg-gray-200"></CardHeader>
                <CardContent className="pt-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            <p>{error}</p>
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No drives found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no {activeTab !== "all" ? activeTab : ""} NGO drives available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrives.map((drive) => (
              <Card key={drive.id} className="overflow-hidden">
                <div className="h-48 overflow-hidden">
                  {drive.image_url ? (
                    <img 
                      src={drive.image_url} 
                      alt={drive.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <UsersIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{drive.title}</CardTitle>
                    <Badge className={getStatusColor(drive.status)}>
                      {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>{drive.organizer}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700 line-clamp-2">{drive.description}</p>
                  
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{format(new Date(drive.date), 'MMMM d, yyyy')} • {drive.time}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{drive.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    <span>{drive.participants_count} participants</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  {drive.status === "completed" ? (
                    <Button className="w-full" variant="outline">
                      View Details
                      <ChevronRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                  ) : joinedDrives.includes(drive.id) ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleCancelJoin(drive.id)}
                      disabled={joiningDrive}
                    >
                      Cancel Participation
                    </Button>
                  ) : (
                    <Dialog open={joinDialogOpen === drive.id} onOpenChange={(open) => setJoinDialogOpen(open ? drive.id : null)}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={joiningDrive}>
                          Join Drive
                          <ChevronRightIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Join {drive.title}</DialogTitle>
                          <DialogDescription>
                            You're about to register for this environmental drive. Please confirm your participation.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                              <span>{format(new Date(drive.date), 'MMMM d, yyyy')} • {drive.time}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-2 text-primary" />
                              <span>{drive.location}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Users className="h-4 w-4 mr-2 text-primary" />
                              <span>{drive.participants_count} participants so far</span>
                            </div>
                            
                            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                              <p className="font-medium">By joining this drive:</p>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>You'll earn 50 eco points</li>
                                <li>You'll receive updates about the drive</li>
                                <li>You commit to participate on the scheduled date</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setJoinDialogOpen(null)}
                            disabled={joiningDrive}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleJoinDrive(drive.id)}
                            disabled={joiningDrive}
                          >
                            {joiningDrive ? "Joining..." : "Confirm & Join"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md mt-8 mb-20">
          <CardHeader>
            <CardTitle>Why Participate?</CardTitle>
            <CardDescription>Benefits of joining NGO drives and events</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Make a Real Impact</span>
                  <p className="text-sm text-muted-foreground">Directly contribute to environmental conservation efforts in your community</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Earn Eco Points</span>
                  <p className="text-sm text-muted-foreground">Participating in NGO drives earns you eco points that can be redeemed for rewards</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Connect with Like-minded People</span>
                  <p className="text-sm text-muted-foreground">Meet others who share your passion for environmental conservation</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Learn New Skills</span>
                  <p className="text-sm text-muted-foreground">Gain practical knowledge about sustainability and conservation techniques</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NGODrivesPage; 