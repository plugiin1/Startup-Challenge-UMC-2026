from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.produto import Produto

STATUS_COMANDA = ("ABERTA", "FECHADA", "CANCELADA")
STATUS_COZINHA = ("RECEBIDO", "PREPARANDO", "PRONTO", "ENTREGUE")

class Comanda(Base):
    __tablename__ = "comandas"

    id: Mapped[int] = mapped_column(primary_key=True)
    mesa: Mapped[str | None] = mapped_column(String(80))
    cliente: Mapped[str | None] = mapped_column(String(80))
    telefone: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(12), default="ABERTA", index=True)
    aberta_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    fechada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))

    itens: Mapped[list["ItemComanda"]] = relationship(
        back_populates="comanda", cascade="all, delete-orphan", order_by="ItemComanda.id"
    )
    pagamentos: Mapped[list["Pagamento"]] = relationship(back_populates="comanda")

    @property
    def total(self) -> float:
        return round(float(sum(item.subtotal for item in self.itens)), 2)

class ItemComanda(Base):
    __tablename__ = "itens_comanda"

    id: Mapped[int] = mapped_column(primary_key=True)
    comanda_id: Mapped[int] = mapped_column(ForeignKey("comandas.id", ondelete="CASCADE"))
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"))
    qtd: Mapped[float] = mapped_column(Numeric(10, 3), default=1)
    peso_kg: Mapped[float | None] = mapped_column(Numeric(10, 3))
    preco_unit: Mapped[float] = mapped_column(Numeric(10, 2))
    observacao: Mapped[str | None] = mapped_column(String(200))
    status_cozinha: Mapped[str] = mapped_column(String(12), default="RECEBIDO", index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    comanda: Mapped[Comanda] = relationship(back_populates="itens")
    produto: Mapped[Produto] = relationship()

    @property
    def quantidade_cobrada(self) -> float:
        if self.produto is not None and self.produto.tipo == "KG" and self.peso_kg:
            return float(self.peso_kg)
        return float(self.qtd)

    @property
    def subtotal(self) -> float:
        return round(float(self.preco_unit) * self.quantidade_cobrada, 2)

    @property
    def produto_nome(self) -> str:
        return self.produto.nome if self.produto is not None else ""
