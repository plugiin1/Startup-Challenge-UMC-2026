from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Perfil = Literal["ADMIN", "CAIXA", "GARCOM", "COZINHA"]

class LoginIn(BaseModel):
    email: EmailStr
    senha: str

class UsuarioIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=72)
    perfil: Perfil

class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: EmailStr
    perfil: Perfil
    ativo: bool

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
