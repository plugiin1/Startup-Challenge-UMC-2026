from sqlalchemy.orm import Session

from app.models import Insumo, ItemComanda, MovEstoque

def baixar_insumos_do_item(db: Session, item: ItemComanda, usuario_id: int | None) -> None:
    produto = item.produto
    if produto is None or not produto.ficha:
        return

    multiplicador = item.quantidade_cobrada

    for linha in produto.ficha:
        insumo = db.get(Insumo, linha.insumo_id)
        if insumo is None:
            continue
        consumo = float(linha.qtd_usada) * multiplicador
        insumo.qtd_atual = float(insumo.qtd_atual) - consumo
        db.add(
            MovEstoque(
                insumo_id=insumo.id,
                tipo="SAIDA",
                qtd=consumo,
                observacao=f"Venda - comanda {item.comanda_id}",
                usuario_id=usuario_id,
            )
        )

def estornar_insumos_do_item(db: Session, item: ItemComanda, usuario_id: int | None) -> None:
    produto = item.produto
    if produto is None or not produto.ficha:
        return

    multiplicador = item.quantidade_cobrada

    for linha in produto.ficha:
        insumo = db.get(Insumo, linha.insumo_id)
        if insumo is None:
            continue
        consumo = float(linha.qtd_usada) * multiplicador
        insumo.qtd_atual = float(insumo.qtd_atual) + consumo
        db.add(
            MovEstoque(
                insumo_id=insumo.id,
                tipo="ENTRADA",
                qtd=consumo,
                observacao=f"Estorno - comanda {item.comanda_id}",
                usuario_id=usuario_id,
            )
        )

def insumos_em_alerta(db: Session) -> list[Insumo]:
    return db.query(Insumo).filter(Insumo.qtd_atual <= Insumo.qtd_minima).order_by(Insumo.nome).all()
