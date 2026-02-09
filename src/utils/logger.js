import { supabase } from '../lib/supabaseClient';

/**
 * Logs an activity to the activity_logs table.
 * 
 * @param {Object} params
 * @param {string} params.actionType - 'CREATE', 'UPDATE', 'DELETE', 'MOVE'
 * @param {string} params.entityType - 'DEAL', 'CONTACT', 'PIPELINE'
 * @param {string} params.entityId - ID of the entity
 * @param {Object} params.details - JSON object with details (e.g. { from: 'A', to: 'B' })
 * @param {string|null} params.userId - User ID performing the action (optional)
 */
export const logActivity = async ({ actionType, entityType, entityId, details, userId = null }) => {
    try {
        const { error } = await supabase
            .from('activity_logs')
            .insert([{
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId,
                details: details,
                user_id: userId, // May be null if auth not fully stringent yet
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging activity:', error);
        }
    } catch (err) {
        console.error('Exception logging activity:', err);
    }
};
