# API REST — Tests con cURL

Base URL: `https://bank-up-api.netlify.app/`

Antes de correr los tests autenticados, guarda el token en una variable de shell:

```bash
TOKEN="<pega_el_token_del_login_aqui>"
```

---

## Usuarios de prueba (seed)

Aplica la migración seed antes de testear:

```bash
# Supabase cloud
supabase db push

# Local
supabase db reset
```

| Usuario | Contraseña | Rol | Cuenta (UUID fijo) | Saldo |
| --- | --- | --- | --- | --- |
| admin | Admin1234! | admin | — | — |
| alice | Alice1234! | client | `b0000000-0000-0000-0000-000000000001` | 5000 |
| bob | Bob1234! | client | `b0000000-0000-0000-0000-000000000002` | 3000 |

---

## Health

### GET /api/health — servidor activo

```bash
curl -s http://localhost:3000/api/health | jq
```

**Respuesta esperada `200`:**
```json
{ "status": "ok" }
```

---

## Auth

### POST /api/auth/login — credenciales válidas

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}' | jq
```

**Respuesta esperada `200`:**
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "username": "alice", "role": "user" }
}
```

---

### POST /api/auth/login — credenciales inválidas

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "wrong"}' | jq
```

**Respuesta esperada `401`:**
```json
{ "error": "invalid_credentials" }
```

---

### POST /api/auth/login — cuenta bloqueada (después de 5 intentos fallidos)

```bash
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "alice", "password": "wrong"}' | jq .
done
```

**Al 5.° intento, respuesta esperada `403`:**
```json
{ "error": "account_blocked" }
```

---

### POST /api/auth/login — body vacío

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**Respuesta esperada `400`:**
```json
{ "error": "username_and_password_required" }
```

---

### Ruta protegida sin token

```bash
curl -s http://localhost:3000/api/accounts | jq
```

**Respuesta esperada `401`:**
```json
{ "error": "unauthorized" }
```

---

### Ruta protegida con token inválido

```bash
curl -s http://localhost:3000/api/accounts \
  -H "Authorization: Bearer token_invalido" | jq
```

**Respuesta esperada `401`:**
```json
{ "error": "invalid_token" }
```

---

## Users

### GET /api/users/me — perfil del usuario autenticado

```bash
curl -s http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `200`:**
```json
{
  "user": {
    "id": "uuid",
    "username": "alice",
    "role": "user",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

## Accounts

### GET /api/accounts — listar cuentas activas del usuario

```bash
curl -s http://localhost:3000/api/accounts \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `200`:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "account_number": "0001234567",
      "balance": 5000.00,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/accounts/:id — detalle de una cuenta propia

```bash
ACCOUNT_ID="<uuid_de_la_cuenta>"

curl -s "http://localhost:3000/api/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `200`:**
```json
{
  "account": {
    "id": "uuid",
    "user_id": "uuid",
    "account_number": "0001234567",
    "balance": 5000.00,
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### GET /api/accounts/:id — cuenta de otro usuario (acceso denegado)

```bash
curl -s "http://localhost:3000/api/accounts/uuid-de-otro-usuario" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `404`:**
```json
{ "error": "account_not_found" }
```

---

## Transactions

### GET /api/transactions — historial de una cuenta

```bash
ACCOUNT_ID="<uuid_de_la_cuenta>"

curl -s "http://localhost:3000/api/transactions?account_id=$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `200`:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "sender_account_id": "uuid",
      "receiver_account_id": "uuid",
      "amount": 100.00,
      "status": "completed",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/transactions — sin account_id

```bash
curl -s "http://localhost:3000/api/transactions" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `400`:**
```json
{ "error": "account_id_required" }
```

---

### POST /api/transactions/transfer — transferencia exitosa

```bash
SENDER_ID="<uuid_cuenta_emisora>"
RECEIVER_ID="<uuid_cuenta_receptora>"

curl -s -X POST http://localhost:3000/api/transactions/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sender_account_id\": \"$SENDER_ID\",
    \"receiver_account_id\": \"$RECEIVER_ID\",
    \"amount\": 200.00
  }" | jq
```

**Respuesta esperada `201`:**
```json
{
  "transaction_id": "uuid",
  "status": "completed",
  "amount": 200.00
}
```

---

### POST /api/transactions/transfer — saldo insuficiente

```bash
curl -s -X POST http://localhost:3000/api/transactions/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sender_account_id\": \"$SENDER_ID\",
    \"receiver_account_id\": \"$RECEIVER_ID\",
    \"amount\": 9999999.00
  }" | jq
```

**Respuesta esperada `422`:**
```json
{ "error": "insufficient_funds" }
```

---

### POST /api/transactions/transfer — transferencia a la misma cuenta

```bash
curl -s -X POST http://localhost:3000/api/transactions/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sender_account_id\": \"$SENDER_ID\",
    \"receiver_account_id\": \"$SENDER_ID\",
    \"amount\": 50.00
  }" | jq
```

**Respuesta esperada `422`:**
```json
{ "error": "self_transfer_not_allowed" }
```

---

### POST /api/transactions/transfer — monto inválido

```bash
curl -s -X POST http://localhost:3000/api/transactions/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sender_account_id\": \"$SENDER_ID\",
    \"receiver_account_id\": \"$RECEIVER_ID\",
    \"amount\": -100
  }" | jq
```

**Respuesta esperada `400`:**
```json
{ "error": "invalid_amount" }
```

---

### POST /api/transactions/transfer — cuenta emisora no pertenece al usuario

```bash
curl -s -X POST http://localhost:3000/api/transactions/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sender_account_id\": \"uuid-de-otro-usuario\",
    \"receiver_account_id\": \"$RECEIVER_ID\",
    \"amount\": 100
  }" | jq
```

**Respuesta esperada `404`:**
```json
{ "error": "sender_account_not_found" }
```

---

## Logs

### GET /api/logs — logs del usuario autenticado

```bash
curl -s http://localhost:3000/api/logs \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Respuesta esperada `200`:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "event_type": "login_success",
      "description": "User alice logged in",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/logs — admin filtra por user_id

```bash
# Token de un usuario con role = "admin"
ADMIN_TOKEN="<token_admin>"
TARGET_USER_ID="<uuid_del_usuario>"

curl -s "http://localhost:3000/api/logs?user_id=$TARGET_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Respuesta esperada `200`:** logs del usuario indicado.

---

## Script completo de smoke test

Copia y pega esto en tu terminal una vez que el servidor esté corriendo:

```bash
BASE="http://localhost:3000"

echo "=== Health ==="
curl -s $BASE/api/health | jq

echo "=== Login ==="
RESPONSE=$(curl -s -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}')
echo $RESPONSE | jq
TOKEN=$(echo $RESPONSE | jq -r '.token')

echo "=== Me ==="
curl -s $BASE/api/users/me -H "Authorization: Bearer $TOKEN" | jq

echo "=== Accounts ==="
ACCOUNTS=$(curl -s $BASE/api/accounts -H "Authorization: Bearer $TOKEN")
echo $ACCOUNTS | jq
ACCOUNT_ID=$(echo $ACCOUNTS | jq -r '.accounts[0].id')

echo "=== Account detail ==="
curl -s "$BASE/api/accounts/$ACCOUNT_ID" -H "Authorization: Bearer $TOKEN" | jq

echo "=== Transactions ==="
curl -s "$BASE/api/transactions?account_id=$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "=== Logs ==="
curl -s $BASE/api/logs -H "Authorization: Bearer $TOKEN" | jq
```
