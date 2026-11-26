import sys

from app.core.security import hash_senha
from app.database import Base, SessionLocal, engine
from app.models import Categoria, Configuracao, FichaTecnica, Insumo, Produto, Usuario

USUARIOS = [
    ("Gerente", "gerente@restaurante.com", "gerente123", "GERENTE"),
    ("Caixa", "caixa@restaurante.com", "caixa123", "CAIXA"),
]

CATEGORIAS = ["Buffet", "Marmitex", "Bebidas"]

PRODUTOS = [
    ("Buffet por quilo", "Buffet", 93.00, "KG", False),
    ("Arroz no buffet", "Buffet", 0, "UNIDADE", True),
    ("Feijão no buffet", "Buffet", 0, "UNIDADE", True),
    ("Carne no buffet", "Buffet", 0, "UNIDADE", True),
    ("Frango no buffet", "Buffet", 0, "UNIDADE", True),
    ("Batata no buffet", "Buffet", 0, "UNIDADE", True),
    ("Embalagem marmitex", "Marmitex", 3.00, "UNIDADE", False),
    ("Refrigerante lata", "Bebidas", 7.00, "UNIDADE", False),
    ("Refrigerante 600ml", "Bebidas", 9.00, "UNIDADE", False),
    ("Suco natural", "Bebidas", 11.00, "UNIDADE", False),
    ("Água mineral", "Bebidas", 4.50, "UNIDADE", False),
    ("Cerveja long neck", "Bebidas", 12.00, "UNIDADE", False),
]

INSUMOS = [
    ("Arroz", "kg", 50, 15, True),
    ("Feijão", "kg", 30, 10, True),
    ("Carne bovina", "kg", 25, 10, True),
    ("Frango", "kg", 30, 12, True),
    ("Batata", "kg", 40, 15, True),
    ("Óleo", "L", 20, 6, True),
    ("Alho", "kg", 4, 1, True),
    ("Cebola", "kg", 8, 3, True),
    ("Sal", "kg", 6, 2, True),
    ("Refrigerante lata", "un", 120, 48, False),
    ("Refrigerante 600ml", "un", 60, 24, False),
    ("Água mineral", "un", 100, 40, False),
    ("Cerveja long neck", "un", 80, 36, False),
]

FICHAS = {
    "Arroz no buffet": [("Arroz", 5), ("Óleo", 0.2), ("Alho", 0.1), ("Sal", 0.05)],
    "Feijão no buffet": [("Feijão", 3), ("Óleo", 0.15), ("Alho", 0.1), ("Cebola", 0.2)],
    "Carne no buffet": [("Carne bovina", 4), ("Cebola", 0.3), ("Alho", 0.1), ("Sal", 0.05)],
    "Frango no buffet": [("Frango", 4), ("Alho", 0.1), ("Sal", 0.05)],
    "Batata no buffet": [("Batata", 3), ("Óleo", 0.3), ("Sal", 0.05)],
    "Refrigerante lata": [("Refrigerante lata", 1)],
    "Refrigerante 600ml": [("Refrigerante 600ml", 1)],
    "Água mineral": [("Água mineral", 1)],
    "Cerveja long neck": [("Cerveja long neck", 1)],
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
            db.add(Configuracao(id=1, nome_restaurante="Restaurante"))

        for nome, email, senha, perfil in USUARIOS:
            db.add(Usuario(nome=nome, email=email, senha_hash=hash_senha(senha), perfil=perfil))

        categorias = {nome: Categoria(nome=nome) for nome in CATEGORIAS}
        db.add_all(categorias.values())

        insumos = {
            nome: Insumo(nome=nome, unidade=un, qtd_atual=atual, qtd_minima=minima, ingrediente=ingr)
            for nome, un, atual, minima, ingr in INSUMOS
        }
        db.add_all(insumos.values())
        db.flush()

        produtos = {}
        for nome, categoria, preco, tipo, buffet in PRODUTOS:
            produto = Produto(
                nome=nome,
                categoria_id=categorias[categoria].id,
                preco=preco,
                tipo=tipo,
                baixa_ao_ativar=buffet,
                ativo=not buffet,
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
