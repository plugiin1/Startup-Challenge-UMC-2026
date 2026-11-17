from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil, usuario_atual
from app.database import get_db
from app.models import Categoria, Produto, Usuario
from app.schemas import CategoriaIn, CategoriaOut, ProdutoIn, ProdutoOut

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
    _: Usuario = Depends(exigir_perfil("ADMIN")),
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
    _: Usuario = Depends(exigir_perfil("ADMIN")),
) -> Produto:
    produto = Produto(**dados.model_dump())
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return produto

@router.put("/{produto_id}", response_model=ProdutoOut)
def atualizar_produto(
    produto_id: int,
    dados: ProdutoIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("ADMIN")),
) -> Produto:
    produto = db.get(Produto, produto_id)
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")

    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)
    db.commit()
    db.refresh(produto)
    return produto

@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("ADMIN")),
) -> None:
    produto = db.get(Produto, produto_id)
    if produto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produto nao encontrado")
    produto.ativo = False
    db.commit()
