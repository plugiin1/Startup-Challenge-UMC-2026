from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

FORMAS_PAGAMENTO = ("DINHEIRO", "DEBITO", "CREDITO", "PIX")
STATUS_CAIXA = ("ABERTO", "FECHADO")

class Caixa(Base):
    __tablename__ = "caixas"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String(10), default="ABERTO", index=True)
    aberto_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    fechado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    valor_inicial: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    valor_contado: Mapped[float | None] = mapped_column(Numeric(10, 2))

    valor_maquininhas: Mapped[float | None] = mapped_column(Numeric(10, 2))
    observacao: Mapped[str | None] = mapped_column(String(300))
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))

    pagamentos: Mapped[list["Pagamento"]] = relationship(back_populates="caixa")

class Pagamento(Base):
    __tablename__ = "pagamentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    comanda_id: Mapped[int] = mapped_column(ForeignKey("comandas.id"))
    caixa_id: Mapped[int | None] = mapped_column(ForeignKey("caixas.id"))
    forma: Mapped[str] = mapped_column(String(12))
    valor: Mapped[float] = mapped_column(Numeric(10, 2))
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    caixa: Mapped[Caixa | None] = relationship(back_populates="pagamentos")
    comanda: Mapped["Comanda"] = relationship(back_populates="pagamentos")
