from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TipoProduto = Literal["UNIDADE", "KG"]

class CategoriaIn(BaseModel):
    nome: str = Field(min_length=2, max_length=80)

class CategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str

class ProdutoIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    preco: float = Field(default=0, ge=0)
    tipo: TipoProduto = "UNIDADE"
    categoria_id: int | None = None
    ativo: bool = True
    baixa_ao_ativar: bool = False

class ProdutoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    preco: float
    tipo: TipoProduto
    ativo: bool
    baixa_ao_ativar: bool = False
    categoria_id: int | None
    categoria: CategoriaOut | None = None
