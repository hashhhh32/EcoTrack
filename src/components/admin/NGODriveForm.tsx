import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Define the form schema using Zod
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, { message: "Please enter a time" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  organizer: z.string().min(2, { message: "Organizer name is required" }),
  contact_email: z.string().email({ message: "Invalid email address" }),
  contact_phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  image_url: z.string().optional(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"], {
    required_error: "Please select a status",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type NGODriveFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driveToEdit?: {
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
  } | null;
  onSuccess: () => void;
};

export function NGODriveForm({ open, onOpenChange, driveToEdit, onSuccess }: NGODriveFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      time: "10:00 AM - 01:00 PM",
      location: "",
      organizer: "",
      contact_email: "",
      contact_phone: "",
      image_url: "",
      status: "upcoming",
    },
  });

  // Update form values when editing an existing drive
  useEffect(() => {
    if (driveToEdit) {
      form.reset({
        title: driveToEdit.title,
        description: driveToEdit.description,
        date: new Date(driveToEdit.date),
        time: driveToEdit.time,
        location: driveToEdit.location,
        organizer: driveToEdit.organizer,
        contact_email: driveToEdit.contact_email,
        contact_phone: driveToEdit.contact_phone,
        image_url: driveToEdit.image_url || "",
        status: driveToEdit.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        date: new Date(),
        time: "10:00 AM - 01:00 PM",
        location: "",
        organizer: "",
        contact_email: "",
        contact_phone: "",
        image_url: "",
        status: "upcoming",
      });
    }
  }, [driveToEdit, form]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Format the date to ISO string for database storage
      const formattedDate = format(data.date, "yyyy-MM-dd");
      
      if (driveToEdit) {
        // Update existing drive
        const { error } = await supabase
          .from("ngo_drives")
          .update({
            title: data.title,
            description: data.description,
            date: formattedDate,
            time: data.time,
            location: data.location,
            organizer: data.organizer,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            image_url: data.image_url || null,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", driveToEdit.id);

        if (error) throw error;
        
        toast({
          title: "Drive updated",
          description: "The NGO drive has been updated successfully.",
        });
      } else {
        // Create new drive
        const { error } = await supabase.from("ngo_drives").insert({
          title: data.title,
          description: data.description,
          date: formattedDate,
          time: data.time,
          location: data.location,
          organizer: data.organizer,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          image_url: data.image_url || null,
          status: data.status,
          created_at: new Date().toISOString(),
          participants_count: 0, // New drives start with 0 participants
        });

        if (error) throw error;
        
        toast({
          title: "Drive created",
          description: "The NGO drive has been created successfully.",
        });
      }
      
      // Close the dialog and refresh the data
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving NGO drive:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save the NGO drive. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{driveToEdit ? "Edit NGO Drive" : "Create New NGO Drive"}</DialogTitle>
          <DialogDescription>
            {driveToEdit 
              ? "Update the details of this environmental drive or initiative." 
              : "Add a new environmental drive or initiative to the platform."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Beach Cleanup Drive" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the environmental drive or initiative.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Join us for a community beach cleanup event. Help remove plastic waste from our shores and protect marine life."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the drive, its goals, and what participants can expect.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date when the drive will take place.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input placeholder="10:00 AM - 01:00 PM" {...field} />
                    </FormControl>
                    <FormDescription>
                      The time duration of the drive.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Sunset Beach, Main Street" {...field} />
                  </FormControl>
                  <FormDescription>
                    The physical location where the drive will take place.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer</FormLabel>
                    <FormControl>
                      <Input placeholder="Ocean Guardians" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the NGO or organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The current status of the drive.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Email address for inquiries.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormDescription>
                      Phone number for inquiries.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    URL to an image representing the drive (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : driveToEdit ? "Update Drive" : "Create Drive"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 