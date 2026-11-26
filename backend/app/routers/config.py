from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil, usuario_atual
from app.database import get_db
from app.models import Configuracao, Usuario
from app.schemas import ConfigIn, ConfigOut

router = APIRouter(prefix="/config", tags=["config"])

def obter_config(db: Session) -> Configuracao:
    cfg = db.get(Configuracao, 1)
    if cfg is None:
        cfg = Configuracao(id=1)
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg

@router.get("", response_model=ConfigOut)
def ver_config(
    db: Session = Depends(get_db),
    _: Usuario = Depends(usuario_atual),
) -> Configuracao:
    return obter_config(db)

@router.put("", response_model=ConfigOut)
def atualizar_config(
    dados: ConfigIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Configuracao:
    cfg = obter_config(db)
    cfg.nome_restaurante = dados.nome_restaurante
    db.commit()
    db.refresh(cfg)
    return cfg
