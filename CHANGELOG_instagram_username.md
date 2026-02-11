# Alterações: Instagram Username e Created By

## 🔧 Mudanças Implementadas

### 1. ✅ Corrigido erro `created_by` null

**Problema:** Ao criar um negócio pelo modal, o campo `created_by` não era preenchido, causando erro no banco.

**Solução:** O `UnifiedEntityModal` agora pega o usuário autenticado antes de criar o negócio:
```javascript
const { data: { user } } = await supabase.auth.getUser();
// ... depois adiciona no insert:
created_by: user.id
```

### 2. ✅ Instagram: de ID numérico para @username

**Problema:** O sistema usava o ID numérico do Instagram (ex: `6087671747936441`), mas o usuário do CRM não tem acesso a esse ID.

**Solução:** 
- **Nova coluna criada:** `instagram_username` em `central_vendas`
- **Migração SQL:** `migrations/002_add_instagram_username.sql`
- **Campos atualizados:**
  - `UnifiedEntityModal`: usa `instagram_username` ao criar negócio
  - `EditDealModal`: lê e salva `instagram_username`
  - `ChatInfoPanel`: já estava salvando username em `metadata.username` ✅

**Agora o fluxo é:**
1. n8n captura mensagem do Instagram
2. n8n envia para o banco incluindo o **@username** (você precisa adicionar isso no workflow)
3. Sistema salva em `social_conversations.metadata.username`
4. Quando vincular a um negócio, o @username é copiado para `central_vendas.instagram_username`

---

## 📋 Próximos Passos

### Passo 1: Executar a migração SQL no Supabase

Acesse o SQL Editor do Supabase e execute o conteúdo do arquivo:
```
migrations/002_add_instagram_username.sql
```

Isso irá criar a coluna `instagram_username` na tabela `central_vendas`.

### Passo 2: Atualizar o n8n

No seu workflow do n8n que captura mensagens do Instagram, você precisa adicionar o campo `username` do remetente ao objeto `metadata` que é salvo no banco.

**Exemplo:**
```json
{
  "external_id": "6087671747936441",
  "metadata": {
    "username": "luiskempe",  // ← ADICIONAR ISSO
    "full_name": "Luis Kempe",
    ...
  }
}
```

O campo já está sendo usado pelo sistema em `ChatInfoPanel` e `UnifiedEntityModal`.

---

## 📝 Retrocompatibilidade

O código foi preparado para suportar ambos os formatos enquanto você atualiza os dados:
- Lê primeiro `instagram_username` (novo)
- Se não existir, usa `instagram` (antigo ID)

Exemplo:
```javascript
instagram: deal.instagram_username || deal.instagram || ''
```

Isso garante que negócios antigos continuem funcionando enquanto você migra para o novo formato.
