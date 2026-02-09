-- Credit Card Management Tables
-- Created: 2026-01-28
-- Description: Schema for credit card management including cards, transactions, and statements

-- =====================================================
-- TABLE: credit_cards
-- Description: Stores credit card information
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Card Details
  card_name VARCHAR(100) NOT NULL,
  card_brand VARCHAR(50),                 -- Visa, Mastercard, Elo, Amex, etc
  last_four_digits VARCHAR(4),
  credit_limit DECIMAL(12,2) NOT NULL,
  
  -- Billing Configuration
  closing_day INTEGER NOT NULL CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- UI Metadata
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'CreditCard',
  notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_credit_limit CHECK (credit_limit > 0)
);

-- =====================================================
-- TABLE: credit_card_transactions
-- Description: Individual purchases/transactions on credit cards
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_card_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Relationship
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction Details
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  transaction_date DATE NOT NULL,
  
  -- Installments (Parcelamento)
  total_installments INTEGER DEFAULT 1 CHECK (total_installments >= 1 AND total_installments <= 60),
  current_installment INTEGER DEFAULT 1,
  parent_transaction_id UUID REFERENCES credit_card_transactions(id) ON DELETE CASCADE,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency VARCHAR(20),       -- 'monthly', 'yearly', etc
  recurrence_end_date DATE,
  
  -- Billing
  statement_month VARCHAR(7) NOT NULL,    -- YYYY-MM format
  is_billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment tracking
  payable_id UUID,                        -- Reference to accounts_payable when billed
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_installment CHECK (current_installment <= total_installments)
);

-- =====================================================
-- TABLE: credit_card_statements
-- Description: Monthly statements for credit cards
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_card_statements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationship
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  
  -- Period
  month VARCHAR(7) NOT NULL,              -- YYYY-MM format
  closing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  minimum_payment DECIMAL(12,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'overdue', 'partial')),
  closed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Integration with Accounts Payable
  payable_id UUID,                        -- Reference to accounts_payable
  auto_billed BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  
  -- Constraints
  UNIQUE(card_id, month),
  CONSTRAINT valid_paid_amount CHECK (paid_amount >= 0 AND paid_amount <= total_amount)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cc_transactions_card_id ON credit_card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_statement_month ON credit_card_transactions(statement_month);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_transaction_date ON credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_parent ON credit_card_transactions(parent_transaction_id);
CREATE INDEX IF NOT EXISTS idx_cc_statements_card_month ON credit_card_statements(card_id, month);
CREATE INDEX IF NOT EXISTS idx_cc_statements_status ON credit_card_statements(status);
CREATE INDEX IF NOT EXISTS idx_cc_cards_user ON credit_cards(created_by);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;

-- Policies for credit_cards
CREATE POLICY "Users can view their own cards"
  ON credit_cards FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own cards"
  ON credit_cards FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own cards"
  ON credit_cards FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own cards"
  ON credit_cards FOR DELETE
  USING (auth.uid() = created_by);

-- Policies for credit_card_transactions
CREATE POLICY "Users can view transactions of their cards"
  ON credit_card_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = credit_card_transactions.card_id
      AND credit_cards.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions on their cards"
  ON credit_card_transactions FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = card_id
      AND credit_cards.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions on their cards"
  ON credit_card_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = credit_card_transactions.card_id
      AND credit_cards.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions on their cards"
  ON credit_card_transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = credit_card_transactions.card_id
      AND credit_cards.created_by = auth.uid()
    )
  );

-- Policies for credit_card_statements
CREATE POLICY "Users can view statements of their cards"
  ON credit_card_statements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = credit_card_statements.card_id
      AND credit_cards.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage statements of their cards"
  ON credit_card_statements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM credit_cards
      WHERE credit_cards.id = credit_card_statements.card_id
      AND credit_cards.created_by = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_card_transactions_updated_at
  BEFORE UPDATE ON credit_card_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_card_statements_updated_at
  BEFORE UPDATE ON credit_card_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate statement month based on transaction date and card closing day
CREATE OR REPLACE FUNCTION calculate_statement_month(
  transaction_date DATE,
  closing_day INTEGER
) RETURNS VARCHAR(7) AS $$
DECLARE
  statement_month VARCHAR(7);
BEGIN
  -- If transaction is after closing day of current month, it goes to next month's statement
  IF EXTRACT(DAY FROM transaction_date) > closing_day THEN
    statement_month := TO_CHAR(transaction_date + INTERVAL '1 month', 'YYYY-MM');
  ELSE
    statement_month := TO_CHAR(transaction_date, 'YYYY-MM');
  END IF;
  
  RETURN statement_month;
END;
$$ LANGUAGE plpgsql;

-- Function to get card available credit
CREATE OR REPLACE FUNCTION get_card_available_credit(card_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  card_limit DECIMAL(12,2);
  used_amount DECIMAL(12,2);
BEGIN
  -- Get card limit
  SELECT credit_limit INTO card_limit
  FROM credit_cards
  WHERE id = card_uuid;
  
  -- Calculate total unbilled transactions
  SELECT COALESCE(SUM(amount), 0) INTO used_amount
  FROM credit_card_transactions
  WHERE card_id = card_uuid
  AND is_billed = false;
  
  RETURN card_limit - used_amount;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE credit_cards IS 'Stores credit card information for financial management';
COMMENT ON TABLE credit_card_transactions IS 'Individual transactions made with credit cards including installments and recurring payments';
COMMENT ON TABLE credit_card_statements IS 'Monthly statements for credit cards with billing and payment tracking';
