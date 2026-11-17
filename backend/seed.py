from app.core.security import hash_senha
from app.database import Base, SessionLocal, engine
from app.models import Categoria, FichaTecnica, Insumo, Produto, Usuario

USUARIOS = [
    ("Administrador", "admin@restaurante.com", "admin123", "ADMIN"),
    ("Caixa", "caixa@restaurante.com", "caixa123", "CAIXA"),
    ("Garcom", "garcom@restaurante.com", "garcom123", "GARCOM"),
    ("Cozinha", "cozinha@restaurante.com", "cozinha123", "COZINHA"),
]

CATEGORIAS = ["Pratos", "Bebidas", "Sobremesas"]

PRODUTOS = [
    ("Buffet por quilo", "Pratos", 69.90, "KG"),
    ("Prato executivo", "Pratos", 32.00, "UNIDADE"),
    ("Refrigerante lata", "Bebidas", 7.00, "UNIDADE"),
    ("Suco natural", "Bebidas", 9.50, "UNIDADE"),
    ("Pudim", "Sobremesas", 12.00, "UNIDADE"),
]

INSUMOS = [
    ("Arroz", "KG", 40, 10),
    ("Feijao", "KG", 25, 8),
    ("Carne bovina", "KG", 18, 10),
    ("Refrigerante lata", "UN", 60, 24),
    ("Leite condensado", "UN", 12, 6),
]

FICHAS = {
    "Prato executivo": [("Arroz", 0.2), ("Feijao", 0.1), ("Carne bovina", 0.18)],
    "Refrigerante lata": [("Refrigerante lata", 1)],
    "Pudim": [("Leite condensado", 0.5)],
    "Buffet por quilo": [("Arroz", 0.3), ("Feijao", 0.15)],
}

def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.query(Usuario).count() > 0:
            print("Banco ja populado. Nada a fazer.")
            return

        for nome, email, senha, perfil in USUARIOS:
            db.add(
                Usuario(nome=nome, email=email, senha_hash=hash_senha(senha), perfil=perfil)
            )

        categorias = {nome: Categoria(nome=nome) for nome in CATEGORIAS}
        db.add_all(categorias.values())

        insumos = {
            nome: Insumo(nome=nome, unidade=un, qtd_atual=atual, qtd_minima=minima)
            for nome, un, atual, minima in INSUMOS
        }
        db.add_all(insumos.values())
        db.flush()

        produtos = {}
        for nome, categoria, preco, tipo in PRODUTOS:
            produto = Produto(
                nome=nome, categoria_id=categorias[categoria].id, preco=preco, tipo=tipo
            )
            produtos[nome] = produto
            db.add(produto)
        db.flush()

        for produto_nome, linhas in FICHAS.items():
            for insumo_nome, qtd in linhas:
                db.add(
                    FichaTecnica(
                        produto_id=produtos[produto_nome].id,
                        insumo_id=insumos[insumo_nome].id,
                        qtd_usada=qtd,
                    )
                )

        db.commit()
        print("Dados de demonstracao criados.")
        for _, email, senha, perfil in USUARIOS:
            print(f"  {perfil:<8} {email}  senha: {senha}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
