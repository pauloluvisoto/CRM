import React, { useState, useEffect, useRef, useCallback } from 'react';
import ConversationList from '../components/Chat/ConversationList';
import ChatWindow from '../components/Chat/ChatWindow';
import { supabase } from '../lib/supabaseClient';

const Messages = () => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [lastSelectedAt, setLastSelectedAt] = useState(Date.now());
    const selectedIdRef = useRef(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Sync Source of Truth
    const hub = useRef({}); // convId -> { content, time, isoTime }

    useEffect(() => {
        selectedIdRef.current = selectedConversation?.id;
    }, [selectedConversation]);

    const sortArr = (arr) => {
        return [...arr].sort((a, b) => {
            const tA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const tB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return tB - tA;
        });
    };

    const refresh = useCallback(async () => {
        try {
            const { data: convs, error } = await supabase
                .from('social_conversations')
                .select('*')
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const extIds = convs.map(c => c.external_id).filter(Boolean);
            let clientsMap = {};
            if (extIds.length > 0) {
                const { data: clients } = await supabase
                    .from('clients')
                    .select('id, instagram_id, contact_name, company_name, instagram_data')
                    .in('instagram_id', extIds);
                if (clients) clients.forEach(cl => {
                    clientsMap[cl.instagram_id] = {
                        id: cl.id,
                        name: cl.contact_name || cl.company_name,
                        picture: cl.instagram_data?.profile_pic || null
                    };
                });
            }

            const formatted = convs.map(c => {
                const cId = String(c.id);
                const cached = hub.current[cId];

                const dbTime = c.last_message_at ? new Date(c.last_message_at).getTime() : 0;
                const cacheTime = cached ? new Date(cached.isoTime).getTime() : 0;

                // If local knowledge is newer, prioritize it.
                // Otherwise use DB but apply prefixing if unread_count is 0 or it starts with Você/CRM
                const useLocal = cached && (cacheTime >= dbTime - 1000);

                let preview = (useLocal ? cached.content : c.last_message) || '';
                let displayTime = useLocal ? cached.time : (c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

                // Fallback: If DB content exists but lacks prefix, and we think it's outbound, add it.
                // But only if we are sure (e.g. unread is 0 AND it's not inbound).
                // Actually, let's keep it simple: manual prefixes are ONLY added by Realtime/Sent handlers.
                // If refresh happens, we hope DB has the right content. 

                return {
                    id: c.id,
                    contact_id: clientsMap[c.external_id]?.id,
                    contact_name: clientsMap[c.external_id]?.name || 'Desconhecido',
                    picture_url: clientsMap[c.external_id]?.picture,
                    platform: c.platform,
                    external_id: c.external_id,
                    last_message: preview,
                    unread: (preview.startsWith('Você:') || preview.startsWith('CRM:')) ? 0 : (c.unread_count || 0),
                    time: displayTime,
                    last_message_at: useLocal ? cached.isoTime : c.last_message_at
                };
            });

            setConversations(sortArr(formatted));
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();

        const channel = supabase.channel('inbox_final_sync')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_messages' }, (payload) => {
                const msg = payload.new;
                const cId = String(msg.conversation_id);

                let text = msg.content || '';
                if (text.match(/\.(mp3|mp4|webm|m4a)(\?.*)?$/i)) text = '🎵 Áudio';
                else if (text.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) text = '📷 Imagem';

                const formatted = (msg.direction === 'outbound' ? 'Você: ' : '') + text;
                const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                hub.current[cId] = { content: formatted, time: timeStr, isoTime: msg.created_at };

                refresh(); // Full refresh is safest to get updated unread counts from server
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'social_conversations' }, () => refresh())
            .subscribe();

        const timer = setInterval(refresh, 8000); // 8s safety polling

        return () => {
            supabase.removeChannel(channel);
            clearInterval(timer);
        };
    }, [refresh]);

    const handleSelectConversation = useCallback((conversation) => {
        setSelectedConversation(conversation);
        setLastSelectedAt(Date.now());
        setConversations(prev => prev.map(conv => String(conv.id) === String(conversation.id) ? { ...conv, unread: 0 } : conv));
        supabase.from('social_conversations').update({ unread_count: 0 }).eq('id', conversation.id).then(() => refresh());
    }, [refresh]);

    return (
        <div className="messages-container">
            <div className="conversations-sidebar">
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation?.id}
                    onSelect={handleSelectConversation}
                />
            </div>
            <div className="chat-area">
                {selectedConversation ? (
                    <ChatWindow
                        conversation={selectedConversation}
                        lastSelectedAt={lastSelectedAt}
                        onMessageSent={(content) => {
                            const cId = String(selectedConversation.id);
                            const now = new Date();
                            hub.current[cId] = { content, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isoTime: now.toISOString() };
                            refresh();
                        }}
                    />
                ) : (
                    <div className="empty-state">
                        <h3>Selecione uma conversa</h3>
                        <p>Escolha um contato para iniciar o atendimento.</p>
                    </div>
                )}
            </div>

            <style>{`
                .messages-container { display: flex; height: 100%; width: 100%; background-color: var(--bg-primary); overflow: hidden; }
                .conversations-sidebar { width: 350px; border-right: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%); backdrop-filter: blur(10px); }
                .chat-area { flex: 1; display: flex; flex-direction: column; background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 20px 20px; background-color: var(--bg-primary); position: relative; }
                .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); opacity: 0.6; }
                .empty-state h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
               .empty-state p { font-size: 0.95rem; }
            `}</style>
        </div>
    );
};

export default Messages;
