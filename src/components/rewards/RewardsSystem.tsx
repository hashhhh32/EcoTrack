import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Gift, 
  ChevronRight, 
  Leaf, 
  TrendingUp, 
  Recycle,
  Calendar,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import AnimatedTransition from '../ui/AnimatedTransition';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const RewardsSystem = () => {
  const [tab, setTab] = useState<'points' | 'redeem'>('points');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState("Eco Beginner");
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch user points and history from database
  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's total points
        const { data: pointsData, error: pointsError } = await supabase
          .from("user_points")
          .select("total_points")
          .eq("user_id", user.id)
          .single();
          
        if (pointsError) {
          if (pointsError.code !== 'PGRST116') { // Not found error
            console.error("Error fetching user points:", pointsError);
          }
          setUserPoints(0);
        } else if (pointsData) {
          setUserPoints(pointsData.total_points);
          
          // Set user level based on points
          if (pointsData.total_points >= 500) {
            setUserLevel("Eco Master");
          } else if (pointsData.total_points >= 300) {
            setUserLevel("Eco Warrior");
          } else if (pointsData.total_points >= 100) {
            setUserLevel("Eco Enthusiast");
          } else {
            setUserLevel("Eco Beginner");
          }
        }
        
        // Fetch points history
        const { data: historyData, error: historyError } = await supabase
          .from("points_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (historyError) {
          console.error("Error fetching points history:", historyError);
        } else if (historyData) {
          setPointsHistory(historyData);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Set up real-time subscription for points updates
    const pointsSubscription = supabase
      .channel('user_points_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_points',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Points changed:', payload);
          if (payload.new) {
            // Add type assertion to fix TypeScript error
            const newData = payload.new as { total_points: number };
            setUserPoints(newData.total_points);
            
            // Update user level based on new points
            if (newData.total_points >= 500) {
              setUserLevel("Eco Master");
            } else if (newData.total_points >= 300) {
              setUserLevel("Eco Warrior");
            } else if (newData.total_points >= 100) {
              setUserLevel("Eco Enthusiast");
            } else {
              setUserLevel("Eco Beginner");
            }
          }
        }
      )
      .subscribe();
      
    // Set up real-time subscription for points history updates
    const historySubscription = supabase
      .channel('points_history_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'points_history',
          filter: `user_id=eq.${user.id}`
        }, 
        async (payload) => {
          console.log('Points history changed:', payload);
          if (payload.new) {
            // Fetch updated history
            const { data } = await supabase
              .from("points_history")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5);
              
            if (data) {
              setPointsHistory(data);
              
              // Show toast notification for new points
              toast({
                title: "Points Earned!",
                description: `You earned ${payload.new.points} points for ${payload.new.action}`,
              });
            }
          }
        }
      )
      .subscribe();
    
    // Cleanup subscriptions on unmount
    return () => {
      pointsSubscription.unsubscribe();
      historySubscription.unsubscribe();
    };
  }, [user, toast]);
  
  // Sample rewards data - this could also come from the database
  const rewardOptions = [
    {
      id: 1,
      title: 'Eco-Friendly Water Bottle',
      description: 'Reusable stainless steel water bottle',
      points: 200,
      available: true,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 2,
      title: '$10 Gift Card',
      description: 'For use at local eco-friendly stores',
      points: 300,
      available: true,
      image: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 3,
      title: 'Organic Cotton Tote Bag',
      description: 'Reusable shopping bag made from organic materials',
      points: 150,
      available: true,
      image: 'https://images.unsplash.com/photo-1593368858664-a1abfe932b09?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 4,
      title: 'Free Composting Starter Kit',
      description: 'Everything you need to start composting at home',
      points: 500,
      available: false,
      image: 'https://images.unsplash.com/photo-1582560475093-ba66accbc095?q=80&w=2519&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
  ];
  
  const redeemReward = async (id: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to redeem rewards",
      });
      return;
    }
    
    const reward = rewardOptions.find(r => r.id === id);
    if (reward) {
      if (userPoints >= reward.points) {
        try {
          // Start a transaction to redeem the reward
          // 1. Deduct points from user_points
          // 2. Add a record to points_history
          // 3. Add a record to rewards_redeemed (if you have such a table)
          
          // Deduct points
          const { error: updateError } = await supabase.rpc('deduct_user_points', {
            user_id_param: user.id,
            points_to_deduct: reward.points
          });
          
          if (updateError) {
            console.error("Error redeeming reward:", updateError);
            toast({
              title: "Error",
              description: "Failed to redeem reward. Please try again.",
              variant: "destructive",
            });
            return;
          }
          
          // Add to points history
          await supabase.from("points_history").insert({
            user_id: user.id,
            points: -reward.points,
            action: `Redeemed ${reward.title}`,
            description: `Redeemed reward: ${reward.title}`
          });
          
          toast({
            title: "Reward Redeemed!",
            description: `You've successfully redeemed ${reward.title}. Check your email for details.`,
          });
        } catch (error) {
          console.error("Error in redeemReward:", error);
          toast({
            title: "Error",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Not Enough Points",
          description: `You need ${reward.points - userPoints} more points to redeem this reward.`,
        });
      }
    }
  };
  
  const renderProgressCircle = () => {
    const nextLevel = userPoints < 100 ? 100 : 
                     userPoints < 300 ? 300 : 
                     userPoints < 500 ? 500 : 1000;
    const currentLevel = userPoints < 100 ? 0 : 
                        userPoints < 300 ? 100 : 
                        userPoints < 500 ? 300 : 500;
    const progress = Math.min(((userPoints - currentLevel) / (nextLevel - currentLevel)) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="relative flex items-center justify-center h-44 w-44">
        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
          <circle
            className="text-muted stroke-current"
            strokeWidth="5"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary stroke-current transition-all duration-500 ease-in-out"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{userPoints}</span>
          <span className="text-sm text-muted-foreground">Points</span>
        </div>
      </div>
    );
  };
  
  // Get user level display text
  const getUserLevelDisplay = () => {
    if (userPoints < 100) return "Eco Beginner";
    if (userPoints < 300) return "Eco Enthusiast";
    if (userPoints < 500) return "Eco Warrior";
    return "Sustainability Master";
  };
  
  // Get next level points
  const getNextLevelPoints = () => {
    if (userPoints < 100) return 100;
    if (userPoints < 300) return 300;
    if (userPoints < 500) return 500;
    return 1000;
  };
  
  // Get points needed for next level
  const getPointsNeeded = () => {
    return getNextLevelPoints() - userPoints;
  };
  
  // Waste segregation guide data
  const wasteCategories = [
    {
      id: 'plastic',
      name: 'Plastic',
      color: 'bg-eco-plastic',
      borderColor: 'border-eco-plastic',
      textColor: 'text-eco-plastic',
      bgColor: 'bg-eco-plastic/20',
      icon: '🧴',
      description: 'Plastics are versatile materials that can take hundreds of years to decompose. Proper recycling reduces pollution and conserves resources.',
      examples: ['Water bottles', 'Food containers', 'Shopping bags', 'Packaging materials', 'Plastic cutlery'],
      doItems: [
        'Rinse containers before recycling',
        'Check for recycling symbols (1-7)',
        'Remove caps and lids (recycle separately)',
        'Flatten to save space'
      ],
      dontItems: [
        'Mix different types of plastics',
        'Recycle items with food residue',
        'Include plastic bags with rigid plastics',
        'Recycle styrofoam with regular plastics'
      ],
      recyclingSymbols: [
        { number: '1', name: 'PET', items: 'Soda bottles, water bottles', recyclability: 'Highly recyclable' },
        { number: '2', name: 'HDPE', items: 'Milk jugs, detergent bottles', recyclability: 'Widely recyclable' },
        { number: '3', name: 'PVC', items: 'Pipes, shower curtains', recyclability: 'Limited recyclability' },
        { number: '4', name: 'LDPE', items: 'Plastic bags, squeeze bottles', recyclability: 'Increasingly recyclable' },
        { number: '5', name: 'PP', items: 'Yogurt containers, bottle caps', recyclability: 'Moderately recyclable' }
      ],
      environmentalImpact: 'Plastic waste is a major contributor to ocean pollution, affecting marine life and ecosystems. Microplastics have been found in drinking water, food, and even human blood.'
    },
    {
      id: 'paper',
      name: 'Paper',
      color: 'bg-eco-paper',
      borderColor: 'border-eco-paper',
      textColor: 'text-eco-paper',
      bgColor: 'bg-eco-paper/20',
      icon: '📄',
      description: 'Paper products are among the most recyclable materials. Recycling paper saves trees, water, and energy while reducing landfill waste.',
      examples: ['Newspapers', 'Magazines', 'Cardboard boxes', 'Office paper', 'Paper bags', 'Envelopes', 'Notebooks', 'Brochures'],
      doItems: [
        'Keep paper clean and dry',
        'Flatten cardboard boxes',
        'Remove plastic windows from envelopes',
        'Separate glossy paper if required',
        'Remove staples and paper clips when possible'
      ],
      dontItems: [
        'Recycle greasy or food-stained paper',
        'Include paper towels or tissues',
        'Mix paper with other materials',
        'Recycle waxed or laminated paper',
        'Include thermal receipt paper with regular paper'
      ],
      paperTypes: [
        { type: 'Cardboard', recyclability: 'Highly recyclable', notes: 'Flatten to save space' },
        { type: 'Newspaper', recyclability: 'Highly recyclable', notes: 'Keep dry and clean' },
        { type: 'Office Paper', recyclability: 'Highly recyclable', notes: 'Remove staples if possible' },
        { type: 'Glossy Magazines', recyclability: 'Recyclable', notes: 'May need to be separated in some areas' }
      ],
      environmentalImpact: 'Recycling one ton of paper saves approximately 17 trees, 7,000 gallons of water, and 463 gallons of oil. It also reduces greenhouse gas emissions compared to producing new paper.'
    },
    {
      id: 'glass',
      name: 'Glass',
      color: 'bg-eco-glass',
      borderColor: 'border-eco-glass',
      textColor: 'text-eco-glass',
      bgColor: 'bg-eco-glass/20',
      icon: '🥛',
      description: 'Glass is 100% recyclable and can be recycled endlessly without loss in quality or purity. Recycling glass reduces landfill waste and saves energy.',
      examples: ['Bottles', 'Jars', 'Glass containers', 'Beverage glasses', 'Food jars', 'Wine bottles', 'Beer bottles', 'Sauce jars'],
      doItems: [
        'Rinse thoroughly to remove residue',
        'Remove lids and caps (recycle separately)',
        'Sort by color if required locally',
        'Keep intact when possible',
        'Remove labels if your program requires it'
      ],
      dontItems: [
        'Mix with ceramics or porcelain',
        'Include light bulbs or window glass',
        'Recycle broken glass without proper containment',
        'Include mirrors or tempered glass',
        'Mix different colored glass if separation is required'
      ],
      glassColors: [
        { color: 'Clear', uses: 'Food jars, beverage bottles', notes: 'Most versatile for recycling' },
        { color: 'Green', uses: 'Wine bottles, some beverage bottles', notes: 'Commonly recycled' },
        { color: 'Brown/Amber', uses: 'Beer bottles, medicine bottles', notes: 'Protects contents from light damage' }
      ],
      environmentalImpact: 'Recycling glass reduces the need for raw materials, lowers energy consumption in manufacturing, and decreases CO2 emissions. Glass in landfills never decomposes.'
    },
    {
      id: 'metal',
      name: 'Metal',
      color: 'bg-eco-metal',
      borderColor: 'border-eco-metal',
      textColor: 'text-eco-metal',
      bgColor: 'bg-eco-metal/20',
      icon: '🥫',
      description: 'Metals are valuable recyclables that can be reprocessed indefinitely. Recycling metals conserves natural resources and reduces energy consumption.',
      examples: ['Aluminum cans', 'Food tins', 'Metal bottle caps', 'Foil', 'Metal containers', 'Steel cans', 'Aerosol cans (empty)', 'Metal lids'],
      doItems: [
        'Rinse food residue thoroughly',
        'Crush cans to save space',
        'Remove paper labels when possible',
        'Separate different types of metals',
        'Make sure aerosol cans are completely empty'
      ],
      dontItems: [
        'Include aerosol cans with contents',
        'Mix with non-metal materials',
        'Recycle items with hazardous residue',
        'Include electronics with regular metals',
        'Recycle pressurized containers that aren\'t empty'
      ],
      metalTypes: [
        { type: 'Aluminum', examples: 'Beverage cans, foil', notes: 'Highly valuable for recycling' },
        { type: 'Steel/Tin', examples: 'Food cans, soup cans', notes: 'Magnetic and widely recycled' },
        { type: 'Copper', examples: 'Wiring, pipes', notes: 'High value, take to scrap yards' },
        { type: 'Mixed/Other', examples: 'Bottle caps, metal lids', notes: 'Collect small items together' }
      ],
      environmentalImpact: 'Recycling aluminum uses 95% less energy than producing new aluminum from raw materials. Metal recycling significantly reduces mining impacts and greenhouse gas emissions.'
    },
    {
      id: 'organic',
      name: 'Organic',
      color: 'bg-amber-500',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-500/20',
      icon: '🍎',
      description: 'Organic waste can be composted to create nutrient-rich soil. Composting reduces methane emissions from landfills and returns nutrients to the earth.',
      examples: ['Food scraps', 'Yard waste', 'Coffee grounds', 'Eggshells', 'Plant trimmings', 'Fruit peels', 'Vegetable scraps', 'Tea bags'],
      doItems: [
        'Chop larger items for faster decomposition',
        'Mix green (nitrogen-rich) and brown (carbon-rich) materials',
        'Keep compost moist but not soggy',
        'Turn compost regularly for aeration',
        'Include a variety of materials for balanced nutrients'
      ],
      dontItems: [
        'Include meat or dairy in home composting',
        'Add diseased plants to compost',
        'Include pet waste in food compost',
        'Add glossy or colored paper',
        'Include oils, fats, or greasy foods'
      ],
      compostTypes: [
        { type: 'Greens (Nitrogen-rich)', examples: 'Fresh grass clippings, food scraps, coffee grounds', notes: 'Provides protein for microorganisms' },
        { type: 'Browns (Carbon-rich)', examples: 'Dry leaves, cardboard, newspaper, wood chips', notes: 'Provides energy for microorganisms' }
      ],
      environmentalImpact: 'When organic waste decomposes in landfills, it produces methane, a potent greenhouse gas. Composting prevents these emissions while creating valuable soil amendments that reduce the need for chemical fertilizers.'
    }
  ];
  
  // State for selected waste category
  const [selectedWasteCategory, setSelectedWasteCategory] = useState<string | null>(null);
  
  return (
    <div className="pt-20 pb-20 md:pb-6 px-4 min-h-screen bg-eco-backdrop">
      <AnimatedTransition animation="slide-down">
        <div className="mb-8 relative">
          {/* Background decorative elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-5 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
          
          {/* Header content with enhanced styling */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Rewards Dashboard
                  </h1>
                </div>
                <p className="text-muted-foreground">Track your eco-friendly achievements and redeem exciting rewards</p>
              </div>
              
              <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg">
                <div className="p-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Points</p>
                  <p className="text-xl font-bold text-primary">{userPoints}</p>
                </div>
              </div>
            </div>
            
            {/* Level indicator */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Level: {userLevel}</span>
                <span className="text-xs text-muted-foreground">{getPointsNeeded()} points to next level</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" 
                  style={{ 
                    width: `${userPoints < 100 ? (userPoints / 100) * 100 :
                           userPoints < 300 ? ((userPoints - 100) / 200) * 100 :
                           userPoints < 500 ? ((userPoints - 300) / 200) * 100 :
                           ((userPoints - 500) / 500) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedTransition>
      
      <AnimatedTransition animation="fade-in" delay={100}>
        <div className="flex mb-6 bg-muted/50 rounded-lg p-1">
          <button
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'points' 
                ? 'bg-white shadow-sm' 
                : 'hover:bg-white/50'
            }`}
            onClick={() => setTab('points')}
          >
            <Leaf className="w-4 h-4 inline-block mr-2" />
            My Points
          </button>
          <button
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'redeem' 
                ? 'bg-white shadow-sm' 
                : 'hover:bg-white/50'
            }`}
            onClick={() => setTab('redeem')}
          >
            <Gift className="w-4 h-4 inline-block mr-2" />
            Redeem Rewards
          </button>
        </div>
      </AnimatedTransition>
      
      {/* Add new tab for waste segregation guide */}
      <AnimatedTransition animation="fade-in" delay={150}>
        <div className="mb-8 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center">
              <Recycle className="mr-2 h-5 w-5 text-primary" />
              Waste Segregation Guide
            </h2>
            <p className="text-sm text-muted-foreground">
              Proper waste segregation is crucial for effective recycling and environmental conservation
            </p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {wasteCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedWasteCategory(
                    selectedWasteCategory === category.id ? null : category.id
                  )}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    selectedWasteCategory === category.id 
                      ? `${category.bgColor} border-2 ${category.borderColor} shadow-md` 
                      : 'bg-muted/50 hover:bg-muted border border-border'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className="text-2xl mb-2">{category.icon}</span>
                    <span className={`font-medium ${
                      selectedWasteCategory === category.id ? category.textColor : ''
                    }`}>
                      {category.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {selectedWasteCategory && (
              <AnimatedTransition animation="slide-up">
                {wasteCategories
                  .filter(category => category.id === selectedWasteCategory)
                  .map(category => (
                    <div 
                      key={category.id} 
                      className={`border-2 ${category.borderColor} rounded-lg overflow-hidden shadow-lg`}
                    >
                      <div className={`${category.bgColor} p-6`}>
                        <div className="flex items-center mb-3">
                          <span className="text-3xl mr-4">{category.icon}</span>
                          <h3 className={`text-2xl font-bold ${category.textColor}`}>
                            {category.name} Waste
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {category.description}
                        </p>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 uppercase tracking-wider">Common Examples:</h4>
                          <div className="flex flex-wrap gap-2">
                            {category.examples.map((example, i) => (
                              <span 
                                key={i} 
                                className="bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs shadow-sm"
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Environmental Impact Section */}
                        <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe mr-2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            Environmental Impact
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {category.environmentalImpact}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <h4 className="text-sm font-medium flex items-center text-green-600 mb-3">
                              <div className="p-1 bg-green-100 rounded-full mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              DO's
                            </h4>
                            <ul className="space-y-2">
                              {category.doItems.map((item, i) => (
                                <li key={i} className="flex items-start">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-green-500 mr-2 mt-0.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                  <span className="text-sm">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                            <h4 className="text-sm font-medium flex items-center text-red-600 mb-3">
                              <div className="p-1 bg-red-100 rounded-full mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </div>
                              DON'Ts
                            </h4>
                            <ul className="space-y-2">
                              {category.dontItems.map((item, i) => (
                                <li key={i} className="flex items-start">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x text-red-500 mr-2 mt-0.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                  <span className="text-sm">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {/* Additional Information Section */}
                        {category.id === 'plastic' && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-medium flex items-center mb-3 text-blue-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info mr-2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                              </svg>
                              Plastic Recycling Symbols
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {category.recyclingSymbols.map((symbol, i) => (
                                <div key={i} className="bg-white p-2 rounded border border-blue-50 text-xs">
                                  <div className="font-semibold mb-1">#{symbol.number} - {symbol.name}</div>
                                  <div><span className="text-muted-foreground">Examples:</span> {symbol.items}</div>
                                  <div><span className="text-muted-foreground">Recyclability:</span> {symbol.recyclability}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {category.id === 'paper' && (
                          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                            <h4 className="text-sm font-medium flex items-center mb-3 text-yellow-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file mr-2">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                              Paper Types & Recyclability
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {category.paperTypes.map((type, i) => (
                                <div key={i} className="bg-white p-2 rounded border border-yellow-50 text-xs">
                                  <div className="font-semibold mb-1">{type.type}</div>
                                  <div><span className="text-muted-foreground">Recyclability:</span> {type.recyclability}</div>
                                  <div><span className="text-muted-foreground">Notes:</span> {type.notes}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {category.id === 'glass' && (
                          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                            <h4 className="text-sm font-medium flex items-center mb-3 text-teal-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wine mr-2">
                                <path d="M8 22h8"></path>
                                <path d="M7 10h10"></path>
                                <path d="M12 15v7"></path>
                                <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"></path>
                              </svg>
                              Glass Colors & Uses
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {category.glassColors.map((glassColor, i) => (
                                <div key={i} className="bg-white p-2 rounded border border-teal-50 text-xs">
                                  <div className="font-semibold mb-1">{glassColor.color}</div>
                                  <div><span className="text-muted-foreground">Uses:</span> {glassColor.uses}</div>
                                  <div><span className="text-muted-foreground">Notes:</span> {glassColor.notes}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {category.id === 'metal' && (
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium flex items-center mb-3 text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hammer mr-2">
                                <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"></path>
                                <path d="M17.64 15 22 10.64"></path>
                                <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"></path>
                              </svg>
                              Metal Types & Recyclability
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {category.metalTypes.map((type, i) => (
                                <div key={i} className="bg-white p-2 rounded border border-gray-100 text-xs">
                                  <div className="font-semibold mb-1">{type.type}</div>
                                  <div><span className="text-muted-foreground">Examples:</span> {type.examples}</div>
                                  <div><span className="text-muted-foreground">Notes:</span> {type.notes}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {category.id === 'organic' && (
                          <div className="mt-6 p-4 bg-lime-50 rounded-lg border border-lime-100">
                            <h4 className="text-sm font-medium flex items-center mb-3 text-lime-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sprout mr-2">
                                <path d="M7 20h10"></path>
                                <path d="M10 20c5.5-2.5.8-6.4 3-10"></path>
                                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path>
                                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path>
                              </svg>
                              Compost Material Types
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {category.compostTypes.map((type, i) => (
                                <div key={i} className="bg-white p-2 rounded border border-lime-50 text-xs">
                                  <div className="font-semibold mb-1">{type.type}</div>
                                  <div><span className="text-muted-foreground">Examples:</span> {type.examples}</div>
                                  <div><span className="text-muted-foreground">Notes:</span> {type.notes}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <h4 className="text-sm font-medium flex items-center mb-2 text-purple-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb mr-2">
                              <line x1="9" y1="18" x2="15" y2="18"></line>
                              <line x1="10" y1="22" x2="14" y2="22"></line>
                              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
                            </svg>
                            Pro Tip
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {(() => {
                              switch(category.id) {
                                case 'plastic':
                                  return 'Look for the recycling number (1-7) on plastic items to identify the type of plastic and its recyclability in your area. Consider using a reusable water bottle instead of disposable plastic bottles to reduce waste significantly.';
                                case 'paper':
                                  return 'Shred sensitive documents before recycling, but check if your local facility accepts shredded paper, as it may require special handling. Consider using digital documents when possible to reduce paper consumption altogether.';
                                case 'glass':
                                  return 'Some recycling programs require separating glass by color (clear, green, brown) to maintain quality in the recycling process. Glass can be recycled indefinitely without loss of quality, making it one of the most sustainable packaging materials.';
                                case 'metal':
                                  return 'Small metal items like bottle caps can be collected in a larger metal container like a tin can so they don\'t get lost in the recycling process. The energy saved by recycling one aluminum can is enough to run a TV for three hours!';
                                case 'organic':
                                  return 'Start with a small compost bin in your kitchen for food scraps, then transfer to a larger outdoor compost pile or bin regularly. A balanced compost needs both "green" (nitrogen-rich) and "brown" (carbon-rich) materials in roughly equal amounts.';
                                default:
                                  return '';
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </AnimatedTransition>
            )}
            
            {!selectedWasteCategory && (
              <div className="text-center p-6 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/30">
                <Recycle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">Select a waste category</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any category above to view detailed segregation guidelines
                </p>
              </div>
            )}
          </div>
        </div>
      </AnimatedTransition>
      
      {tab === 'points' && (
        <AnimatedTransition animation="slide-up">
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-border p-5 flex flex-col items-center">
              {renderProgressCircle()}
              
              <div className="mt-4 text-center">
                <h3 className="font-medium">Level: {getUserLevelDisplay()}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPointsNeeded()} more points to reach {userPoints < 100 ? "Eco Enthusiast" : 
                                                          userPoints < 300 ? "Eco Warrior" : 
                                                          userPoints < 500 ? "Sustainability Master" : 
                                                          "Eco Legend"}
                </p>
              </div>
              
              <div className="w-full mt-6 flex justify-around">
                <div className="text-center">
                  <div className="flex items-center justify-center p-2 rounded-full bg-eco-leaf/10 mb-2 mx-auto">
                    <TrendingUp className="w-5 h-5 text-eco-leaf" />
                  </div>
                  <span className="text-sm font-medium">{Math.min(Math.round(userPoints / 5), 100)}%</span>
                  <p className="text-xs text-muted-foreground">Recycling Rate</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center p-2 rounded-full bg-eco-leaf/10 mb-2 mx-auto">
                    <Calendar className="w-5 h-5 text-eco-leaf" />
                  </div>
                  <span className="text-sm font-medium">{Math.max(1, Math.floor(userPoints / 30))}</span>
                  <p className="text-xs text-muted-foreground">Weeks Active</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center p-2 rounded-full bg-eco-leaf/10 mb-2 mx-auto">
                    <Recycle className="w-5 h-5 text-eco-leaf" />
                  </div>
                  <span className="text-sm font-medium">{Math.max(1, Math.floor(userPoints / 25))}</span>
                  <p className="text-xs text-muted-foreground">Actions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Points History</h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading your points history...</p>
                </div>
              ) : pointsHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Leaf className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <h3 className="font-medium">No points history yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start taking eco-friendly actions to earn points!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pointsHistory.map((item, index) => (
                    <AnimatedTransition
                      key={item.id}
                      animation="fade-in"
                      delay={200 + index * 50}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-eco-leaf/10 rounded-full mr-3">
                            <Recycle className="w-5 h-5 text-eco-leaf" />
                          </div>
                          <div>
                            <h4 className="font-medium">{item.action}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${item.points >= 0 ? 'text-eco-leaf' : 'text-red-500'}`}>
                          {item.points >= 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>
                    </AnimatedTransition>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedTransition>
      )}
      
      {tab === 'redeem' && (
        <AnimatedTransition animation="slide-up">
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-border p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Award className="w-6 h-6 text-eco-leaf mr-3" />
                <div>
                  <h3 className="font-medium">Your Points</h3>
                  <p className="text-sm text-muted-foreground">Available to redeem</p>
                </div>
              </div>
              <span className="text-2xl font-semibold">{userPoints}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewardOptions.map((reward, index) => (
                <AnimatedTransition
                  key={reward.id}
                  animation="scale-up"
                  delay={150 + index * 50}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-border">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={reward.image} 
                        alt={reward.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{reward.title}</h3>
                        <span className="bg-eco-leaf/10 text-eco-leafDark px-2.5 py-1 rounded-full text-sm">
                          {reward.points} pts
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {reward.description}
                      </p>
                      
                      <button
                        disabled={!reward.available || userPoints < reward.points}
                        onClick={() => redeemReward(reward.id)}
                        className={`w-full py-2 rounded-lg flex items-center justify-center ${
                          !reward.available || userPoints < reward.points
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {!reward.available 
                          ? 'Out of Stock' 
                          : userPoints < reward.points 
                            ? `Need ${reward.points - userPoints} more points` 
                            : 'Redeem Reward'}
                      </button>
                    </div>
                  </div>
                </AnimatedTransition>
              ))}
            </div>
            
            <AnimatedTransition animation="slide-up" delay={350}>
              <div className="bg-eco-leaf/10 rounded-xl p-4 border border-eco-leaf/20">
                <div className="flex items-start">
                  <ShoppingBag className="w-5 h-5 mr-3 text-eco-leafDark mt-0.5" />
                  <div>
                    <h3 className="font-medium">More rewards available in our eco-store</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Visit our partner eco-stores to discover more sustainable rewards and products.
                    </p>
                    <a 
                      href="#" 
                      className="mt-2 inline-flex items-center text-sm text-eco-leafDark hover:underline"
                    >
                      Visit Eco Store
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedTransition>
          </div>
        </AnimatedTransition>
      )}
    </div>
  );
};

export default RewardsSystem;
