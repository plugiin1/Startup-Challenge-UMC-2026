# Sistema de Gestão para Restaurante — Startup Challenge UMC 2026

Sistema que resolve as quatro dores levantadas na conversa com a Thais (Restaurante Da Thais):
controle de estoque manual, comandas escritas à mão, dificuldade de conciliar o caixa e falta
frequente de produtos.

| Módulo | O que faz |
| --- | --- |
| Login e perfis | ADMIN, CAIXA, GARCOM, COZINHA |
| Cardápio | Categorias e produtos, por unidade ou por quilo |
| Comandas | Abre por mesa, lança itens, fecha com uma ou mais formas de pagamento |
| Cozinha | Painel que recebe o pedido na hora: RECEBIDO → PREPARANDO → PRONTO → ENTREGUE |
| Estoque | Insumos, ficha técnica, baixa automática na venda e alerta de estoque mínimo |
| Caixa | Abertura, fechamento e conciliação entre sistema, gaveta e maquininhas |

## Stack

- **Backend:** Python 3.12 + FastAPI + SQLAlchemy (documentação automática em `/docs`)
- **Banco:** PostgreSQL no Supabase
- **Frontend:** React + Vite
- **Hospedagem:** Render (backend) e Vercel (frontend)

```
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── core/        security.py, deps.py
│   │   ├── models/      usuario, produto, estoque, comanda, caixa
│   │   ├── schemas/     entrada e saída da API
│   │   ├── routers/     auth, produtos, comandas, cozinha, estoque, caixa
│   │   └── services/    baixa de estoque e fechamento de caixa
│   ├── seed.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── pages/       Login, Comandas, Cozinha, Estoque, Caixa
│       ├── services/api.js
│       └── contexts/AuthContext.jsx
├── supabase/schema.sql
└── render.yaml
```

## Passo 1 — Supabase (banco de dados)

1. Crie a conta em [supabase.com](https://supabase.com) e clique em **New project**.
   - Name: `restaurante`
   - Database Password: gere uma senha forte e **guarde**, ela entra na connection string
   - Region: `South America (São Paulo)`
2. Crie as tabelas: menu lateral **SQL Editor** → **New query** → cole o conteúdo de
   `supabase/schema.sql` → **Run**.
3. Pegue a connection string: **Project Settings** → **Database** → **Connection string** → aba
   **URI**, modo **Session pooler**. O formato é:

   ```
   postgresql://postgres.abcdefgh:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

   Troque `[YOUR-PASSWORD]` pela senha do passo 1. Use o **pooler**, não a conexão direta: o plano
   grátis do Render tem poucas conexões disponíveis.

> O backend fala com o Postgres do Supabase direto por SQLAlchemy. Não usamos o Supabase Auth,
> porque o login é feito pela nossa API com JWT.

## Passo 2 — Rodar local

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # cole a DATABASE_URL do Supabase dentro
python seed.py                  # cria as tabelas e os dados de demonstração
uvicorn app.main:app --reload
```

API em http://localhost:8000 e documentação em http://localhost:8000/docs

Frontend:

```bash
cd frontend
npm install
copy .env.example .env.local    # VITE_API_URL=http://localhost:8000
npm run dev
```

Aplicação em http://localhost:5173

Usuários criados pelo `seed.py`:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| ADMIN | admin@restaurante.com | admin123 |
| CAIXA | caixa@restaurante.com | caixa123 |
| GARCOM | garcom@restaurante.com | garcom123 |
| COZINHA | cozinha@restaurante.com | cozinha123 |

Troque essas senhas antes de usar no restaurante.

## Passo 3 — Render (backend)

1. Suba o repositório no GitHub (comandos no fim deste arquivo).
2. Em [render.com](https://render.com): **New** → **Blueprint** → escolha o repositório. O Render lê
   o `render.yaml` e já cria o serviço `restaurante-api`.
   - Se preferir manual: **New** → **Web Service**, Root Directory `backend`, Runtime `Python 3`,
     Build Command `pip install -r requirements.txt`, Start Command
     `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, Health Check Path `/health`.
3. Em **Environment**, cadastre:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | a connection string do Supabase |
   | `JWT_SECRET` | gere com `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `CORS_ORIGINS` | a URL da Vercel, ex: `https://restaurante-umc.vercel.app` |

4. Deploy. Teste em `https://restaurante-api.onrender.com/health` e `.../docs`.
5. Popule o banco uma vez: **Shell** do serviço → `python seed.py`.

> No plano gratuito o serviço hiberna depois de 15 minutos parado e a primeira requisição leva
> cerca de 50 segundos. Para a apresentação, abra o `/health` alguns minutos antes. Para o
> restaurante em produção, use o plano pago mais barato.

## Passo 4 — Vercel (frontend)

1. Em [vercel.com](https://vercel.com): **Add New** → **Project** → importe o repositório.
2. Configure:
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build` · Output Directory: `dist`
3. Em **Environment Variables**, adicione `VITE_API_URL` com a URL do Render
   (`https://restaurante-api.onrender.com`), marcando Production, Preview e Development.
4. Deploy. Copie a URL final e cole em `CORS_ORIGINS` no Render, depois reinicie o backend.

> A variável `VITE_API_URL` entra no bundle durante o build. Se mudar o valor depois, rode um
> **Redeploy** na Vercel.

A partir daí, cada `git push` na branch `main` publica o frontend na Vercel e o backend no Render
automaticamente.

## Ordem de desenvolvimento

1. Banco e autenticação — pronto
2. Cardápio e comandas — pronto
3. Painel da cozinha — pronto
4. Caixa e fechamento — pronto
5. Estoque com ficha técnica — pronto
6. Fase 2: balança pela porta serial (`pyserial`) e link de pagamento (Mercado Pago ou Pix)

## Principais rotas da API

| Método | Rota | Perfil |
| --- | --- | --- |
| POST | `/auth/login` | público |
| GET | `/produtos` | autenticado |
| POST | `/comandas` | CAIXA, GARCOM |
| POST | `/comandas/{id}/itens` | CAIXA, GARCOM |
| POST | `/comandas/{id}/fechar` | CAIXA |
| GET | `/cozinha/pedidos` | COZINHA, CAIXA, GARCOM |
| PATCH | `/cozinha/itens/{id}` | COZINHA, CAIXA, GARCOM |
| GET | `/estoque/alertas` | ADMIN, CAIXA |
| POST | `/estoque/movimentos` | ADMIN, CAIXA |
| POST | `/caixa/abrir` · `/caixa/fechar` | ADMIN, CAIXA |
| GET | `/caixa/relatorio` | ADMIN, CAIXA |

A lista completa fica em `/docs`.
