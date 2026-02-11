import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Star, Mail, Phone, MessageCircle, Trash2, Edit2 } from 'lucide-react';
import { dealContactsService, messageChannelsService } from '../../services/dealContactsService';
import { supabase } from '../../lib/supabaseClient';

const DealContactsManager = ({ dealId, dealName, onClose }) => {
    const [contacts, setContacts] = useState([]);
    const [allContacts, setAllContacts] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddContact, setShowAddContact] = useState(false);
    const [showAddChannel, setShowAddChannel] = useState(false);
    const [selectedContactForChannel, setSelectedContactForChannel] = useState(null);

    const [newContact, setNewContact] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        roleInDeal: 'Contato'
    });

    const [newChannel, setNewChannel] = useState({
        type: 'whatsapp',
        identifier: '',
        name: '',
        linkedTo: 'deal' // 'deal' ou 'contact'
    });

    useEffect(() => {
        if (dealId) {
            fetchData();
        }
    }, [dealId]);

    const fetchData = async () => {
        setLoading(true);

        // Buscar contatos vinculados ao negócio
        const { data: dealContacts } = await dealContactsService.getContactsByDeal(dealId);
        setContacts(dealContacts || []);

        // Buscar todos os contatos disponíveis
        const { data: allContactsData } = await supabase.from('contacts').select('*').order('name');
        setAllContacts(allContactsData || []);

        // Buscar canais do negócio
        const { data: channelsData } = await messageChannelsService.getChannelsByDeal(dealId);
        setChannels(channelsData || []);

        setLoading(false);
    };

    const handleAddContact = async () => {
        if (!newContact.name) {
            alert('Nome é obrigatório');
            return;
        }

        // Criar contato novo
        const { data: createdContact, error: createError } = await supabase
            .from('contacts')
            .insert({
                name: newContact.name,
                email: newContact.email,
                phone: newContact.phone,
                role: newContact.role,
                company: dealName
            })
            .select()
            .single();

        if (createError) {
            alert('Erro ao criar contato: ' + createError.message);
            return;
        }

        // Vincular ao negócio
        await dealContactsService.linkContactToDeal(
            dealId,
            createdContact.id,
            newContact.roleInDeal,
            contacts.length === 0 // Primeiro contato é primary
        );

        setNewContact({ name: '', email: '', phone: '', role: '', roleInDeal: 'Contato' });
        setShowAddContact(false);
        fetchData();
    };

    const handleLinkExistingContact = async (contactId, roleInDeal = 'Contato') => {
        await dealContactsService.linkContactToDeal(dealId, contactId, roleInDeal);
        fetchData();
    };

    const handleRemoveContact = async (contactId) => {
        if (confirm('Remover este contato do negócio?')) {
            await dealContactsService.unlinkContactFromDeal(dealId, contactId);
            fetchData();
        }
    };

    const handleSetPrimary = async (contactId) => {
        await dealContactsService.setPrimaryContact(dealId, contactId);
        fetchData();
    };

    const handleAddChannel = async () => {
        if (!newChannel.identifier) {
            alert('Identificador do canal é obrigatório');
            return;
        }

        const channelData = {
            channelType: newChannel.type,
            channelIdentifier: newChannel.identifier,
            channelName: newChannel.name || `${newChannel.type} - ${newChannel.identifier}`,
            linkedToType: newChannel.linkedTo,
            linkedToId: newChannel.linkedTo === 'deal' ? dealId : selectedContactForChannel,
            dealId: dealId,
            contactId: newChannel.linkedTo === 'contact' ? selectedContactForChannel : null
        };

        const { error } = await messageChannelsService.createChannel(channelData);

        if (error) {
            alert('Erro ao criar canal: ' + error.message);
            return;
        }

        setNewChannel({ type: 'whatsapp', identifier: '', name: '', linkedTo: 'deal' });
        setShowAddChannel(false);
        setSelectedContactForChannel(null);
        fetchData();
    };

    const getChannelIcon = (type) => {
        switch (type) {
            case 'whatsapp': return '💬';
            case 'instagram': return '📷';
            case 'email': return '📧';
            case 'phone': return '📞';
            case 'telegram': return '✈️';
            default: return '💬';
        }
    };

    const availableContacts = allContacts.filter(
        c => !contacts.some(dc => dc.contact_id === c.id)
    );

    if (loading) {
        return (
            <div className="deal-contacts-manager">
                <div className="loading">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="deal-contacts-manager">
            {/* Header */}
            <div className="manager-header">
                <div>
                    <h2><Users size={24} /> Contatos do Negócio</h2>
                    <p className="deal-name">{dealName}</p>
                </div>
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            {/* Contatos Vinculados */}
            <div className="section">
                <div className="section-header">
                    <h3>Contatos Vinculados ({contacts.length})</h3>
                    <button className="btn-add" onClick={() => setShowAddContact(!showAddContact)}>
                        <Plus size={16} /> Adicionar
                    </button>
                </div>

                {showAddContact && (
                    <div className="add-contact-form">
                        <h4>Novo Contato</h4>
                        <input
                            type="text"
                            placeholder="Nome *"
                            value={newContact.name}
                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={newContact.email}
                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Telefone"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Cargo"
                            value={newContact.role}
                            onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                        />
                        <select
                            value={newContact.roleInDeal}
                            onChange={(e) => setNewContact({ ...newContact, roleInDeal: e.target.value })}
                        >
                            <option value="Contato">Contato</option>
                            <option value="Dono">Dono</option>
                            <option value="Gerente">Gerente</option>
                            <option value="Decisor">Decisor</option>
                            <option value="Influenciador">Influenciador</option>
                        </select>
                        <div className="form-actions">
                            <button className="btn-primary" onClick={handleAddContact}>Criar e Vincular</button>
                            <button className="btn-secondary" onClick={() => setShowAddContact(false)}>Cancelar</button>
                        </div>

                        {availableContacts.length > 0 && (
                            <>
                                <hr />
                                <h4>Ou vincular contato existente:</h4>
                                <div className="existing-contacts-list">
                                    {availableContacts.map(c => (
                                        <div key={c.id} className="existing-contact-item">
                                            <div>
                                                <strong>{c.name}</strong>
                                                <span>{c.email || c.phone}</span>
                                            </div>
                                            <button onClick={() => handleLinkExistingContact(c.id)}>
                                                <Plus size={14} /> Vincular
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="contacts-list">
                    {contacts.map(contact => (
                        <div key={contact.contact_id} className={`contact-card ${contact.is_primary ? 'primary' : ''}`}>
                            <div className="contact-avatar">
                                {contact.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="contact-info">
                                <div className="contact-name">
                                    {contact.name}
                                    {contact.is_primary && <Star size={14} className="primary-icon" fill="#fbbf24" />}
                                </div>
                                <div className="contact-role">{contact.role_in_deal || contact.role || 'Contato'}</div>
                                <div className="contact-methods">
                                    {contact.email && <span><Mail size={12} /> {contact.email}</span>}
                                    {contact.phone && <span><Phone size={12} /> {contact.phone}</span>}
                                </div>
                            </div>
                            <div className="contact-actions">
                                {!contact.is_primary && (
                                    <button onClick={() => handleSetPrimary(contact.contact_id)} title="Definir como principal">
                                        <Star size={14} />
                                    </button>
                                )}
                                <button onClick={() => {
                                    setSelectedContactForChannel(contact.contact_id);
                                    setShowAddChannel(true);
                                    setNewChannel({ ...newChannel, linkedTo: 'contact' });
                                }} title="Adicionar canal">
                                    <MessageCircle size={14} />
                                </button>
                                <button onClick={() => handleRemoveContact(contact.contact_id)} title="Remover">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Canais de Mensagem */}
            <div className="section">
                <div className="section-header">
                    <h3>Canais de Mensagem ({channels.length})</h3>
                    <button className="btn-add" onClick={() => {
                        setShowAddChannel(!showAddChannel);
                        setNewChannel({ ...newChannel, linkedTo: 'deal' });
                        setSelectedContactForChannel(null);
                    }}>
                        <Plus size={16} /> Adicionar
                    </button>
                </div>

                {showAddChannel && (
                    <div className="add-channel-form">
                        <h4>Novo Canal</h4>
                        <select
                            value={newChannel.type}
                            onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                        >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="instagram">Instagram</option>
                            <option value="email">Email</option>
                            <option value="phone">Telefone</option>
                            <option value="telegram">Telegram</option>
                            <option value="other">Outro</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Número/Username/Email *"
                            value={newChannel.identifier}
                            onChange={(e) => setNewChannel({ ...newChannel, identifier: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Nome do canal (opcional)"
                            value={newChannel.name}
                            onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                        />
                        <select
                            value={newChannel.linkedTo}
                            onChange={(e) => setNewChannel({ ...newChannel, linkedTo: e.target.value })}
                        >
                            <option value="deal">Vinculado ao Negócio</option>
                            <option value="contact">Vinculado a Contato Específico</option>
                        </select>
                        {newChannel.linkedTo === 'contact' && (
                            <select
                                value={selectedContactForChannel || ''}
                                onChange={(e) => setSelectedContactForChannel(e.target.value)}
                            >
                                <option value="">Selecione um contato</option>
                                {contacts.map(c => (
                                    <option key={c.contact_id} value={c.contact_id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                        <div className="form-actions">
                            <button className="btn-primary" onClick={handleAddChannel}>Adicionar Canal</button>
                            <button className="btn-secondary" onClick={() => setShowAddChannel(false)}>Cancelar</button>
                        </div>
                    </div>
                )}

                <div className="channels-list">
                    {channels.map(channel => {
                        const linkedContact = contacts.find(c => c.contact_id === channel.contact_id);
                        return (
                            <div key={channel.id} className="channel-card">
                                <div className="channel-icon">{getChannelIcon(channel.channel_type)}</div>
                                <div className="channel-info">
                                    <div className="channel-name">{channel.channel_name || channel.channel_identifier}</div>
                                    <div className="channel-type">{channel.channel_type.toUpperCase()}</div>
                                    {linkedContact && (
                                        <div className="channel-linked">
                                            Vinculado a: <strong>{linkedContact.name}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
        .deal-contacts-manager {
          position: fixed;
          top: 0;
          right: 0;
          width: 600px;
          height: 100vh;
          background: linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
          overflow-y: auto;
          padding: 2rem;
          box-shadow: -10px 0 50px rgba(0, 0, 0, 0.5);
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .manager-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .deal-name {
          color: #84cc16;
          font-size: 0.9rem;
          margin: 0;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 0, 0, 0.1);
          border-color: rgba(255, 0, 0, 0.3);
        }

        .section {
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          color: #fff;
          font-size: 1.1rem;
          margin: 0;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(132, 204, 22, 0.1);
          color: #84cc16;
          border: 1px solid rgba(132, 204, 22, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: #84cc16;
          color: #000;
        }

        .add-contact-form, .add-channel-form {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .add-contact-form h4, .add-channel-form h4 {
          margin: 0 0 1rem 0;
          color: #fff;
          font-size: 0.95rem;
        }

        .add-contact-form input, .add-contact-form select,
        .add-channel-form input, .add-channel-form select {
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #84cc16;
          color: #000;
          border: none;
        }

        .btn-primary:hover {
          background: #65a30d;
        }

        .btn-secondary {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .contacts-list, .channels-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contact-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .contact-card.primary {
          border-color: rgba(251, 191, 36, 0.5);
          background: rgba(251, 191, 36, 0.05);
        }

        .contact-card:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .contact-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(132, 204, 22, 0.2), rgba(101, 163, 13, 0.1));
          color: #84cc16;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          border: 2px solid rgba(132, 204, 22, 0.3);
        }

        .contact-info {
          flex: 1;
        }

        .contact-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fff;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .primary-icon {
          color: #fbbf24;
        }

        .contact-role {
          color: #84cc16;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .contact-methods {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #888;
        }

        .contact-methods span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .contact-actions {
          display: flex;
          gap: 0.5rem;
        }

        .contact-actions button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .contact-actions button:hover {
          background: rgba(132, 204, 22, 0.1);
          border-color: rgba(132, 204, 22, 0.3);
          color: #84cc16;
        }

        .channel-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
        }

        .channel-icon {
          font-size: 2rem;
        }

        .channel-info {
          flex: 1;
        }

        .channel-name {
          color: #fff;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .channel-type {
          color: #888;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .channel-linked {
          color: #84cc16;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        .existing-contacts-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .existing-contact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .existing-contact-item div {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .existing-contact-item strong {
          color: #fff;
        }

        .existing-contact-item span {
          color: #888;
          font-size: 0.8rem;
        }

        .existing-contact-item button {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(132, 204, 22, 0.1);
          color: #84cc16;
          border: 1px solid rgba(132, 204, 22, 0.3);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .existing-contact-item button:hover {
          background: #84cc16;
          color: #000;
        }

        hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 1.5rem 0;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #888;
        }
      `}</style>
        </div>
    );
};

export default DealContactsManager;
