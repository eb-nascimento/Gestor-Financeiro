// Importe as dependências do Firebase aqui
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export class Transacao {
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

  // --- NOVO MÉTODO ESTÁTICO ---
  // Este método é responsável por receber os dados, criar uma instância e salvá-la no Firestore.
  static async salvar(dadosDaTransacao) {
    console.log(
      "(Classe Transacao) Salvando nova transação com os dados:",
      dadosDaTransacao
    );
    try {
      // 1. Cria uma instância da classe para garantir que os dados estejam no formato correto
      //    e para aplicar valores padrão (como parcelas = 1).
      const novaTransacao = new Transacao(
        dadosDaTransacao.valor,
        dadosDaTransacao.gastoFixo,
        dadosDaTransacao.descricao,
        dadosDaTransacao.data,
        dadosDaTransacao.parcelas, // undefined, usará o default da classe
        dadosDaTransacao.parcelaAtual, // undefined, usará o default da classe
        dadosDaTransacao.tipo,
        dadosDaTransacao.idCategoria,
        dadosDaTransacao.idMetodo
      );

      // 2. Converte a instância para um objeto simples para o Firestore.
      const transacaoParaSalvar = { ...novaTransacao };

      // Opcional: Adicionar um timestamp de criação
      // transacaoParaSalvar.criadoEm = new Date();

      // 3. Salva no Firestore na coleção 'transacao' (singular).
      const docRef = await addDoc(
        collection(db, "transacao"),
        transacaoParaSalvar
      );
      console.log(
        "(Classe Transacao) Transação salva com sucesso com o ID: ",
        docRef.id
      );

      return docRef; // Retorna a referência do documento, pode ser útil no futuro.
    } catch (error) {
      console.error("Erro na classe Transacao ao salvar dados:", error);
      throw error; // Propaga o erro para ser tratado no script.js (ex: com um alert)
    }
  }
}
