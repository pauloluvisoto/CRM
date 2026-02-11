# Plano de Implementação: Sistema de Relacionamento Negócios-Contatos-Mensagens

## Objetivo
Criar uma hierarquia onde:
- **Negócio (Deal)** é a entidade principal
- **Contatos (Pessoas)** são vinculados a Negócios
- **Canais de Mensagem** podem ser vinculados a Negócios OU a Contatos específicos

## Estrutura de Dados

### 1. Tabela: `deals` (central_vendas - já existe)
```sql
- id (PK)
- name
- stage
- value
- created_at
- tipo_pipeline
```

### 2. Tabela: `contacts` (já existe, precisa ajustes)
```sql
- id (PK)
- name
- email
- phone
- company
- role (cargo da pessoa)
- created_at
```

### 3. NOVA Tabela: `deal_contacts` (relacionamento N:N)
```sql
- id (PK)
- deal_id (FK -> deals.id)
- contact_id (FK -> contacts.id)
- is_primary (boolean) - indica se é o contato principal
- role_in_deal (texto) - "Dono", "Gerente", "Decisor", etc.
- created_at
```

### 4. NOVA Tabela: `message_channels` (canais de comunicação)
```sql
- id (PK)
- channel_type (enum: 'whatsapp', 'instagram', 'email', 'phone')
- channel_identifier (número/username)
- linked_to_type (enum: 'deal', 'contact')
- linked_to_id (ID do negócio ou contato)
- deal_id (FK -> deals.id) - sempre preenchido para rastreabilidade
- contact_id (FK -> contacts.id, nullable) - preenchido se canal é de pessoa específica
- created_at
- last_message_at
```

### 5. Tabela: `messages` (ajustar existente)
```sql
- id (PK)
- channel_id (FK -> message_channels.id)
- content
- direction ('inbound'/'outbound')
- created_at
- read_at
```

## Fluxo de Dados

### Cenário 1: Conversa com Equipe (Instagram)
1. Criar Negócio: "Empresa XYZ"
2. Criar Canal: Instagram @empresaxyz → vinculado ao NEGÓCIO
3. Mensagens ficam associadas ao canal do negócio

### Cenário 2: Conseguir contato do Dono
1. Criar Contato: "João Silva" (Dono)
2. Vincular Contato ao Negócio: deal_contacts (deal_id, contact_id, role="Dono")
3. Criar Canal: WhatsApp +5511999999999 → vinculado ao CONTATO
4. Canal também referencia o deal_id para rastreabilidade

## Componentes a Criar/Modificar

### 1. Componente: DealContactsManager
- Lista contatos vinculados ao negócio
- Adicionar novo contato ao negócio
- Definir contato principal
- Ver canais de cada contato

### 2. Componente: MessageChannelManager
- Lista todos os canais de um negócio
- Mostra se canal é do negócio ou de pessoa específica
- Permite vincular canal existente a contato

### 3. Modificar: Contacts Page
- Sincronizar com deals do pipeline
- Mostrar negócios associados a cada contato
- Permitir criar negócio a partir de contato

### 4. Modificar: Messages Page
- Agrupar conversas por negócio
- Mostrar qual contato está falando em cada canal
- Permitir transferir canal entre contato/negócio

## Migrations SQL Necessárias

```sql
-- 1. Criar tabela de relacionamento
CREATE TABLE deal_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES central_vendas(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  role_in_deal TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(deal_id, contact_id)
);

-- 2. Criar tabela de canais
CREATE TABLE message_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_type TEXT CHECK (channel_type IN ('whatsapp', 'instagram', 'email', 'phone')),
  channel_identifier TEXT NOT NULL,
  linked_to_type TEXT CHECK (linked_to_type IN ('deal', 'contact')),
  linked_to_id UUID NOT NULL,
  deal_id UUID REFERENCES central_vendas(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP
);

-- 3. Adicionar índices
CREATE INDEX idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX idx_deal_contacts_contact ON deal_contacts(contact_id);
CREATE INDEX idx_message_channels_deal ON message_channels(deal_id);
CREATE INDEX idx_message_channels_contact ON message_channels(contact_id);
```

## Fases de Implementação

### Fase 1: Estrutura de Dados ✓
- [ ] Criar migrations SQL
- [ ] Executar no Supabase
- [ ] Criar services para CRUD

### Fase 2: UI de Relacionamento
- [ ] DealContactsManager component
- [ ] MessageChannelManager component
- [ ] Integrar em EditDealModal

### Fase 3: Sincronização
- [ ] Sincronizar Contacts com Deals
- [ ] Migrar conversas existentes para channels
- [ ] Atualizar Messages page

### Fase 4: Features Avançadas
- [ ] Merge de contatos duplicados
- [ ] Merge de negócios
- [ ] Histórico de interações unificado

## Próximos Passos Imediatos

1. Ajustar padding Dashboard e Contacts
2. Criar migrations SQL
3. Criar services de relacionamento
4. Implementar UI básica de vinculação
