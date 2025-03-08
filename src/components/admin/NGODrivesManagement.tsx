import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Trash, Edit, Plus, Users, RefreshCw, Tent, UserCircle2 } from "lucide-react";
import { NGODriveForm } from "./NGODriveForm";
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
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealtimeChannel } from "@supabase/supabase-js";
import { subscribeToNGODrives, unsubscribe } from "@/lib/realtime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

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

type DriveParticipant = {
  id: string;
  drive_id: string;
  user_id: string;
  user_email: string;
  joined_at: string;
  status: "registered" | "attended" | "cancelled";
  user_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const NGODrivesManagement = () => {
  const { toast } = useToast();
  const [drives, setDrives] = useState<NGODrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [driveToEdit, setDriveToEdit] = useState<NGODrive | null>(null);
  const [driveToDelete, setDriveToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [selectedDriveParticipants, setSelectedDriveParticipants] = useState<DriveParticipant[]>([]);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsSubscription, setParticipantsSubscription] = useState<RealtimeChannel | null>(null);

  // Fetch NGO drives from the database with participant counts
  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get all drives
      const { data: drivesData, error: drivesError } = await supabase
        .from("ngo_drives")
        .select("*")
        .order("date", { ascending: true });
        
      if (drivesError) {
        console.error("Error fetching NGO drives:", drivesError);
        setError("Failed to load NGO drives");
        return;
      }

      if (!drivesData) {
        setDrives([]);
        return;
      }

      // Then get participant counts for each drive
      const { data: participantCounts, error: countsError } = await supabase
        .rpc('get_drive_participant_counts');

      if (countsError) {
        console.error("Error fetching participant counts:", countsError);
      }

      // Combine the data
      const drivesWithCounts = drivesData.map(drive => ({
        ...drive,
        participants_count: (participantCounts as Array<{drive_id: string, count: number}>)?.find(
          p => p.drive_id === drive.id
        )?.count || 0
      }));
      
      setDrives(drivesWithCounts);
    } catch (err) {
      console.error("Unexpected error fetching NGO drives:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for drives
  const setupDrivesSubscription = () => {
    // Clean up any existing subscription
    unsubscribe(subscription);

    // Create a new subscription
    const newSubscription = subscribeToNGODrives<NGODrive>((payload) => {
      console.log('Real-time drive update received:', payload);
      
      if (payload.eventType === 'INSERT') {
        setDrives(currentDrives => [...currentDrives, { ...payload.new, participants_count: 0 }]);
      } 
      else if (payload.eventType === 'UPDATE') {
        setDrives(currentDrives => 
          currentDrives.map(drive => 
            drive.id === payload.new.id ? payload.new : drive
          )
        );
      } 
      else if (payload.eventType === 'DELETE') {
        setDrives(currentDrives => 
          currentDrives.filter(drive => drive.id !== payload.old.id)
        );
      }
    });

    setSubscription(newSubscription);
  };

  // Set up real-time subscription for participants
  const setupParticipantsSubscription = () => {
    // Clean up any existing subscription
    unsubscribe(participantsSubscription);

    // Create a new subscription for drive_participants table
    const newSubscription = supabase
      .channel('drive-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drive_participants'
        },
        async (payload: any) => {
          console.log('Participant change received:', payload);

          // Refresh the drives to get updated participant counts
          await fetchDrives();

          // If we're currently viewing participants for this drive, refresh them
          if (participantsDialogOpen && payload.new && 'drive_id' in payload.new) {
            await fetchDriveParticipants(payload.new.drive_id);
          }
        }
      )
      .subscribe();

    setParticipantsSubscription(newSubscription);
  };

  // Set up subscriptions when component mounts
  useEffect(() => {
    fetchDrives();
    setupDrivesSubscription();
    setupParticipantsSubscription();
    
    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribe(subscription);
      unsubscribe(participantsSubscription);
    };
  }, []);

  // Handle opening the form for editing
  const handleEdit = (drive: NGODrive) => {
    setDriveToEdit(drive);
    setFormOpen(true);
  };

  // Handle opening the form for creating
  const handleCreate = () => {
    setDriveToEdit(null);
    setFormOpen(true);
  };

  // Handle deleting a drive
  const handleDelete = async () => {
    if (!driveToDelete) return;
    
    try {
      const { error } = await supabase
        .from("ngo_drives")
        .delete()
        .eq("id", driveToDelete);
        
      if (error) throw error;
      
      // Update local state
      setDrives(drives.filter(drive => drive.id !== driveToDelete));
      
      toast({
        title: "Drive deleted",
        description: "The NGO drive has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting NGO drive:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete the NGO drive. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDriveToDelete(null);
    }
  };

  // Get status badge color
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

  // Filter drives based on active tab
  const filteredDrives = drives.filter(drive => {
    if (activeTab === "all") return true;
    return drive.status === activeTab;
  });

  // Fetch participants for a specific drive
  const fetchDriveParticipants = async (driveId: string) => {
    try {
      setLoadingParticipants(true);
      
      // First, get the drive participants
      const { data: participants, error: participantsError } = await supabase
        .from("drive_participants")
        .select("*")
        .eq("drive_id", driveId)
        .order("joined_at", { ascending: false });
        
      if (participantsError) throw participantsError;
      
      if (!participants) {
        setSelectedDriveParticipants([]);
        return;
      }

      // Then, get the user profiles for these participants
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
        
      if (profilesError) throw profilesError;

      // Combine the data
      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        user_profile: profiles?.find(profile => profile.id === participant.user_id) || {
          full_name: null,
          avatar_url: null
        }
      }));
      
      setSelectedDriveParticipants(participantsWithProfiles);
    } catch (error) {
      console.error("Error fetching drive participants:", error);
      toast({
        title: "Error",
        description: "Failed to load drive participants",
        variant: "destructive",
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Handle viewing participants
  const handleViewParticipants = async (driveId: string) => {
    setParticipantsDialogOpen(true);
    await fetchDriveParticipants(driveId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Tent className="mr-2 h-5 w-5" />
          NGO Drives Management
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDrives} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Drive
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <p className="font-medium">Error loading drives</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Drives</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <CardHeader className="pb-2">
                <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Tent className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No drives found</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no {activeTab !== "all" ? activeTab : ""} NGO drives available at the moment.
          </p>
          <Button onClick={handleCreate} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create New Drive
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrives.map((drive) => (
            <Card key={drive.id} className="overflow-hidden">
              <div className="h-40 bg-gray-100 relative">
                {drive.image_url ? (
                  <img 
                    src={drive.image_url} 
                    alt={drive.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Tent className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(drive.status)}`}>
                    {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                  </span>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{drive.title}</CardTitle>
                <CardDescription>{drive.organizer}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{format(new Date(drive.date), 'MMM d, yyyy')} • {drive.time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{drive.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{drive.participants_count} participants</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(drive)}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewParticipants(drive.id)}
                    className="flex items-center"
                  >
                    <UserCircle2 className="h-4 w-4 mr-1" />
                    Participants
                  </Button>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 flex items-center"
                      onClick={() => setDriveToDelete(drive.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete this NGO drive from the database.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDriveToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Form dialog for adding/editing drives */}
      <NGODriveForm
        open={formOpen}
        onOpenChange={setFormOpen}
        driveToEdit={driveToEdit}
        onSuccess={fetchDrives}
      />
      
      {/* Participants Dialog */}
      <Dialog open={participantsDialogOpen} onOpenChange={setParticipantsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Drive Participants</DialogTitle>
            <DialogDescription>
              View all users who have registered for this drive
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {loadingParticipants ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : selectedDriveParticipants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No participants have registered yet
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedDriveParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage 
                            src={participant.user_profile?.avatar_url || `https://avatar.vercel.sh/${participant.user_email}`}
                          />
                          <AvatarFallback>
                            {participant.user_email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {participant.user_profile?.full_name || 'Anonymous User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {participant.user_email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Joined {format(new Date(participant.joined_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        participant.status === 'attended' 
                          ? 'bg-green-100 text-green-800'
                          : participant.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NGODrivesManagement; 