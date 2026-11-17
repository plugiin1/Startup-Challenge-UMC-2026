from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.caixa import PagamentoIn

StatusComanda = Literal["ABERTA", "FECHADA", "CANCELADA"]
StatusCozinha = Literal["RECEBIDO", "PREPARANDO", "PRONTO", "ENTREGUE"]

class AbrirComandaIn(BaseModel):
    mesa: str = Field(min_length=1, max_length=20)
    cliente: str | None = Field(default=None, max_length=120)

class ItemComandaIn(BaseModel):
    produto_id: int
    qtd: float = Field(default=1, gt=0)

    peso_kg: float | None = Field(default=None, gt=0)
    observacao: str | None = Field(default=None, max_length=200)

class ItemComandaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    produto_nome: str = ""
    qtd: float
    peso_kg: float | None
    preco_unit: float
    subtotal: float
    observacao: str | None
    status_cozinha: StatusCozinha
    criado_em: datetime

class ComandaResumoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mesa: str
    cliente: str | None
    status: StatusComanda
    aberta_em: datetime
    fechada_em: datetime | None
    total: float

class ComandaOut(ComandaResumoOut):
    itens: list[ItemComandaOut] = []

class FecharComandaIn(BaseModel):
    pagamentos: list[PagamentoIn] = Field(min_length=1)

class StatusCozinhaIn(BaseModel):
    status_cozinha: StatusCozinha

class PedidoCozinhaOut(BaseModel):
    item_id: int
    comanda_id: int
    mesa: str
    produto_nome: str
    qtd: float
    observacao: str | None
    status_cozinha: StatusCozinha
    criado_em: datetime
