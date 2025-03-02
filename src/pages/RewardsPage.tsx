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
import { ArrowLeft, Trophy, Star, Award, Gift, User, LogOut } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const RewardsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserPoints = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's total points
        const { data: pointsData, error: pointsError } = await supabase
          .from("user_points")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (pointsError && pointsError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
          console.error("Error fetching user points:", pointsError);
          setError("Failed to load your points data");
        }
        
        // Set points (default to 0 if no record found)
        setUserPoints(pointsData?.total_points || 0);
        
        // Fetch points history
        const { data: historyData, error: historyError } = await supabase
          .from("points_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
          
        if (historyError) {
          console.error("Error fetching points history:", historyError);
          setError("Failed to load your points history");
        }
        
        if (historyData) {
          setPointsHistory(historyData);
        }
      } catch (err) {
        console.error("Unexpected error fetching rewards data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
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

  // Sample rewards data
  const rewardsData = {
    points: 350,
    level: "Level 3: Eco Warrior",
    nextReward: {
      name: "Eco-friendly Water Bottle",
      points: 450,
      progress: 78,
      remaining: 100
    },
    recentActivity: [
      { action: "Waste Classification", points: 25, date: "Today" },
      { action: "Reported Illegal Dumping", points: 50, date: "Yesterday" },
      { action: "Participated in Beach Cleanup", points: 75, date: "Last Week" }
    ],
    badges: [
      { name: "Recycling Rookie", description: "Classified your first waste item", unlocked: true },
      { name: "Cleanup Champion", description: "Participated in a community cleanup", unlocked: true },
      { name: "Waste Warrior", description: "Reported 5 illegal waste dumps", unlocked: true },
      { name: "Tree Hugger", description: "Planted your first tree", unlocked: true },
      { name: "Eco Influencer", description: "Invited 3 friends to join EcoTrack", unlocked: true },
      { name: "Plastic Preventer", description: "Avoided 100 single-use plastics", unlocked: false },
      { name: "Carbon Cutter", description: "Reduced carbon footprint by 50%", unlocked: false },
      { name: "Water Watcher", description: "Saved 1000 liters of water", unlocked: false },
      { name: "Energy Expert", description: "Reduced energy consumption by 30%", unlocked: false },
      { name: "Zero Waste Hero", description: "Achieved zero waste for a month", unlocked: false },
      { name: "Compost King", description: "Composted 50kg of organic waste", unlocked: false },
      { name: "Sustainable Shopper", description: "Made 20 eco-friendly purchases", unlocked: false }
    ],
    availableRewards: [
      { name: "Eco-friendly Pen", points: 200, image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
      { name: "Eco-friendly Water Bottle", points: 450, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
      { name: "$10 Coffee Shop Gift Card", points: 600, image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
      { name: "$25 Eco Store Gift Card", points: 1200, image: "https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" },
      { name: "$50 Sustainable Fashion Voucher", points: 2500, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" }
    ]
  };

  const getUserLevel = (points: number) => {
    if (points < 100) return "Level 1: Beginner";
    if (points < 200) return "Level 2: Intermediate";
    if (points < 300) return "Level 3: Eco Warrior";
    if (points < 400) return "Level 4: Advanced Eco Warrior";
    if (points < 500) return "Level 5: Master Eco Warrior";
    return "Level 6: Eco Legend";
  };

  const getNextReward = (points: number) => {
    if (points < 100) return rewardsData.availableRewards[0];
    if (points < 200) return rewardsData.availableRewards[1];
    if (points < 300) return rewardsData.availableRewards[2];
    if (points < 400) return rewardsData.availableRewards[3];
    return rewardsData.availableRewards[4];
  };

  const getProgressToNextReward = (points: number) => {
    const nextReward = getNextReward(points);
    return (points % nextReward.points) / nextReward.points * 100;
  };

  const getPointsNeeded = (points: number) => {
    const nextReward = getNextReward(points);
    return nextReward.points - (points % nextReward.points);
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
            <h1 className="text-xl font-bold">Rewards & Achievements</h1>
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
                <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                Your Reward Points
              </CardTitle>
              <CardDescription>Track your eco-friendly achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-3xl font-bold text-primary">{userPoints}</h3>
                  <p className="text-sm text-muted-foreground">Total Eco Points</p>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {getUserLevel(userPoints)}
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Next Reward: {getNextReward(userPoints).name}</span>
                  <span className="text-sm">{getNextReward(userPoints).points} points</span>
                </div>
                <Progress value={getProgressToNextReward(userPoints)} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">{getPointsNeeded(userPoints)} more points needed</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="rewards" className="w-full mb-6">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewards">
            <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="mr-2 h-5 w-5 text-primary" />
                  Redeem Your Points
                </CardTitle>
                <CardDescription>Exchange your eco points for sustainable rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewardsData.availableRewards.map((reward, index) => {
                    const isLocked = userPoints < reward.points;
                    const isHighValue = reward.points >= 1200; // High value rewards
                    
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 ${isHighValue && isLocked ? 'opacity-70' : ''}`}
                      >
                        <div className="h-40 overflow-hidden relative">
                          <img 
                            src={reward.image} 
                            alt={reward.name} 
                            className={`w-full h-full object-cover ${isHighValue && isLocked ? 'grayscale' : ''}`}
                          />
                          {isHighValue && isLocked && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                                Premium Reward
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className={`font-medium mb-1 ${isHighValue && isLocked ? 'text-muted-foreground' : ''}`}>
                            {reward.name}
                          </h3>
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-semibold ${isLocked ? 'text-muted-foreground' : 'text-primary'}`}>
                              {reward.points} points
                            </span>
                            <Button 
                              size="sm" 
                              variant={isLocked ? "outline" : "default"}
                              disabled={isLocked}
                              className={isHighValue && isLocked ? 'opacity-50' : ''}
                            >
                              {isLocked ? "Locked" : "Redeem"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your recent eco-friendly actions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-800 rounded-md">
                    <p>{error}</p>
                  </div>
                ) : pointsHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No activity found. Start taking eco-friendly actions to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pointsHistory.map((activity, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/30 transition-all duration-300">
                        <div>
                          <h3 className="font-medium">{activity.action}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()} • {activity.description}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary">+{activity.points} points</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="badges">
            <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  Your Badges
                </CardTitle>
                <CardDescription>Achievements you've unlocked through eco-friendly actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {rewardsData.badges.map((badge, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg ${badge.unlocked ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 opacity-60'}`}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`p-2 rounded-full ${badge.unlocked ? 'bg-primary/20' : 'bg-muted'} mr-2`}>
                          <Award className={`h-4 w-4 ${badge.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <h3 className={`font-medium ${badge.unlocked ? '' : 'text-muted-foreground'}`}>{badge.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      {badge.unlocked ? (
                        <span className="text-xs text-primary mt-2 inline-block">Unlocked</span>
                      ) : (
                        <span className="text-xs text-muted-foreground mt-2 inline-block">Locked</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md mb-20">
          <CardHeader>
            <CardTitle>How to Earn More Points</CardTitle>
            <CardDescription>Complete these actions to increase your eco points</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Classify Waste</span>
                  <p className="text-sm text-muted-foreground">Use our waste classification tool to identify recyclables (+25 points)</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Report Illegal Dumping</span>
                  <p className="text-sm text-muted-foreground">Help keep our environment clean by reporting waste dumps (+50 points)</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Participate in Community Events</span>
                  <p className="text-sm text-muted-foreground">Join beach cleanups, tree planting, and other eco initiatives (+75 points)</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-primary/20 p-1 rounded-full mr-2 mt-0.5">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium">Invite Friends</span>
                  <p className="text-sm text-muted-foreground">Spread the word and invite friends to join EcoTrack (+30 points per friend)</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RewardsPage; 