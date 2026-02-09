import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    rectIntersection // Better for columns
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import {
    Plus,
    Search,
    Filter,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Target
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import StatCard from '../components/dashboard/StatCard';
import Column from '../components/Deals/Column';
import NewDealModal from '../components/Deals/NewDealModal';
import ImportModal from '../components/Import/ImportModal';
import DealCard, { DealCardContent } from '../components/Deals/DealCard';
import EditDealModal from '../components/Deals/EditDealModal'; // Import Edit Modal
import { useAuth } from '../contexts/AuthContext'; // Import Auth Context
import { toast } from 'sonner';
import { getSyncColor } from '../utils/colors';

const Pipeline = () => {
    const { id: routePipelineId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Scroll Ref for Buttons
    const scrollContainerRef = useRef(null);

    // State
    const [activePipeline, setActivePipeline] = useState('Receptivo');
    const [columns, setColumns] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [pipelineTitle, setPipelineTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isCreatePipelineModalOpen, setIsCreatePipelineModalOpen] = useState(false);
    const [kpiStats, setKpiStats] = useState({ total: { count: 0, value: 0 } });

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOwner, setFilterOwner] = useState('all'); // 'all' | 'me'
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // State for Scroll Buttons
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1); // -1 tolerance
        }
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            // Initial check
            checkScroll();
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (el) el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [columns]); // Re-check when columns change/layout shifts

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
        }
    };

    // PIPELINE DEFINITIONS - STANDARDIZED IDs (v2.0)
    const PIPELINE_CONFIG = {
        'Receptivo': {
            title: 'Pipeline Receptivo (Inbound)',
            columns: [
                { id: 'receptivo_lead', title: 'Novo Lead', color: getSyncColor('Novo Lead') },
                { id: 'receptivo_qualificacao', title: 'Qualificação Rápida', color: getSyncColor('Qualificação Rápida') },
                { id: 'receptivo_agendada', title: 'RVP Agendada', color: getSyncColor('RVP Agendada') },
                { id: 'receptivo_proposta', title: 'Proposta/Contrato', color: getSyncColor('Proposta/Contrato') },
                { id: 'receptivo_fechamento', title: 'Fechamento', color: getSyncColor('Fechamento') }
            ]
        },
        'Ativo': {
            title: 'Pipeline Ativo (Diagnóstico)',
            columns: [
                { id: 'ativo_abordagem', title: 'Abordagem Diagnóstico', color: getSyncColor('Abordagem Diagnóstico') },
                { id: 'ativo_aguardando', title: 'Aguardando Resposta', color: getSyncColor('Aguardando Resposta') },
                { id: 'ativo_rvp', title: 'RVP de Solução', color: getSyncColor('RVP de Solução') },
                { id: 'ativo_proposta', title: 'Proposta/Contrato', color: getSyncColor('Proposta/Contrato') },
                { id: 'ativo_followup', title: 'Follow-up de Decisão', color: getSyncColor('Follow-up de Decisão') }
            ]
        }
    };

    // Sync pipeline from URL
    useEffect(() => {
        // Reset states to prevent race conditions during navigation
        setLoading(true);
        setDeals([]);
        setColumns([]);

        console.log('Route Pipeline ID changed:', routePipelineId);
        if (routePipelineId === 'new') {
            setIsCreatePipelineModalOpen(true);
            setLoading(false);
        } else if (routePipelineId) {
            fetchPipelineName(routePipelineId);
        } else {
            // Root View (/pipeline) - Default to Receptivo Standard
            setActivePipeline('Receptivo');
            setPipelineTitle('Pipeline Padrão');
            setColumns(PIPELINE_CONFIG['Receptivo'].columns);
            // fetchCentralDeals will be triggered by columns.length dependency
        }
    }, [routePipelineId]);

    const fetchPipelineName = async (id) => {
        try {
            const { data, error } = await supabase.from('pipelines').select('id, name, type').eq('id', id).single();

            if (error) return;

            if (data) {
                // Use 'type' column for logic if available (preferred)
                let mappedType = data.type;

                // Fallback to name matching if 'type' is missing (pre-migration)
                if (!mappedType) {
                    const name = data.name;
                    if (name.includes('Receptivo') || name === 'Pipeline Padrão') {
                        mappedType = 'Receptivo';
                    }
                    else if (name.includes('Ativo') || name === 'Prospecção Fria') {
                        mappedType = 'Ativo';
                    }
                }

                if (mappedType) {
                    setActivePipeline(mappedType);
                    fetchPipelineStages(id, mappedType);
                }

                // Set Display Title
                setPipelineTitle(data.name);
            }
        } catch (e) {
            console.error('Error syncing pipeline', e);
        }
    };

    // AUTO-MIGRATION LOGIC (Internal Repair)
    const autoMigratePipeline = async (pipelineId, type) => {
        console.log(`Starting auto-migration for ${type}...`);
        try {
            // 1. Try to fetch from LEGACY 'columns' table first
            const { data: legacyCols } = await supabase.from('columns').select('*').eq('pipeline_id', pipelineId).order('position');

            let stagesToInsert = [];

            if (legacyCols && legacyCols.length > 0) {
                console.log('Legacy columns found, migrating...');
                stagesToInsert = legacyCols.map((col, index) => ({
                    id: col.id,
                    pipeline_id: pipelineId,
                    name: col.title || col.name || `Etapa ${index + 1}`,
                    position: col.position || index,
                    color: col.color || '#3b82f6'
                }));
            } else {
                // 2. Fallback to Standard Seed if no legacy columns exist
                console.log('No legacy columns, seeding from config...');
                const initialColumns = PIPELINE_CONFIG[type].columns;
                stagesToInsert = initialColumns.map((col, index) => ({
                    id: col.id,
                    pipeline_id: pipelineId,
                    name: col.title,
                    position: index,
                    color: col.color
                }));
            }

            const { error } = await supabase.from('pipeline_stages').insert(stagesToInsert);

            if (!error) {
                console.log('Migration successful. Reloading stages...');
                // Return mapped objects for the caller to update state immediately
                return stagesToInsert.map(s => ({
                    id: s.id,
                    pipeline_id: s.pipeline_id,
                    title: s.name,
                    color: s.color,
                    position: s.position
                }));
            }
        } catch (err) {
            console.error('Migration failed', err);
        }
        return null;
    };

    const fetchPipelineStages = async (pipelineId, type) => {
        try {
            const { data: stages, error } = await supabase
                .from('pipeline_stages')
                .select('*')
                .eq('pipeline_id', pipelineId)
                .order('position', { ascending: true });

            if (error) throw error;

            let finalStages = stages;

            // CHECK & MIGRATE
            // 1. If empty -> Seed
            // 2. If has legacy IDs (e.g. "Novo Lead" instead of "receptivo_lead") -> Migrate

            const hasLegacyIds = stages && stages.some(s => s.id.includes(' ') || !s.id.includes('_'));
            const isEmpty = !stages || stages.length === 0;

            if (isEmpty || hasLegacyIds) {
                const migrated = await autoMigratePipeline(pipelineId, type);
                if (migrated) finalStages = migrated;
            }

            if (finalStages && finalStages.length > 0) {
                // 1. Reserved Semantic Colors
                const COLOR_WON = '#10b981'; // Emerald-500
                const COLOR_LOST = '#ef4444'; // Red-500

                // 2. Positional Gradient (Cold -> Hot), EXCLUDING Red/Green
                // 2. Positional Gradient Spectrum (Cold -> Hot)
                const GRADIENT_SPECTRUM = [
                    '#3b82f6', // 0% - Blue
                    '#4f46e5', // 14% - Indigo
                    '#7c3aed', // 28% - Violet
                    '#a855f7', // 42% - Purple
                    '#c026d3', // 57% - Fuchsia
                    '#db2777', // 71% - Pink
                    '#f97316', // 85% - Orange
                    '#f59e0b'  // 100% - Amber
                ];

                // Helper to check for semantic roles (STRICT MODE)
                // "Exclusivamente" verde para Fechado/Ganho
                const isWon = (name) => ['fechamento', 'fechado', 'ganho'].some(k => name.toLowerCase().includes(k));

                // "Exclusivamente" vermelho para Perdido/Cancelado
                const isLost = (name) => ['perdido', 'cancelado', 'no show'].some(k => name.toLowerCase().includes(k));

                // Filter Standard Stages
                const standardStages = finalStages.filter(s => !isWon(s.name) && !isLost(s.name));
                const totalStandard = standardStages.length;

                setColumns(finalStages.map((s, index) => {
                    // 1. Semantic Overrides (Fixed)
                    if (isWon(s.name)) return { ...s, pipeline_id: s.pipeline_id || pipelineId, title: s.name, color: COLOR_WON, position: s.position };
                    if (isLost(s.name)) return { ...s, pipeline_id: s.pipeline_id || pipelineId, title: s.name, color: COLOR_LOST, position: s.position };

                    // 2. Elastic Gradient Calculation
                    // Find the rank of this stage among standard stages
                    const standardIndex = standardStages.findIndex(st => st.id === s.id);

                    let color;
                    if (standardIndex === -1) {
                        color = GRADIENT_SPECTRUM[0]; // Fallback
                    } else if (totalStandard <= 1) {
                        color = GRADIENT_SPECTRUM[0]; // Only one standard col -> Blue
                    } else {
                        // Calculate percentage position (0 to 1)
                        const t = standardIndex / (totalStandard - 1);
                        // Map to spectrum index
                        const spectrumIndex = Math.min(
                            Math.floor(t * (GRADIENT_SPECTRUM.length - 1)),
                            GRADIENT_SPECTRUM.length - 1
                        );
                        color = GRADIENT_SPECTRUM[spectrumIndex];
                    }

                    return {
                        id: s.id,
                        pipeline_id: s.pipeline_id || pipelineId,
                        title: s.name,
                        color: color,
                        position: s.position
                    };
                }));
            }
        } catch (error) {
            console.error('Error fetching/migrating stages:', error);
            if (type) setColumns(PIPELINE_CONFIG[type].columns);
        }
    };

    // ... (rendering code, Removing Button)
    // No button rendered here.


    useEffect(() => {
        // HARD Barrier: Wait for all metadata before fetching deals
        const isCustom = !!routePipelineId;
        const hasNeededMetadata = isCustom ? (columns.length > 0 && pipelineTitle) : true;

        const isReady = activePipeline && hasNeededMetadata;

        if (isReady) {
            console.log(`%c 🚀 PIPELINE READY: type=${activePipeline}, route=${routePipelineId || 'standard'}, cols=${columns.length}`, 'color: #bef264; font-weight: bold;');
            fetchCentralDeals();
        } else {
            console.log(`%c ⏳ Pipeline waiting for metadata... (cols: ${columns.length})`, 'color: #f59e0b;');
        }
    }, [activePipeline, columns.length, routePipelineId, pipelineTitle]);

    const fetchCentralDeals = async () => {
        try {
            setLoading(true);
            // setColumns removed - handled by fetchPipelineStages

            let query = supabase
                .from('central_vendas')
                .select('*')
                .eq('tipo_pipeline', activePipeline === 'Ativo' ? 'Ativo_Diagnostico' : 'Receptivo');

            const { data, error } = await query;
            if (error) throw error;

            const validColumnIds = columns.length > 0
                ? columns.map(c => c.id)
                : PIPELINE_CONFIG[activePipeline].columns.map(c => c.id);

            const defaultColumnId = validColumnIds[0];

            const formatted = data.map(d => {
                // Determine Final Stage with ID vs Title matching logic
                let finalStage = d.stage;
                const isIdValid = validColumnIds.includes(d.stage);

                if (!isIdValid && columns.length > 0) {
                    // Try to match by Title (case insensitive)
                    const matchingCol = columns.find(c => c.title?.toLowerCase() === d.stage?.toLowerCase())
                        || PIPELINE_CONFIG[activePipeline].columns.find(c => c.title?.toLowerCase() === d.stage?.toLowerCase());

                    if (matchingCol) {
                        finalStage = matchingCol.id;
                    }
                    // CRITICAL: If still not found and it looks like a technical ID (contains _ or is standard), reset.
                    // If it's a UUID, we keep it as is - don't force reset if columns weren't ready to handle it.
                    else if (!d.stage?.includes('-')) {
                        finalStage = defaultColumnId;
                    }
                }

                return {
                    ...d,
                    id: d.id,
                    title: d.empresa_cliente,
                    company: d.empresa_cliente,
                    contact_name: d.nome_contato, // New field mapping
                    value: d.faturamento_mensal,
                    faturamento: d.faturamento_mensal,
                    columnId: finalStage,
                    stage: finalStage, // Ensure consistent internally
                    user_id: d.created_by,
                    status_contrato: d.status_contrato,
                    tags: d.status_contrato === 'Gerado' ? ['Contrato Gerado'] : []
                };
            });

            console.log('Fetched & Normalized Deals:', formatted);
            setDeals(formatted);


        } catch (error) {
            console.error('Error fetching central deals:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleCreatePipeline = async (name, type) => {
        try {
            // 1. Create Pipeline
            const { data: pipeline, error } = await supabase
                .from('pipelines')
                .insert({ name, type })
                .select()
                .single();

            if (error) throw error;

            // 2. Seed Default Stages
            const initialColumns = PIPELINE_CONFIG[type].columns;
            const stagesToInsert = initialColumns.map((col, index) => ({
                id: `stage_${Date.now()}_${index}`, // Unique logic ID
                pipeline_id: pipeline.id,
                name: col.title,
                position: index,
                color: col.color
            }));

            await supabase.from('pipeline_stages').insert(stagesToInsert);

            // 3. Navigate and Close
            setIsCreatePipelineModalOpen(false);
            navigate(`/pipeline/${pipeline.id}`);

            // Force refresh of sidebar list (hacky, ideally ctx)
            window.location.reload();
        } catch (error) {
            console.error('Error creating pipeline:', error);
            alert('Erro ao criar pipeline');
        }
    };

    const handleUpdatePipelineTitle = async (newTitle) => {
        setPipelineTitle(newTitle);
        if (routePipelineId) {
            try {
                await supabase.from('pipelines').update({ name: newTitle }).eq('id', routePipelineId);
            } catch (error) {
                console.error('Error updating pipeline title:', error);
            }
        }
    };

    // Sync KPIs whenever deals change
    useEffect(() => {
        if (deals.length >= 0) {
            // Define Semantic Helpers locally (or move to utils)
            const isWon = (name) => ['fechamento', 'fechado', 'ganho'].some(k => name?.toLowerCase().includes(k));
            const isLost = (name) => ['perdido', 'cancelado', 'no show'].some(k => name?.toLowerCase().includes(k));

            const activeDeals = deals.filter(d => {
                const col = columns.find(c => c.id === d.columnId);
                if (!col) return true; // Keep if column unknown (safe default)
                // Exclude Won and Lost stages
                return !isWon(col.title) && !isLost(col.title);
            });

            const totalVal = activeDeals.reduce((acc, d) => {
                // Use faturamento_mensal (Monthly Revenue) as the primary value
                const val = Number(d.faturamento_mensal) || Number(d.value) || 0;
                return acc + val;
            }, 0);

            setKpiStats({
                total: { count: activeDeals.length, value: totalVal }
            });
        }
    }, [deals, columns]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Track the last column the active item was moved to, to prevent infinite loops from stale closures
    const lastOverColumnRef = useRef(null);

    const handleDragStart = (event) => {
        console.log(`%c 🛫 DragStart: ${event.active.id}`, 'color: #3b82f6; font-weight: bold;');
        setActiveId(event.active.id);

        // Initialize the ref with the current column of the dragged item
        const deal = deals.find(d => d.id === event.active.id);
        if (deal) lastOverColumnRef.current = deal.columnId;
    };

    const handleDragOver = (event) => {
        // Disabled active state key updates to prevent "Maximum update depth exceeded" errors
        // Relies on handleDragEnd for the final update.
        // This makes the card not "snap" into the new column while dragging, making it more stable.
        return;
    };

    const handleAddColumn = async () => {
        if (!routePipelineId) {
            alert('⚠️ Você precisa estar em um Pipeline customizado para adicionar novas fases. O "Pipeline Padrão" não pode ser modificado.');
            return;
        }

        const newId = `stage_${Date.now()}`;
        const newPosition = columns.length;
        const newTitle = "Nova Fase";

        const newStage = {
            id: newId,
            pipeline_id: routePipelineId,
            title: newTitle,
            color: '#3b82f6',
            position: newPosition
        };

        console.log(`%c ➕ Adicionando nova fase: ${newId} no pipeline ${routePipelineId}`, 'color: #3b82f6; font-weight: bold;');
        const updatedColumns = [...columns, newStage];
        setColumns(updatedColumns);

        try {
            // Upsert row
            const { error } = await supabase.from('pipeline_stages').insert({
                id: newId,
                pipeline_id: routePipelineId,
                name: newTitle,
                position: newPosition,
                color: '#3b82f6'
            });

            if (error) {
                console.error('Error saving new column:', error);
                alert('🚨 Erro ao salvar nova fase no banco de dados.');
                fetchPipelineStages(routePipelineId, activePipeline);
            } else {
                console.log('%c ✅ Nova fase salva no banco.', 'color: #10b981;');
            }
        } catch (error) {
            console.error('Error adding column:', error);
        }
    };



    const handleUpdateColumnTitle = async (columnId, newTitle) => {
        const updatedColumns = columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c);
        setColumns(updatedColumns);

        try {
            const { data, error } = await supabase
                .from('pipeline_stages')
                .update({ name: newTitle })
                .eq('id', columnId)
                .select();

            if (error) throw error;

            if (error) throw error;

            if (!data || data.length === 0) {
                console.warn(`⚠️ Nenhuma linha atualizada para a coluna ${columnId}. Talvez ela não exista no banco de dados?`);
                alert('🚨 Erro: A coluna não foi encontrada no banco de dados para ser atualizada.');
            } else {
                console.log(`%c ✓ Título da coluna ${columnId} atualizado com sucesso.`, 'color: #3b82f6;');
            }
        } catch (error) {
            console.error('Error updating column title:', error);
            alert(`🚨 Erro ao salvar novo título: ${error.message}`);
            if (routePipelineId) fetchPipelineStages(routePipelineId, activePipeline);
        }
    };

    // --- BOARD DRAG-TO-SCROLL LOGIC ---
    const boardDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

    const handleBoardMouseDown = (e) => {
        // Prevent interfering with Card Dragging (if activeId is set, or target is draggable)
        // We can check if the target has specific class or attribute, or just rely on bubbling order.
        // But simply: only trigger if we are clicking the board background / column container, not a card.
        // A simple check is: if we are clicking an input or button, ignore.
        if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) return;

        // Prevent Text Selection
        e.preventDefault();

        // Also if we are dragging a deal, activeId will be set soon, but mousedown happens first.
        // Let's assume if the user clicks the background, they mean to scroll.

        const slider = scrollContainerRef.current;
        boardDragRef.current.isDown = true;
        boardDragRef.current.startX = e.pageX - slider.offsetLeft;
        boardDragRef.current.scrollLeft = slider.scrollLeft;
        slider.style.cursor = 'grabbing';
    };

    const handleBoardMouseLeave = () => {
        boardDragRef.current.isDown = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
    };

    const handleBoardMouseUp = () => {
        boardDragRef.current.isDown = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
    };

    const handleBoardMouseMove = (e) => {
        if (!boardDragRef.current.isDown) return;
        if (activeId) return; // Disable board scroll if dragging a card

        e.preventDefault();
        const slider = scrollContainerRef.current;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - boardDragRef.current.startX) * 1.5; // Scroll speed
        slider.scrollLeft = boardDragRef.current.scrollLeft - walk;
    };
    // ----------------------------------

    const handleUpdateColumnColor = async (columnId, newColor) => {
        console.log(`%c 🎨 Intent: Alterar cor da coluna [${columnId}] para [${newColor}]`, 'color: #8b5cf6; font-weight: bold;');
        const updatedColumns = columns.map(c => c.id === columnId ? { ...c, color: newColor } : c);
        setColumns(updatedColumns);

        try {
            const { data, error } = await supabase
                .from('pipeline_stages')
                .update({ color: newColor })
                .eq('id', columnId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                console.error(`🚨 Falha: O banco retornou SUCESSO mas alterou 0 linhas. Verifique se o ID [${columnId}] existe.`);
                alert(`🚨 ERRO DE BANCO: A coluna [${columnId}] não foi encontrada para atualizar a cor.`);
            } else {
                console.log(`%c ✅ SUCESSO: Cor salva permanentemente no banco.`, 'color: #10b981; font-weight: bold;');
            }
        } catch (error) {
            console.error('Fatal Update Error:', error);
            alert(`🚨 ERRO DE PERSISTÊNCIA: ${error.message || 'Erro desconhecido'}.\n\nIsso geralmente é bloqueio de segurança (RLS).`);
            if (routePipelineId) fetchPipelineStages(routePipelineId, activePipeline);
        }
    };

    const updateStageOrder = async (newColumns) => {
        setColumns(newColumns);
        try {
            const stagesToUpsert = newColumns.map((col, index) => ({
                id: col.id,
                pipeline_id: routePipelineId || activePipeline,
                name: col.title,
                position: index,
                color: col.color
            }));
            await supabase.from('pipeline_stages').upsert(stagesToUpsert);
        } catch (err) {
            console.error("Failed to update order", err);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Check if dragging a column
        const activeColumnIndex = columns.findIndex(c => c.id === activeId);
        const overColumnIndex = columns.findIndex(c => c.id === overId);

        if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
            if (activeId !== overId) {
                const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);

                // Re-assign positions locally for clarity
                const orderedColumns = newColumns.map((col, index) => ({ ...col, position: index }));

                setColumns(orderedColumns);
                updateStageOrder(orderedColumns);
            }
            setActiveId(null);
            return;
        }

        // Deal Dragging Logic
        let newColumnId = null;
        if (columns.find(c => c.id === overId)) {
            newColumnId = overId;
        } else {
            const overDeal = deals.find(d => d.id === overId);
            if (overDeal) newColumnId = overDeal.columnId;
        }

        console.log(`%c 🎯 DragEnd: active=${activeId}, over=${overId}, targetColumn=${newColumnId}`, 'color: #8b5cf6;');

        if (newColumnId) {
            const originalDealData = active.data.current?.deal;
            const originalStage = originalDealData?.stage || originalDealData?.columnId;

            const activeIndex = deals.findIndex(d => d.id === activeId);
            const overIndex = deals.findIndex(d => d.id === overId);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                // REORDERING DETECTED
                setDeals((items) => {
                    return arrayMove(items, activeIndex, overIndex).map(d =>
                        d.id === activeId ? { ...d, columnId: newColumnId, stage: newColumnId } : d
                    );
                });
            } else if (originalStage !== newColumnId) {
                // ONLY COLUMN CHANGE (No index change, just append to new col conceptually)
                // This covers dropping into an empty column or onto the column header
                setDeals(prev => prev.map(d => d.id === activeId ? { ...d, columnId: newColumnId, stage: newColumnId } : d));
            }

            // DB PERSISTENCE (Stage Change Only for now)
            if (originalStage !== newColumnId) {
                try {
                    console.log(`%c 💾 Persisting deal ${activeId} to db (stage: ${newColumnId})...`, 'color: #3b82f6;');
                    const { data: updatedData, error } = await supabase
                        .from('central_vendas')
                        .update({ stage: newColumnId })
                        .eq('id', activeId)
                        .select();

                    if (error) throw error;

                    if (!updatedData || updatedData.length === 0) {
                        throw new Error('Permissão negada ou erro de autorização no Supabase.');
                    }
                    console.log(`%c ✅ Deal ${activeId} SAVED SUCCESSFULLY.`, 'color: #10b981; font-weight: bold;');
                } catch (err) {
                    console.error('Failed to move deal:', err);
                    alert(`🚨 ERRO DE PERSISTÊNCIA: ${err.message || 'Erro de conexão'}.\n\nO card voltará à posição original.`);
                    fetchCentralDeals();
                }
            } else {
                console.log('%c ℹ️ No stage change (dropped in same column). Reorder handled in state.', 'color: #6b7280;');
            }
        }

        setActiveId(null);
    };



    // Memoize the grouping of deals by column to ensure stable references
    const groupedDeals = useMemo(() => {
        const groups = {};
        columns.forEach(c => groups[c.id] = []);

        const searchLower = searchTerm.toLowerCase();

        deals.forEach(deal => {
            // Apply Search Filter here efficiently
            const matchesSearch = !searchTerm ||
                deal.title?.toLowerCase().includes(searchLower) ||
                deal.company?.toLowerCase().includes(searchLower);

            if (matchesSearch && groups[deal.columnId]) {
                groups[deal.columnId].push(deal);
            }
        });

        return groups;
    }, [deals, columns, searchTerm]);

    return (
        <div className="pipeline-container h-full flex flex-col"> {/* Use h-full to fit layout */}
            {/* Header matching Finance style */}
            <div className="page-header" style={{
                display: 'flex',
                justifyContent: 'space-between', // Standardize spacing
                alignItems: 'center',
                marginBottom: '2rem', // Match Finance margin
                padding: '1rem 2rem',
                gap: '2rem'
            }}>
                {isEditingTitle ? (
                    <div className="flex items-center">
                        <input
                            autoFocus
                            type="text"
                            value={pipelineTitle}
                            onChange={(e) => setPipelineTitle(e.target.value)}
                            onBlur={() => {
                                setIsEditingTitle(false);
                                handleUpdatePipelineTitle(pipelineTitle);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setIsEditingTitle(false);
                                    handleUpdatePipelineTitle(pipelineTitle);
                                }
                            }}
                            style={{
                                margin: 0,
                                background: 'var(--bg-secondary)', // Match Finance Input
                                border: '1px solid var(--border-color)',
                                borderRadius: '14px', // Increased rounding
                                padding: '0.6rem 1.25rem',
                                color: 'var(--text-primary)',
                                fontSize: '1.8rem', // Match Finance Title
                                fontWeight: '700',
                                outline: 'none',
                                minWidth: '340px',
                                transition: 'all 0.2s'
                            }}
                        />

                    </div>
                ) : (
                    <div className="flex items-center">
                        <h1
                            style={{
                                margin: 0,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                fontSize: '1.8rem', // Match Finance Title
                                fontWeight: '700',
                                color: 'var(--text-primary)',
                                padding: '0.5rem 1rem',
                                borderRadius: '12px'
                            }}
                            onClick={() => setIsEditingTitle(true)}
                            title="Clique para editar"
                            className="hover:text-blue-400 hover:bg-white/5 transition-all"
                        >
                            {pipelineTitle || PIPELINE_CONFIG[activePipeline]?.title || 'Pipeline de Vendas'}
                        </h1>

                    </div>
                )}

                {/* KPI CARDS MOVED HERE */}
                <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center', height: '110px', zIndex: 50 }}>
                    <div style={{ flex: 1, height: '100%' }}>
                        <StatCard
                            title="Valor em Pipeline"
                            value={formatCurrency(kpiStats.total.value)}
                            icon={TrendingUp}
                            trend="neutral"
                            trendValue="--"
                            color="text-blue-400"
                            compact={true}
                            className="h-full"
                        />
                    </div>
                    <div style={{ flex: 1, height: '100%' }}>
                        <StatCard
                            title="Negócios Ativos"
                            value={kpiStats.total.count}
                            icon={Target}
                            trend="neutral"
                            trendValue="--"
                            color="text-emerald-400"
                            compact={true}
                            className="h-full"
                        />
                    </div>
                </div>

                <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`header-btn ${isFilterOpen ? 'active' : ''}`}
                        title="Filtrar"
                    >
                        <Filter size={18} />
                        <span>Filtrar</span>
                    </button>


                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="header-btn"
                        title="Importar Negócios"
                    >
                        <Download size={18} className="rotate-180" />
                        <span>Importar</span>
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="header-btn primary"
                    >
                        <Plus size={18} />
                        <span>Novo Negócio</span>
                    </button>
                </div>
            </div>

            {/* SPACER FOR OVERLAP PREVENTION */}
            <div style={{ height: '20px' }}></div>

            {/* FILTER BAR - Conditionally Rendered */}
            {isFilterOpen && (
                <div style={{ padding: '0 2rem 1.5rem 2rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Buscar por nome, empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1.5rem',
                                background: 'rgba(30,30,40,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px', // Increased rounding
                                color: 'white',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            className="focus:border-blue-500/50 focus:bg-white/5"
                        />
                    </div>
                </div>
            )}

            {/* BOARD */}
            {
                !loading && columns.length > 0 && (
                    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex' }}>
                        {/* LEFT SCROLL BUTTON */}
                        {canScrollLeft && (
                            <button
                                onClick={scrollLeft}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 9999,
                                    background: 'rgba(20, 20, 25, 0.6)', // Glassy Dark
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '50%',
                                    width: '56px',
                                    height: '56px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#bef264', // Keep Lime Icon
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(8px)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                className="hover:scale-110 hover:bg-black/80 hover:border-lime-400/50"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        {canScrollRight && (
                            <button
                                onClick={scrollRight}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 9999,
                                    background: 'rgba(20, 20, 25, 0.6)', // Glassy Dark
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '50%',
                                    width: '56px',
                                    height: '56px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#bef264', // Keep Lime Icon
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(8px)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                className="hover:scale-110 hover:bg-black/80 hover:border-lime-400/50"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}

                        <div
                            ref={scrollContainerRef}
                            className="custom-scrollbar"
                            onMouseDown={handleBoardMouseDown}
                            onMouseLeave={handleBoardMouseLeave}
                            onMouseUp={handleBoardMouseUp}
                            onMouseMove={handleBoardMouseMove}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                paddingLeft: '5rem',
                                paddingRight: '2rem',
                                scrollBehavior: 'auto', // Disable smooth for direct drag
                                height: '100%',
                                boxSizing: 'border-box',
                                cursor: 'grab', // Indicate draggable
                                userSelect: 'none' // Prevent text selection globally in this area
                            }}
                        >
                            <DndContext
                                sensors={sensors}
                                collisionDetection={rectIntersection}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="board h-full" style={{ width: 'max-content', display: 'flex', gap: '2rem', alignItems: 'stretch' }}>
                                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                                        {columns.map((column) => (
                                            <Column
                                                key={column.id}
                                                column={column}
                                                // APPLY FILTERS HERE
                                                deals={groupedDeals[column.id] || []}
                                                onDealClick={(deal) => setEditingDeal(deal)}
                                                onDeleteColumn={() => { }}
                                                onUpdateTitle={(newTitle) => handleUpdateColumnTitle(column.id, newTitle)}
                                                onUpdateColor={(newColor) => handleUpdateColumnColor(column.id, newColor)}
                                            />
                                        ))}
                                    </SortableContext>
                                    {/* Add Column Button */}
                                    <div style={{ minWidth: '350px', paddingRight: '2.5rem' }}>
                                        <button
                                            onClick={handleAddColumn}
                                            style={{
                                                width: '100%',
                                                height: '64px', // Taller button
                                                border: '2px dashed rgba(255,255,255,0.08)',
                                                borderRadius: '24px', // Match column rounding
                                                background: 'rgba(255,255,255,0.02)',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontSize: '0.75rem'
                                            }}
                                            className="hover:bg-white/5 hover:border-white/10 hover:text-white hover:scale-[1.02]"
                                        >
                                            <Plus size={20} />
                                            <span>Nova Fase</span>
                                        </button>
                                    </div>
                                </div>

                                <DragOverlay>
                                    {activeId ? (
                                        <>
                                            {deals.find(d => d.id === activeId) ? (
                                                <div className="drag-overlay-item">
                                                    <DealCardContent deal={deals.find(d => d.id === activeId)} />
                                                </div>
                                            ) : columns.find(c => c.id === activeId) ? (
                                                <div className="column-drag-overlay" style={{
                                                    background: 'rgba(30,30,40,0.9)',
                                                    padding: '1rem',
                                                    borderRadius: '16px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    width: '300px',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                                }}>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                        {columns.find(c => c.id === activeId)?.title}
                                                    </h3>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </div>
                )
            }

            <style>{`
                .pipeline-container {
                    height: 100vh; /* Fixed height */
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    overflow: hidden; /* No page scroll */
                    background-color: transparent;
                }

                /* Header Buttons - Copied from Finance.jsx */
                .header-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: rgba(30, 30, 40, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(8px);
                }

                .header-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    color: var(--text-primary);
                }

                .header-btn.active {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%); /* Greenish for sales */
                    border-color: rgba(16, 185, 129, 0.5);
                    color: #34d399;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
                }

                /* Primary Action Button (New Deal) */
                .header-btn.primary {
                    background: linear-gradient(135deg, #bef264 0%, #a3e635 100%); /* Lime Gradient */
                    color: #050a07;
                    border: none;
                    font-weight: 700;
                    box-shadow: 0 4px 15px rgba(163, 230, 53, 0.3);
                }

                .header-btn.primary:hover {
                    filter: brightness(1.1);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(163, 230, 53, 0.4);
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1.5rem;
                    max-width: 600px; /* Kept constrained as before */
                }

                .board {
                    display: flex;
                    gap: 0.75rem; /* Decreased from 1.5rem */
                    min-width: min-content; 
                    height: 100%;
                    align-items: stretch; /* Stretch columns to fill height so they can scroll internally */
                }

                .drag-overlay-item {
                    opacity: 0.9;
                    transform: rotate(2deg) scale(1.02);
                    cursor: grabbing;
                    pointer-events: none; /* Crucial for DND to detect drops underneath */
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    border-radius: 20px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px; /* Slightly wider for visibility */
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #bef264; /* NEON LIME */
                    border-radius: 10px;
                    border: 2px solid rgba(20, 20, 30, 0.8); /* Refined border */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a3e635;
                    border: 2px solid rgba(20, 20, 30, 0.8);
                }
            `}</style>
            <NewDealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDealCreated={(newDeal) => setDeals(prev => [...prev, newDeal])}
                columns={columns}
                pipelineType={activePipeline}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onDealCreated={(newDeal) => setDeals(prev => [...prev, newDeal])}
                columns={columns}
                onImportComplete={() => {
                    fetchCentralDeals();
                }}
            />

            {/* CREATE PIPELINE MODAL */}
            {
                isCreatePipelineModalOpen && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            width: '400px',
                            backgroundColor: '#16161c', // Slightly darker
                            borderRadius: '24px', // Increased rounding
                            padding: '2rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}>
                            <h2 style={{ marginTop: 0, color: 'white', fontSize: '1.25rem' }}>Criar Novo Pipeline</h2>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleCreatePipeline(formData.get('name'), formData.get('type'));
                            }}>
                                <div style={{ marginBottom: '1rem', marginTop: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Nome do Pipeline</label>
                                    <input
                                        name="name"
                                        required
                                        autoFocus
                                        placeholder="Ex: Parcerias, Vendas Q1..."
                                        style={{
                                            width: '100%', padding: '0.75rem', borderRadius: '8px',
                                            backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white', outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Tipo de Processo</label>
                                    <select
                                        name="type"
                                        style={{
                                            width: '100%', padding: '0.75rem', borderRadius: '8px',
                                            backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white', outline: 'none'
                                        }}
                                    >
                                        <option value="Receptivo">Receptivo (Inbound)</option>
                                        <option value="Ativo">Ativo (Outbound)</option>
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        Define as fases iniciais padrão.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreatePipelineModalOpen(false);
                                            if (routePipelineId === 'new') navigate('/pipeline'); // Go back if stuck on /new
                                        }}
                                        style={{
                                            padding: '0.75rem 1.25rem', borderRadius: '14px',
                                            backgroundColor: 'rgba(255,255,255,0.05)', color: '#9ca3af',
                                            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                                            fontWeight: '600', transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-white/10"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '0.75rem 1.25rem', borderRadius: '14px',
                                            backgroundColor: '#bef264', color: '#000', fontWeight: '700',
                                            border: 'none', cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(190, 242, 100, 0.2)',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:scale-105 active:scale-95"
                                    >
                                        Criar Pipeline
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <EditDealModal
                isOpen={!!editingDeal}
                onClose={() => setEditingDeal(null)}
                deal={editingDeal}
                columns={columns}
                onDealUpdated={(updatedDeal) => {
                    // Normalize updated deal to have both stage and columnId consistent for current local logic
                    const normalized = {
                        ...updatedDeal,
                        columnId: updatedDeal.stage || updatedDeal.columnId
                    };
                    setDeals(prev => prev.map(d => d.id === normalized.id ? normalized : d));
                }}
                onDealDeleted={(deletedId) => {
                    setDeals(prev => prev.filter(d => d.id !== deletedId));
                }}
            />
        </div >
    );
};

export default Pipeline;
