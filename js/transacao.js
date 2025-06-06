// Conteúdo completo para o arquivo: js/transacao.js

// 1. ADICIONE AS IMPORTAÇÕES DO FIREBASE AQUI
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. SUA CLASSE TRANSACAO COM OS MÉTODOS ESTÁTICOS
export class Transacao {
  // Seu construtor atual (continua o mesmo)
  constructor(
    valor,
    gastoFixo,
    descricao,
    data,
    parcelas,
    parcelaAtual,
    tipo,
    idCategoria,
    idMetodo
  ) {
    this.valor = valor;
    this.gastoFixo = gastoFixo;
    this.descricao = descricao;
    this.data = data;
    this.parcelas = parcelas || 1;
    this.parcelaAtual = parcelaAtual || 1;
    this.tipo = tipo;
    this.idCategoria = idCategoria;
    this.idMetodo = idMetodo;
  }

  // MÉTODO ESTÁTICO PARA SALVAR (que discutimos antes)
  static async salvar(dadosDaTransacao) {
    try {
      const novaInstancia = new Transacao(
        dadosDaTransacao.valor,
        dadosDaTransacao.gastoFixo,
        dadosDaTransacao.descricao,
        dadosDaTransacao.data,
        dadosDaTransacao.parcelas,
        dadosDaTransacao.parcelaAtual,
        dadosDaTransacao.tipo,
        dadosDaTransacao.idCategoria,
        dadosDaTransacao.idMetodo
      );
      const transacaoParaSalvar = { ...novaInstancia };
      const docRef = await addDoc(
        collection(db, "transacao"),
        transacaoParaSalvar
      );
      return docRef;
    } catch (error) {
      console.error("Erro na classe Transacao ao salvar:", error);
      throw new Error("Não foi possível salvar a transação.");
    }
  }

  // --- NOVO MÉTODO ESTÁTICO PARA BUSCAR TRANSAÇÕES ---
  static async buscarTodas() {
    console.log("(Classe Transacao) Buscando todas as transações...");
    try {
      // Cria a consulta para buscar na coleção 'transacao', ordenando pela data mais recente
      const consulta = query(
        collection(db, "transacao"),
        orderBy("data", "desc")
      );
      const querySnapshot = await getDocs(consulta);

      // Retorna o array de documentos para o script.js usar
      return querySnapshot.docs;
    } catch (error) {
      console.error(
        "Erro na classe Transacao ao buscar todas as transações:",
        error
      );
      throw new Error("Não foi possível buscar as transações.");
    }
  }
}
