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

    const sizeMap = {
        '1x1': 'col-span-12 md:col-span-6 lg:col-span-3',
        '1.3x1': 'col-span-12 md:col-span-6 lg:col-span-4',
        '2x1': 'col-span-12 md:col-span-12 lg:col-span-6',
        '3x1': 'col-span-12 lg:col-span-9',
        '4x1': 'col-span-12',
        '8x1': 'col-span-12'
    };
    const sizeClass = sizeMap[props.size] || 'col-span-12 md:col-span-6 lg:col-span-3';

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`sortable-stat-card ${sizeClass}`}>
            <StatCard {...props} />
        </div>
    );
};

export default SortableStatCard;
