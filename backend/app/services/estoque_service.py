from sqlalchemy.orm import Session

from app.models import Insumo, ItemComanda, MovEstoque

class EstoqueInsuficiente(Exception):
    def __init__(self, faltantes: list[dict]) -> None:
        self.faltantes = faltantes
        nomes = ", ".join(f["nome"] for f in faltantes)
        super().__init__(f"Estoque insuficiente: {nomes}")

def previa_do_buffet(db: Session, produto) -> list[dict]:
    if produto is None or not produto.ficha:
        return []

    linhas = []
    for linha in produto.ficha:
        insumo = db.get(Insumo, linha.insumo_id)
        if insumo is None:
            continue
        necessario = float(linha.qtd_usada)
        disponivel = float(insumo.qtd_atual)
        linhas.append(
            {
                "insumo_id": insumo.id,
                "nome": insumo.nome,
                "unidade": insumo.unidade,
                "qtd_necessaria": necessario,
                "qtd_atual": disponivel,
                "suficiente": disponivel >= necessario,
            }
        )
    return sorted(linhas, key=lambda x: x["nome"])

def enviar_ao_buffet(db: Session, produto, usuario_id: int | None) -> None:
    if produto is None or not produto.ficha:
        return

    previa = previa_do_buffet(db, produto)
    faltantes = [p for p in previa if not p["suficiente"]]
    if faltantes:
        raise EstoqueInsuficiente(faltantes)

    for linha in previa:
        insumo = db.get(Insumo, linha["insumo_id"])
        if insumo is None:
            continue
        qtd = linha["qtd_necessaria"]
        insumo.qtd_atual = max(float(insumo.qtd_atual) - qtd, 0.0)
        db.add(
            MovEstoque(
                insumo_id=insumo.id,
                tipo="SAIDA",
                qtd=qtd,
                observacao=f"Envio ao buffet - {produto.nome}",
                usuario_id=usuario_id,
            )
        )

def baixar_insumos_do_item(db: Session, item: ItemComanda, usuario_id: int | None) -> None:
    produto = item.produto
    if produto is None or not produto.ficha or produto.baixa_ao_ativar:
        return

    multiplicador = item.quantidade_cobrada

    for linha in produto.ficha:
        insumo = db.get(Insumo, linha.insumo_id)
        if insumo is None:
            continue
        atual = float(insumo.qtd_atual)
        consumo = min(float(linha.qtd_usada) * multiplicador, atual)
        if consumo <= 0:
            continue
        insumo.qtd_atual = atual - consumo
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
    if produto is None or not produto.ficha or produto.baixa_ao_ativar:
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
