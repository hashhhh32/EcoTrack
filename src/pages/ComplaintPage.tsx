import React, { useState, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Image as ImageIcon, Upload, CheckCircle2, Loader, MapPin, User } from "lucide-react";
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

const ComplaintPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [imageCapturing, setImageCapturing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check location services on mount
  useEffect(() => {
    // Check if location services are available
    if (navigator.geolocation) {
      setLocationStatus("Location services available");
    } else {
      setLocationStatus("Location services not available");
    }
  }, []);

  // Check for resolved complaints and show notifications
  useEffect(() => {
    if (!user) return;
    
    const checkResolvedComplaints = async () => {
      try {
        // Fetch recently resolved complaints for this user that have points awarded
        const { data, error } = await supabase
          .from("complaints")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "resolved")
          .is("notification_shown", null) // Only get complaints where notification hasn't been shown
          .order("resolved_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching resolved complaints:", error);
          return;
        }
        
        // Show notifications for resolved complaints
        if (data && data.length > 0) {
          data.forEach(async (complaint) => {
            if (complaint.points_awarded) {
              toast({
                title: "Complaint Resolved! 🎉",
                description: `Your complaint has been resolved and you've earned ${complaint.points_awarded} eco points!`,
                duration: 10000,
              });
              
              // Mark notification as shown
              await supabase
                .from("complaints")
                .update({ notification_shown: true })
                .eq("id", complaint.id);
            }
          });
        }
      } catch (err) {
        console.error("Error checking resolved complaints:", err);
      }
    };
    
    checkResolvedComplaints();
    
    // Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(checkResolvedComplaints, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, toast]);

  const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by your browser.");
      }
      
      const locationTimeout = setTimeout(() => {
        reject("Location request timed out. Please check that location services are enabled in your browser settings and try again.");
      }, 20000); // Increased to 20 second timeout
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          clearTimeout(locationTimeout);
          let errorMessage = "Unknown location error";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location services for this site in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please try again later or check your device's GPS.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please check your internet connection and try again.";
              break;
          }
          
          reject(errorMessage);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000, // Increased timeout to match the Promise timeout
          maximumAge: 0
        }
      );
    });
  };

  const startCamera = async () => {
    setImageCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera error",
        description: "Unable to access your camera. Please check permissions.",
        variant: "destructive",
      });
      setImageCapturing(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Draw video frame on canvas
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Get image data as base64 string
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setImagePreview(imageData);
        
        // Stop camera
        stopCamera();
        setImageCapturing(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setImageCapturing(false);
  };

  // Function to help users open their browser location settings
  const openLocationSettings = () => {
    // Different browsers have different ways to access location settings
    // This is a best-effort approach to guide users
    let helpMessage = "";
    
    // Detect browser
    const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
    const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
    const isSafari = navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") === -1;
    const isEdge = navigator.userAgent.indexOf("Edg") > -1;
    
    if (isChrome) {
      helpMessage = "For Chrome: Click the lock icon in the address bar → Site settings → Location → Allow";
    } else if (isFirefox) {
      helpMessage = "For Firefox: Click the lock icon in the address bar → Connection secure → More information → Permissions → Access Your Location → Allow";
    } else if (isSafari) {
      helpMessage = "For Safari: Go to Settings → Safari → Location → Enable Location Services";
    } else if (isEdge) {
      helpMessage = "For Edge: Click the lock icon in the address bar → Site permissions → Location → Allow";
    } else {
      helpMessage = "Please check your browser settings to enable location services for this site.";
    }
    
    toast({
      title: "How to enable location",
      description: helpMessage,
      duration: 10000, // Show for longer
    });
  };

  const checkLocation = async (): Promise<boolean> => {
    try {
      // Try to get location before proceeding
      await getUserLocation();
      return true;
    } catch (locationError) {
      console.error("Location check error:", locationError);
      
      // Provide more specific guidance based on the error message
      let description = locationError.toString();
      let title = "Location required";
      let showHelp = false;
      
      if (description.includes("timed out")) {
        description = "Location request timed out. Please ensure location services are enabled in your browser settings and try again. On most devices, you can enable location in your browser settings or device settings.";
        title = "Location Timeout";
        showHelp = true;
      } else if (description.includes("permission denied")) {
        description = "You've denied location access. Please enable location services for this site in your browser settings and refresh the page to try again.";
        title = "Location Permission Denied";
        showHelp = true;
      }
      
      toast({
        title: title,
        description: description,
        variant: "destructive",
        action: showHelp ? (
          <Button variant="outline" size="sm" onClick={openLocationSettings}>
            Show Help
          </Button>
        ) : undefined,
      });
      return false;
    }
  };

  const uploadComplaint = async () => { 
    if (!imagePreview) {
      toast({
        title: "Image required",
        description: "Please take a photo of the waste dump",
        variant: "destructive",
      });
      return;
    }
  
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide details about the waste dump",
        variant: "destructive",
      });
      return;
    }
  
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a complaint",
        variant: "destructive",
      });
      return;
    }
    
    // Check location before proceeding
    const locationAvailable = await checkLocation();
    if (!locationAvailable) {
      return;
    }
  
    setSubmitting(true);
  
    try {
      // Get user location - this should succeed since we checked earlier
      const location = await getUserLocation();
      console.log("User Location:", location);
  
      const timestamp = new Date().toISOString(); // Capture timestamp
  
      const dataURLtoBlob = (dataUrl: string) => {
        const arr = dataUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };
  
      const blob = dataURLtoBlob(imagePreview);
      const file = new File([blob], `complaint_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
  
      setImageUploading(true);
      const { data: fileData, error: uploadError } = await supabase.storage
        .from("complaint_images")
        .upload(`${user.id}/${Date.now()}.jpg`, file);
  
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }
  
      const { data: publicUrlData } = supabase.storage
        .from("complaint_images")
        .getPublicUrl(fileData.path);
  
      const { error: insertError } = await supabase.from("complaints").insert({
        user_id: user.id,
        image_url: publicUrlData.publicUrl,
        description: description,
        timestamp: timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
      });
  
      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Error saving complaint details: ${insertError.message}`);
      }
  
      toast({
        title: "Complaint submitted",
        description: "Thank you for reporting this issue. We'll look into it.",
        variant: "default",
      });
  
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Submission failed",
        description: `There was an error submitting your complaint: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setImageUploading(false);
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
            <h1 className="text-xl font-bold">Report Waste Dump</h1>
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
        <Card className="mb-6 border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="mr-2 h-5 w-5 text-primary" />
              Upload Evidence
            </CardTitle>
            <CardDescription>
              Take a photo of the illegal waste dump
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imageCapturing ? (
              <div className="relative">
                <video 
                  ref={videoRef} 
                  className="w-full h-64 object-cover rounded-md border border-border"
                  autoPlay
                  playsInline
                ></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button 
                    onClick={captureImage}
                    className="rounded-full w-14 h-14 p-0"
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Captured" 
                  className="w-full h-64 object-contain rounded-md border border-border"
                />
                <div className="absolute bottom-2 right-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setImagePreview(null);
                      startCamera();
                    }}
                    className="bg-white/80 backdrop-blur-sm"
                  >
                    <Camera className="mr-2 h-4 w-4" /> Retake
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-64 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={startCamera}
              >
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Tap to take a photo <br />
                  <span className="text-sm">Use camera to capture evidence of illegal dumping</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5 text-primary" />
              Complaint Details
            </CardTitle>
            <CardDescription>
              Provide information about the waste dump
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Describe the location and details of the illegal waste dump. Include information about the type of waste, approximate size, and any other relevant details."
              className="min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 flex items-start">
              <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Location Required:</p>
                <p>Your device location is necessary to process this complaint. Please ensure location services are enabled when submitting.</p>
                <p className="mt-1 text-xs">If you encounter location errors, try refreshing the page or check your browser settings.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={uploadComplaint} 
              disabled={!imagePreview || !description.trim() || submitting || imageUploading}
              className="w-full"
            >
              {submitting || imageUploading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {imageUploading ? "Uploading image..." : "Submitting..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit Complaint
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-md">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Your complaint will be reviewed by our team</li>
              <li>Local authorities will be notified if necessary</li>
              <li>Clean-up teams may be dispatched to the location</li>
              <li>You'll receive updates on the status of your complaint</li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ComplaintPage;