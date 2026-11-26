from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

TipoMovimento = Literal["ENTRADA", "SAIDA", "AJUSTE"]

class InsumoIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    unidade: str = Field(default="UN", max_length=10)
    qtd_atual: float = 0
    qtd_minima: float = 0
    ingrediente: bool = True

class InsumoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    unidade: str
    qtd_atual: float
    qtd_minima: float
    ingrediente: bool = True

    @computed_field
    @property
    def abaixo_do_minimo(self) -> bool:
        return self.qtd_atual <= self.qtd_minima

class EntradaEstoqueIn(BaseModel):
    insumo_id: int
    tipo: TipoMovimento = "ENTRADA"
    qtd: float = Field(gt=0)
    observacao: str | None = Field(default=None, max_length=200)

class MovEstoqueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    insumo_id: int
    tipo: TipoMovimento
    qtd: float
    observacao: str | None
    data: datetime

class FichaTecnicaIn(BaseModel):
    insumo_id: int
    qtd_usada: float = Field(gt=0)

class FichaTecnicaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    insumo_id: int
    qtd_usada: float
    insumo: InsumoOut | None = None
