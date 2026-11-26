from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import exigir_perfil, usuario_atual
from app.core.security import criar_token, hash_senha, verificar_senha
from app.database import get_db
from app.models import Caixa, Comanda, MovEstoque, Usuario
from app.schemas import TokenOut, UsuarioIn, UsuarioOut

router = APIRouter(prefix="/auth", tags=["auth"])

def _autenticar(db: Session, email: str, senha: str) -> Usuario:
    usuario = db.query(Usuario).filter(Usuario.email == email.lower()).first()
    if usuario is None or not usuario.ativo or not verificar_senha(senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha invalidos",
        )
    return usuario

@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> TokenOut:
    usuario = _autenticar(db, form.username, form.password)
    return TokenOut(
        access_token=criar_token(usuario.id, usuario.perfil),
        usuario=UsuarioOut.model_validate(usuario),
    )

@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(usuario_atual)) -> Usuario:
    return usuario

@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> list[Usuario]:
    return db.query(Usuario).order_by(Usuario.nome).all()

@router.post("/usuarios", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def criar_usuario(
    dados: UsuarioIn,
    db: Session = Depends(get_db),
    _: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Usuario:
    email = dados.email.lower()
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ja existe um usuario com este e-mail")

    usuario = Usuario(
        nome=dados.nome,
        email=email,
        senha_hash=hash_senha(dados.senha),
        perfil=dados.perfil,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@router.patch("/usuarios/{usuario_id}", response_model=UsuarioOut)
def alternar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    gerente: Usuario = Depends(exigir_perfil("GERENTE")),
) -> Usuario:
    alvo = db.get(Usuario, usuario_id)
    if alvo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario nao encontrado")
    if alvo.id == gerente.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Voce nao pode desativar a si mesmo")
    alvo.ativo = not alvo.ativo
    db.commit()
    db.refresh(alvo)
    return alvo

@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    gerente: Usuario = Depends(exigir_perfil("GERENTE")),
) -> None:
    alvo = db.get(Usuario, usuario_id)
    if alvo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario nao encontrado")
    if alvo.id == gerente.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Voce nao pode excluir a si mesmo")

    db.query(Comanda).filter(Comanda.usuario_id == usuario_id).update(
        {Comanda.usuario_id: None}, synchronize_session=False
    )
    db.query(Caixa).filter(Caixa.usuario_id == usuario_id).update(
        {Caixa.usuario_id: None}, synchronize_session=False
    )
    db.query(MovEstoque).filter(MovEstoque.usuario_id == usuario_id).update(
        {MovEstoque.usuario_id: None}, synchronize_session=False
    )
    db.delete(alvo)
    db.commit()
