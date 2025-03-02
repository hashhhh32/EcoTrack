import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Creates a real-time subscription to a Supabase table
 * 
 * @param channelName Unique name for the subscription channel
 * @param table The table to subscribe to
 * @param event The event type to listen for ('INSERT', 'UPDATE', 'DELETE', or '*' for all)
 * @param schema The database schema (default: 'public')
 * @param filter Optional filter string in the format "column=eq.value"
 * @param callback Function to call when an event occurs
 * @returns The subscription channel
 */
export function subscribeToTable<T = any>(
  channelName: string,
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  schema: string = 'public',
  filter?: string,
  callback?: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE', 
    new: T, 
    old: T 
  }) => void
): RealtimeChannel {
  const channel = supabase.channel(channelName);
  
  const subscription = channel.on(
    'postgres_changes' as any,
    {
      event: event,
      schema: schema,
      table: table,
      ...(filter ? { filter } : {})
    },
    (payload: RealtimePostgresChangesPayload<any>) => {
      if (callback) {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T
        });
      }
    }
  ).subscribe();
  
  return subscription;
}

/**
 * Unsubscribes from a real-time channel
 * 
 * @param subscription The subscription channel to unsubscribe from
 */
export function unsubscribe(subscription: RealtimeChannel | null): void {
  if (subscription) {
    subscription.unsubscribe();
  }
}

/**
 * Creates a real-time subscription to the ngo_drives table
 * 
 * @param callback Function to call when an event occurs
 * @returns The subscription channel
 */
export function subscribeToNGODrives<T = any>(
  callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE', 
    new: T, 
    old: T 
  }) => void
): RealtimeChannel {
  return subscribeToTable<T>(
    'ngo-drives-changes',
    'ngo_drives',
    '*',
    'public',
    undefined,
    callback
  );
}

/**
 * Creates a real-time subscription to a user's drive participations
 * 
 * @param userId The user ID to filter by
 * @param callback Function to call when an event occurs
 * @returns The subscription channel
 */
export function subscribeToUserDriveParticipations<T = any>(
  userId: string,
  callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE', 
    new: T, 
    old: T 
  }) => void
): RealtimeChannel {
  return subscribeToTable<T>(
    `user-${userId}-drive-participations`,
    'drive_participants',
    '*',
    'public',
    `user_id=eq.${userId}`,
    callback
  );
} 