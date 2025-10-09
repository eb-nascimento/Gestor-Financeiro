import admin from "firebase-admin";
import { readFileSync } from "fs";

// Lê a chave do arquivo JSON
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf-8")
);

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const categorias = [
  { nome: "Supermercado", tipo: "saida", classificacao: "variavel" },
  { nome: "Comida", tipo: "saida", classificacao: "variavel" },
  { nome: "Uber", tipo: "saida", classificacao: "variavel" },
  { nome: "Compras", tipo: "saida", classificacao: "variavel" },
  { nome: "Bebida", tipo: "saida", classificacao: "variavel" },
  { nome: "Presentes", tipo: "saida", classificacao: "variavel" },
  { nome: "Saúde", tipo: "saida", classificacao: "variavel" },
  { nome: "Ingresso", tipo: "saida", classificacao: "variavel" },
  { nome: "Passagem", tipo: "saida", classificacao: "variavel" },
  { nome: "Airbnb", tipo: "saida", classificacao: "variavel" },
  { nome: "Bet", tipo: "saida", classificacao: "variavel" },
  { nome: "Lazer", tipo: "saida", classificacao: "variavel" },
  { nome: "Faculdade", tipo: "saida", classificacao: "fixa" },
  { nome: "Inter", tipo: "saida", classificacao: "variavel" },
  { nome: "Telefone", tipo: "saida", classificacao: "fixa" },
  { nome: "Barbeiro", tipo: "saida", classificacao: "fixa" },
  { nome: "Spotify", tipo: "saida", classificacao: "fixa" },
  { nome: "Premiere", tipo: "saida", classificacao: "variavel" },
  { nome: "Tatuagem", tipo: "saida", classificacao: "variavel" },
  { nome: "Empréstimo", tipo: "saida", classificacao: "variavel" },
  { nome: "Salário", tipo: "entrada" },
  { nome: "Aluguel", tipo: "entrada" },
  { nome: "Entrada", tipo: "entrada" },
  { nome: "Presente", tipo: "entrada" },
];

async function inserirCategorias() {
  try {
    for (const categoria of categorias) {
      await db.collection("categoria").add(categoria);
      console.log(`Categoria "${categoria.nome}" inserida.`);
    }
    console.log("✅ Todas as categorias foram inseridas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir categorias:", error);
  }
}

inserirCategorias();
