import { supabase } from '../lib/supabaseClient';

/**
 * Returns an array of User IDs that the current user is allowed to view.
 * - Admin: Returns null (Active filter should be 'all' or specific, but here null implies no restriction if handled by caller, OR we return all IDs. 
 *   Actually, for Supabase queries, "no filter" is best. So Admin -> null).
 * - Sales: Returns [user.id].
 * - Supervisor: Returns [user.id, ...teamMemberIds].
 */
export const getAccessibleUserIds = async (user, role) => {
    if (!user) return [];
    if (role === 'admin') return null; // Implies "All"
    if (role === 'sales') return [user.id];

    if (role === 'supervisor') {
        try {
            // 1. Get Teams managed by this user
            const { data: teams } = await supabase
                .from('teams')
                .select('id')
                .eq('supervisor_id', user.id);

            const teamIds = teams?.map(t => t.id) || [];

            if (teamIds.length === 0) return [user.id];

            // 2. Get Members of those teams
            const { data: members } = await supabase
                .from('profiles')
                .select('id')
                .in('team_id', teamIds);

            const memberIds = members?.map(m => m.id) || [];

            // Return unique IDs (self + members)
            return [...new Set([user.id, ...memberIds])];
        } catch (error) {
            console.error('Error fetching accessible IDs:', error);
            return [user.id]; // Fallback to safe default
        }
    }

    return [user.id]; // Default safe
};
