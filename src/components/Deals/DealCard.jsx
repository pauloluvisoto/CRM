import React, { forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Instagram, MessageCircle, User } from 'lucide-react';

// Presentational Component - Safe for DragOverlay (No hooks)
export const DealCardContent = forwardRef(({ deal, isDragging, columnColor, style, ...props }, ref) => {

  // Logic to avoid redundancy
  const showCompany = deal.company && deal.title && !deal.title.includes(deal.company) && !deal.company.includes(deal.title);

  // Base styles defined in JS to guarantee rendering
  const cardStyle = {
    backgroundColor: '#27272a', // Zinc-800
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    position: 'relative',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    ...style // Merge dnd styles (transform, etc)
  };

  const accentStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: columnColor || '#3b82f6',
    borderTopLeftRadius: '6px',
    borderBottomLeftRadius: '6px'
  };

  return (
    <div ref={ref} style={cardStyle} {...props}>
      {/* Accent Stripe */}
      <div style={accentStyle} />

      {!isDragging && (
        <div style={{ marginLeft: '8px' }}> {/* Offset for accent */}
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff', lineHeight: '1.2' }}>
              {deal.title}
            </h4>
            <span style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
              {deal.company}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

          {/* Data Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>

            {/* Value */}
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#71717a', fontWeight: 'bold', display: 'block' }}>
                VALOR
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#34d399' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}
              </span>
            </div>

            {/* Contact */}
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#71717a', fontWeight: 'bold', display: 'block' }}>
                CONTATO
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#d4d4d8' }}>
                {deal.contact_name ? (
                  <>
                    <User size={12} color="#a1a1aa" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {deal.contact_name}
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#52525b', fontStyle: 'italic' }}>--</span>
                )}
              </div>
            </div>
          </div>

          {/* Tags Footer */}
          {deal.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
              {deal.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '4px',
                  color: '#a1a1aa'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
});

// Container Component with Drag Logic
const DealCard = ({ deal, onClick, columnColor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { type: 'Deal', deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DealCardContent
      ref={setNodeRef}
      style={style}
      deal={deal}
      columnColor={columnColor} // Pass color down
      isDragging={isDragging}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick();
      }}
      {...attributes}
      {...listeners}
    />
  );
};

export default React.memo(DealCard);
