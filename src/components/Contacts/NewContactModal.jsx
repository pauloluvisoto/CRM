
import React from 'react';
import UnifiedEntityModal from '../shared/UnifiedEntityModal';

const NewContactModal = ({ isOpen, onClose, onContactCreated, prefill = {} }) => {
    return (
        <UnifiedEntityModal
            isOpen={isOpen}
            onClose={onClose}
            mode="contact"
            prefill={prefill}
            onSuccess={(result) => {
                if (result.type === 'contact-created' && onContactCreated) {
                    onContactCreated({
                        ...result.data,
                        lastContact: result.data.last_contact
                    });
                }
                onClose();
            }}
        />
    );
};

export default NewContactModal;
