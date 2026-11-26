import sys

from app.core.security import hash_senha
from app.database import Base, SessionLocal, engine
from app.models import Categoria, Configuracao, FichaTecnica, Insumo, Produto, Usuario

USUARIOS = [
    ("Gerente", "gerente@restaurante.com", "gerente123", "GERENTE"),
    ("Caixa", "caixa@restaurante.com", "caixa123", "CAIXA"),
    ("Garcom", "garcom@restaurante.com", "garcom123", "GARCOM"),
]

CATEGORIAS = ["Buffet", "Pratos", "Porções", "Bebidas", "Sobremesas"]

PRODUTOS = [
    ("Buffet por quilo", "Buffet", 69.90, "KG"),
    ("Buffet livre (almoço)", "Buffet", 44.90, "UNIDADE"),
    ("Prato feito (PF)", "Pratos", 24.90, "UNIDADE"),
    ("Filé à parmegiana", "Pratos", 48.00, "UNIDADE"),
    ("Frango grelhado com salada", "Pratos", 32.00, "UNIDADE"),
    ("Feijoada individual", "Pratos", 39.90, "UNIDADE"),
    ("Strogonoff de carne", "Pratos", 36.00, "UNIDADE"),
    ("Parmegiana de frango", "Pratos", 42.00, "UNIDADE"),
    ("Batata frita", "Porções", 28.00, "UNIDADE"),
    ("Isca de frango", "Porções", 34.00, "UNIDADE"),
    ("Refrigerante lata", "Bebidas", 7.00, "UNIDADE"),
    ("Refrigerante 600ml", "Bebidas", 9.00, "UNIDADE"),
    ("Suco natural", "Bebidas", 11.00, "UNIDADE"),
    ("Água mineral", "Bebidas", 4.50, "UNIDADE"),
    ("Cerveja long neck", "Bebidas", 12.00, "UNIDADE"),
    ("Pudim", "Sobremesas", 12.00, "UNIDADE"),
    ("Mousse de maracujá", "Sobremesas", 11.00, "UNIDADE"),
    ("Petit gateau", "Sobremesas", 18.00, "UNIDADE"),
]

INSUMOS = [
    ("Arroz", "kg", 50, 15),
    ("Feijão", "kg", 30, 10),
    ("Carne bovina", "kg", 25, 10),
    ("Frango", "kg", 30, 12),
    ("Batata", "kg", 40, 15),
    ("Óleo", "L", 20, 6),
    ("Refrigerante lata", "un", 120, 48),
    ("Refrigerante 600ml", "un", 60, 24),
    ("Água mineral", "un", 100, 40),
    ("Cerveja long neck", "un", 80, 36),
    ("Leite condensado", "un", 24, 8),
    ("Ovos", "dz", 20, 6),
    ("Queijo", "kg", 8, 3),
    ("Farinha de rosca", "kg", 5, 2),
    ("Maracujá", "kg", 6, 2),
    ("Chocolate", "kg", 5, 2),
]

FICHAS = {
    "Buffet por quilo": [("Arroz", 0.3), ("Feijão", 0.15), ("Carne bovina", 0.1)],
    "Buffet livre (almoço)": [("Arroz", 0.3), ("Feijão", 0.15), ("Frango", 0.15)],
    "Prato feito (PF)": [("Arroz", 0.2), ("Feijão", 0.15), ("Carne bovina", 0.15)],
    "Filé à parmegiana": [("Carne bovina", 0.25), ("Queijo", 0.05), ("Farinha de rosca", 0.03), ("Arroz", 0.2)],
    "Frango grelhado com salada": [("Frango", 0.25), ("Arroz", 0.15)],
    "Feijoada individual": [("Feijão", 0.3), ("Carne bovina", 0.2)],
    "Strogonoff de carne": [("Carne bovina", 0.2), ("Arroz", 0.2), ("Batata", 0.15)],
    "Parmegiana de frango": [("Frango", 0.25), ("Queijo", 0.05), ("Farinha de rosca", 0.03)],
    "Batata frita": [("Batata", 0.3), ("Óleo", 0.05)],
    "Isca de frango": [("Frango", 0.25), ("Óleo", 0.05)],
    "Refrigerante lata": [("Refrigerante lata", 1)],
    "Refrigerante 600ml": [("Refrigerante 600ml", 1)],
    "Água mineral": [("Água mineral", 1)],
    "Cerveja long neck": [("Cerveja long neck", 1)],
    "Pudim": [("Leite condensado", 0.5), ("Ovos", 0.25)],
    "Mousse de maracujá": [("Maracujá", 0.1), ("Leite condensado", 0.3)],
    "Petit gateau": [("Chocolate", 0.08), ("Ovos", 0.2)],
}

def main() -> None:
    reset = "--reset" in sys.argv
    if reset:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    db = SessionLocal()
    try:
        if db.query(Usuario).count() > 0 and not reset:
            print("Banco ja populado. Use 'python seed.py --reset' para recriar com os dados reais.")
            return

        if db.get(Configuracao, 1) is None:
            db.add(Configuracao(id=1, nome_restaurante="Restaurante", taxa_servico_percent=10))

        for nome, email, senha, perfil in USUARIOS:
            db.add(Usuario(nome=nome, email=email, senha_hash=hash_senha(senha), perfil=perfil))

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
        print("Dados reais criados.")
        for _, email, senha, perfil in USUARIOS:
            print(f"  {perfil:<8} {email}  senha: {senha}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
