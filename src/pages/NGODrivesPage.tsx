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
import { ArrowLeft, Calendar, MapPin, User, Clock, ExternalLink, Tent, Users, Bell, Trophy, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { subscribeToNGODrives, subscribeToUserDriveParticipations, unsubscribe } from "@/lib/realtime";
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
import { RealtimeNotificationManager } from "@/components/ui/realtime-notification";
import { generateAvatarUrl } from "@/lib/utils";

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

// Type for real-time notifications
type RealtimeNotification = {
  id: string;
  message: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  icon?: React.ReactNode;
  timestamp: number;
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
  const [drivesSubscription, setDrivesSubscription] = useState<RealtimeChannel | null>(null);
  const [participantsSubscription, setParticipantsSubscription] = useState<RealtimeChannel | null>(null);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState("Eco Beginner");
  const [selectedDrive, setSelectedDrive] = useState<NGODrive | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Add a notification
  const addNotification = (notification: Omit<RealtimeNotification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(current => [
      ...current,
      {
        ...notification,
        id,
        timestamp: Date.now()
      }
    ]);
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(current => current.filter(notification => notification.id !== id));
  };

  // Clean up old notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications(current => 
        current.filter(notification => now - notification.timestamp < 10000)
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch NGO drives from the database
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

  // Set up real-time subscription for NGO drives
  const setupDrivesSubscription = () => {
    // Clean up any existing subscription
    unsubscribe(drivesSubscription);

    // Create a new subscription
    const newSubscription = subscribeToNGODrives<NGODrive>((payload) => {
      console.log('Real-time drive update received:', payload);
      
      // Handle different types of changes
      if (payload.eventType === 'INSERT') {
        // Add the new drive to the list
        setDrives(currentDrives => [...currentDrives, payload.new].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        
        // Show notification for new drive
        addNotification({
          message: `New drive added: ${payload.new.title}`,
          variant: "primary",
          icon: <Tent className="h-5 w-5" />
        });
      } 
      else if (payload.eventType === 'UPDATE') {
        // Update the modified drive
        setDrives(currentDrives => 
          currentDrives.map(drive => 
            drive.id === payload.new.id ? payload.new : drive
          )
        );
        
        // Show notification for updated drive if it's one the user has joined
        if (joinedDrives.includes(payload.new.id)) {
          addNotification({
            message: `Drive updated: ${payload.new.title}`,
            variant: "warning",
            icon: <Bell className="h-5 w-5" />
          });
        }
      } 
      else if (payload.eventType === 'DELETE') {
        // Remove the deleted drive
        setDrives(currentDrives => 
          currentDrives.filter(drive => drive.id !== payload.old.id)
        );
        
        // Show notification for deleted drive if it's one the user has joined
        if (joinedDrives.includes(payload.old.id)) {
          addNotification({
            message: `A drive you joined has been cancelled`,
            variant: "destructive",
            icon: <Bell className="h-5 w-5" />
          });
        }
      }
    });

    setDrivesSubscription(newSubscription);
  };

  // Set up real-time subscription for drive participants
  const setupParticipantsSubscription = () => {
    if (!user) return;
    
    // Clean up any existing subscription
    unsubscribe(participantsSubscription);

    // Create a new subscription
    const newSubscription = subscribeToUserDriveParticipations<DriveParticipant>(
      user.id,
      (payload) => {
        console.log('Real-time participant update received:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'INSERT') {
          // Add the new drive to joined drives
          setJoinedDrives(current => [...current, payload.new.drive_id]);
        } 
        else if (payload.eventType === 'DELETE') {
          // Remove from joined drives
          setJoinedDrives(current => 
            current.filter(driveId => driveId !== payload.old.drive_id)
          );
        }
      }
    );

    setParticipantsSubscription(newSubscription);
  };

  useEffect(() => {
    // Initial fetch
    fetchDrives();
    
    // Set up real-time subscription for drives
    setupDrivesSubscription();
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe(drivesSubscription);
      unsubscribe(participantsSubscription);
    };
  }, []);
  
  useEffect(() => {
    // If user is logged in, fetch their joined drives and set up participants subscription
    if (user) {
      fetchUserJoinedDrives();
      setupParticipantsSubscription();
    } else {
      // Clear joined drives if user logs out
      setJoinedDrives([]);
      
      // Clean up participants subscription
      unsubscribe(participantsSubscription);
      setParticipantsSubscription(null);
    }
  }, [user]);

  // Fetch user points for profile
  useEffect(() => {
    if (!user) return;
    
    const fetchUserPoints = async () => {
      try {
        const { data, error } = await supabase
          .from("user_points")
          .select("total_points")
          .eq("user_id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user points:", error);
          return;
        }
        
        if (data) {
          setUserPoints(data.total_points);
          
          // Set user level based on points
          if (data.total_points >= 500) {
            setUserLevel("Eco Master");
          } else if (data.total_points >= 300) {
            setUserLevel("Eco Warrior");
          } else if (data.total_points >= 100) {
            setUserLevel("Eco Enthusiast");
          } else {
            setUserLevel("Eco Beginner");
          }
        }
      } catch (error) {
        console.error("Error in fetchUserPoints:", error);
      }
    };
    
    fetchUserPoints();
  }, [user]);

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

      // Deduct eco points from the user (50 points for cancelling)
      const pointsToDeduct = 50;
      
      // Get current user points
      const { data: existingPoints, error: pointsError } = await supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", user.id)
        .single();
        
      if (pointsError) {
        console.error("Error fetching user points:", pointsError);
      } else if (existingPoints) {
        // Update user points
        const newPoints = Math.max(0, existingPoints.total_points - pointsToDeduct);
        await supabase
          .from("user_points")
          .update({
            total_points: newPoints,
            last_updated: new Date().toISOString()
          })
          .eq("user_id", user.id);

        // Update local state for points display
        setUserPoints(newPoints);
        
        // Update user level based on new points
        if (newPoints >= 500) {
          setUserLevel("Eco Master");
        } else if (newPoints >= 300) {
          setUserLevel("Eco Warrior");
        } else if (newPoints >= 100) {
          setUserLevel("Eco Enthusiast");
        } else {
          setUserLevel("Eco Beginner");
        }
      }
      
      // Add points history record for the deduction
      await supabase
        .from("points_history")
        .insert({
          user_id: user.id,
          points: -pointsToDeduct,
          action: "Cancelled NGO Drive Participation",
          description: `Cancelled participation in ${drives.find(d => d.id === driveId)?.title || "environmental drive"}`,
          created_at: new Date().toISOString()
        });
      
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
        description: `You have cancelled your participation in this drive. ${pointsToDeduct} eco points have been deducted.`,
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

  // Handle viewing drive details
  const handleViewDetails = (drive: NGODrive) => {
    setSelectedDrive(drive);
    setDetailsDialogOpen(true);
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
                    <AvatarImage src={generateAvatarUrl(user.email)} />
                    <AvatarFallback className="text-xs">
                      {user.email?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {user && (
                <div className="p-4 pb-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={generateAvatarUrl(user.email)} />
                      <AvatarFallback>
                        {user.email?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{user.email?.split('@')[0]}</h4>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                      <div className="mt-2 flex items-center">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                          {userLevel}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm font-medium">Eco Points</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{userPoints}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (userPoints / 500) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Beginner</span>
                      <span className="text-xs text-muted-foreground">Master</span>
                    </div>
                  </div>
                </div>
              )}
              
              <DropdownMenuLabel>
                {user ? `Account Options` : 'My Account'}
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
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleViewDetails(drive)}
                    >
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
      
      {/* Real-time notifications */}
      <RealtimeNotificationManager 
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Drive Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedDrive && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedDrive.title}</DialogTitle>
                <DialogDescription className="text-base">
                  Organized by {selectedDrive.organizer}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="relative h-48 rounded-lg overflow-hidden mb-6">
                  {selectedDrive.image_url ? (
                    <img 
                      src={selectedDrive.image_url} 
                      alt={selectedDrive.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Tent className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(selectedDrive.status)}`}>
                      {selectedDrive.status.charAt(0).toUpperCase() + selectedDrive.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">About the Drive</h3>
                    <p className="text-muted-foreground">{selectedDrive.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Date & Time</p>
                          <p className="text-muted-foreground">
                            {format(new Date(selectedDrive.date), 'MMMM d, yyyy')}
                            <br />
                            {selectedDrive.time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-muted-foreground">{selectedDrive.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Contact Email</p>
                          <p className="text-muted-foreground">{selectedDrive.contact_email}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Contact Phone</p>
                          <p className="text-muted-foreground">{selectedDrive.contact_phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Participation</p>
                      <p className="text-muted-foreground">
                        {selectedDrive.participants_count} participants joined this drive
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Drive Completion Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      This drive was successfully completed on {format(new Date(selectedDrive.date), 'MMMM d, yyyy')}. 
                      Thank you to all participants who contributed to making this environmental initiative a success.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NGODrivesPage; 