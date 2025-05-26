import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const metodos = [
  { nome: "Salário", tipo: "entrada" },
  { nome: "Aluguel", tipo: "entrada" },
  { nome: "Entrada", tipo: "entrada" },
  { nome: "Presente", tipo: "entrada" },

  { nome: "Rico", tipo: "saida" },
  { nome: "Nu", tipo: "saida" },
  { nome: "Inter", tipo: "saida" },
  { nome: "Meu", tipo: "saida" },
  { nome: "Pix", tipo: "saida" },
];

async function inserirMetodos() {
  try {
    for (const metodo of metodos) {
      await db.collection("metodo").add(metodo);
      console.log(`Método "${metodo.nome}" inserido.`);
    }
    console.log("✅ Todos os métodos foram inseridos com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inserir métodos:", error);
  }
}

inserirMetodos();
