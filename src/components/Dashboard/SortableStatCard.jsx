import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import StatCard from './StatCard';

const SortableStatCard = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`sortable-stat-card size-${(props.size || '1x1').replace('.', '-')}`}>
            <StatCard {...props} />
        </div>
    );
};

export default SortableStatCard;
