from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import exigir_perfil
from app.database import get_db
from app.models import Comanda, ItemComanda, Usuario
from app.schemas import PedidoCozinhaOut, StatusCozinhaIn

router = APIRouter(prefix="/cozinha", tags=["cozinha"])

ACESSO = ("COZINHA", "CAIXA", "GARCOM")

@router.get("/pedidos", response_model=list[PedidoCozinhaOut])
def painel_de_pedidos(
    incluir_entregues: bool = False,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> list[PedidoCozinhaOut]:
    status_visiveis = ["RECEBIDO", "PREPARANDO", "PRONTO"]
    if incluir_entregues:
        status_visiveis.append("ENTREGUE")

    itens = (
        db.query(ItemComanda)
        .join(Comanda)
        .options(joinedload(ItemComanda.produto), joinedload(ItemComanda.comanda))
        .filter(Comanda.status == "ABERTA", ItemComanda.status_cozinha.in_(status_visiveis))
        .order_by(ItemComanda.criado_em)
        .all()
    )

    return [
        PedidoCozinhaOut(
            item_id=item.id,
            comanda_id=item.comanda_id,
            mesa=item.comanda.mesa,
            produto_nome=item.produto_nome,
            qtd=float(item.qtd),
            observacao=item.observacao,
            status_cozinha=item.status_cozinha,
            criado_em=item.criado_em,
        )
        for item in itens
    ]

@router.patch("/itens/{item_id}", response_model=PedidoCozinhaOut)
def mudar_status(
    item_id: int,
    dados: StatusCozinhaIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> PedidoCozinhaOut:
    item = db.get(ItemComanda, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item nao encontrado")

    item.status_cozinha = dados.status_cozinha
    db.commit()
    db.refresh(item)

    return PedidoCozinhaOut(
        item_id=item.id,
        comanda_id=item.comanda_id,
        mesa=item.comanda.mesa,
        produto_nome=item.produto_nome,
        qtd=float(item.qtd),
        observacao=item.observacao,
        status_cozinha=item.status_cozinha,
        criado_em=item.criado_em,
    )
