import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recycle, MapPin, Trophy, AlertTriangle, UserCircle, LogIn, Image, Trash, LogOut, Users, Mail, User, Calendar, Tent, Lightbulb, RotateCcw, Leaf, MessageCircle, MessagesSquare } from "lucide-react";
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
  return <div className="min-h-screen bg-gradient-to-b from-background to-emerald-50/30 flex flex-col">
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 z-0 overflow-hidden">
          {/* Enhanced abstract pattern overlay */}
          <div className="absolute inset-0 opacity-15" 
               style={{ 
                 backgroundImage: 'url("https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")', 
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 filter: 'saturate(1.2) contrast(1.1)'
               }}>
          </div>
          {/* Enhanced geometric shapes with animation */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 p-6">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full relative">
                {/* Glowing effect */}
                <div className="absolute inset-0 rounded-full bg-white/30 blur-md animate-pulse"></div>
                {/* Updated logo with circular mask */}
                <div className="h-10 w-10 relative z-10 overflow-hidden rounded-full">
                  <img src="/1.png" alt="EcoTrack Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">EcoTrack</h1>
                <p className="text-xs text-white/80">Sustainable waste management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="mr-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  Admin Dashboard
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 shadow-glow-sm">
                    {user ? (
                      <Avatar className="h-8 w-8 border border-white/30 ring-2 ring-white/10">
                        <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                        <AvatarFallback className="text-xs text-white bg-primary/50 backdrop-blur-sm">
                          {user.email?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 border border-primary/20 shadow-lg backdrop-blur-sm">
                  {user && (
                    <div className="p-4 pb-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 border border-primary/20 ring-2 ring-primary/10">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                          <AvatarFallback className="bg-primary/10">
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
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                              {userLevel}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-muted/50 rounded-md border border-primary/10">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                            <span className="text-sm font-medium">Eco Points</span>
                          </div>
                          <span className="text-sm font-bold text-primary">{userPoints}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" 
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
                  
                  <DropdownMenuLabel className="text-primary/80">
                    Account Options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/waste-classification")} className="hover:bg-primary/5 cursor-pointer">
                    <Recycle className="h-4 w-4 mr-2 text-primary/70" /> Waste Classification
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ngo-drives")} className="hover:bg-primary/5 cursor-pointer">
                    <Users className="h-4 w-4 mr-2 text-primary/70" /> NGO Drives
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/rewards")} className="hover:bg-primary/5 cursor-pointer">
                    <Trophy className="h-4 w-4 mr-2 text-primary/70" /> Rewards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/complaint")} className="hover:bg-primary/5 cursor-pointer">
                    <AlertTriangle className="h-4 w-4 mr-2 text-primary/70" /> Report Waste
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="hover:bg-primary/5 cursor-pointer">
                    <User className="h-4 w-4 mr-2 text-primary/70" /> Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-50 text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="h-8 bg-gradient-to-b from-primary/10 to-transparent"></div>
      </header>

      <main className="flex-1 container mx-auto p-6 mb-20">
        <section className="mb-10 animate-fade-in">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:shadow-xl transition-all duration-500 border border-emerald-100 group">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-3 text-primary tracking-tight group-hover:translate-x-1 transition-transform">Welcome to EcoTrack</h2>
                <p className="text-muted-foreground mb-5 leading-relaxed">Your partner in sustainable waste management and environmental conservation. Join our community of eco-warriors making a difference.</p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-primary/10 px-4 py-1.5 rounded-full text-sm font-medium text-primary flex items-center shadow-sm hover:shadow-md transition-all hover:bg-primary/15 cursor-default">
                    <Recycle className="h-4 w-4 mr-2" /> Waste Management
                  </div>
                  <div className="bg-secondary/10 px-4 py-1.5 rounded-full text-sm font-medium text-secondary flex items-center shadow-sm hover:shadow-md transition-all hover:bg-secondary/15 cursor-default">
                    <Users className="h-4 w-4 mr-2" /> Community Drives
                  </div>
                  <div className="bg-amber-500/10 px-4 py-1.5 rounded-full text-sm font-medium text-amber-600 flex items-center shadow-sm hover:shadow-md transition-all hover:bg-amber-500/15 cursor-default">
                    <Trophy className="h-4 w-4 mr-2" /> Eco Rewards
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="relative w-56 h-56 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse-slow"></div>
                  <div className="relative h-full w-full flex items-center justify-center">
                    {/* Larger logo with circular mask */}
                    <div className="h-40 w-40 overflow-hidden rounded-full">
                      <img src="/1.png" alt="EcoTrack Logo" className="w-full h-full object-cover animate-float" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10 animate-fade-in animation-delay-200">
          <h2 className="text-2xl font-bold mb-6 text-primary flex items-center">
            <Recycle className="mr-3 h-6 w-6" />
            <span className="relative">
              Sustainable Waste Management
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></span>
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border-0 group">
              <div className="relative h-56 bg-eco-backdrop">
                <img 
                  src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Waste Segregation" 
                  className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-xl font-medium text-white">Waste Segregation</h3>
                  <p className="text-sm text-white/90">Learn proper segregation techniques</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed">
                  Proper waste segregation is crucial for effective recycling. Learn how to separate waste into 
                  recyclables, organic waste, and other categories to minimize environmental impact.
                </p>
                <Button variant="outline" className="mt-5 w-full group border-primary/20 hover:border-primary/50" onClick={() => navigate("/waste-classification")}>
                  <Recycle className="mr-2 h-4 w-4 text-eco-leaf group-hover:text-primary transition-colors" /> 
                  Waste Classification
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border-0 group">
              <div className="relative h-56 bg-eco-backdrop">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Community Forum" 
                  className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-xl font-medium text-white">Community Forum</h3>
                  <p className="text-sm text-white/90">Connect with eco-conscious individuals</p>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed">
                  Join our vibrant community of environmentally conscious individuals. Share ideas, ask questions, 
                  and collaborate on sustainable initiatives to create a greener future together.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-5 w-full group border-primary/20 hover:border-primary/50"
                  onClick={() => navigate("/community-forum")}
                >
                  <MessagesSquare className="mr-2 h-4 w-4 text-blue-500 group-hover:text-primary transition-colors" /> 
                  Join Discussion
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-10 animate-fade-in animation-delay-300">
          <Tabs defaultValue="segregation" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="segregation" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all duration-300">Waste Guide</TabsTrigger>
              <TabsTrigger value="tips" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all duration-300">Eco Tips</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all duration-300">Reports</TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all duration-300">Rewards</TabsTrigger>
            </TabsList>
            <TabsContent value="segregation" className="animate-fade-in">
              <Card className="border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
                  <CardTitle className="flex items-center text-primary">
                    <Recycle className="mr-2 h-5 w-5 text-primary" />
                    Waste Segregation Guide
                  </CardTitle>
                  <CardDescription>Learn how to properly sort your waste for maximum environmental impact</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <WasteTypeCard type="Plastic" color="bg-eco-plastic" />
                    <WasteTypeCard type="Paper" color="bg-eco-paper" />
                    <WasteTypeCard type="Glass" color="bg-eco-glass" />
                    <WasteTypeCard type="Metal" color="bg-eco-metal" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tips" className="animate-fade-in">
              <Card className="border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
                  <CardTitle className="flex items-center text-primary">
                    <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                    Sustainable Waste Management Tips
                  </CardTitle>
                  <CardDescription>Simple practices for reducing your environmental footprint</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 border rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-all duration-300 group">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <RotateCcw className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-center font-medium text-green-800 mb-2">Reduce & Reuse</h3>
                      <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        Choose reusable alternatives to single-use items and reduce overall consumption to minimize waste generation.
                      </p>
                    </div>
                    
                    <div className="p-5 border rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-md transition-all duration-300 group">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Recycle className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="text-center font-medium text-blue-800 mb-2">Proper Recycling</h3>
                      <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        Clean recyclables before disposal and learn which materials are accepted in your local recycling program.
                      </p>
                    </div>
                    
                    <div className="p-5 border rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:shadow-md transition-all duration-300 group">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Leaf className="h-8 w-8 text-amber-600" />
                        </div>
                      </div>
                      <h3 className="text-center font-medium text-amber-800 mb-2">Composting</h3>
                      <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        Turn food scraps and yard waste into nutrient-rich soil through composting to reduce landfill waste.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-5 border rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm">
                    <h4 className="font-medium flex items-center mb-3">
                      <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                      Did You Know?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The average person generates about 4.5 pounds of waste per day. By implementing proper waste management practices, you can reduce this by up to 70%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports" className="animate-fade-in">
              <Card className="border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-red-50 to-transparent border-b border-primary/5">
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Report Waste Dump
                  </CardTitle>
                  <CardDescription>Help us keep our environment clean by reporting illegal waste dumps</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <AlertTriangle className="h-12 w-12 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-2">See illegal dumping?</h3>
                    <p className="text-sm text-center text-muted-foreground mb-6 max-w-md">
                      Take a photo and report illegal waste dumps in your area. Your report will be sent to the authorities for immediate action.
                    </p>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => navigate("/complaint")}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" /> Report Illegal Dumping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rewards" className="animate-fade-in">
              <Card className="border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent border-b border-primary/5">
                  <CardTitle className="flex items-center text-amber-600">
                    <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                    Your Reward Points
                  </CardTitle>
                  <CardDescription>Track your eco-friendly achievements and earn rewards</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!user ? (
                    <div className="text-center py-8">
                      <Trophy className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                      <h3 className="font-medium text-lg mb-2">Sign in to view your rewards</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Track your eco-friendly achievements and earn rewards for your sustainable actions</p>
                      <Button onClick={() => navigate("/login")} className="bg-amber-500 hover:bg-amber-600 text-white">Sign In</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-amber-50 to-transparent rounded-xl border border-amber-100">
                        <div>
                          <h3 className="text-3xl font-bold text-amber-600">{userPoints}</h3>
                          <p className="text-sm text-muted-foreground">Total Eco Points</p>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md">
                          {userLevel}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-xl border border-primary/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              {userPoints < 100 ? "Next Reward: Eco-friendly Pen" :
                               userPoints < 300 ? "Next Reward: Eco-friendly Water Bottle" :
                               userPoints < 500 ? "Next Reward: $10 Coffee Shop Gift Card" :
                               "Next Reward: $25 Eco Store Gift Card"}
                            </span>
                            <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded-full text-primary">
                              {userPoints < 100 ? "100 points" :
                               userPoints < 300 ? "300 points" :
                               userPoints < 500 ? "500 points" :
                               "1000 points"}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                              className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full" 
                              style={{ 
                                width: `${userPoints < 100 ? (userPoints / 100) * 100 :
                                        userPoints < 300 ? ((userPoints - 100) / 200) * 100 :
                                        userPoints < 500 ? ((userPoints - 300) / 200) * 100 :
                                        ((userPoints - 500) / 500) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center">
                            <Trophy className="h-3 w-3 mr-1 text-amber-500" />
                            {userPoints < 100 ? 100 - userPoints :
                             userPoints < 300 ? 300 - userPoints :
                             userPoints < 500 ? 500 - userPoints :
                             1000 - userPoints} more points needed
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-xl p-4 text-center bg-gradient-to-br from-background to-primary/5 hover:shadow-md transition-all duration-300">
                            <h4 className="text-sm font-medium mb-2 text-primary">Recent Activity</h4>
                            <p className="text-xs text-muted-foreground">+25 points for waste classification</p>
                          </div>
                          <div className="border rounded-xl p-4 text-center bg-gradient-to-br from-background to-amber-50 hover:shadow-md transition-all duration-300">
                            <h4 className="text-sm font-medium mb-2 text-amber-600">Badges Earned</h4>
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
                        className="w-full mt-6 text-sm border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        onClick={() => navigate("/rewards")}
                      >
                        <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                        View All Rewards
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <section className="animate-fade-in animation-delay-400">
          <Card className="border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-primary">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    NGO Drives
                  </CardTitle>
                  <CardDescription>Join upcoming environmental initiatives and volunteer opportunities</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-primary/20 hover:border-primary/50"
                  onClick={() => navigate("/ngo-drives")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {drivesLoading ? (
                // Enhanced loading state
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-5 border rounded-xl animate-pulse">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
                        <div className="h-5 bg-gray-200 rounded-full w-1/5"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                        <div className="h-9 bg-gray-200 rounded-md w-1/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : drivesError ? (
                // Enhanced error state
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 flex flex-col items-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
                  <p className="font-medium text-lg mb-1">Error loading drives</p>
                  <p className="text-sm text-center">{drivesError}</p>
                </div>
              ) : drives.length === 0 ? (
                // Enhanced empty state
                <div className="text-center py-12 px-6">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Tent className="h-10 w-10 text-muted-foreground/60" />
                  </div>
                  <h3 className="mt-2 text-xl font-medium text-primary mb-2">No upcoming drives</h3>
                  <p className="mt-1 text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    There are no upcoming NGO drives available at the moment. Check back later or create your own initiative.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-primary/20 hover:border-primary/50"
                    onClick={() => navigate("/ngo-drives")}
                  >
                    View All Drives
                  </Button>
                </div>
              ) : (
                // Enhanced drives list
                <div className="space-y-6">
                  {drives.map((drive, index) => (
                    <div 
                      key={drive.id} 
                      className={`p-5 border rounded-xl hover:shadow-md transition-all duration-300 ${
                        index % 2 === 0 
                          ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-100" 
                          : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100"
                      } group`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold text-lg ${index % 2 === 0 ? "text-primary" : "text-secondary"} group-hover:translate-x-1 transition-transform`}>
                          {drive.title}
                        </h3>
                        <span className={`text-xs ${
                          index % 2 === 0 
                            ? "bg-primary/20 text-primary" 
                            : "bg-secondary/20 text-secondary"
                        } px-3 py-1 rounded-full font-medium`}>
                          {format(new Date(drive.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mb-3 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          <span>{drive.time}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1.5" />
                          <span>{drive.location}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{drive.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-white/50 px-3 py-1 rounded-full text-muted-foreground flex items-center">
                          <Users className="h-3 w-3 mr-1.5" />
                          {drive.participants_count} volunteers joined
                        </span>
                        <Button 
                          variant={index % 2 === 0 ? "default" : "secondary"}
                          size="sm" 
                          className="text-xs shadow-sm"
                          onClick={() => navigate(`/ngo-drives?drive=${drive.id}`)}
                        >
                          Register Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Fixed nav bar with proper z-index */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary/10 py-2 z-50 shadow-lg backdrop-blur-md">
        <div className="container mx-auto">
          <ul className="flex justify-around">
            <NavItem icon={
              <div className="w-8 h-8 overflow-hidden rounded-full">
                <img src="/1.png" alt="EcoTrack Logo" className="w-full h-full object-cover transition-all duration-300" />
              </div>
            } label="Home" isActive />
            <NavItem icon={<Recycle className="transition-all duration-300" />} label="Segregate" onClick={() => navigate("/waste-classification")} />
            <NavItem icon={<Trash className="transition-all duration-300" />} label="Complaint" onClick={() => navigate("/complaint")} />
            <NavItem icon={<MessagesSquare className="transition-all duration-300" />} label="Forum" onClick={() => navigate("/community-forum")} />
            <NavItem icon={<Users className="transition-all duration-300" />} label="NGO Drives" onClick={() => navigate("/ngo-drives")} />
            <NavItem icon={<Trophy className="transition-all duration-300" />} label="Rewards" onClick={() => navigate("/rewards")} />
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
  return <div className="flex items-center p-4 rounded-xl bg-card border border-primary/5 hover:shadow-md transition-all duration-300 hover:bg-primary/5 group">
      <div className={`w-5 h-5 rounded-full ${color} mr-3 group-hover:scale-110 transition-transform`}></div>
      <span className="font-medium">{type}</span>
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
  return <div className="flex justify-between items-center p-4 border border-primary/5 rounded-xl hover:shadow-md transition-all duration-300 hover:bg-muted/30 group">
      <div>
        <div className="font-medium group-hover:text-primary transition-colors">{day}</div>
        <div className="text-sm text-muted-foreground">{type}</div>
      </div>
      <div className="text-sm bg-primary/10 px-3 py-1 rounded-full text-primary">{time}</div>
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
      className={`flex flex-col items-center justify-center p-2 w-16 relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors duration-300`}
    >
      <div className={`mb-1 ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>{icon}</div>
      <span className="text-xs font-medium">{label}</span>
      {isActive && (
        <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
      )}
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
