import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, User, Building, Mail, Phone, Briefcase, Plus, Link, Star, ChevronRight, MessageCircle, Instagram, ArrowRight, UserPlus, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

/**
 * UnifiedEntityModal — Popup padronizado reutilizável para:
 * - Criar novo Contato
 * - Criar novo Negócio (Deal)
 * - Vincular Contato existente a um Negócio
 * - Vincular Negócio existente a um Contato/Conversa
 * - Enriquecer dados de contato/negócio existente
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - mode: 'contact' | 'deal' | 'link-contact' | 'link-deal'
 *  - prefill: { name?, email?, phone?, company?, instagram?, whatsapp?, conversationId? }
 *  - dealId?: string (quando vinculando contato a negócio)
 *  - contactId?: string (quando vinculando negócio a contato)
 *  - onSuccess: (result) => void
 */
const UnifiedEntityModal = ({ isOpen, onClose, mode = 'contact', prefill = {}, dealId, contactId, onSuccess }) => {
  const [activeMode, setActiveMode] = useState(mode);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('search'); // 'search' | 'create'

  // Contact selector state (for deal creation)
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showNewContactInline, setShowNewContactInline] = useState(false);
  const [newContactInline, setNewContactInline] = useState({ name: '', email: '', phone: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    instagram: '',
    whatsapp: '',
    roleInDeal: 'Contato'
  });

  const [wasOpen, setWasOpen] = useState(false);

  useEffect(() => {
    // Só inicializar se o modal ACABOU de abrir (estava fechado e agora está aberto)
    if (isOpen && !wasOpen) {
      setActiveMode(mode);
      setFormData({
        name: prefill.name || '',
        email: prefill.email || '',
        phone: prefill.phone || '',
        company: prefill.company || '',
        role: prefill.role || '',
        instagram: prefill.instagram || '',
        whatsapp: prefill.whatsapp || '',
        roleInDeal: 'Contato'
      });
      setSearchTerm('');
      setContactSearchTerm('');
      setShowContactSearch(false);
      setShowNewContactInline(false);
      setNewContactInline({ name: '', email: '', phone: '' });
      setTab(mode === 'link-contact' || mode === 'link-deal' ? 'search' : 'create');
      fetchData();

      // Auto-populate selected contacts
      const autoContacts = [];
      if (contactId && prefill.name) {
        autoContacts.push({ id: contactId, name: prefill.name, email: prefill.email || '', phone: prefill.phone || '', company: prefill.company || '' });
      } else if (prefill.linkedContactId && prefill.linkedContactName) {
        autoContacts.push({ id: prefill.linkedContactId, name: prefill.linkedContactName, email: prefill.linkedContactEmail || '', phone: prefill.linkedContactPhone || '' });
      }
      setSelectedContacts(autoContacts);

      setWasOpen(true);
    } else if (!isOpen && wasOpen) {
      setWasOpen(false);
    }
  }, [isOpen, mode, prefill, contactId, wasOpen]);

  useEffect(() => {
    if (selectedPipeline) {
      fetchStages(selectedPipeline);
    }
  }, [selectedPipeline]);

  const fetchData = async () => {
    const [{ data: contactsData }, { data: dealsData }, { data: pipelinesData }] = await Promise.all([
      supabase.from('contacts').select('*').order('name'),
      supabase.from('central_vendas').select('id, empresa_cliente, nome_contato, stage, tipo_pipeline, instagram, whatsapp').order('empresa_cliente'),
      supabase.from('pipelines').select('id, name')
    ]);
    setContacts(contactsData || []);
    setDeals(dealsData || []);
    setPipelines(pipelinesData || []);
    if (pipelinesData?.length > 0) setSelectedPipeline(pipelinesData[0].id);
  };

  const fetchStages = async (pipelineId) => {
    const { data } = await supabase
      .from('pipeline_stages')
      .select('id, name')
      .eq('pipeline_id', pipelineId)
      .order('position');
    setStages(data || []);
    if (data?.length > 0) setSelectedStage(data[0].id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Criar novo contato
  const handleCreateContact = async () => {
    if (!formData.name.trim()) return alert('Nome é obrigatório');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          role: formData.role
        })
        .select()
        .single();

      if (error) throw error;

      // Se tiver dealId, também vincular
      if (dealId) {
        await supabase.from('deal_contacts').insert({
          deal_id: dealId,
          contact_id: data.id,
          role_in_deal: formData.roleInDeal,
          is_primary: false
        });
      }

      onSuccess?.({ type: 'contact-created', data });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar contato: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo negócio
  const handleCreateDeal = async () => {
    if (!formData.company.trim()) return alert('Nome da empresa é obrigatório');
    if (!selectedStage) return alert('Selecione uma fase');
    setLoading(true);
    try {
      // Pegar usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Você precisa estar logado para criar um negócio');
      }

      const pipeline = pipelines.find(p => p.id === selectedPipeline);
      const primaryContact = selectedContacts[0];

      const { data, error } = await supabase
        .from('central_vendas')
        .insert({
          empresa_cliente: formData.company,
          nome_contato: primaryContact?.name || '',
          stage: selectedStage,
          origem: 'Manual',
          status_contrato: 'Identificado',
          faturamento_mensal: 0,
          instagram_username: formData.instagram, // Agora usando username ao invés de ID
          whatsapp: formData.whatsapp,
          tipo_pipeline: pipeline?.name === 'Ativo' ? 'Ativo_Diagnostico' : 'Receptivo',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Vincular todos os contatos selecionados
      if (selectedContacts.length > 0) {
        const linkInserts = selectedContacts.map((c, idx) => ({
          deal_id: data.id,
          contact_id: c.id,
          role_in_deal: 'Contato',
          is_primary: idx === 0
        }));
        await supabase.from('deal_contacts').insert(linkInserts);
      }

      onSuccess?.({ type: 'deal-created', data });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar negócio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar contato inline (dentro do form de deal)
  const handleCreateContactInline = async () => {
    if (!newContactInline.name.trim()) return alert('Nome é obrigatório');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: newContactInline.name,
          email: newContactInline.email,
          phone: newContactInline.phone,
          company: formData.company
        })
        .select()
        .single();
      if (error) throw error;
      setSelectedContacts(prev => [...prev, data]);
      setNewContactInline({ name: '', email: '', phone: '' });
      setShowNewContactInline(false);
      // Refresh contacts list
      const { data: refreshed } = await supabase.from('contacts').select('*').order('name');
      setContacts(refreshed || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar contato: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContactForDeal = (contact) => {
    if (selectedContacts.find(c => c.id === contact.id)) return; // already added
    setSelectedContacts(prev => [...prev, contact]);
    setContactSearchTerm('');
    setShowContactSearch(false);
  };

  const handleRemoveContactFromDeal = (contactId) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const contactSearchResults = useMemo(() => {
    if (!contactSearchTerm) return contacts.slice(0, 8);
    const term = contactSearchTerm.toLowerCase();
    return contacts.filter(c =>
      (c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term)) &&
      !selectedContacts.find(sc => sc.id === c.id)
    ).slice(0, 8);
  }, [contacts, contactSearchTerm, selectedContacts]);

  // Vincular contato existente ao deal ou conversa
  const handleLinkContact = async (contact) => {
    setLoading(true);
    try {
      // 1. Se estivermos dentro de um contexto de Negócio (Deal)
      if (dealId) {
        await supabase.from('deal_contacts').insert({
          deal_id: dealId,
          contact_id: contact.id,
          role_in_deal: 'Contato',
          is_primary: false
        });
      }

      // 2. Se tivermos um context de Conversa
      if (prefill.conversationId) {
        const { data: convData } = await supabase
          .from('social_conversations')
          .select('metadata')
          .eq('id', prefill.conversationId)
          .single();

        await supabase
          .from('social_conversations')
          .update({
            metadata: {
              ...(convData?.metadata || {}),
              linked_contact_id: contact.id
            }
          })
          .eq('id', prefill.conversationId);
      }

      onSuccess?.({ type: 'contact-linked', data: contact });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao vincular: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Vincular negócio existente ao contato/conversa
  const handleLinkDeal = async (deal) => {
    setLoading(true);
    try {
      if (contactId) {
        await supabase.from('deal_contacts').insert({
          deal_id: deal.id,
          contact_id: contactId,
          role_in_deal: 'Contato',
          is_primary: false
        });
      }

      // Se tem conversationId no prefill, atualizar metadata
      if (prefill.conversationId) {
        const { data: convData } = await supabase
          .from('social_conversations')
          .select('metadata')
          .eq('id', prefill.conversationId)
          .single();

        await supabase
          .from('social_conversations')
          .update({
            metadata: {
              ...(convData?.metadata || {}),
              linked_deal_id: deal.id,
              company_name: deal.empresa_cliente
            }
          })
          .eq('id', prefill.conversationId);
      }

      onSuccess?.({ type: 'deal-linked', data: deal });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao vincular: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts.slice(0, 20);
    const term = searchTerm.toLowerCase();
    return contacts.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.phone?.includes(term)
    ).slice(0, 20);
  }, [contacts, searchTerm]);

  const filteredDeals = useMemo(() => {
    if (!searchTerm) return deals.slice(0, 20);
    const term = searchTerm.toLowerCase();
    return deals.filter(d =>
      d.empresa_cliente?.toLowerCase().includes(term) ||
      d.nome_contato?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [deals, searchTerm]);

  if (!isOpen) return null;

  const isLinkMode = activeMode === 'link-contact' || activeMode === 'link-deal';
  const isContactMode = activeMode === 'contact' || activeMode === 'link-contact';

  const getTitle = () => {
    switch (activeMode) {
      case 'contact': return 'Novo Contato';
      case 'deal': return 'Novo Negócio';
      case 'link-contact': return 'Vincular Contato';
      case 'link-deal': return 'Vincular Negócio';
      default: return 'Entidade';
    }
  };

  return (
    <div className="uem-overlay" onClick={onClose}>
      <div className="uem-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="uem-header">
          <div className="uem-title-row">
            <h2>{getTitle()}</h2>
            <button className="uem-close" onClick={onClose}><X size={20} /></button>
          </div>

          {/* Mode Tabs - se veio de link, permitir alternar search/create */}
          {isLinkMode && (
            <div className="uem-tabs">
              <button className={`uem-tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
                <Search size={14} /> Buscar Existente
              </button>
              <button className={`uem-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                <Plus size={14} /> Criar Novo
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="uem-body">
          {/* SEARCH TAB */}
          {tab === 'search' && isLinkMode && (
            <>
              <div className="uem-search-bar">
                <Search size={16} />
                <input
                  placeholder={isContactMode ? 'Buscar contato por nome, email ou telefone...' : 'Buscar negócio por empresa ou contato...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="uem-results">
                {isContactMode ? (
                  filteredContacts.length === 0 ? (
                    <div className="uem-empty">
                      <p>Nenhum contato encontrado</p>
                      <button className="uem-empty-btn" onClick={() => setTab('create')}>
                        <Plus size={14} /> Criar novo contato
                      </button>
                    </div>
                  ) : filteredContacts.map(c => (
                    <div key={c.id} className="uem-result-item" onClick={() => handleLinkContact(c)}>
                      <div className="uem-result-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                      <div className="uem-result-info">
                        <span className="uem-result-name">{c.name}</span>
                        <span className="uem-result-meta">
                          {c.company && <span>{c.company}</span>}
                          {c.email && <span>• {c.email}</span>}
                        </span>
                      </div>
                      <ArrowRight size={16} className="uem-result-arrow" />
                    </div>
                  ))
                ) : (
                  filteredDeals.length === 0 ? (
                    <div className="uem-empty">
                      <p>Nenhum negócio encontrado</p>
                      <button className="uem-empty-btn" onClick={() => setTab('create')}>
                        <Plus size={14} /> Criar novo negócio
                      </button>
                    </div>
                  ) : filteredDeals.map(d => (
                    <div key={d.id} className="uem-result-item" onClick={() => handleLinkDeal(d)}>
                      <div className="uem-result-avatar biz">{d.empresa_cliente?.charAt(0).toUpperCase()}</div>
                      <div className="uem-result-info">
                        <span className="uem-result-name">{d.empresa_cliente}</span>
                        <span className="uem-result-meta">
                          {d.nome_contato && <span>{d.nome_contato}</span>}
                          <span>• {d.tipo_pipeline === 'Ativo_Diagnostico' ? 'Ativo' : 'Receptivo'}</span>
                        </span>
                      </div>
                      <ArrowRight size={16} className="uem-result-arrow" />
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* CREATE TAB */}
          {(tab === 'create' || !isLinkMode) && (
            <div className="uem-form">
              {(activeMode === 'contact' || (isLinkMode && isContactMode)) && (
                <>
                  <div className="uem-form-row">
                    <div className="uem-field">
                      <label><User size={14} /> Nome *</label>
                      <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome completo" autoFocus />
                    </div>
                  </div>
                  <div className="uem-form-row two">
                    <div className="uem-field">
                      <label><Mail size={14} /> Email</label>
                      <input name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" />
                    </div>
                    <div className="uem-field">
                      <label><Phone size={14} /> Telefone</label>
                      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+55 11 99999-9999" />
                    </div>
                  </div>
                  <div className="uem-form-row two">
                    <div className="uem-field">
                      <label><Building size={14} /> Empresa</label>
                      <input name="company" value={formData.company} onChange={handleChange} placeholder="Nome da empresa" />
                    </div>
                    <div className="uem-field">
                      <label><Briefcase size={14} /> Cargo</label>
                      <input name="role" value={formData.role} onChange={handleChange} placeholder="Ex: Director" />
                    </div>
                  </div>
                  {dealId && (
                    <div className="uem-form-row">
                      <div className="uem-field">
                        <label><Star size={14} /> Papel no Negócio</label>
                        <select name="roleInDeal" value={formData.roleInDeal} onChange={handleChange}>
                          <option value="Contato">Contato</option>
                          <option value="Dono">Dono</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Decisor">Decisor</option>
                          <option value="Influenciador">Influenciador</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(activeMode === 'deal' || (isLinkMode && !isContactMode)) && (
                <>
                  <div className="uem-form-row">
                    <div className="uem-field">
                      <label><Building size={14} /> Nome da Empresa *</label>
                      <input name="company" value={formData.company} onChange={handleChange} placeholder="Ex: Empresa XYZ" autoFocus />
                    </div>
                  </div>

                  {/* === Contact Selector === */}
                  <div className="uem-contact-selector">
                    <div className="uem-cs-header">
                      <label><User size={14} /> Contatos Vinculados</label>
                      <div className="uem-cs-actions">
                        <button type="button" className="uem-cs-action" onClick={() => { setShowContactSearch(!showContactSearch); setShowNewContactInline(false); }}>
                          <Search size={13} /> Buscar
                        </button>
                        <button type="button" className="uem-cs-action" onClick={() => { setShowNewContactInline(!showNewContactInline); setShowContactSearch(false); }}>
                          <UserPlus size={13} /> Novo
                        </button>
                      </div>
                    </div>

                    {/* Already selected contacts */}
                    {selectedContacts.length > 0 && (
                      <div className="uem-cs-chips">
                        {selectedContacts.map((c, idx) => (
                          <div key={c.id} className={`uem-cs-chip ${idx === 0 ? 'primary' : ''}`}>
                            <div className="uem-cs-chip-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                            <div className="uem-cs-chip-info">
                              <span className="uem-cs-chip-name">{c.name}</span>
                              {c.email && <span className="uem-cs-chip-meta">{c.email}</span>}
                            </div>
                            {idx === 0 && <span className="uem-cs-primary-badge">Principal</span>}
                            <button type="button" className="uem-cs-chip-remove" onClick={() => handleRemoveContactFromDeal(c.id)}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedContacts.length === 0 && !showContactSearch && !showNewContactInline && (
                      <div className="uem-cs-empty">
                        <User size={18} style={{ opacity: 0.3 }} />
                        <span>Nenhum contato vinculado</span>
                      </div>
                    )}

                    {/* Contact Search */}
                    {showContactSearch && (
                      <div className="uem-cs-search-area">
                        <div className="uem-cs-search-input">
                          <Search size={14} />
                          <input
                            placeholder="Buscar contato..."
                            value={contactSearchTerm}
                            onChange={e => setContactSearchTerm(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="uem-cs-search-results">
                          {contactSearchResults.length === 0 ? (
                            <div className="uem-cs-no-results">
                              <span>Nenhum encontrado</span>
                              <button type="button" onClick={() => { setShowNewContactInline(true); setShowContactSearch(false); setNewContactInline(prev => ({ ...prev, name: contactSearchTerm })); }}>
                                <Plus size={12} /> Criar "{contactSearchTerm}"
                              </button>
                            </div>
                          ) : contactSearchResults.map(c => (
                            <div key={c.id} className="uem-cs-search-item" onClick={() => handleSelectContactForDeal(c)}>
                              <div className="uem-cs-search-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                              <div className="uem-cs-search-info">
                                <span>{c.name}</span>
                                <span className="uem-cs-search-sub">{[c.company, c.email].filter(Boolean).join(' · ') || 'Sem info'}</span>
                              </div>
                              <Plus size={14} className="uem-cs-search-plus" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Contact Inline */}
                    {showNewContactInline && (
                      <div className="uem-cs-new-form">
                        <h4><UserPlus size={14} /> Criar novo contato</h4>
                        <div className="uem-cs-new-fields">
                          <input placeholder="Nome *" value={newContactInline.name} onChange={e => setNewContactInline(prev => ({ ...prev, name: e.target.value }))} autoFocus />
                          <input placeholder="Email" value={newContactInline.email} onChange={e => setNewContactInline(prev => ({ ...prev, email: e.target.value }))} />
                          <input placeholder="Telefone" value={newContactInline.phone} onChange={e => setNewContactInline(prev => ({ ...prev, phone: e.target.value }))} />
                        </div>
                        <div className="uem-cs-new-actions">
                          <button type="button" className="uem-cs-new-cancel" onClick={() => setShowNewContactInline(false)}>Cancelar</button>
                          <button type="button" className="uem-cs-new-confirm" onClick={handleCreateContactInline} disabled={loading}>
                            <Check size={14} /> {loading ? 'Criando...' : 'Criar e Vincular'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="uem-form-row two">
                    <div className="uem-field">
                      <label>Pipeline</label>
                      <select value={selectedPipeline} onChange={e => setSelectedPipeline(e.target.value)}>
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="uem-field">
                      <label>Fase</label>
                      <select value={selectedStage} onChange={e => setSelectedStage(e.target.value)}>
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="uem-form-row two">
                    <div className="uem-field">
                      <label><Instagram size={14} /> Instagram</label>
                      <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@usuario" />
                    </div>
                    <div className="uem-field">
                      <label><MessageCircle size={14} /> WhatsApp</label>
                      <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+55 11 99999-9999" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(tab === 'create' || !isLinkMode) && (
          <div className="uem-footer">
            <button className="uem-btn-cancel" onClick={onClose}>Cancelar</button>
            <button
              className="uem-btn-confirm"
              onClick={isContactMode ? handleCreateContact : handleCreateDeal}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (
                <>
                  <Plus size={16} />
                  {isContactMode ? 'Criar Contato' : 'Criar Negócio'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .uem-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: uemFadeIn 0.2s ease;
        }

        @keyframes uemFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes uemSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .uem-modal {
          background: linear-gradient(160deg, #1a1a24 0%, #12121a 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          width: 100%;
          max-width: 540px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03);
          animation: uemSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .uem-header {
          padding: 1.5rem 1.75rem 0 1.75rem;
        }

        .uem-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .uem-title-row h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .uem-close {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #999;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .uem-close:hover {
          background: rgba(255, 80, 80, 0.1);
          border-color: rgba(255, 80, 80, 0.3);
          color: #ff6b6b;
        }

        .uem-tabs {
          display: flex;
          gap: 4px;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 0;
        }

        .uem-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #888;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .uem-tab.active {
          background: rgba(132, 204, 22, 0.15);
          color: #84cc16;
        }
        .uem-tab:hover:not(.active) {
          color: #ccc;
          background: rgba(255, 255, 255, 0.03);
        }

        .uem-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.75rem;
        }

        /* === Search === */
        .uem-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 1rem;
          transition: border-color 0.2s;
        }
        .uem-search-bar:focus-within {
          border-color: rgba(132, 204, 22, 0.4);
        }
        .uem-search-bar svg { color: #666; flex-shrink: 0; }
        .uem-search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 0.9rem;
        }

        .uem-results {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .uem-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .uem-result-item:hover {
          background: rgba(132, 204, 22, 0.06);
          border-color: rgba(132, 204, 22, 0.15);
        }

        .uem-result-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(132, 204, 22, 0.15), rgba(101, 163, 13, 0.08));
          color: #84cc16;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.95rem;
          flex-shrink: 0;
          border: 1.5px solid rgba(132, 204, 22, 0.2);
        }
        .uem-result-avatar.biz {
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08));
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.2);
        }

        .uem-result-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .uem-result-name {
          font-weight: 600;
          color: #fff;
          font-size: 0.9rem;
        }
        .uem-result-meta {
          display: flex;
          gap: 6px;
          font-size: 0.78rem;
          color: #666;
          margin-top: 2px;
        }

        .uem-result-arrow {
          color: #444;
          flex-shrink: 0;
          transition: color 0.2s, transform 0.2s;
        }
        .uem-result-item:hover .uem-result-arrow {
          color: #84cc16;
          transform: translateX(2px);
        }

        .uem-empty {
          text-align: center;
          padding: 2rem 0;
          color: #666;
        }
        .uem-empty p {
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .uem-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(132, 204, 22, 0.1);
          color: #84cc16;
          border: 1px solid rgba(132, 204, 22, 0.25);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .uem-empty-btn:hover {
          background: #84cc16;
          color: #000;
        }

        /* === Form === */
        .uem-form {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .uem-form-row {
          display: flex;
          gap: 12px;
        }
        .uem-form-row.two .uem-field {
          flex: 1;
        }

        .uem-field {
          flex: 1;
          margin-bottom: 12px;
        }
        .uem-field label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 6px;
        }
        .uem-field label svg {
          color: #555;
        }
        .uem-field input, .uem-field select {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #fff;
          font-size: 0.9rem;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .uem-field input:focus, .uem-field select:focus {
          outline: none;
          border-color: rgba(132, 204, 22, 0.4);
        }
        .uem-field input::placeholder {
          color: #444;
        }

        /* === Footer === */
        .uem-footer {
          padding: 1rem 1.75rem 1.5rem;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .uem-btn-cancel {
          padding: 10px 20px;
          background: transparent;
          color: #888;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .uem-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ccc;
        }

        .uem-btn-confirm {
          padding: 10px 24px;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          color: #000;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          font-size: 0.9rem;
          box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
        }
        .uem-btn-confirm:hover {
          background: linear-gradient(135deg, #65a30d, #4d7c0f);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(132, 204, 22, 0.35);
        }
        .uem-btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* === Contact Selector === */
        .uem-contact-selector {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .uem-cs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .uem-cs-header label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .uem-cs-actions {
          display: flex;
          gap: 4px;
        }
        .uem-cs-action {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #888;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .uem-cs-action:hover {
          background: rgba(132,204,22,0.1);
          border-color: rgba(132,204,22,0.25);
          color: #84cc16;
        }

        /* Chips for selected contacts */
        .uem-cs-chips {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 8px;
        }
        .uem-cs-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          transition: all 0.2s;
        }
        .uem-cs-chip.primary {
          border-color: rgba(251, 191, 36, 0.25);
          background: rgba(251, 191, 36, 0.04);
        }
        .uem-cs-chip-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(132,204,22,0.15), rgba(101,163,13,0.06));
          color: #84cc16;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.78rem;
          flex-shrink: 0;
        }
        .uem-cs-chip-info { flex: 1; min-width: 0; }
        .uem-cs-chip-name { font-weight: 600; color: #fff; font-size: 0.82rem; display: block; }
        .uem-cs-chip-meta { font-size: 0.7rem; color: #555; }
        .uem-cs-primary-badge {
          font-size: 0.65rem; font-weight: 700;
          background: rgba(251,191,36,0.15); color: #fbbf24;
          padding: 2px 6px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.3px;
        }
        .uem-cs-chip-remove {
          background: transparent; border: none; color: #555;
          cursor: pointer; padding: 3px; border-radius: 4px;
          transition: all 0.2s;
        }
        .uem-cs-chip-remove:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

        .uem-cs-empty {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 0;
          color: #444; font-size: 0.82rem;
        }

        /* Contact Search within deal form */
        .uem-cs-search-area {
          margin-top: 4px;
        }
        .uem-cs-search-input {
          display: flex; align-items: center; gap: 8px;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 8px 10px;
          margin-bottom: 6px;
        }
        .uem-cs-search-input:focus-within { border-color: rgba(132,204,22,0.3); }
        .uem-cs-search-input svg { color: #555; flex-shrink: 0; }
        .uem-cs-search-input input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #fff; font-size: 0.85rem;
        }
        .uem-cs-search-input input::placeholder { color: #444; }

        .uem-cs-search-results {
          max-height: 200px;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 2px;
        }
        .uem-cs-search-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 8px; border-radius: 6px;
          cursor: pointer; transition: all 0.15s;
        }
        .uem-cs-search-item:hover { background: rgba(132,204,22,0.06); }
        .uem-cs-search-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
          color: #888; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.72rem; flex-shrink: 0;
        }
        .uem-cs-search-info {
          flex: 1; min-width: 0;
        }
        .uem-cs-search-info span:first-child {
          display: block; font-size: 0.82rem; color: #ccc; font-weight: 500;
        }
        .uem-cs-search-sub {
          font-size: 0.7rem; color: #555;
        }
        .uem-cs-search-plus {
          color: #444; flex-shrink: 0; transition: color 0.2s;
        }
        .uem-cs-search-item:hover .uem-cs-search-plus { color: #84cc16; }

        .uem-cs-no-results {
          padding: 10px 0; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .uem-cs-no-results span { color: #555; font-size: 0.82rem; }
        .uem-cs-no-results button {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(132,204,22,0.1); color: #84cc16;
          border: 1px solid rgba(132,204,22,0.2); border-radius: 6px;
          padding: 5px 10px; font-size: 0.75rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .uem-cs-no-results button:hover { background: #84cc16; color: #000; }

        /* New Contact Inline */
        .uem-cs-new-form {
          background: rgba(132,204,22,0.03);
          border: 1px solid rgba(132,204,22,0.12);
          border-radius: 8px; padding: 10px;
          margin-top: 4px;
        }
        .uem-cs-new-form h4 {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.78rem; font-weight: 600; color: #84cc16;
          margin: 0 0 8px 0;
        }
        .uem-cs-new-fields {
          display: flex; gap: 6px; margin-bottom: 8px;
        }
        .uem-cs-new-fields input {
          flex: 1; padding: 7px 8px;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; color: #fff; font-size: 0.82rem;
        }
        .uem-cs-new-fields input:focus { outline: none; border-color: rgba(132,204,22,0.3); }
        .uem-cs-new-fields input::placeholder { color: #444; }
        .uem-cs-new-actions {
          display: flex; gap: 6px; justify-content: flex-end;
        }
        .uem-cs-new-cancel {
          padding: 5px 12px; background: transparent; color: #888;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 6px;
          font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
        }
        .uem-cs-new-cancel:hover { background: rgba(255,255,255,0.05); color: #ccc; }
        .uem-cs-new-confirm {
          padding: 5px 12px;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          color: #000; border: none; border-radius: 6px;
          font-size: 0.78rem; font-weight: 700;
          display: flex; align-items: center; gap: 4px;
          cursor: pointer; transition: all 0.2s;
        }
        .uem-cs-new-confirm:hover { opacity: 0.9; }
        .uem-cs-new-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default UnifiedEntityModal;
