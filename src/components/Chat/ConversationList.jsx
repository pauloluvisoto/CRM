import React, { useState } from 'react';
import { Search, MessageCircle, Instagram, Image as ImageIcon, Mic, Users } from 'lucide-react';

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
            return <><Mic size={12} className="cl-inline-icon" /> Áudio</>;
        }
        if (msg.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
            return <><ImageIcon size={12} className="cl-inline-icon" /> Imagem</>;
        }
        return msg.length > 35 ? msg.substring(0, 35) + '...' : msg;
    };

    const totalUnread = (conversations || []).reduce((acc, c) => acc + (c.unread || 0), 0);

    return (
        <div className="cl-container">
            <div className="cl-header">
                <div className="cl-header-top">
                    <h2 className="cl-title">Mensagens</h2>
                    {totalUnread > 0 && (
                        <span className="cl-total-badge">{totalUnread}</span>
                    )}
                </div>
                <div className="cl-filters">
                    <button className={`cl-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        <Users size={13} /> Todos
                    </button>
                    <button className={`cl-filter ${filter === 'whatsapp' ? 'active' : ''}`} onClick={() => setFilter('whatsapp')}>
                        <MessageCircle size={13} /> WhatsApp
                    </button>
                    <button className={`cl-filter ${filter === 'instagram' ? 'active' : ''}`} onClick={() => setFilter('instagram')}>
                        <Instagram size={13} /> Instagram
                    </button>
                </div>
                <div className="cl-search">
                    <Search size={15} className="cl-search-icon" />
                    <input
                        placeholder="Buscar conversa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="cl-list">
                {filtered.length === 0 && (
                    <div className="cl-empty">
                        <p>Nenhuma conversa encontrada</p>
                    </div>
                )}
                {filtered.map(conv => (
                    <div
                        key={conv.id}
                        className={`cl-item ${selectedId === conv.id ? 'selected' : ''} ${conv.unread > 0 ? 'has-unread' : ''}`}
                        onClick={() => onSelect(conv)}
                    >
                        <div className="cl-avatar-wrap">
                            {conv.picture_url ? (
                                <img src={conv.picture_url} alt="" className="cl-avatar-img" />
                            ) : (
                                <div className="cl-avatar-ph">
                                    {(conv.contact_name || '?').charAt(0)}
                                </div>
                            )}
                            <div className={`cl-platform ${conv.platform}`}>
                                {conv.platform === 'whatsapp' ? <MessageCircle size={9} color="white" /> : <Instagram size={9} color="white" />}
                            </div>
                        </div>

                        <div className="cl-info">
                            <div className="cl-row-top">
                                <span className={`cl-name ${conv.unread > 0 ? 'unread' : ''}`}>{conv.contact_name}</span>
                                <span className="cl-time">{conv.time}</span>
                            </div>
                            <div className="cl-row-bottom">
                                <span className={`cl-preview ${conv.unread > 0 ? 'unread' : ''}`}>
                                    {getPreviewContent(conv.last_message)}
                                </span>
                                {conv.unread > 0 && (
                                    <span className="cl-unread-dot"></span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .cl-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: transparent;
                }

                .cl-header {
                    padding: 16px 14px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .cl-header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .cl-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #fff;
                    margin: 0;
                }

                .cl-total-badge {
                    background: #22c55e;
                    color: #fff;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 99px;
                    min-width: 20px;
                    text-align: center;
                }

                .cl-filters {
                    display: flex;
                    gap: 4px;
                    background: rgba(0,0,0,0.2);
                    padding: 3px;
                    border-radius: 10px;
                }
                .cl-filter {
                    flex: 1;
                    padding: 6px 8px;
                    border: none;
                    background: transparent;
                    color: #666;
                    border-radius: 7px;
                    cursor: pointer;
                    display: flex; justify-content: center; align-items: center; gap: 4px;
                    transition: all 0.2s;
                    font-size: 0.78rem;
                    font-weight: 600;
                }
                .cl-filter:hover { color: #999; background: rgba(255,255,255,0.03); }
                .cl-filter.active {
                    background: rgba(132,204,22,0.12);
                    color: #84cc16;
                }

                .cl-search {
                    position: relative;
                }
                .cl-search-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #444;
                }
                .cl-search input {
                    width: 100%;
                    padding: 8px 8px 8px 32px;
                    background: rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 0.85rem;
                    transition: border-color 0.2s;
                }
                .cl-search input:focus {
                    outline: none;
                    border-color: rgba(132,204,22,0.3);
                }
                .cl-search input::placeholder { color: #444; }

                .cl-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .cl-empty {
                    padding: 2rem;
                    text-align: center;
                    color: #444;
                    font-size: 0.85rem;
                }

                .cl-item {
                    display: flex;
                    padding: 12px 14px;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                    transition: all 0.15s;
                    border-left: 3px solid transparent;
                }
                .cl-item:hover {
                    background: rgba(255,255,255,0.02);
                }
                .cl-item.selected {
                    background: rgba(132,204,22,0.06);
                    border-left-color: #84cc16;
                }
                .cl-item.has-unread {
                    background: rgba(34,197,94,0.03);
                }

                .cl-avatar-wrap {
                    position: relative;
                    width: 42px; height: 42px;
                    margin-right: 10px;
                    flex-shrink: 0;
                }
                .cl-avatar-ph, .cl-avatar-img {
                    width: 100%; height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .cl-avatar-ph {
                    background: linear-gradient(135deg, #2a2a35, #1f1f28);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; color: #888; font-size: 1rem;
                    border: 1.5px solid rgba(255,255,255,0.06);
                }

                .cl-platform {
                    position: absolute;
                    bottom: -1px; right: -1px;
                    border-radius: 50%;
                    padding: 3px;
                    display: flex; align-items: center; justify-content: center;
                    border: 2px solid #16161e;
                }
                .cl-platform.whatsapp { background: #25D366; }
                .cl-platform.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }

                .cl-info {
                    flex: 1;
                    display: flex; flex-direction: column;
                    justify-content: center;
                    min-width: 0;
                }
                .cl-row-top, .cl-row-bottom {
                    display: flex; justify-content: space-between; align-items: center;
                }
                .cl-row-top { margin-bottom: 3px; }

                .cl-name {
                    font-weight: 500; font-size: 0.9rem; color: #ccc;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    max-width: 170px;
                }
                .cl-name.unread { font-weight: 700; color: #fff; }

                .cl-time { font-size: 0.72rem; color: #555; flex-shrink: 0; }

                .cl-preview {
                    font-size: 0.8rem; color: #555;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    max-width: 190px;
                    display: flex; align-items: center; gap: 4px;
                }
                .cl-preview.unread {
                    color: #aaa;
                    font-weight: 600;
                }

                .cl-unread-dot {
                    background: #22c55e;
                    width: 9px; height: 9px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 6px rgba(34,197,94,0.4);
                }

                .cl-inline-icon {
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
};

export default ConversationList;
