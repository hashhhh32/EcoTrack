import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ChevronDown, ChevronUp, ArrowLeft, X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import ImpactAndMission from "@/components/ImpactAndMission";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type LoginScreenProps = {
  onLogin: () => void;
};

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({
          title: "Account created",
          description: "Please check your email for verification",
        });
      } else {
        await signIn(email, password);
        onLogin();
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // The redirect happens automatically with OAuth
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 opacity-40">
        <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md relative backdrop-blur-sm bg-background/95 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full inline-flex relative">
              {/* Enhanced glowing effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-md animate-pulse"></div>
              <motion.div 
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="h-12 w-12 relative z-10 overflow-hidden rounded-full">
                <img src="/1.png" alt="EcoTrack Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome to EcoTrack
              </CardTitle>
              <CardDescription>Your sustainable waste management companion</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.form 
              onSubmit={handleAuth} 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                <LogIn className="mr-2 h-4 w-4" /> 
                {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline" 
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="mr-2 h-4 w-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                Sign in with Google
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>
                  {isSignUp 
                    ? "Already have an account? " 
                    : "Don't have an account? "}
                  <span 
                    className="text-primary cursor-pointer"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </span>
                </p>
              </div>
            </motion.form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStory(!showStory)}
                className="group relative overflow-hidden hover:bg-primary/5 transition-colors w-full"
              >
                <span className="relative flex items-center gap-2 justify-center">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  {showStory ? "Hide Our Story" : "Discover Our Story"}
                  {showStory ? (
                    <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
                  )}
                </span>
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Story Content */}
      <AnimatePresence>
        {showStory && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto"
          >
            {/* Header with back button */}
            <motion.div 
              className="sticky top-0 w-full bg-background/95 backdrop-blur-sm z-10 border-b"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="container mx-auto max-w-4xl px-4">
                <div className="flex items-center justify-between h-16">
                  <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStory(false)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground group"
                    >
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      <span>Back to Login</span>
                    </Button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStory(false)}
                      className="rounded-full h-8 w-8 p-0 hover:bg-primary/5"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Content container with max width */}
            <motion.div 
              className="container mx-auto max-w-4xl px-4 pb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ImpactAndMission />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
