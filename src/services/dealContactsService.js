import { supabase } from '../lib/supabaseClient';

/**
 * Service para gerenciar relacionamentos entre Negócios e Contatos
 */
export const dealContactsService = {
    /**
     * Vincula um contato a um negócio
     */
    async linkContactToDeal(dealId, contactId, roleInDeal = null, isPrimary = false) {
        try {
            const { data, error } = await supabase
                .from('deal_contacts')
                .insert({
                    deal_id: dealId,
                    contact_id: contactId,
                    role_in_deal: roleInDeal,
                    is_primary: isPrimary
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error linking contact to deal:', error);
            return { data: null, error };
        }
    },

    /**
     * Remove vínculo entre contato e negócio
     */
    async unlinkContactFromDeal(dealId, contactId) {
        try {
            const { error } = await supabase
                .from('deal_contacts')
                .delete()
                .eq('deal_id', dealId)
                .eq('contact_id', contactId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error unlinking contact from deal:', error);
            return { error };
        }
    },

    /**
     * Busca todos os contatos de um negócio
     */
    async getContactsByDeal(dealId) {
        try {
            const { data, error } = await supabase
                .from('deal_contacts')
                .select(`
          *,
          contact:contacts(*)
        `)
                .eq('deal_id', dealId)
                .order('is_primary', { ascending: false });

            if (error) throw error;
            return { data: data?.map(dc => ({ ...dc.contact, ...dc })) || [], error: null };
        } catch (error) {
            console.error('Error fetching contacts by deal:', error);
            return { data: [], error };
        }
    },

    /**
     * Busca todos os negócios de um contato
     */
    async getDealsByContact(contactId) {
        try {
            const { data, error } = await supabase
                .from('deal_contacts')
                .select(`
          *,
          deal:central_vendas(*)
        `)
                .eq('contact_id', contactId);

            if (error) throw error;
            return { data: data?.map(dc => ({ ...dc.deal, role_in_deal: dc.role_in_deal, is_primary: dc.is_primary })) || [], error: null };
        } catch (error) {
            console.error('Error fetching deals by contact:', error);
            return { data: [], error };
        }
    },

    /**
     * Define um contato como principal do negócio
     */
    async setPrimaryContact(dealId, contactId) {
        try {
            // Remove primary de todos os outros contatos deste negócio
            await supabase
                .from('deal_contacts')
                .update({ is_primary: false })
                .eq('deal_id', dealId);

            // Define o novo primary
            const { data, error } = await supabase
                .from('deal_contacts')
                .update({ is_primary: true })
                .eq('deal_id', dealId)
                .eq('contact_id', contactId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error setting primary contact:', error);
            return { data: null, error };
        }
    },

    /**
     * Atualiza o papel de um contato no negócio
     */
    async updateContactRole(dealId, contactId, roleInDeal) {
        try {
            const { data, error } = await supabase
                .from('deal_contacts')
                .update({ role_in_deal: roleInDeal })
                .eq('deal_id', dealId)
                .eq('contact_id', contactId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating contact role:', error);
            return { data: null, error };
        }
    },

    /**
     * Busca negócios com seus contatos (usando view)
     */
    async getDealsWithContacts() {
        try {
            const { data, error } = await supabase
                .from('deals_with_contacts')
                .select('*');

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching deals with contacts:', error);
            return { data: [], error };
        }
    },

    /**
     * Busca contatos com seus negócios (usando view)
     */
    async getContactsWithDeals() {
        try {
            const { data, error } = await supabase
                .from('contacts_with_deals')
                .select('*');

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching contacts with deals:', error);
            return { data: [], error };
        }
    }
};

/**
 * Service para gerenciar canais de mensagem
 */
export const messageChannelsService = {
    /**
     * Cria um novo canal de mensagem
     */
    async createChannel({
        channelType,
        channelIdentifier,
        channelName = null,
        linkedToType, // 'deal' ou 'contact'
        linkedToId,
        dealId,
        contactId = null
    }) {
        try {
            const { data, error } = await supabase
                .from('message_channels')
                .insert({
                    channel_type: channelType,
                    channel_identifier: channelIdentifier,
                    channel_name: channelName,
                    linked_to_type: linkedToType,
                    linked_to_id: linkedToId,
                    deal_id: dealId,
                    contact_id: contactId
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating message channel:', error);
            return { data: null, error };
        }
    },

    /**
     * Busca canais de um negócio
     */
    async getChannelsByDeal(dealId) {
        try {
            const { data, error } = await supabase
                .from('message_channels')
                .select('*')
                .eq('deal_id', dealId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching channels by deal:', error);
            return { data: [], error };
        }
    },

    /**
     * Busca canais de um contato
     */
    async getChannelsByContact(contactId) {
        try {
            const { data, error } = await supabase
                .from('message_channels')
                .select('*')
                .eq('contact_id', contactId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching channels by contact:', error);
            return { data: [], error };
        }
    },

    /**
     * Transfere um canal de negócio para contato ou vice-versa
     */
    async transferChannel(channelId, newLinkedToType, newLinkedToId, newContactId = null) {
        try {
            const { data, error } = await supabase
                .from('message_channels')
                .update({
                    linked_to_type: newLinkedToType,
                    linked_to_id: newLinkedToId,
                    contact_id: newContactId
                })
                .eq('id', channelId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error transferring channel:', error);
            return { data: null, error };
        }
    },

    /**
     * Atualiza última mensagem do canal
     */
    async updateLastMessage(channelId) {
        try {
            const { data, error } = await supabase
                .from('message_channels')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', channelId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating last message:', error);
            return { data: null, error };
        }
    },

    /**
     * Desativa um canal
     */
    async deactivateChannel(channelId) {
        try {
            const { data, error } = await supabase
                .from('message_channels')
                .update({ is_active: false })
                .eq('id', channelId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error deactivating channel:', error);
            return { data: null, error };
        }
    },

    /**
     * Busca canais com contexto completo (usando view)
     */
    async getChannelsWithContext() {
        try {
            const { data, error } = await supabase
                .from('channels_with_context')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching channels with context:', error);
            return { data: [], error };
        }
    }
};
