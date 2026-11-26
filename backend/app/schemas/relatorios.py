from pydantic import BaseModel

class VendaDiaOut(BaseModel):
    dia: str
    total: float
    comandas: int

class RelatorioVendasOut(BaseModel):
    total_vendido: float
    comandas: int
    ticket_medio: float
    por_forma: dict[str, float]
    por_dia: list[VendaDiaOut]

class ProdutoVendidoOut(BaseModel):
    produto_id: int
    produto_nome: str
    quantidade: float
    receita: float
