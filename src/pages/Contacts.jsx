import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// import { initialContacts } from '../data/mockData'; // No longer needed
import ContactDetail from '../components/Contacts/ContactDetail';
import NewContactModal from '../components/Contacts/NewContactModal';
import { Search, Plus, MoreHorizontal, Mail, Phone } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('contacts'); // 'contacts' or 'deals'
  const [deals, setDeals] = useState([]);

  // Action Menu State
  const [actionsMenu, setActionsMenu] = useState({ isOpen: false, id: null, top: 0, left: 0 });

  useEffect(() => {
    // Close menu on click outside
    const handleClickOutside = () => setActionsMenu({ isOpen: false, id: null, top: 0, left: 0 });
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);

      // 1. Fetch Generic Contacts
      const { data: genericContacts } = await supabase.from('contacts').select('*').order('name');

      // 2. Fetch Clients (Onboarding/Maintenance) with their contacts JSON column
      const { data: clientsData } = await supabase.from('clients').select('id, company_name, contacts, stage');

      // 3. Fetch Pipeline Deals (Leads)
      const { data: pipelineDeals } = await supabase.from('central_vendas').select('id, empresa_cliente, nome_contato, telefone, email, stage, tipo_pipeline');

      let aggregated = [];

      // Process Generic
      if (genericContacts) {
        aggregated = [...aggregated, ...genericContacts.map(c => ({
          ...c,
          uniqueId: `gen_${c.id}`,
          sourceType: 'general',
          sourceLabel: 'Contato Geral'
        }))];
      }

      // Process Clients
      if (clientsData) {
        clientsData.forEach(client => {
          if (client.contacts && Array.isArray(client.contacts)) {
            client.contacts.forEach((c, idx) => {
              aggregated.push({
                id: `client_${client.id}_${idx}`,
                uniqueId: `client_${client.id}_${idx}`,
                name: c.name,
                role: c.role,
                email: c.email,
                phone: c.phone,
                company: client.company_name,
                sourceType: client.stage === 'onboarding' ? 'onboarding' : 'maintenance',
                sourceLabel: client.stage === 'onboarding' ? 'Onboarding' : 'Manutenção',
                clientId: client.id
              });
            });
          }
        });
      }

      // Process Pipeline
      if (pipelineDeals) {
        pipelineDeals.forEach(deal => {
          if (deal.nome_contato) {
            // Avoid duplicates if possible (simple name/company check could be done, but for now we list all)
            aggregated.push({
              id: `deal_${deal.id}`,
              uniqueId: `deal_${deal.id}`,
              name: deal.nome_contato,
              role: 'Lead',
              email: deal.email,
              phone: deal.telefone,
              company: deal.empresa_cliente,
              sourceType: 'pipeline',
              sourceLabel: deal.tipo_pipeline === 'Ativo_Diagnostico' ? 'Pipeline Ativo' : 'Pipeline Receptivo',
              dealId: deal.id
            });
          }
        });
      }

      // Sort by Name
      aggregated.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // --- Grouping for Deals View ---
      const dealsMap = new Map();

      // 1. Process Clients into Deals
      if (clientsData) {
        clientsData.forEach(client => {
          dealsMap.set(`client_${client.id}`, {
            id: `client_${client.id}`,
            uniqueId: `client_${client.id}`,
            name: client.company_name,
            sourceType: client.stage === 'onboarding' ? 'onboarding' : 'maintenance',
            sourceLabel: client.stage === 'onboarding' ? 'Onboarding' : 'Manutenção',
            contacts: (client.contacts || []).map((c, idx) => ({
              ...c,
              id: `client_c_${client.id}_${idx}`
            })),
            type: 'client',
            clientId: client.id
          });
        });
      }

      // 2. Process Pipeline Deals
      if (pipelineDeals) {
        pipelineDeals.forEach(deal => {
          dealsMap.set(`deal_${deal.id}`, {
            id: `deal_${deal.id}`,
            uniqueId: `deal_${deal.id}`,
            name: deal.empresa_cliente,
            sourceType: 'pipeline',
            sourceLabel: deal.tipo_pipeline === 'Ativo_Diagnostico' ? 'Pipeline Ativo' : 'Pipeline Receptivo',
            contacts: deal.nome_contato ? [{
              name: deal.nome_contato,
              role: 'Lead',
              email: deal.email,
              phone: deal.telefone,
              id: `deal_c_${deal.id}`
            }] : [],
            type: 'pipeline',
            dealId: deal.id
          });
        });
      }

      // 3. Process General Contacts - group by company if it exists
      if (genericContacts) {
        genericContacts.forEach(c => {
          if (c.company) {
            const key = `company_${c.company.toLowerCase().trim()}`;
            if (dealsMap.has(key)) {
              dealsMap.get(key).contacts.push({ ...c });
            } else {
              // Check if company already exists in other categories (by name)
              let foundExisting = false;
              for (let [dKey, dValue] of dealsMap) {
                if (dValue.name?.toLowerCase().trim() === c.company.toLowerCase().trim()) {
                  dValue.contacts.push({ ...c });
                  foundExisting = true;
                  break;
                }
              }

              if (!foundExisting) {
                dealsMap.set(key, {
                  id: key,
                  uniqueId: key,
                  name: c.company,
                  sourceType: 'general',
                  sourceLabel: 'Contato Geral',
                  contacts: [{ ...c }],
                  type: 'general'
                });
              }
            }
          }
        });
      }

      const aggregatedDeals = Array.from(dealsMap.values());
      aggregatedDeals.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setContacts(aggregated);
      setDeals(aggregatedDeals);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleContactUpdated = (updatedContact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    setSelectedContact(updatedContact); // Update the selected contact view too
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeals = deals.filter(deal =>
    deal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.contacts?.some(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container contacts-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Contatos</h1>
          <div className="view-switcher">
            <button
              className={`switcher-btn ${viewMode === 'contacts' ? 'active' : ''}`}
              onClick={() => setViewMode('contacts')}
            >
              Contatos
            </button>
            <button
              className={`switcher-btn ${viewMode === 'deals' ? 'active' : ''}`}
              onClick={() => setViewMode('deals')}
            >
              Negócios
            </button>
          </div>
        </div>
        <div className="actions">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={viewMode === 'contacts' ? "Buscar contatos..." : "Buscar negócios..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span className='btn-text'>Novo Contato</span>
          </button>
        </div>
      </div>

      <div className="contacts-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem' }}>Carregando...</p>
          </div>
        ) : viewMode === 'contacts' ? (
          filteredContacts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Nenhum contato encontrado.</div>
          ) : (
            <table className="contacts-table">
              <thead>
                <tr>
                  <th className="th-name">Nome</th>
                  <th>Empresa</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Origem / Status</th>
                  <th className="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => (
                  <tr
                    key={contact.uniqueId}
                    className="contact-row"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="td-name-cell">
                      <div className="name-wrapper">
                        <div className="avatar-small">{contact.name?.charAt(0).toUpperCase() || '?'}</div>
                        <div className="name-info">
                          <span className="name">{contact.name}</span>
                          <span className="role">{contact.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td-company">
                      {contact.company ? (
                        <div className="company-hover-wrapper">
                          <span className="company-text">{contact.company}</span>
                          {/* Business Summary Popup */}
                          <div className="company-popup">
                            <div className="popup-header">
                              <span className="popup-title">{contact.company}</span>
                              <span className={`status-badge-small ${deals.find(d => d.name === contact.company)?.sourceType || 'general'}`}>
                                {deals.find(d => d.name === contact.company)?.sourceLabel || 'Contato Geral'}
                              </span>
                            </div>
                            <div className="popup-body">
                              <div className="popup-info-row">
                                <span className="label">Total de Contatos:</span>
                                <span className="value">{deals.find(d => d.name === contact.company)?.contacts?.length || 1}</span>
                              </div>
                              <div className="popup-contacts-preview">
                                {deals.find(d => d.name === contact.company)?.contacts?.slice(0, 3).map((c, i) => (
                                  <div key={i} className="popup-contact-item">
                                    <div className="avatar-xs" style={{ width: '14px', height: '14px', fontSize: '0.6rem' }}>
                                      {c.name?.charAt(0)}
                                    </div>
                                    <span>{c.name}</span>
                                  </div>
                                ))}
                                {(deals.find(d => d.name === contact.company)?.contacts?.length || 0) > 3 && (
                                  <span className="more-text">+{deals.find(d => d.name === contact.company).contacts.length - 3} outros</span>
                                )}
                              </div>
                            </div>
                            <div className="popup-footer">
                              Clique para ver detalhes do negócio
                            </div>
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="contact-method">
                        <Mail size={14} />
                        {contact.email || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="contact-method">
                        <Phone size={14} />
                        {contact.phone || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="status-badge-wrapper">
                        <span className={`status-badge ${contact.sourceType}`}>
                          {contact.sourceLabel}
                        </span>
                      </div>
                    </td>
                    <td className="td-actions">
                      <button
                        className="icon-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActionsMenu({
                            isOpen: true,
                            id: contact.uniqueId,
                            top: rect.bottom + 5,
                            left: rect.left - 100,
                            contact: contact
                          });
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          /* Negócios (Deals) View */
          filteredDeals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Nenhum negócio encontrado.</div>
          ) : (
            <table className="contacts-table">
              <thead>
                <tr>
                  <th>Negócio (Empresa)</th>
                  <th>Contatos Atrelados</th>
                  <th>Origem / Status</th>
                  <th className="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map(deal => (
                  <tr
                    key={deal.uniqueId}
                    className="contact-row deal-row"
                    onClick={() => {
                      if (deal.type === 'client') navigate(`/clients/${deal.clientId}`);
                      if (deal.type === 'pipeline') navigate(`/pipeline`);
                    }}
                  >
                    <td className="td-business">
                      <div className="business-info">
                        <span className="business-name">{deal.name || 'Empresa não identificada'}</span>
                        <span className="business-subtitle">{deal.contacts?.length || 0} {deal.contacts?.length === 1 ? 'contato' : 'contatos'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="deal-contacts-list">
                        {deal.contacts && deal.contacts.length > 0 ? (
                          deal.contacts.slice(0, 5).map((c, i) => (
                            <div key={c.id || i} className="deal-contact-tag" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContact({ ...c, company: deal.name, sourceType: deal.sourceType, sourceLabel: deal.sourceLabel });
                            }}>
                              <div className="avatar-xs" style={{ background: '#bef264', color: '#000' }}>{c.name?.charAt(0).toUpperCase()}</div>
                              <span className="contact-tag-name">{c.name}</span>

                              {/* Contact Hover Popup */}
                              <div className="contact-tag-popup">
                                <div className="popup-header">
                                  <div className="avatar-small" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                    {c.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="popup-title-group">
                                    <span className="popup-title">{c.name}</span>
                                    <span className="popup-subtitle">{c.role || 'Contato'}</span>
                                  </div>
                                </div>
                                <div className="popup-body">
                                  <div className="popup-contact-info">
                                    <div className="info-item">
                                      <Mail size={12} className="info-icon" />
                                      <span>{c.email || 'E-mail não informado'}</span>
                                    </div>
                                    <div className="info-item">
                                      <Phone size={12} className="info-icon" />
                                      <span>{c.phone || 'Telefone não informado'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="popup-footer">
                                  Clique para abrir perfil completo
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#666', fontSize: '0.8rem' }}>Sem contatos</span>
                        )}
                        {deal.contacts?.length > 5 && (
                          <span className="more-count">+{deal.contacts.length - 5}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="status-badge-wrapper">
                        <span className={`status-badge ${deal.sourceType}`}>
                          {deal.sourceLabel}
                        </span>
                      </div>
                    </td>
                    <td className="td-actions">
                      <button
                        className="icon-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deal.type === 'client') navigate(`/clients/${deal.clientId}`);
                          else if (deal.type === 'pipeline') navigate(`/pipeline`);
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      <ContactDetail
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onUpdate={handleContactUpdated}
      />

      <NewContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContactCreated={(newContact) => setContacts(prev => [...prev, newContact])}
      />

      {/* Floating Action Menu - Moved to Root to avoid overflow clipping */}
      {actionsMenu.isOpen && (
        <div
          className="action-menu-dropdown"
          style={{
            top: actionsMenu.top,
            left: actionsMenu.left,
            position: 'fixed',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actionsMenu.contact.sourceType === 'general' ? (
            <>
              <div className="menu-item" onClick={() => {
                setSelectedContact(actionsMenu.contact);
                setActionsMenu({ isOpen: false, id: null });
              }}>
                Editar
              </div>
              <div className="menu-item delete" onClick={() => {
                alert('Funcionalidade de deletar (TODO)');
                setActionsMenu({ isOpen: false, id: null });
              }}>
                Excluir
              </div>
            </>
          ) : actionsMenu.contact.sourceType === 'pipeline' ? (
            <div className="menu-item" onClick={() => navigate(`/pipeline`)}>
              Ver no Pipeline
            </div>
          ) : (
            <div className="menu-item" onClick={() => navigate(`/clients/${actionsMenu.contact.clientId}`)}>
              Ir para Cliente
            </div>
          )}
        </div>
      )}

      <style>{`
        .contacts-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .view-switcher {
          display: flex;
          background: rgba(0, 0, 0, 0.4);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .switcher-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          background: transparent;
        }

        .switcher-btn.active {
          background: rgba(190, 242, 100, 0.1);
          color: #bef264;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .switcher-btn:hover:not(.active) {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .search-box {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.625rem 0.875rem;
          border-radius: 10px;
          gap: var(--spacing-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-box:focus-within {
          border-color: rgba(190, 242, 100, 0.5);
          background: rgba(190, 242, 100, 0.05);
          box-shadow: 0 0 0 3px rgba(190, 242, 100, 0.1);
        }

        .search-box input {
          border: none;
          outline: none;
          font-size: 0.9rem;
          width: 200px;
          background-color: transparent;
          color: var(--text-primary);
        }

        .search-icon {
          color: var(--text-secondary);
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
          color: #1a1a1a;
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(190, 242, 100, 0.4);
        }

        .contacts-table-container {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          /* overflow: hidden;  -- Removed to prevent popup clipping */
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          position: relative;
        }

        /* Manually apply border radius to first/last cells since container overflow is visible */
        .contacts-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .contacts-table th:first-child { border-top-left-radius: 16px; }
        .contacts-table th:last-child { border-top-right-radius: 16px; }
        .contact-row:last-child td:first-child { border-bottom-left-radius: 16px; }
        .contact-row:last-child td:last-child { border-bottom-right-radius: 16px; }

        .contacts-table th {
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .contacts-table td {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.9rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          vertical-align: middle;
        }

        .contact-row:last-child td {
          border-bottom: none;
        }

        .contact-row:hover td {
          background: rgba(255, 255, 255, 0.04);
        }

        .name-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .td-business {
          padding-left: 1.5rem !important;
        }

        .business-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .business-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 1rem;
          transition: color 0.2s;
        }

        .contact-row:hover .business-name {
          color: #bef264;
        }

        .business-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .avatar-small {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(190, 242, 100, 0.2) 0%, rgba(163, 230, 53, 0.1) 100%);
          color: #bef264;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          border: 2px solid rgba(190, 242, 100, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .contact-row:hover .avatar-small {
          transform: scale(1.1);
          box-shadow: 0 0 12px rgba(190, 242, 100, 0.3);
        }

        .name-info {
          display: flex;
          flex-direction: column;
        }

        .name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .status-badge-wrapper {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .contact-method {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }

        .icon-btn-small {
          padding: 0.5rem;
          border-radius: 8px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .icon-btn-small:hover {
          background: rgba(190, 242, 100, 0.1);
          border-color: rgba(190, 242, 100, 0.3);
          color: #bef264;
          transform: scale(1.05);
        }

        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-badge.onboarding {
            background: rgba(59, 130, 246, 0.15);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .status-badge.maintenance {
            background: rgba(34, 197, 94, 0.15);
            color: #4ade80;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-badge.pipeline {
            background: rgba(249, 115, 22, 0.15);
            color: #fb923c;
            border: 1px solid rgba(249, 115, 22, 0.3);
        }

        .status-badge.general {
            background: rgba(113, 113, 122, 0.2);
            color: #a1a1aa;
            border: 1px solid rgba(113, 113, 122, 0.3);
        }

        .action-menu-dropdown {
            position: absolute;
            background: #18181b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 4px;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            width: 140px;
        }

        .menu-item {
            padding: 8px 12px;
            font-size: 0.85rem;
            color: #e4e4e7;
            cursor: pointer;
            border-radius: 4px;
            transition: content 0.2s;
        }

        .menu-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
        }

        .menu-item.delete {
            color: #ef4444;
        }

        .menu-item.delete:hover {
            background: rgba(239, 68, 68, 0.1);
        }

        .deal-contacts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .deal-contact-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .deal-contact-tag:hover {
          background: rgba(190, 242, 100, 0.1);
          border-color: rgba(190, 242, 100, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .contact-tag-name {
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
        }

        /* Contact Tag Popup Styles */
        .contact-tag-popup {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          width: 240px;
          background: rgba(28, 28, 33, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(190, 242, 100, 0.2);
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .deal-contact-tag:hover .contact-tag-popup {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        .contact-tag-popup::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 8px;
          border-style: solid;
          border-color: rgba(190, 242, 100, 0.2) transparent transparent transparent;
        }

        .popup-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .popup-subtitle {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .popup-contact-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .info-icon {
          color: #bef264;
          flex-shrink: 0;
        }

        .avatar-xs {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #bef264;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 800;
        }

        .more-count {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(190, 242, 100, 0.1);
          border-radius: 50%;
          border-top-color: #bef264;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        /* Business Popup Styles */
        .company-hover-wrapper {
          position: relative;
          display: inline-block;
        }

        .company-text {
          font-weight: 600;
          color: var(--text-primary);
          transition: color 0.2s;
        }

        .company-hover-wrapper:hover .company-text {
          color: #bef264;
          text-decoration: underline;
        }

        .company-popup {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          width: 280px;
          background: rgba(28, 28, 33, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        /* Triangle Arrow */
        .company-popup::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 8px;
          border-style: solid;
          border-color: rgba(255, 255, 255, 0.15) transparent transparent transparent;
        }

        .company-popup::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 7px;
          border-style: solid;
          border-color: #1c1c21 transparent transparent transparent;
          z-index: 1;
        }

        .company-hover-wrapper:hover .company-popup {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          gap: 8px;
        }

        .popup-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: #fff;
          line-height: 1.2;
        }

        .status-badge-small {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .status-badge-small.onboarding { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .status-badge-small.maintenance { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .status-badge-small.pipeline { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
        .status-badge-small.general { background: rgba(113, 113, 122, 0.2); color: #a1a1aa; }

        .popup-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 8px;
        }

        .popup-info-row .label { color: var(--text-secondary); }
        .popup-info-row .value { color: #bef264; font-weight: 600; }

        .popup-contacts-preview {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 8px;
        }

        .popup-contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .more-text {
          font-size: 0.7rem;
          color: #666;
          margin-top: 2px;
        }

        .popup-footer {
          margin-top: 12px;
          font-size: 0.7rem;
          color: #555;
          text-align: center;
          font-style: italic;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Contacts;
