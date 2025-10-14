import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// --- Configuração do Firebase Admin ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccountPath = join(__dirname, "../json/serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// --- LISTA MÁXIMA DE MÉTODOS COM CORES ---
const metodos = [
  // === Bancos Digitais e Fintechs ===
  {
    nome: "Nubank",
    categoria: "Cartão de Crédito",
    cor: "#820AD1",
    userId: null,
  },
  {
    nome: "Inter",
    categoria: "Cartão de Crédito",
    cor: "#FF7A00",
    userId: null,
  },
  {
    nome: "C6 Bank",
    categoria: "Cartão de Crédito",
    cor: "#242424",
    userId: null,
  },
  {
    nome: "Will Bank",
    categoria: "Cartão de Crédito",
    cor: "#FFC107",
    userId: null,
  },
  {
    nome: "Neon",
    categoria: "Cartão de Crédito",
    cor: "#00A5F0",
    userId: null,
  },
  {
    nome: "Banco Pan",
    categoria: "Cartão de Crédito",
    cor: "#00A1AB",
    userId: null,
  },
  {
    nome: "Next",
    categoria: "Cartão de Crédito",
    cor: "#00FF7F",
    userId: null,
  },
  {
    nome: "Digio",
    categoria: "Cartão de Crédito",
    cor: "#0073E6",
    userId: null,
  },
  {
    nome: "Original",
    categoria: "Cartão de Crédito",
    cor: "#009640",
    userId: null,
  },
  {
    nome: "BTG+",
    categoria: "Cartão de Crédito",
    cor: "#001E2B",
    userId: null,
  },
  {
    nome: "Sofisa Direto",
    categoria: "Cartão de Crédito",
    cor: "#00A0E3",
    userId: null,
  },
  {
    nome: "Modalmais",
    categoria: "Cartão de Crédito",
    cor: "#004B8D",
    userId: null,
  },
  {
    nome: "Rico",
    categoria: "Cartão de Crédito",
    cor: "#F37021",
    userId: null,
  },
  {
    nome: "XP Investimentos",
    categoria: "Cartão de Crédito",
    cor: "#242625",
    userId: null,
  },

  // === Bancos Tradicionais ===
  {
    nome: "Itaú",
    categoria: "Cartão de Crédito",
    cor: "#EC7000",
    userId: null,
  },
  {
    nome: "Bradesco",
    categoria: "Cartão de Crédito",
    cor: "#CC092F",
    userId: null,
  },
  {
    nome: "Santander",
    categoria: "Cartão de Crédito",
    cor: "#EC0000",
    userId: null,
  },
  {
    nome: "Caixa",
    categoria: "Cartão de Crédito",
    cor: "#0066B3",
    userId: null,
  },
  {
    nome: "Banco do Brasil",
    categoria: "Cartão de Crédito",
    cor: "#0033A0",
    userId: null,
  },
  {
    nome: "Sicoob",
    categoria: "Cartão de Crédito",
    cor: "#009946",
    userId: null,
  },
  {
    nome: "Sicredi",
    categoria: "Cartão de Crédito",
    cor: "#00933E",
    userId: null,
  },

  // === Cartões de Lojas e Varejo ===
  {
    nome: "Porto Seguro",
    categoria: "Cartão de Crédito",
    cor: "#0055A4",
    userId: null,
  },
  {
    nome: "Azul Itaucard",
    categoria: "Cartão de Crédito",
    cor: "#003A70",
    userId: null,
  },
  {
    nome: "Smiles (GOL)",
    categoria: "Cartão de Crédito",
    cor: "#FF6600",
    userId: null,
  },
  {
    nome: "LATAM Pass",
    categoria: "Cartão de Crédito",
    cor: "#D9002D",
    userId: null,
  },
  {
    nome: "Magazine Luiza",
    categoria: "Cartão de Crédito",
    cor: "#0086FF",
    userId: null,
  },
  {
    nome: "Casas Bahia",
    categoria: "Cartão de Crédito",
    cor: "#E30613",
    userId: null,
  },
  {
    nome: "Ponto (Ponto Frio)",
    categoria: "Cartão de Crédito",
    cor: "#FF6000",
    userId: null,
  },
  {
    nome: "Americanas",
    categoria: "Cartão de Crédito",
    cor: "#E6233E",
    userId: null,
  },
  {
    nome: "Carrefour",
    categoria: "Cartão de Crédito",
    cor: "#004B8D",
    userId: null,
  },
  {
    nome: "Pão de Açúcar (PDA)",
    categoria: "Cartão de Crédito",
    cor: "#00B34B",
    userId: null,
  },
  {
    nome: "Assaí",
    categoria: "Cartão de Crédito",
    cor: "#E30613",
    userId: null,
  },
  {
    nome: "Atacadão",
    categoria: "Cartão de Crédito",
    cor: "#004B8D",
    userId: null,
  },
  {
    nome: "Riachuelo (Midway)",
    categoria: "Cartão de Crédito",
    cor: "#3199D3",
    userId: null,
  },
  {
    nome: "Renner",
    categoria: "Cartão de Crédito",
    cor: "#D40000",
    userId: null,
  },
  {
    nome: "C&A (Braderscard)",
    categoria: "Cartão de Crédito",
    cor: "#1C1C1C",
    userId: null,
  },
  {
    nome: "Credicard",
    categoria: "Cartão de Crédito",
    cor: "#F58220",
    userId: null,
  },

  // === Carteiras Digitais e Contas de Pagamento ===
  {
    nome: "PicPay",
    categoria: "Carteira Digital",
    cor: "#21C25E",
    userId: null,
  },
  {
    nome: "Mercado Pago",
    categoria: "Carteira Digital",
    cor: "#00B1EA",
    userId: null,
  },
  {
    nome: "PagBank (PagSeguro)",
    categoria: "Carteira Digital",
    cor: "#F7941D",
    userId: null,
  },
  {
    nome: "PayPal",
    categoria: "Carteira Digital",
    cor: "#00457C",
    userId: null,
  },
  {
    nome: "Ame Digital",
    categoria: "Carteira Digital",
    cor: "#FF4500",
    userId: null,
  },
  {
    nome: "RecargaPay",
    categoria: "Carteira Digital",
    cor: "#39B54A",
    userId: null,
  },
  {
    nome: "iti Itaú",
    categoria: "Carteira Digital",
    cor: "#EC7000",
    userId: null,
  },
  {
    nome: "99Pay",
    categoria: "Carteira Digital",
    cor: "#FF8C00",
    userId: null,
  },
  {
    nome: "Google Pay",
    categoria: "Carteira Digital",
    cor: "#4285F4",
    userId: null,
  },
  {
    nome: "Apple Pay",
    categoria: "Carteira Digital",
    cor: "#A2AAAD",
    userId: null,
  },

  // === Vouchers (Refeição/Alimentação/Outros) ===
  {
    nome: "Alelo Refeição",
    categoria: "Voucher",
    cor: "#00B44E",
    userId: null,
  },
  {
    nome: "Alelo Alimentação",
    categoria: "Voucher",
    cor: "#00A651",
    userId: null,
  },
  {
    nome: "Ticket Restaurante",
    categoria: "Voucher",
    cor: "#E30613",
    userId: null,
  },
  {
    nome: "Ticket Alimentação",
    categoria: "Voucher",
    cor: "#00A950",
    userId: null,
  },
  {
    nome: "Pluxee (Sodexo) Refeição",
    categoria: "Voucher",
    cor: "#0073E6",
    userId: null,
  },
  {
    nome: "Pluxee (Sodexo) Alimentação",
    categoria: "Voucher",
    cor: "#00A750",
    userId: null,
  },
  { nome: "VR Refeição", categoria: "Voucher", cor: "#00A859", userId: null },
  {
    nome: "VR Alimentação",
    categoria: "Voucher",
    cor: "#00843D",
    userId: null,
  },
  { nome: "Ben Visa Vale", categoria: "Voucher", cor: "#F36F21", userId: null },
  {
    nome: "Caju Benefícios",
    categoria: "Voucher",
    cor: "#FF5A39",
    userId: null,
  },
  {
    nome: "iFood Benefícios",
    categoria: "Voucher",
    cor: "#EA1D2C",
    userId: null,
  },

  // === Métodos Gerais e Outros ===
  { nome: "Pix", categoria: "Conta Digital", cor: "#32BCAD", userId: null },
  {
    nome: "Débito em Conta",
    categoria: "Conta Digital",
    cor: "#5F6368",
    userId: null,
  },
  { nome: "Boleto", categoria: "Outros", cor: "#FD6721", userId: null },
  { nome: "Dinheiro", categoria: "Dinheiro", cor: "#1E8449", userId: null },
  { nome: "TED/DOC", categoria: "Conta Digital", cor: "#5F6368", userId: null },
  { nome: "Cheque", categoria: "Outros", cor: "#AAB7B8", userId: null },
  {
    nome: "Transferência Bancária",
    categoria: "Conta Digital",
    cor: "#5F6368",
    userId: null,
  },
];
// ... (resto do script para deletar e inserir)
async function deletarColecao(collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function popularMetodos() {
  try {
    console.log("🔥 Excluindo todos os métodos antigos...");
    await deletarColecao("metodo", 50);
    console.log("✅ Métodos antigos excluídos com sucesso!");

    console.log("\n🚀 Inserindo novos métodos...");
    for (const metodo of metodos) {
      await db.collection("metodo").add(metodo);
      console.log(
        `   -> Método "${metodo.nome}" (${metodo.categoria}) inserido.`
      );
    }
    console.log("\n✨ Todos os novos métodos foram inseridos com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao popular métodos:", error);
  }
}

popularMetodos();
