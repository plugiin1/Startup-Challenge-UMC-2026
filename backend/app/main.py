from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, caixa, comandas, config, cozinha, estoque, produtos, relatorios

app = FastAPI(
    title="Gestao de Restaurante - API",
    description=(
        "Comandas digitais, pedidos direto para a cozinha, controle de estoque "
        "com baixa automatica e fechamento de caixa."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(produtos.router)
app.include_router(comandas.router)
app.include_router(cozinha.router)
app.include_router(estoque.router)
app.include_router(caixa.router)
app.include_router(config.router)
app.include_router(relatorios.router)

@app.get("/health", tags=["infra"])
def health() -> dict[str, str]:
    return {"status": "ok"}
