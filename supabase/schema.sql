create table if not exists usuarios (
    id serial primary key,
    nome varchar(120) not null,
    email varchar(120) not null unique,
    senha_hash varchar(200) not null,
    perfil varchar(20) not null check (perfil in ('ADMIN', 'CAIXA', 'GARCOM', 'COZINHA')),
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

create table if not exists categorias (
    id serial primary key,
    nome varchar(80) not null unique
);

create table if not exists produtos (
    id serial primary key,
    categoria_id integer references categorias (id),
    nome varchar(120) not null,
    preco numeric(10, 2) not null,
    tipo varchar(10) not null default 'UNIDADE' check (tipo in ('UNIDADE', 'KG')),
    ativo boolean not null default true
);

create table if not exists insumos (
    id serial primary key,
    nome varchar(120) not null unique,
    unidade varchar(10) not null default 'UN',
    qtd_atual numeric(10, 3) not null default 0,
    qtd_minima numeric(10, 3) not null default 0
);

create table if not exists ficha_tecnica (
    id serial primary key,
    produto_id integer not null references produtos (id) on delete cascade,
    insumo_id integer not null references insumos (id) on delete cascade,
    qtd_usada numeric(10, 3) not null,
    unique (produto_id, insumo_id)
);

create table if not exists mov_estoque (
    id serial primary key,
    insumo_id integer not null references insumos (id),
    tipo varchar(10) not null check (tipo in ('ENTRADA', 'SAIDA', 'AJUSTE')),
    qtd numeric(10, 3) not null,
    observacao varchar(200),
    usuario_id integer references usuarios (id),
    data timestamptz not null default now()
);

create table if not exists caixas (
    id serial primary key,
    status varchar(10) not null default 'ABERTO' check (status in ('ABERTO', 'FECHADO')),
    aberto_em timestamptz not null default now(),
    fechado_em timestamptz,
    valor_inicial numeric(10, 2) not null default 0,
    valor_contado numeric(10, 2),
    valor_maquininhas numeric(10, 2),
    observacao varchar(300),
    usuario_id integer references usuarios (id)
);

create table if not exists comandas (
    id serial primary key,
    mesa varchar(20) not null,
    cliente varchar(120),
    status varchar(12) not null default 'ABERTA' check (status in ('ABERTA', 'FECHADA', 'CANCELADA')),
    aberta_em timestamptz not null default now(),
    fechada_em timestamptz,
    usuario_id integer references usuarios (id)
);

create table if not exists itens_comanda (
    id serial primary key,
    comanda_id integer not null references comandas (id) on delete cascade,
    produto_id integer not null references produtos (id),
    qtd numeric(10, 3) not null default 1,
    peso_kg numeric(10, 3),
    preco_unit numeric(10, 2) not null,
    observacao varchar(200),
    status_cozinha varchar(12) not null default 'RECEBIDO'
        check (status_cozinha in ('RECEBIDO', 'PREPARANDO', 'PRONTO', 'ENTREGUE')),
    criado_em timestamptz not null default now()
);

create table if not exists pagamentos (
    id serial primary key,
    comanda_id integer not null references comandas (id),
    caixa_id integer references caixas (id),
    forma varchar(12) not null check (forma in ('DINHEIRO', 'DEBITO', 'CREDITO', 'PIX')),
    valor numeric(10, 2) not null,
    criado_em timestamptz not null default now()
);

create index if not exists idx_comandas_status on comandas (status);
create index if not exists idx_itens_status_cozinha on itens_comanda (status_cozinha);
create index if not exists idx_pagamentos_caixa on pagamentos (caixa_id);
create index if not exists idx_caixas_status on caixas (status);
