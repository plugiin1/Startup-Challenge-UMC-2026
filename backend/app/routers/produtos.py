from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil, usuario_atual
from app.database import get_db
from app.models import Categoria, ItemComanda, Produto, Usuario
from app.schemas import CategoriaIn, CategoriaOut, ProdutoIn, ProdutoOut
from app.services import estoque_service

router = APIRouter(prefix="/produtos", tags=["cardapio"])

@router.get("/categorias", response_model=list[CategoriaOut])
def listar_categorias(
    db: Session = Depends(get_db),
    _: Usuario = Depends(usuario_atual),
) -> list[Categoria]:
    return db.query(Categoria).order_by(Categoria.nome).all()

@router.post("/categorias", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
def criar_categoria(
    dados: CategoriaIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Categoria:
    categoria = Categoria(nome=dados.nome)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria

@router.get("", response_model=list[ProdutoOut])
def listar_produtos(
    apenas_ativos: bool = True,
    db: Session = Depends(get_db),
    _: Usuario = Depends(usuario_atual),
) -> list[Produto]:
    query = db.query(Produto)
    if apenas_ativos:
        query = query.filter(Produto.ativo.is_(True))
    return query.order_by(Produto.nome).all()

@router.post("", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED)
def criar_produto(
    dados: ProdutoIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Produto:
    produto = Produto(**dados.model_dump())
    db.add(produto)
    db.flush()
    if produto.ativo and produto.baixa_ao_ativar:
        estoque_service.enviar_ao_buffet(db, produto, usuario.id)
    db.commit()
    db.refresh(produto)
    return produto

@router.put("/{produto_id}", response_model=ProdutoOut)
def atualizar_produto(
    produto_id: int,
    dados: ProdutoIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Produto:
    produto = db.get(Produto, produto_id)
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")

    estava_ativo = produto.ativo
    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)

    if produto.baixa_ao_ativar and produto.ativo and not estava_ativo:
        estoque_service.enviar_ao_buffet(db, produto, usuario.id)

    db.commit()
    db.refresh(produto)
    return produto

@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> None:
    produto = db.get(Produto, produto_id)
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")

    tem_vendas = (
        db.query(ItemComanda.id).filter(ItemComanda.produto_id == produto_id).first()
        is not None
    )
    if tem_vendas:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Este produto ja tem vendas registradas. Desative-o para tira-lo do cardapio sem perder os relatorios.",
        )

    db.delete(produto)
    db.commit()
