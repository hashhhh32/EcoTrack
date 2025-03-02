# NGO Drives Database Setup

This directory contains SQL scripts for setting up the database tables and functions required for the NGO Drives feature.

## Tables

1. **ngo_drives** - Stores information about environmental drives and initiatives
2. **drive_participants** - Tracks user participation in drives

## Functions

1. **increment_drive_participants** - Increments the participant count for a drive
2. **decrement_drive_participants** - Decrements the participant count for a drive

## Setup Instructions

### Using Supabase UI

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `drive_functions.sql`
4. Paste into the SQL Editor and run the script

### Using Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push -f sql/drive_functions.sql
```

## Database Schema

### ngo_drives

| Column             | Type                     | Description                                |
|--------------------|--------------------------|-------------------------------------------|
| id                 | UUID                     | Primary key                               |
| title              | TEXT                     | Title of the drive                        |
| description        | TEXT                     | Detailed description                      |
| date               | DATE                     | Date of the drive                         |
| time               | TEXT                     | Time/duration (e.g., "10:00 AM - 2:00 PM")|
| location           | TEXT                     | Physical location                         |
| organizer          | TEXT                     | Name of the organizing NGO                |
| contact_email      | TEXT                     | Contact email                             |
| contact_phone      | TEXT                     | Contact phone number                      |
| image_url          | TEXT                     | URL to an image (optional)                |
| status             | TEXT                     | Status: upcoming, ongoing, completed, cancelled |
| created_at         | TIMESTAMP WITH TIME ZONE | Creation timestamp                        |
| updated_at         | TIMESTAMP WITH TIME ZONE | Last update timestamp                     |
| participants_count | INTEGER                  | Number of participants                    |

### drive_participants

| Column     | Type                     | Description                                |
|------------|--------------------------|-------------------------------------------|
| id         | UUID                     | Primary key                               |
| drive_id   | UUID                     | Foreign key to ngo_drives                 |
| user_id    | UUID                     | Foreign key to auth.users                 |
| user_email | TEXT                     | User's email                              |
| joined_at  | TIMESTAMP WITH TIME ZONE | When the user joined                      |
| status     | TEXT                     | Status: registered, attended, cancelled   |

## Row Level Security (RLS) Policies

The script sets up the following RLS policies:

### For drive_participants:
- Users can view, insert, and delete their own participations
- Admins can manage all participations

### For ngo_drives:
- Anyone can view drives
- Only admins can create, update, or delete drives 