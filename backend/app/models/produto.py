from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

TIPOS_PRODUTO = ("UNIDADE", "KG")

class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(80), unique=True)

    produtos: Mapped[list["Produto"]] = relationship(back_populates="categoria")

class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(primary_key=True)
    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("categorias.id"))
    nome: Mapped[str] = mapped_column(String(120))
    preco: Mapped[float] = mapped_column(Numeric(10, 2))

    tipo: Mapped[str] = mapped_column(String(10), default="UNIDADE")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    baixa_ao_ativar: Mapped[bool] = mapped_column(Boolean, default=False)

    categoria: Mapped[Categoria | None] = relationship(back_populates="produtos")
    ficha: Mapped[list["FichaTecnica"]] = relationship(
        back_populates="produto", cascade="all, delete-orphan"
    )

class FichaTecnica(Base):
    __tablename__ = "ficha_tecnica"

    id: Mapped[int] = mapped_column(primary_key=True)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id", ondelete="CASCADE"))
    insumo_id: Mapped[int] = mapped_column(ForeignKey("insumos.id", ondelete="CASCADE"))
    qtd_usada: Mapped[float] = mapped_column(Numeric(10, 3))

    produto: Mapped[Produto] = relationship(back_populates="ficha")
    insumo: Mapped["Insumo"] = relationship()
