from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil
from app.database import get_db
from app.models import Comanda, ItemComanda, Pagamento, Produto, Usuario
from app.schemas import (
    AbrirComandaIn,
    ComandaOut,
    ComandaResumoOut,
    FecharComandaIn,
    ItemComandaIn,
    ItemComandaOut,
)
from app.services import caixa_service, estoque_service

router = APIRouter(prefix="/comandas", tags=["comandas"])

OPERADORES = ("CAIXA",)

def _buscar_comanda(db: Session, comanda_id: int) -> Comanda:
    comanda = db.get(Comanda, comanda_id)
    if comanda is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comanda nao encontrada")
    return comanda

@router.get("", response_model=list[ComandaResumoOut])
def listar_comandas(
    status_filtro: str = "ABERTA",
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*OPERADORES)),
) -> list[Comanda]:
    return (
        db.query(Comanda)
        .filter(Comanda.status == status_filtro.upper())
        .order_by(Comanda.aberta_em.desc())
        .all()
    )

@router.post("", response_model=ComandaOut, status_code=status.HTTP_201_CREATED)
def abrir_comanda(
    dados: AbrirComandaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil(*OPERADORES)),
) -> Comanda:
    cliente = dados.cliente.strip()
    tel = (dados.telefone or "").strip()

    abertas = (
        db.query(Comanda)
        .filter(func.lower(Comanda.cliente) == cliente.lower(), Comanda.status == "ABERTA")
        .all()
    )
    if abertas:
        if not tel:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail={
                    "code": "TELEFONE_NECESSARIO",
                    "mensagem": f"Ja existe uma comanda aberta para {cliente}. Informe o telefone para diferenciar.",
                },
            )
        if any((c.telefone or "").strip() == tel for c in abertas):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICADA",
                    "mensagem": f"{cliente} com esse telefone ja tem uma comanda aberta.",
                },
            )

    comanda = Comanda(cliente=cliente, telefone=tel or None, usuario_id=usuario.id)
    db.add(comanda)
    db.commit()
    db.refresh(comanda)
    return comanda

@router.get("/{comanda_id}", response_model=ComandaOut)
def ver_comanda(
    comanda_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*OPERADORES)),
) -> Comanda:
    return _buscar_comanda(db, comanda_id)

@router.post("/{comanda_id}/itens", response_model=ItemComandaOut, status_code=201)
def lancar_item(
    comanda_id: int,
    dados: ItemComandaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil(*OPERADORES)),
) -> ItemComanda:
    comanda = _buscar_comanda(db, comanda_id)
    if comanda.status != "ABERTA":
        raise HTTPException(status.HTTP_409_CONFLICT, "Esta comanda nao esta aberta")

    produto = db.get(Produto, dados.produto_id)
    if produto is None or not produto.ativo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado ou inativo")
    if produto.tipo == "KG" and not dados.peso_kg:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Informe o peso em kg para produtos vendidos por quilo",
        )

    item = ItemComanda(
        comanda_id=comanda.id,
        produto_id=produto.id,
        qtd=dados.qtd,
        peso_kg=dados.peso_kg,
        preco_unit=produto.preco,
        observacao=dados.observacao,
    )
    db.add(item)
    db.flush()

    estoque_service.baixar_insumos_do_item(db, item, usuario.id)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{comanda_id}/itens/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item(
    comanda_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil(*OPERADORES)),
) -> None:
    item = db.get(ItemComanda, item_id)
    if item is None or item.comanda_id != comanda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item nao encontrado nesta comanda")
    if item.comanda.status != "ABERTA":
        raise HTTPException(status.HTTP_409_CONFLICT, "Esta comanda nao esta aberta")
    estoque_service.estornar_insumos_do_item(db, item, usuario.id)
    db.delete(item)
    db.commit()

@router.post("/{comanda_id}/cancelar", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_comanda(
    comanda_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil(*OPERADORES)),
) -> None:
    comanda = _buscar_comanda(db, comanda_id)
    if comanda.status != "ABERTA":
        raise HTTPException(status.HTTP_409_CONFLICT, "Esta comanda nao esta aberta")
    for item in comanda.itens:
        estoque_service.estornar_insumos_do_item(db, item, usuario.id)
    comanda.status = "CANCELADA"
    comanda.fechada_em = datetime.now(UTC)
    db.commit()

@router.post("/{comanda_id}/fechar", response_model=ComandaOut)
def fechar_comanda(
    comanda_id: int,
    dados: FecharComandaIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("CAIXA")),
) -> Comanda:
    comanda = _buscar_comanda(db, comanda_id)
    if comanda.status != "ABERTA":
        raise HTTPException(status.HTTP_409_CONFLICT, "Esta comanda ja foi fechada")
    if not comanda.itens:
        raise HTTPException(status.HTTP_409_CONFLICT, "Comanda sem itens lancados")

    caixa = caixa_service.caixa_aberto(db)
    if caixa is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Nenhum caixa aberto. Abra o caixa antes de receber pagamentos",
        )

    total_devido = round(comanda.total, 2)

    total_pago = round(sum(p.valor for p in dados.pagamentos), 2)
    if abs(total_pago - total_devido) > 0.01:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Pagamentos somam {total_pago:.2f} e o total e {total_devido:.2f}",
        )

    for pagamento in dados.pagamentos:
        db.add(
            Pagamento(
                comanda_id=comanda.id,
                caixa_id=caixa.id,
                forma=pagamento.forma,
                valor=pagamento.valor,
            )
        )

    comanda.status = "FECHADA"
    comanda.fechada_em = datetime.now(UTC)
    db.commit()
    db.refresh(comanda)
    return comanda
