import React, { useState } from 'react';
import { Search, MessageCircle, Instagram, Image as ImageIcon, Mic } from 'lucide-react';

const ConversationList = ({ conversations, selectedId, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    const filtered = (conversations || []).filter(c => {
        const name = c.contact_name || 'Desconhecido';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || c.platform === filter;
        return matchesSearch && matchesFilter;
    });

    const getPreviewContent = (msg) => {
        if (!msg) return '';
        if (msg.match(/\.(mp3|mp4|webm|m4a)(\?.*)?$/i)) {
            return <><Mic size={12} className="inline-icon" /> Áudio</>;
        }
        if (msg.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
            return <><ImageIcon size={12} className="inline-icon" /> Imagem</>;
        }
        return msg.length > 30 ? msg.substring(0, 30) + '...' : msg;
    };

    return (
        <div className="conv-list-container">
            <div className="conv-header">
                <h2>Mensagens</h2>
                <div className="filter-tabs">
                    <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                    <button className={`tab ${filter === 'whatsapp' ? 'active' : ''}`} onClick={() => setFilter('whatsapp')}><MessageCircle size={14} /></button>
                    <button className={`tab ${filter === 'instagram' ? 'active' : ''}`} onClick={() => setFilter('instagram')}><Instagram size={14} /></button>
                </div>
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        placeholder="Buscar conversa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="conv-items">
                {filtered.map(conv => (
                    <div
                        key={conv.id}
                        className={`conv-item ${selectedId === conv.id ? 'selected' : ''}`}
                        onClick={() => onSelect(conv)}
                    >
                        <div className="avatar-wrapper">
                            {conv.picture_url ? (
                                <img src={conv.picture_url} alt="" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {(conv.contact_name || '?').charAt(0)}
                                </div>
                            )}
                            <div className={`platform-badge ${conv.platform}`}>
                                {conv.platform === 'whatsapp' ? <MessageCircle size={10} color="white" /> : <Instagram size={10} color="white" />}
                            </div>
                        </div>

                        <div className="conv-info">
                            <div className="conv-top">
                                <span className={`name ${conv.unread > 0 ? 'unread-name' : ''}`}>{conv.contact_name}</span>
                                <span className="time">{conv.time}</span>
                            </div>
                            <div className="conv-bottom">
                                <span className={`last-msg ${conv.unread > 0 ? 'unread-msg' : ''}`}>
                                    {getPreviewContent(conv.last_message)}
                                </span>
                                {conv.unread > 0 && (
                                    <span className="unread-badge"></span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .conv-list-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .conv-header {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .conv-header h2 { font-size: 1.25rem; font-weight: 700; }

                .filter-tabs {
                    display: flex;
                    gap: 0.5rem;
                }
                .tab {
                    flex: 1;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    background: transparent;
                    color: var(--text-secondary);
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex; justify-content: center; align-items: center;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                }
                .tab:hover { background: var(--bg-hover); }
                .tab.active { background: var(--primary); color: black; border-color: var(--primary); }

                .search-bar {
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }
                .search-bar input {
                    width: 100%;
                    padding: 0.6rem 0.6rem 0.6rem 2.2rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    color: white;
                }

                .conv-items {
                    flex: 1;
                    overflow-y: auto;
                }

                .conv-item {
                    display: flex;
                    padding: 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    transition: background 0.2s;
                }
                .conv-item:hover { background: var(--bg-hover); }
                .conv-item.selected { background: rgba(180, 240, 58, 0.08); border-right: 3px solid var(--primary); }

                .avatar-wrapper {
                    position: relative;
                    width: 40px; height: 40px;
                    margin-right: 12px;
                }
                .avatar-placeholder, .avatar-img {
                    width: 100%; height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    background: #333;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; color: #fff;
                }
                
                .platform-badge {
                    position: absolute;
                    bottom: -2px; right: -2px;
                    background: black;
                    border-radius: 50%;
                    padding: 2px;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid var(--bg-secondary);
                }
                .platform-badge.whatsapp { background: #25D366; }
                .platform-badge.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }

                .conv-info {
                    flex: 1;
                    display: flex; flex-direction: column;
                    justify-content: center;
                    overflow: hidden;
                }
                .conv-top, .conv-bottom {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 2px;
                }
                .name { font-weight: 500; font-size: 0.95rem; }
                .name.unread-name { font-weight: 700; color: white; }
                
                .time { font-size: 0.75rem; color: var(--text-secondary); }
                
                .last-msg { 
                    font-size: 0.85rem; color: var(--text-secondary); 
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    max-width: 180px;
                    display: flex; align-items: center; gap: 4px;
                }
                .last-msg.unread-msg {
                    color: #fff;
                    font-weight: 600;
                }

                .unread-badge {
                    background: #22c55e;
                    width: 10px; height: 10px;
                    border-radius: 50%;
                    margin-left: 8px;
                    flex-shrink: 0;
                }
                
                .inline-icon {
                    opacity: 0.7;
                }
            `}</style>
        </div>
    );
};

export default ConversationList;
