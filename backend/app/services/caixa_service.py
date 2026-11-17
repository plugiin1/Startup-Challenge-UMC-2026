from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Caixa, Comanda, Pagamento
from app.schemas import CaixaOut, RelatorioCaixaOut

FORMAS = ("DINHEIRO", "DEBITO", "CREDITO", "PIX")

def caixa_aberto(db: Session) -> Caixa | None:
    return db.query(Caixa).filter(Caixa.status == "ABERTO").order_by(Caixa.id.desc()).first()

def montar_relatorio(db: Session, caixa: Caixa) -> RelatorioCaixaOut:
    linhas = (
        db.query(Pagamento.forma, func.sum(Pagamento.valor))
        .filter(Pagamento.caixa_id == caixa.id)
        .group_by(Pagamento.forma)
        .all()
    )
    por_forma = {forma: 0.0 for forma in FORMAS}
    for forma, total in linhas:
        por_forma[forma] = round(float(total or 0), 2)

    total_vendido = round(sum(por_forma.values()), 2)
    dinheiro_esperado = round(float(caixa.valor_inicial) + por_forma["DINHEIRO"], 2)
    cartao_pix_sistema = round(
        por_forma["DEBITO"] + por_forma["CREDITO"] + por_forma["PIX"], 2
    )

    contado = float(caixa.valor_contado) if caixa.valor_contado is not None else None
    maquininhas = (
        float(caixa.valor_maquininhas) if caixa.valor_maquininhas is not None else None
    )

    fechadas = (
        db.query(func.count(Comanda.id))
        .filter(Comanda.status == "FECHADA", Comanda.fechada_em >= caixa.aberto_em)
        .scalar()
        or 0
    )
    abertas = db.query(func.count(Comanda.id)).filter(Comanda.status == "ABERTA").scalar() or 0

    return RelatorioCaixaOut(
        caixa=CaixaOut.model_validate(caixa),
        total_vendido=total_vendido,
        por_forma=por_forma,
        dinheiro_esperado=dinheiro_esperado,
        dinheiro_contado=contado,
        diferenca_dinheiro=None if contado is None else round(contado - dinheiro_esperado, 2),
        cartao_pix_sistema=cartao_pix_sistema,
        cartao_pix_maquininhas=maquininhas,
        diferenca_maquininhas=(
            None if maquininhas is None else round(maquininhas - cartao_pix_sistema, 2)
        ),
        comandas_fechadas=int(fechadas),
        comandas_abertas=int(abertas),
    )
