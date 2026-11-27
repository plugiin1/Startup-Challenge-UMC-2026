<div align="center">

# 🍙 Casa Gohan

### Sistema de gestão para buffet por Kg

**Brasil + Ásia** · Arujá, SP · Segunda a sexta, 11h às 15h

[![Aplicação](https://img.shields.io/badge/aplicação-casagohan.vercel.app-6e1a15?style=for-the-badge)](https://casagohan.vercel.app)
[![API](https://img.shields.io/badge/API-documentação-c2601f?style=for-the-badge)](https://restaurante-api-v557.onrender.com/docs)

![Python](https://img.shields.io/badge/Python-3.12-15705a?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.118-15705a?style=flat-square)
![React](https://img.shields.io/badge/React-18-1f5d7a?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-1f5d7a?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-a9711a?style=flat-square)

*Projeto do Startup Challenge UMC 2026*

</div>

---

## O problema

A Casa Gohan serve almoço por quilo de segunda a sexta. Em quatro horas de movimento, quatro coisas travam o salão:

| A dor | O que acontece hoje |
| :-- | :-- |
| 🧾 **Comanda no papel** | O cliente pesa o prato, alguém anota num papelzinho e o papel se perde, borra ou vai embora no bolso |
| 📦 **Estoque no olho** | Ninguém sabe quanto de arroz saiu no dia, só quando acaba |
| 💸 **Caixa que não fecha** | No fim do dia, a gaveta e as maquininhas nunca batem com o que foi vendido |
| ⚠️ **Falta de produto** | A reposição é feita de memória, e sempre falta alguma coisa no meio do serviço |

## A solução

Um sistema só, aberto no navegador do caixa, que acompanha o prato do momento da pesagem até o fechamento do dia.

| Módulo | O que faz |
| :-- | :-- |
| **Comandas** | Abre no nome do cliente, registra o peso do prato, soma bebidas e marmitex, fecha em uma ou mais formas de pagamento |
| **Cardápio** | O que está no buffet hoje, com ativação item a item e baixa automática de estoque |
| **Estoque** | Insumos, ficha técnica, entrada e saída, alerta de mínimo |
| **Caixa** | Abertura, conferência ao vivo e fechamento comparando sistema, gaveta e maquininhas |
| **Relatórios** | Vendas por dia e ranking dos itens mais vendidos |
| **Usuários** | O gerente cadastra, ativa e remove os caixas da equipe |

## As regras que o sistema garante

Estas não são telas, são travas. Valem no backend, não só no navegador.

**O prato na balança vira dinheiro na comanda.** Produto por quilo exige o peso. O sistema multiplica pelo preço do dia e lança na comanda na hora.

**Ativar o buffet baixa o estoque, e o sistema avisa antes.** Ao ativar um prato, aparece a lista do que vai sair, item por item, com o saldo antes e depois. Só confirma quem viu a conta.

**O que foi pro buffet não volta.** Desativar um prato não devolve nada ao estoque, porque comida de buffet não é reaproveitada. A tela diz isso antes de confirmar.

**Sem estoque, não ativa.** Se faltar ingrediente, o cartão fica vermelho, o botão trava e o aviso diz o que está faltando. A API recusa com `409`.

**Estoque não fica negativo.** Saída maior que o saldo é recusada, com a quantidade disponível na mensagem.

**Cada dia começa do zero.** Abrir o caixa desativa todos os pratos de buffet. Bebidas e porções continuam no ar.

**Buffet por quilo e marmitex não saem do cardápio.** São itens fixos: dá para mudar o preço na promoção, mas não dá para desativar nem excluir, nem pela tela nem pela API.

**Servidor público paga 20% a menos no prato.** O desconto incide só sobre o item por quilo. Bebidas seguem no valor cheio, e o total já sai descontado para o caixa, para a gaveta e para o relatório.

**O caixa fecha com três números na mesa.** O que o sistema registrou, o que foi contado na gaveta e o que a maquininha reporta, com a diferença calculada.

---

## Stack

| Camada | Tecnologia | Onde roda |
| :-- | :-- | :-- |
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2 · Pydantic v2 | [Render](https://render.com) |
| Banco | PostgreSQL | [Supabase](https://supabase.com) |
| Frontend | React 18 · Vite 5 · Framer Motion | [Vercel](https://vercel.com) |
| Autenticação | JWT próprio (PyJWT + bcrypt) | — |

```
.
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI, CORS e /health
│   │   ├── config.py          variáveis de ambiente
│   │   ├── database.py        engine e sessão
│   │   ├── core/              security.py (JWT, bcrypt) e deps.py (perfis)
│   │   ├── models/            usuario, produto, estoque, comanda, caixa
│   │   ├── schemas/           entrada e saída da API
│   │   ├── routers/           auth, produtos, comandas, estoque, caixa, relatorios
│   │   └── services/          baixa de estoque e conciliação de caixa
│   ├── seed.py                cria as tabelas e os dados da casa
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/             Login, Comandas, Cardapio, Estoque, Caixa, Relatorios, Usuarios
│       ├── components/Logo.jsx
│       ├── contexts/AuthContext.jsx
│       ├── services/api.js
│       └── styles.css         tema da casa em variáveis CSS
└── render.yaml                blueprint do backend
```

### Perfis de acesso

| Perfil | Vê |
| :-- | :-- |
| **Gerente** | Tudo, mais Cardápio e Usuários |
| **Caixa** | Comandas, Estoque, Caixa e Relatórios |

---

## Rodando na sua máquina

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python seed.py
uvicorn app.main:app --reload
```

API em `http://localhost:8000`, documentação interativa em `http://localhost:8000/docs`.

O `seed.py` cria as tabelas e popula com o cardápio e o estoque da casa. Para recriar tudo do zero, `python seed.py --reset`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Aplicação em `http://localhost:5173`.

### Variáveis de ambiente

**`backend/.env`**

| Variável | Para que serve |
| :-- | :-- |
| `DATABASE_URL` | Connection string do Postgres |
| `JWT_SECRET` | Chave dos tokens. Gere com `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duração da sessão. `720` cobre o turno inteiro |
| `CORS_ORIGINS` | Origens liberadas, separadas por vírgula |

**`frontend/.env.local`**

| Variável | Para que serve |
| :-- | :-- |
| `VITE_API_URL` | Endereço da API |

> ⚠️ O `seed.py` cria dois usuários de demonstração com senhas conhecidas, visíveis no próprio arquivo. **Troque as duas antes de rodar no restaurante.**

---

## Publicando

### 1. Banco no Supabase

1. **New project** em [supabase.com](https://supabase.com).
   - Region: **East US (North Virginia)** — a mesma do backend. A latência que pesa é entre a API e o banco, não entre você e o banco.
   - Guarde a senha do banco, ela entra na connection string.
2. **Project Settings → Database → Connection string → URI**, modo **Session pooler**:

   ```
   postgresql://postgres.SEUPROJETO:SUA_SENHA@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```

   Troque `[YOUR-PASSWORD]` pela senha de verdade — **sem os colchetes**. Use o pooler, não a conexão direta: o plano grátis tem poucas conexões.
3. As tabelas são criadas pelo `seed.py`, não por SQL manual.

> O backend fala direto com o Postgres por SQLAlchemy. Não usamos Supabase Auth nem a Data API, então pode deixar as duas desligadas.

### 2. Backend no Render

1. **New → Blueprint** e escolha o repositório. O Render lê o `render.yaml` e cria o serviço.
2. Em **Environment**, cadastre `DATABASE_URL`, `JWT_SECRET` e `CORS_ORIGINS` (a URL da Vercel).
3. Depois do deploy, rode o `seed.py` uma vez pelo **Shell** do serviço.
4. Confira em `/health` e `/docs`.

### 3. Frontend na Vercel

1. **Add New → Project** e importe o repositório.
2. Framework **Vite**, Root Directory **`frontend`**, Output **`dist`**.
3. Em **Environment Variables**, `VITE_API_URL` com a URL do Render, marcando Production, Preview e Development.
4. Copie a URL final e coloque em `CORS_ORIGINS` no Render.

A partir daí, cada `git push` na `main` publica os dois automaticamente.

### Três pegadinhas que já nos pegaram

> **Trocou o domínio da Vercel? Atualize o `CORS_ORIGINS` no Render.** Senão a aplicação carrega e o login morre com "Failed to fetch".
>
> **Mudou um model do backend? Rode o `ALTER TABLE` no Supabase antes do deploy terminar.** Na ordem inversa, a API devolve 500 e o navegador mostra só "Failed to fetch", porque resposta de erro não leva cabeçalho de CORS.
>
> **`VITE_API_URL` entra no bundle durante o build.** Mudou o valor? Precisa de um Redeploy na Vercel.

---

## Principais rotas

| Método | Rota | Quem acessa |
| :-- | :-- | :-- |
| `POST` | `/auth/login` | público |
| `GET` `POST` `PATCH` `DELETE` | `/auth/usuarios` | gerente |
| `GET` | `/produtos` | autenticado |
| `POST` `PUT` `DELETE` | `/produtos` | gerente |
| `GET` | `/produtos/{id}/previa-ativacao` | gerente, caixa |
| `POST` | `/comandas` | gerente, caixa |
| `POST` `DELETE` | `/comandas/{id}/itens` | gerente, caixa |
| `POST` | `/comandas/{id}/fechar` | caixa |
| `GET` `POST` | `/estoque/insumos` · `/estoque/movimentos` | gerente, caixa |
| `GET` | `/estoque/alertas` | gerente, caixa |
| `POST` | `/caixa/abrir` · `/caixa/fechar` | gerente, caixa |
| `GET` | `/caixa/relatorio` | gerente, caixa |
| `GET` | `/relatorios/vendas` · `/relatorios/produtos` | gerente, caixa |

A lista completa, com os corpos de requisição, fica em **[/docs](https://restaurante-api-v557.onrender.com/docs)**.

---

<div align="center">

Feito para a **Casa Gohan** · Startup Challenge UMC 2026

</div>
