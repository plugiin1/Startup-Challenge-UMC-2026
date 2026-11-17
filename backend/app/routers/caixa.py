from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil
from app.database import get_db
from app.models import Caixa, Usuario
from app.schemas import AbrirCaixaIn, CaixaOut, FecharCaixaIn, RelatorioCaixaOut
from app.services import caixa_service

router = APIRouter(prefix="/caixa", tags=["caixa"])

ACESSO = ("ADMIN", "CAIXA")

@router.get("/atual", response_model=CaixaOut | None)
def caixa_atual(
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> Caixa | None:
    return caixa_service.caixa_aberto(db)

@router.post("/abrir", response_model=CaixaOut, status_code=status.HTTP_201_CREATED)
def abrir_caixa(
    dados: AbrirCaixaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> Caixa:
    if caixa_service.caixa_aberto(db) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ja existe um caixa aberto")

    caixa = Caixa(valor_inicial=dados.valor_inicial, usuario_id=usuario.id)
    db.add(caixa)
    db.commit()
    db.refresh(caixa)
    return caixa

@router.get("/relatorio", response_model=RelatorioCaixaOut)
def relatorio_do_caixa_aberto(
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> RelatorioCaixaOut:
    caixa = caixa_service.caixa_aberto(db)
    if caixa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nenhum caixa aberto")
    return caixa_service.montar_relatorio(db, caixa)

@router.get("/{caixa_id}/relatorio", response_model=RelatorioCaixaOut)
def relatorio_por_id(
    caixa_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> RelatorioCaixaOut:
    caixa = db.get(Caixa, caixa_id)
    if caixa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Caixa nao encontrado")
    return caixa_service.montar_relatorio(db, caixa)

@router.post("/fechar", response_model=RelatorioCaixaOut)
def fechar_caixa(
    dados: FecharCaixaIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> RelatorioCaixaOut:
    caixa = caixa_service.caixa_aberto(db)
    if caixa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nenhum caixa aberto")

    caixa.valor_contado = dados.valor_contado
    caixa.valor_maquininhas = dados.valor_maquininhas
    caixa.observacao = dados.observacao
    caixa.status = "FECHADO"
    caixa.fechado_em = datetime.now(UTC)
    db.commit()
    db.refresh(caixa)

    return caixa_service.montar_relatorio(db, caixa)
