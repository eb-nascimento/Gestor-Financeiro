// Conteúdo para o arquivo: js/transacao.js

// Importe as dependências do Firebase aqui
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export class Transacao {
  // Seu construtor atual (continua igual)
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

  // --- ADICIONE ESTE MÉTODO ESTÁTICO À SUA CLASSE ---
  static async salvar(dadosDaTransacao) {
    try {
      // Cria uma nova instância da classe para garantir a estrutura correta dos dados
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

      // Converte para um objeto simples para salvar no Firestore
      const transacaoParaSalvar = { ...novaInstancia };

      // Salva o objeto na coleção 'transacao'
      const docRef = await addDoc(
        collection(db, "transacao"),
        transacaoParaSalvar
      );
      console.log(
        "(Classe Transacao) Dados salvos com sucesso com o ID:",
        docRef.id
      );

      return docRef; // Retorna a referência do documento
    } catch (error) {
      console.error("Erro na classe Transacao ao tentar salvar:", error);
      // Lança um novo erro para ser pego pelo script.js
      throw new Error("Não foi possível salvar a transação no banco de dados.");
    }
  }
}
