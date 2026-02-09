import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { logActivity } from '../../../utils/logger';
import { Send, Trash2, Clock } from 'lucide-react';

const NotesTab = ({ dealId }) => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [dealId]);

    const fetchNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('deal_notes')
                .select('*')
                .eq('deal_id', dealId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSending(true);
        try {
            const { data, error } = await supabase
                .from('deal_notes')
                .insert([{
                    deal_id: dealId,
                    content: newNote,
                    user_id: user?.id
                }])
                .select()
                .single();

            if (error) throw error;

            setNotes(prev => [data, ...prev]);
            setNewNote('');

            // Log
            logActivity({
                actionType: 'UPDATE',
                entityType: 'DEAL',
                entityId: dealId,
                details: { note: 'Nota adicionada' },
                userId: user?.id
            });

        } catch (err) {
            console.error(err);
            alert('Erro ao adicionar nota');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!confirm('Apagar esta nota?')) return;
        try {
            await supabase.from('deal_notes').delete().eq('id', noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    return (
        <div className="notes-tab">
            <form onSubmit={handleAddNote} className="note-form">
                <textarea
                    className="note-input"
                    placeholder="Escreva uma nota..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    rows={3}
                />
                <div className="form-actions">
                    <button type="submit" className="btn-send" disabled={sending || !newNote.trim()}>
                        <Send size={16} /> {sending ? 'Enviando...' : 'Adicionar Nota'}
                    </button>
                </div>
            </form>

            <div className="notes-list">
                {loading ? <p className="text-muted">Carregando notas...</p> :
                    notes.length === 0 ? <p className="text-muted text-center py-4">Nenhuma nota ainda.</p> :
                        notes.map(note => (
                            <div key={note.id} className="note-card">
                                <div className="note-header">
                                    <span className="note-date"><Clock size={12} /> {formatDate(note.created_at)}</span>
                                    <button onClick={() => handleDeleteNote(note.id)} className="btn-delete-note">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="note-content">
                                    {note.content}
                                </div>
                            </div>
                        ))}
            </div>

            <style>{`
                .notes-tab {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .note-form {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .note-input {
                    background-color: var(--bg-hover);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 0.75rem;
                    color: var(--text-primary);
                    resize: vertical;
                    font-family: inherit;
                }
                .note-input:focus { outline: none; border-color: var(--primary); }
                
                .form-actions { display: flex; justify-content: flex-end; }
                
                .btn-send {
                    background-color: var(--primary);
                    color: var(--primary-text);
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 0.5rem;
                }

                .notes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-height: 300px;
                    overflow-y: auto;
                    padding-right: 4px;
                }

                .note-card {
                    background-color: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                }

                .note-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                
                .note-date { display: flex; align-items: center; gap: 4px; }

                .btn-delete-note {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    opacity: 0.6;
                }
                .btn-delete-note:hover { opacity: 1; color: #f87171; }

                .note-content {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    white-space: pre-wrap;
                }
            `}</style>
        </div>
    );
};

export default NotesTab;
