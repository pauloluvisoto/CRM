import React, { useMemo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Trash2, Pencil, ArrowLeftRight } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import DealCard from './DealCard';

const Column = ({ column, deals, onDealClick, onDeleteColumn, onUpdateTitle, onUpdateColor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const COLUMN_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#6b7280', // Gray
    '#bef264'  // Lime
  ];

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      onUpdateTitle(editTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditTitle(column.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setSortableRef}
      className="flex flex-col transition-all duration-300"
      style={{
        ...style,
        minWidth: '250px',
        width: '250px',
        flexShrink: 0,
        height: '100%',
        maxHeight: '100%',
        gap: '12px',
        padding: '0 8px', // Remove vertical padding, let inner elements handle it
        background: 'transparent',
        border: 'none', // Remove border around the whole column for cleaner look
        borderRadius: '0',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* REBUILT HEADER - INLINE STYLES FOR RELIABILITY */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', paddingLeft: '4px', paddingRight: '4px' }}
        {...attributes}
        {...(!isEditing ? listeners : {})}
      >
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }} onMouseDown={e => e.stopPropagation()}>
            <input
              autoFocus
              style={{
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                color: 'white',
                fontSize: '14px',
                borderRadius: '4px',
                padding: '4px 8px',
                width: '100%',
                outline: 'none'
              }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer'
              }}>
              OK
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Pill Title */}
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backgroundColor: `${column.color}26`, // ~15% opacity hex
                color: column.color,
                border: `1px solid ${column.color}40`,
                boxShadow: `0 2px 10px ${column.color}10`,
                transition: 'all 0.2s',
                position: 'relative' // For popover positioning
              }}
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            >
              {column.title}

              {/* Interactive Color Dot */}
              <div
                onClick={(e) => {
                  e.stopPropagation(); // Prevent title edit
                  setShowColorPicker(!showColorPicker);
                }}
                style={{
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  transition: 'transform 0.2s',
                }}
                className="hover:scale-125"
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', opacity: 0.8 }} />
              </div>

              {/* Color Picker Popover */}
              {showColorPicker && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  left: '0',
                  backgroundColor: '#18181b', // Zinc-950
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  zIndex: 100,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  width: 'max-content'
                }}>
                  {COLUMN_COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateColor(c);
                        setShowColorPicker(false);
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        cursor: 'pointer',
                        border: column.color === c ? '2px solid white' : '1px solid transparent',
                        transition: 'transform 0.1s'
                      }}
                      className="hover:scale-110"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Subtitle Stats */}
            <div style={{
              paddingLeft: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '11px',
              fontWeight: '500',
              color: '#71717a',
              marginTop: '4px',
              borderLeft: '2px solid #27272a',
              marginLeft: '4px'
            }}>
              <span>{deals.length} Negócios</span>
              <span>•</span>
              <span>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(
                  deals.reduce((acc, deal) => acc + (Number(deal.value) || 0), 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DEALS LIST AREA */}
      <div
        ref={setDroppableRef}
        className="custom-scrollbar column-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px', // Reduced spacing (12px -> 6px)
          paddingBottom: '24px',
          paddingRight: '4px', // Space for scrollbar
          minHeight: '150px' // Ensure drop area exists even if empty
        }}
      >
        <SortableContext items={useMemo(() => deals.map(d => d.id), [deals])} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              columnColor={column.color}
              onClick={() => onDealClick(deal)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default React.memo(Column);
