import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideLeaf, Recycle, MapPin, Trophy, AlertTriangle, UserCircle, LogIn, Image, Trash, LogOut, Users, Mail, User, Calendar, Tent, Lightbulb, RotateCcw, Leaf, MessageCircle, MessagesSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/auth/LoginScreen";
import { useNavigate } from "react-router-dom";
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
import { format } from "date-fns";
import { subscribeToNGODrives, unsubscribe } from "@/lib/realtime";
import { RealtimeChannel } from "@supabase/supabase-js";

// Define the NGODrive type
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

const Index = () => {
  console.log("Index component: Rendering started");
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const {
    user,
    loading,
    signOut,
    isAdmin
  } = useAuth();
  console.log("Index component: Auth state", { user: user ? "exists" : "null", loading });
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState("Eco Beginner");
  
  // Add state for NGO drives
  const [drives, setDrives] = useState<NGODrive[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [drivesError, setDrivesError] = useState<string | null>(null);
  const [drivesSubscription, setDrivesSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    console.log("Index component: useEffect triggered", { loading });
    if (!loading) {
      setIsLocalLoading(false);
    }
  }, [loading]);

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
          if (error.code !== 'PGRST116') { // Not found error
            console.error("Error fetching user points:", error);
          }
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

  // Fetch NGO drives from the database
  const fetchDrives = async () => {
    try {
      setDrivesLoading(true);
      setDrivesError(null);
      
      const { data, error } = await supabase
        .from("ngo_drives")
        .select("*")
        .eq("status", "upcoming")  // Only fetch upcoming drives for the homepage
        .order("date", { ascending: true })
        .limit(2);  // Limit to 2 drives for the homepage
        
      if (error) {
        console.error("Error fetching NGO drives for homepage:", error);
        setDrivesError("Failed to load NGO drives");
        return;
      }
      
      setDrives(data || []);
    } catch (err) {
      console.error("Unexpected error fetching NGO drives for homepage:", err);
      setDrivesError("An unexpected error occurred");
    } finally {
      setDrivesLoading(false);
    }
  };

  // Set up real-time subscription for NGO drives
  const setupDrivesSubscription = () => {
    // Clean up any existing subscription
    unsubscribe(drivesSubscription);

    // Create a new subscription
    const newSubscription = subscribeToNGODrives<NGODrive>((payload) => {
      console.log('Real-time drive update received on homepage:', payload);
      
      // Only handle upcoming drives for the homepage
      if (payload.new && payload.new.status === 'upcoming') {
        // Handle different types of changes
        if (payload.eventType === 'INSERT') {
          // Add the new drive to the list if we have less than 2 drives
          setDrives(currentDrives => {
            if (currentDrives.length < 2) {
              return [...currentDrives, payload.new].sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
              );
            }
            return currentDrives;
          });
        } 
        else if (payload.eventType === 'UPDATE') {
          // Update the modified drive
          setDrives(currentDrives => 
            currentDrives.map(drive => 
              drive.id === payload.new.id ? payload.new : drive
            )
          );
        } 
        else if (payload.eventType === 'DELETE') {
          // Remove the deleted drive and fetch a new one if available
          setDrives(currentDrives => {
            const filtered = currentDrives.filter(drive => drive.id !== payload.old.id);
            if (filtered.length < currentDrives.length) {
              // A drive was removed, fetch drives again to get a replacement
              fetchDrives();
            }
            return filtered;
          });
        }
      }
    });

    setDrivesSubscription(newSubscription);
  };

  // Fetch drives and set up subscription when component mounts
  useEffect(() => {
    if (user) {
      fetchDrives();
      setupDrivesSubscription();
    }
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe(drivesSubscription);
    };
  }, [user]);

  const handleLogin = () => {
    console.log("Index component: handleLogin called");
    // This function is now just a pass-through for the UI state
    // The actual login is handled by the AuthContext
  };

  const handleLogout = async () => {
    console.log("Index component: handleLogout called");
    await signOut();
  };

  if (isLocalLoading) {
    console.log("Index component: Showing loading spinner");
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }

  if (!user) {
    console.log("Index component: Showing login screen");
    return <LoginScreen onLogin={handleLogin} />;
  }

  console.log("Index component: Rendering main content");
  return <div className="min-h-screen bg-background flex flex-col">
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 z-0 overflow-hidden">
          {/* Minimal abstract pattern overlay */}
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                 backgroundImage: 'url("https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")', 
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
          </div>
          {/* Subtle geometric shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>
        <div className="relative z-10 p-6">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                <LucideLeaf className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">EcoTrack</h1>
                <p className="text-xs text-white/80">Sustainable waste management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="mr-2"
                >
                  Admin Dashboard
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                    {user ? (
                      <Avatar className="h-8 w-8 border border-white/30">
                        <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                        <AvatarFallback className="text-xs">
                          {user.email?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  {user && (
                    <div className="p-4 pb-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
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
                    Account Options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/waste-classification")}>
                    Waste Classification
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ngo-drives")}>
                    NGO Drives
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/rewards")}>
                    Rewards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/complaint")}>
                    Report Waste
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="h-8 bg-gradient-to-b from-primary/10 to-transparent"></div>
      </header>

      <main className="flex-1 container mx-auto p-4 bg-emerald-50/50 rounded-lg mb-20 shadow-sm">
        <section className="mb-8 animate-enter">
          <div className="p-6 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 hover:shadow-lg transition-all duration-300 border border-emerald-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 text-primary">Welcome to EcoTrack</h2>
                <p className="text-muted-foreground mb-4">Your partner in sustainable waste management and environmental conservation. Join our community of eco-warriors making a difference.</p>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-medium text-primary flex items-center">
                    <Recycle className="h-3 w-3 mr-1" /> Waste Management
                  </div>
                  <div className="bg-secondary/10 px-3 py-1 rounded-full text-xs font-medium text-secondary flex items-center">
                    <Users className="h-3 w-3 mr-1" /> Community Drives
                  </div>
                  <div className="bg-amber-500/10 px-3 py-1 rounded-full text-xs font-medium text-amber-600 flex items-center">
                    <Trophy className="h-3 w-3 mr-1" /> Eco Rewards
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
                  <div className="relative h-full w-full flex items-center justify-center">
                    <LucideLeaf className="h-24 w-24 text-primary/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 animate-enter delay-100">
          <h2 className="text-xl font-bold mb-4 text-primary flex items-center">
            <Recycle className="mr-2 h-5 w-5" />
            Sustainable Waste Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
              <div className="relative h-48 bg-eco-backdrop">
                <img 
                  src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Waste Segregation" 
                  className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-lg font-medium text-white">Waste Segregation</h3>
                  <p className="text-sm text-white/80">Learn proper segregation techniques</p>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm">
                  Proper waste segregation is crucial for effective recycling. Learn how to separate waste into 
                  recyclables, organic waste, and other categories to minimize environmental impact.
                </p>
                <Button variant="outline" className="mt-4 w-full group" onClick={() => navigate("/waste-classification")}>
                  <Recycle className="mr-2 h-4 w-4 text-eco-leaf group-hover:text-primary transition-colors" /> 
                  Waste Classification
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
              <div className="relative h-48 bg-eco-backdrop">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Community Forum" 
                  className="w-full h-full object-cover brightness-90 hover:brightness-100 transition-all duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-lg font-medium text-white">Community Forum</h3>
                  <p className="text-sm text-white/80">Connect with eco-conscious individuals</p>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm">
                  Join our vibrant community of environmentally conscious individuals. Share ideas, ask questions, 
                  and collaborate on sustainable initiatives to create a greener future together.
                </p>
                <Button variant="outline" className="mt-4 w-full group">
                  <MessagesSquare className="mr-2 h-4 w-4 text-blue-500 group-hover:text-primary transition-colors" /> 
                  Join Discussion
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-8 animate-enter delay-200">
          <Tabs defaultValue="segregation" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="segregation">Waste Guide</TabsTrigger>
              <TabsTrigger value="tips">Eco Tips</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>
            <TabsContent value="segregation">
              <Card className="border-2 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Waste Segregation Guide</CardTitle>
                  <CardDescription>Learn how to properly sort your waste</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <WasteTypeCard type="Plastic" color="bg-eco-plastic" />
                    <WasteTypeCard type="Paper" color="bg-eco-paper" />
                    <WasteTypeCard type="Glass" color="bg-eco-glass" />
                    <WasteTypeCard type="Metal" color="bg-eco-metal" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tips">
              <Card className="border-2 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Sustainable Waste Management Tips</CardTitle>
                  <CardDescription>Simple practices for reducing your environmental footprint</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                          <RotateCcw className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-center font-medium text-green-800 mb-2">Reduce & Reuse</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Choose reusable alternatives to single-use items and reduce overall consumption to minimize waste generation.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <Recycle className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="text-center font-medium text-blue-800 mb-2">Proper Recycling</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Clean recyclables before disposal and learn which materials are accepted in your local recycling program.
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                          <Leaf className="h-8 w-8 text-amber-600" />
                        </div>
                      </div>
                      <h3 className="text-center font-medium text-amber-800 mb-2">Composting</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Turn food scraps and yard waste into nutrient-rich soil through composting to reduce landfill waste.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
                    <h4 className="font-medium flex items-center mb-2">
                      <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                      Did You Know?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      The average person generates about 4.5 pounds of waste per day. By implementing proper waste management practices, you can reduce this by up to 70%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports">
              <Card className="border-2 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Report Waste Dump</CardTitle>
                  <CardDescription>Help us keep our environment clean</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full mb-4 bg-destructive hover:bg-destructive/90"
                    onClick={() => navigate("/complaint")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Report Illegal Dumping
                  </Button>
                  <div className="text-muted-foreground text-sm">
                    <p>Take a photo and report illegal waste dumps in your area. Your report will be sent to the authorities for action.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rewards">
              <Card className="border-2 hover:border-primary/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                    Your Reward Points
                  </CardTitle>
                  <CardDescription>Track your eco-friendly achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="text-center py-4">
                      <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                      <h3 className="font-medium">Sign in to view your rewards</h3>
                      <p className="text-sm text-muted-foreground mb-4">Track your eco-friendly achievements and earn rewards</p>
                      <Button onClick={() => navigate("/login")}>Sign In</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-primary">{userPoints}</h3>
                          <p className="text-sm text-muted-foreground">Total Eco Points</p>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {userLevel}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              {userPoints < 100 ? "Next Reward: Eco-friendly Pen" :
                               userPoints < 300 ? "Next Reward: Eco-friendly Water Bottle" :
                               userPoints < 500 ? "Next Reward: $10 Coffee Shop Gift Card" :
                               "Next Reward: $25 Eco Store Gift Card"}
                            </span>
                            <span className="text-xs">
                              {userPoints < 100 ? "100 points" :
                               userPoints < 300 ? "300 points" :
                               userPoints < 500 ? "500 points" :
                               "1000 points"}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${userPoints < 100 ? (userPoints / 100) * 100 :
                                        userPoints < 300 ? ((userPoints - 100) / 200) * 100 :
                                        userPoints < 500 ? ((userPoints - 300) / 200) * 100 :
                                        ((userPoints - 500) / 500) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {userPoints < 100 ? 100 - userPoints :
                             userPoints < 300 ? 300 - userPoints :
                             userPoints < 500 ? 500 - userPoints :
                             1000 - userPoints} more points needed
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border rounded-lg p-3 text-center">
                            <h4 className="text-sm font-medium mb-1">Recent Activity</h4>
                            <p className="text-xs text-muted-foreground">+25 points for waste classification</p>
                          </div>
                          <div className="border rounded-lg p-3 text-center">
                            <h4 className="text-sm font-medium mb-1">Badges Earned</h4>
                            <p className="text-xs text-muted-foreground">
                              {userPoints < 100 ? "1" : 
                               userPoints < 300 ? "3" : 
                               userPoints < 500 ? "5" : "8"} of 12 badges unlocked
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 text-sm"
                        onClick={() => navigate("/rewards")}
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        View All Rewards
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <section className="animate-enter delay-300">
          <Card className="border-2 hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <CardTitle>NGO Drive</CardTitle>
              <CardDescription>Join upcoming environmental initiatives and volunteer opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              {drivesLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : drivesError ? (
                // Error state
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                  <p className="font-medium">Error loading drives</p>
                  <p className="text-sm">{drivesError}</p>
                </div>
              ) : drives.length === 0 ? (
                // Empty state
                <div className="text-center py-8">
                  <Tent className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No upcoming drives</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no upcoming NGO drives available at the moment.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/ngo-drives")}
                  >
                    View All Drives
                  </Button>
                </div>
              ) : (
                // Drives list
                <div className="space-y-4">
                  {drives.map((drive, index) => (
                    <div 
                      key={drive.id} 
                      className={`p-4 border rounded-lg hover:shadow-md transition-all duration-300 ${
                        index % 2 === 0 
                          ? "bg-gradient-to-r from-green-50 to-blue-50" 
                          : "bg-gradient-to-r from-amber-50 to-orange-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold ${index % 2 === 0 ? "text-primary" : "text-secondary"}`}>
                          {drive.title}
                        </h3>
                        <span className={`text-xs ${
                          index % 2 === 0 
                            ? "bg-primary/20 text-primary" 
                            : "bg-secondary/20 text-secondary"
                        } px-2 py-1 rounded-full`}>
                          {format(new Date(drive.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{drive.time}</span>
                        <span className="mx-2">•</span>
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{drive.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{drive.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {drive.participants_count} volunteers joined
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => navigate(`/ngo-drives?drive=${drive.id}`)}
                        >
                          Register
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  className="text-sm"
                  onClick={() => navigate("/ngo-drives")}
                >
                  View all environmental initiatives
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Fixed nav bar with proper z-index */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 z-50 shadow-lg">
        <div className="container mx-auto">
          <ul className="flex justify-around">
            <NavItem icon={<LucideLeaf />} label="Home" isActive />
            <NavItem icon={<Recycle />} label="Segregate" onClick={() => navigate("/waste-classification")} />
            <NavItem icon={<Trash />} label="Complaint" onClick={() => navigate("/complaint")} />
            <NavItem icon={<MessagesSquare />} label="Forum" onClick={() => navigate("/community-forum")} />
            <NavItem icon={<Users />} label="NGO Drives" onClick={() => navigate("/ngo-drives")} />
            <NavItem icon={<Trophy />} label="Rewards" onClick={() => navigate("/rewards")} />
          </ul>
        </div>
      </nav>
    </div>;
};

const WasteTypeCard = ({
  type,
  color
}: {
  type: string;
  color: string;
}) => {
  return <div className="flex items-center p-3 rounded-md bg-card border border-border hover:shadow-md transition-all duration-300">
      <div className={`w-4 h-4 rounded-full ${color} mr-3`}></div>
      <span>{type}</span>
    </div>;
};

const CollectionItem = ({
  day,
  type,
  time
}: {
  day: string;
  type: string;
  time: string;
}) => {
  return <div className="flex justify-between items-center p-3 border border-border rounded-md hover:shadow-sm transition-all duration-300 hover:bg-muted/30">
      <div>
        <div className="font-medium">{day}</div>
        <div className="text-sm text-muted-foreground">{type}</div>
      </div>
      <div className="text-sm">{time}</div>
    </div>;
};

const NavItem = ({
  icon,
  label,
  isActive = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  return <li>
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 w-16 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs">{label}</span>
    </button>
  </li>;
};

// Define ArrowRight component as a fallback
const ArrowRight = ({ className = "h-4 w-4" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

export default Index;
