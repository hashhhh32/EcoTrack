import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/navbar/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Calendar, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  address: string | null;
  bio: string | null;
  date_of_birth: string | null;
  updated_at: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    full_name: '',
    avatar_url: null,
    phone_number: '',
    address: '',
    bio: '',
    date_of_birth: '',
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setUpdating(true);

      const updates = {
        ...profile,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updates, {
          onConflict: 'id',
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      setProfile({ ...profile, avatar_url: publicUrl });

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-emerald-50/30'>
      <Navbar />
      
      <main className='container mx-auto px-4 py-8 pt-20'>
        <div className='max-w-3xl mx-auto'>
          <Card className='border border-primary/10 shadow-lg'>
            <CardHeader className='bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/5'>
              <CardTitle className='text-2xl text-primary'>Profile Settings</CardTitle>
              <CardDescription>
                Manage your profile information and preferences
              </CardDescription>
            </CardHeader>

            <CardContent className='p-6 space-y-8'>
              {/* Avatar Section */}
              <div className='flex flex-col items-center space-y-4'>
                <div className='relative'>
                  <Avatar className='w-24 h-24 border-4 border-background shadow-xl'>
                    <AvatarImage src={profile.avatar_url || `https://avatar.vercel.sh/${user.email}`} />
                    <AvatarFallback>
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor='avatar-upload'
                    className='absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-colors'
                  >
                    <Camera className='w-4 h-4' />
                    <input
                      id='avatar-upload'
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>
                <div className='text-center'>
                  <h3 className='font-medium'>{profile.full_name || user.email?.split('@')[0]}</h3>
                  <p className='text-sm text-muted-foreground'>{user.email}</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className='grid gap-6'>
                <div className='grid gap-2'>
                  <Label htmlFor='full_name'>Full Name</Label>
                  <div className='relative'>
                    <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='full_name'
                      placeholder='Enter your full name'
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='phone_number'>Phone Number</Label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='phone_number'
                      placeholder='Enter your phone number'
                      value={profile.phone_number || ''}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='address'>Address</Label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='address'
                      placeholder='Enter your address'
                      value={profile.address || ''}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='date_of_birth'>Date of Birth</Label>
                  <div className='relative'>
                    <Calendar className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='date_of_birth'
                      type='date'
                      value={profile.date_of_birth || ''}
                      onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='bio'>Bio</Label>
                  <Textarea
                    id='bio'
                    placeholder='Tell us about yourself'
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className='min-h-[100px]'
                  />
                </div>

                <Button
                  onClick={updateProfile}
                  disabled={updating}
                  className='w-full md:w-auto'
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
