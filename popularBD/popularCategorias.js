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
  { nome: "Supermercado", tipo: "saida" },
  { nome: "Comida", tipo: "saida" },
  { nome: "Uber", tipo: "saida" },
  { nome: "Compras", tipo: "saida" },
  { nome: "Bebida", tipo: "saida" },
  { nome: "Presentes", tipo: "saida" },
  { nome: "Saúde", tipo: "saida" },
  { nome: "Ingresso", tipo: "saida" },
  { nome: "Passagem", tipo: "saida" },
  { nome: "Airbnb", tipo: "saida" },
  { nome: "Bet", tipo: "saida" },
  { nome: "Lazer", tipo: "saida" },
  { nome: "Faculdade", tipo: "saida" },
  { nome: "Inter", tipo: "saida" },
  { nome: "Telefone", tipo: "saida" },
  { nome: "Barbeiro", tipo: "saida" },
  { nome: "Spotify", tipo: "saida" },
  { nome: "Premiere", tipo: "saida" },
  { nome: "Tatuagem", tipo: "saida" },
  { nome: "Empréstimo", tipo: "saida" },
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
