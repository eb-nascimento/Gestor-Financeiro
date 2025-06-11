// Conteúdo completo para o arquivo: js/transacao.js

// 1. ADICIONE AS IMPORTAÇÕES DO FIREBASE AQUI
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDoc,
  setDoc,
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

  static async atualizar(id, dadosParaAtualizar) {
    console.log(
      `(Classe Transacao) Atualizando documento ${id} com os dados:`,
      dadosParaAtualizar
    );
    try {
      // Cria a referência para o documento específico que queremos atualizar
      const transacaoRef = doc(db, "transacao", id);

      // Usa o 'updateDoc' do Firestore para aplicar as alterações
      await updateDoc(transacaoRef, dadosParaAtualizar);

      console.log("Documento atualizado com sucesso no Firestore!");
      return true; // Retorna sucesso
    } catch (error) {
      console.error("Erro na classe Transacao ao tentar atualizar:", error);
      throw new Error(
        "Não foi possível atualizar a transação no banco de dados."
      );
    }
  }

  static async excluir(id) {
    console.log(`(Classe Transacao) Excluindo documento com ID: ${id}`);
    try {
      // Cria a referência para o documento específico que queremos excluir
      const transacaoRef = doc(db, "transacao", id);

      // Usa o 'deleteDoc' do Firestore para remover o documento
      await deleteDoc(transacaoRef);

      console.log("Documento excluído com sucesso do Firestore!");
      return true; // Retorna sucesso
    } catch (error) {
      console.error("Erro na classe Transacao ao tentar excluir:", error);
      throw new Error(
        "Não foi possível excluir a transação no banco de dados."
      );
    }
  }
}
