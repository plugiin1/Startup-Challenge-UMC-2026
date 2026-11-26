from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class Configuracao(Base):
    __tablename__ = "configuracoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome_restaurante: Mapped[str] = mapped_column(String(120), default="Meu Restaurante")
