-- Migration: Add credit card linking to accounts_payable
-- Date: 2026-01-28
-- Description: Links accounts_payable entries to credit card transactions

-- Add columns to link accounts_payable to credit cards
ALTER TABLE accounts_payable 
ADD COLUMN IF NOT EXISTS linked_card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linked_transaction_id uuid REFERENCES credit_card_transactions(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_payable_linked_card 
    ON accounts_payable(linked_card_id);
    
CREATE INDEX IF NOT EXISTS idx_accounts_payable_linked_transaction 
    ON accounts_payable(linked_transaction_id);

-- Add comment
COMMENT ON COLUMN accounts_payable.linked_card_id IS 'Reference to credit card if this payable is from a credit card purchase';
COMMENT ON COLUMN accounts_payable.linked_transaction_id IS 'Reference to specific credit card transaction';
