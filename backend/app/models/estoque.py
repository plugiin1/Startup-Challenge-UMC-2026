from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

TIPOS_MOVIMENTO = ("ENTRADA", "SAIDA", "AJUSTE")

class Insumo(Base):
    __tablename__ = "insumos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), unique=True)
    unidade: Mapped[str] = mapped_column(String(10), default="UN")
    qtd_atual: Mapped[float] = mapped_column(Numeric(10, 3), default=0)
    qtd_minima: Mapped[float] = mapped_column(Numeric(10, 3), default=0)
    ingrediente: Mapped[bool] = mapped_column(Boolean, default=True)

class MovEstoque(Base):
    __tablename__ = "mov_estoque"

    id: Mapped[int] = mapped_column(primary_key=True)
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id"))
    tipo: Mapped[str] = mapped_column(String(10))
    qtd: Mapped[float] = mapped_column(Numeric(10, 3))
    observacao: Mapped[str | None] = mapped_column(String(200))
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    insumo: Mapped[Insumo] = relationship()
