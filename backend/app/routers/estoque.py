from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil
from app.database import get_db
from app.models import FichaTecnica, Insumo, MovEstoque, Produto, Usuario
from app.schemas import (
    EntradaEstoqueIn,
    FichaTecnicaIn,
    FichaTecnicaOut,
    InsumoIn,
    InsumoOut,
    MovEstoqueOut,
)
from app.services import estoque_service

router = APIRouter(prefix="/estoque", tags=["estoque"])

ACESSO = ("GERENTE", "CAIXA")

@router.get("/insumos", response_model=list[InsumoOut])
def listar_insumos(
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> list[Insumo]:
    return db.query(Insumo).order_by(Insumo.nome).all()

@router.post("/insumos", response_model=InsumoOut, status_code=status.HTTP_201_CREATED)
def criar_insumo(
    dados: InsumoIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Insumo:
    insumo = Insumo(**dados.model_dump())
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    return insumo

@router.get("/alertas", response_model=list[InsumoOut])
def alertas_de_estoque(
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> list[Insumo]:
    return estoque_service.insumos_em_alerta(db)

@router.post("/movimentos", response_model=MovEstoqueOut, status_code=201)
def registrar_movimento(
    dados: EntradaEstoqueIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> MovEstoque:
    insumo = db.get(Insumo, dados.insumo_id)
    if insumo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Insumo nao encontrado")

    atual = float(insumo.qtd_atual)
    if dados.tipo == "ENTRADA":
        insumo.qtd_atual = atual + dados.qtd
    elif dados.tipo == "SAIDA":
        insumo.qtd_atual = atual - dados.qtd
    else:
        insumo.qtd_atual = dados.qtd

    movimento = MovEstoque(
        insumo_id=insumo.id,
        tipo=dados.tipo,
        qtd=dados.qtd,
        observacao=dados.observacao,
        usuario_id=usuario.id,
    )
    db.add(movimento)
    db.commit()
    db.refresh(movimento)
    return movimento

@router.get("/movimentos", response_model=list[MovEstoqueOut])
def listar_movimentos(
    insumo_id: int | None = None,
    limite: int = 100,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> list[MovEstoque]:
    query = db.query(MovEstoque)
    if insumo_id is not None:
        query = query.filter(MovEstoque.insumo_id == insumo_id)
    return query.order_by(MovEstoque.id.desc()).limit(min(limite, 500)).all()

@router.get("/ficha/{produto_id}", response_model=list[FichaTecnicaOut])
def ver_ficha(
    produto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> list[FichaTecnica]:
    return db.query(FichaTecnica).filter(FichaTecnica.produto_id == produto_id).all()

@router.post("/ficha/{produto_id}", response_model=FichaTecnicaOut, status_code=201)
def adicionar_a_ficha(
    produto_id: int,
    dados: FichaTecnicaIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> FichaTecnica:
    if db.get(Produto, produto_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")
    if db.get(Insumo, dados.insumo_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Insumo nao encontrado")

    linha = (
        db.query(FichaTecnica)
        .filter(
            FichaTecnica.produto_id == produto_id,
            FichaTecnica.insumo_id == dados.insumo_id,
        )
        .first()
    )
    if linha is None:
        linha = FichaTecnica(produto_id=produto_id, insumo_id=dados.insumo_id)
        db.add(linha)
    linha.qtd_usada = dados.qtd_usada

    db.commit()
    db.refresh(linha)
    return linha
