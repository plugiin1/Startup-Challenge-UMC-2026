from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

FormaPagamento = Literal["DINHEIRO", "DEBITO", "CREDITO", "PIX"]
StatusCaixa = Literal["ABERTO", "FECHADO"]

class PagamentoIn(BaseModel):
    forma: FormaPagamento
    valor: float = Field(gt=0)

class PagamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    comanda_id: int
    caixa_id: int | None
    forma: FormaPagamento
    valor: float
    criado_em: datetime

class AbrirCaixaIn(BaseModel):
    valor_inicial: float = Field(default=0, ge=0)

class FecharCaixaIn(BaseModel):

    valor_contado: float = Field(ge=0)

    valor_maquininhas: float = Field(default=0, ge=0)
    observacao: str | None = Field(default=None, max_length=300)

class CaixaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: StatusCaixa
    aberto_em: datetime
    fechado_em: datetime | None
    valor_inicial: float
    valor_contado: float | None
    valor_maquininhas: float | None
    observacao: str | None

class RelatorioCaixaOut(BaseModel):
    caixa: CaixaOut
    total_vendido: float
    por_forma: dict[str, float]

    dinheiro_esperado: float
    dinheiro_contado: float | None
    diferenca_dinheiro: float | None
    cartao_pix_sistema: float
    cartao_pix_maquininhas: float | None
    diferenca_maquininhas: float | None
    comandas_fechadas: int
    comandas_abertas: int
