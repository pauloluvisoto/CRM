import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, Minimize2, Move } from 'lucide-react';

const DraggableWidget = ({
    id,
    children,
    layout,
    isEditing,
    onResize
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: !isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        gridColumn: `span ${layout?.colSpan?.lg || 4} / span ${layout?.colSpan?.lg || 4}`, // Default to 4 (1/3 of 12)
        gridRow: `span ${layout?.rowSpan || 1} / span ${layout?.rowSpan || 1}`,
    };

    // Calculate dynamic classes
    const colClass = `col-span-12 lg:col-span-${layout?.colSpan?.lg || 4}`; // Fallback class if style fails or for mobile
    const rowClass = `row-span-${layout?.rowSpan || 1}`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group/widget ${isDragging ? 'opacity-50 scale-[0.98]' : ''} ${isEditing ? 'ring-1 ring-white/10 rounded-xl bg-white/5' : ''}`}
        >
            {/* Edit Controls Overlay */}
            {isEditing && (
                <div className="absolute top-2 right-2 z-50 flex items-center gap-1 bg-black/80 backdrop-blur-md rounded-lg p-1 border border-white/10 opacity-0 group-hover/widget:opacity-100 transition-opacity">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1.5 hover:bg-white/10 rounded cursor-move text-white/60 hover:text-white"
                    >
                        <GripVertical size={14} />
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-1"></div>

                    {/* Resize Width */}
                    <button
                        onClick={() => onResize(id, 'width')}
                        className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-white/60 hover:text-white"
                        title="Alternar Largura"
                    >
                        <Maximize2 size={14} className="rotate-45" />
                    </button>

                    {/* Resize Height */}
                    <button
                        onClick={() => onResize(id, 'height')}
                        className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-white/60 hover:text-white"
                        title="Alternar Altura"
                    >
                        <Move size={14} className="rotate-90" />
                    </button>
                </div>
            )}

            {/* Widget Content */}
            <div className={`h-full w-full ${isEditing ? 'pointer-events-none select-none' : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default DraggableWidget;
