from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decodificar_token
from app.database import get_db
from app.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

CREDENCIAIS_INVALIDAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciais invalidas ou expiradas",
    headers={"WWW-Authenticate": "Bearer"},
)

def usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    try:
        payload = decodificar_token(token)
        usuario_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise CREDENCIAIS_INVALIDAS from exc

    usuario = db.get(Usuario, usuario_id)
    if usuario is None or not usuario.ativo:
        raise CREDENCIAIS_INVALIDAS
    return usuario

def exigir_perfil(*perfis: str) -> Callable[[Usuario], Usuario]:
    def verificador(usuario: Usuario = Depends(usuario_atual)) -> Usuario:
        if usuario.perfil != "GERENTE" and usuario.perfil not in perfis:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seu perfil nao tem acesso a esta operacao",
            )
        return usuario

    return verificador
