import { v4 as uuidv4 } from 'uuid';

export const initialColumns = [
    {
        id: 'col-1',
        title: 'Lead Inicial',
        color: '#3b82f6', // blue
    },
    {
        id: 'col-2',
        title: 'Contato Feito',
        color: '#f59e0b', // amber
    },
    {
        id: 'col-3',
        title: 'Proposta Enviada',
        color: '#8b5cf6', // violet
    },
    {
        id: 'col-4',
        title: 'Negociação',
        color: '#ec4899', // pink
    },
];

export const initialDeals = [
    {
        id: 'deal-1',
        columnId: 'col-1',
        title: 'Consultoria de Marketing',
        value: 5000,
        company: 'Acme Corp',
        contact: 'Alice Smith',
        tags: ['Quente', 'Novo'],
    },
    {
        id: 'deal-2',
        columnId: 'col-1',
        title: 'Redesign de Site',
        value: 12000,
        company: 'TechStart',
        contact: 'Bob Jones',
        tags: ['Web'],
    },
    {
        id: 'deal-3',
        columnId: 'col-2',
        title: 'Integração de API',
        value: 3500,
        company: 'LogiSystem',
        contact: 'Charlie Day',
        tags: ['Backend'],
    },
    {
        id: 'deal-4',
        columnId: 'col-3',
        title: 'App Mobile v2',
        value: 25000,
        company: 'FoodDelivery',
        contact: 'Diana Prince',
        tags: ['Mobile', 'Urgente'],
    },
];

export const initialContacts = [
    {
        id: 'contact-1',
        name: 'Alice Smith',
        email: 'alice@acmecorp.com',
        phone: '+55 11 99999-0001',
        company: 'Acme Corp',
        role: 'CEO',
        lastContact: '2023-10-25',
    },
    {
        id: 'contact-2',
        name: 'Bob Jones',
        email: 'bob@techstart.io',
        phone: '+55 11 99999-0002',
        company: 'TechStart',
        role: 'CTO',
        lastContact: '2023-10-24',
    },
    {
        id: 'contact-3',
        name: 'Charlie Day',
        email: 'charlie@logisystem.net',
        phone: '+55 21 99999-0003',
        company: 'LogiSystem',
        role: 'Operations Manager',
        lastContact: '2023-10-20',
    },
    {
        id: 'contact-4',
        name: 'Diana Prince',
        email: 'diana@fooddelivery.app',
        phone: '+55 31 99999-0004',
        company: 'FoodDelivery',
        role: 'Product Owner',
        lastContact: '2023-10-26',
    },
    {
        id: 'contact-5',
        name: 'Evan Wright',
        email: 'evan@consulting.com',
        phone: '+55 41 99999-0005',
        company: 'Wright Consulting',
        role: 'Director',
        lastContact: '2023-10-15',
    },
];
