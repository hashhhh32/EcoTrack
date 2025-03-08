-- Function to get participant counts for all drives
CREATE OR REPLACE FUNCTION get_drive_participant_counts()
RETURNS TABLE (
    drive_id UUID,
    count BIGINT
) 
LANGUAGE SQL
AS $$
    SELECT 
        drive_id,
        COUNT(*)::BIGINT
    FROM drive_participants
    WHERE status = 'registered'
    GROUP BY drive_id;
$$; 