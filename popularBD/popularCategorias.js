import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// --- INÍCIO DA CORREÇÃO ---
// Determina o caminho correto para o ficheiro da chave, independentemente de onde o script é executado
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccountPath = join(__dirname, "../json/serviceAccountKey.json");
// --- FIM DA CORREÇÃO ---

// Lê a chave do arquivo JSON a partir do caminho corrigido
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Adicionado o campo "userId: null" a todas as categorias
const categorias = [
  {
    nome: "Supermercado",
    tipo: "saida",
    classificacao: "variavel",
    userId: null,
  },
  { nome: "Comida", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Uber", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Compras", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Bebida", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Presentes", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Saúde", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Ingresso", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Passagem", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Airbnb", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Bet", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Lazer", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Faculdade", tipo: "saida", classificacao: "fixa", userId: null },
  { nome: "Inter", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Telefone", tipo: "saida", classificacao: "fixa", userId: null },
  { nome: "Barbeiro", tipo: "saida", classificacao: "fixa", userId: null },
  { nome: "Spotify", tipo: "saida", classificacao: "fixa", userId: null },
  { nome: "Premiere", tipo: "saida", classificacao: "variavel", userId: null },
  { nome: "Tatuagem", tipo: "saida", classificacao: "variavel", userId: null },
  {
    nome: "Empréstimo",
    tipo: "saida",
    classificacao: "variavel",
    userId: null,
  },
  { nome: "Salário", tipo: "entrada", classificacao: null, userId: null },
  { nome: "Aluguel", tipo: "entrada", classificacao: null, userId: null },
  { nome: "Entrada", tipo: "entrada", classificacao: null, userId: null },
  { nome: "Presente", tipo: "entrada", classificacao: null, userId: null },
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
