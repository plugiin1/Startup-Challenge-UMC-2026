from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.deps import exigir_perfil
from app.database import get_db
from app.models import Comanda, ItemComanda, Pagamento, Usuario
from app.schemas import ProdutoVendidoOut, RelatorioVendasOut, VendaDiaOut

router = APIRouter(prefix="/relatorios", tags=["relatorios"])

ACESSO = ("GERENTE", "CAIXA")
FORMAS = ("DINHEIRO", "DEBITO", "CREDITO", "PIX")

def _intervalo(inicio: str | None, fim: str | None) -> tuple[datetime, datetime]:
    hoje = date.today()
    ini = date.fromisoformat(inicio) if inicio else hoje - timedelta(days=6)
    f = date.fromisoformat(fim) if fim else hoje
    return datetime.combine(ini, time.min), datetime.combine(f, time.max)

@router.get("/vendas", response_model=RelatorioVendasOut)
def vendas(
    inicio: str | None = None,
    fim: str | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> RelatorioVendasOut:
    d0, d1 = _intervalo(inicio, fim)

    comandas = (
        db.query(Comanda)
        .filter(Comanda.status == "FECHADA", Comanda.fechada_em >= d0, Comanda.fechada_em <= d1)
        .all()
    )

    linhas = (
        db.query(Pagamento.forma, func.sum(Pagamento.valor))
        .join(Comanda, Pagamento.comanda_id == Comanda.id)
        .filter(Comanda.status == "FECHADA", Comanda.fechada_em >= d0, Comanda.fechada_em <= d1)
        .group_by(Pagamento.forma)
        .all()
    )
    por_forma = {f: 0.0 for f in FORMAS}
    for forma, soma in linhas:
        por_forma[forma] = round(float(soma or 0), 2)
    total = round(sum(por_forma.values()), 2)

    n = len(comandas)
    ticket = round(total / n, 2) if n else 0.0

    por_dia_map: dict[str, list[float]] = {}
    for c in comandas:
        dia = c.fechada_em.date().isoformat()
        acc = por_dia_map.setdefault(dia, [0.0, 0])
        acc[0] += c.total
        acc[1] += 1
    por_dia = [
        VendaDiaOut(dia=dia, total=round(v[0], 2), comandas=int(v[1]))
        for dia, v in sorted(por_dia_map.items())
    ]

    return RelatorioVendasOut(
        total_vendido=total,
        comandas=n,
        ticket_medio=ticket,
        por_forma=por_forma,
        por_dia=por_dia,
    )

@router.get("/produtos", response_model=list[ProdutoVendidoOut])
def produtos_mais_vendidos(
    inicio: str | None = None,
    fim: str | None = None,
    limite: int = 10,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil(*ACESSO)),
) -> list[ProdutoVendidoOut]:
    d0, d1 = _intervalo(inicio, fim)

    itens = (
        db.query(ItemComanda)
        .join(Comanda)
        .options(joinedload(ItemComanda.produto))
        .filter(Comanda.status == "FECHADA", Comanda.fechada_em >= d0, Comanda.fechada_em <= d1)
        .all()
    )

    agg: dict[int, dict] = {}
    for it in itens:
        e = agg.setdefault(it.produto_id, {"nome": it.produto_nome, "qtd": 0.0, "receita": 0.0})
        e["qtd"] += it.quantidade_cobrada
        e["receita"] += it.subtotal

    ranked = sorted(agg.items(), key=lambda kv: kv[1]["receita"], reverse=True)[: min(limite, 50)]
    return [
        ProdutoVendidoOut(
            produto_id=pid,
            produto_nome=v["nome"],
            quantidade=round(v["qtd"], 3),
            receita=round(v["receita"], 2),
        )
        for pid, v in ranked
    ]
