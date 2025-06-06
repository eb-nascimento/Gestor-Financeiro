// Importe as dependências do Firebase aqui
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export class Metodo {
  constructor(nome, dataFatura, tipo) {
    this.nome = nome;
    this.dataFatura = dataFatura;
    this.tipo = tipo;
  }

  // --- NOVO MÉTODO ESTÁTICO ---
  // Este método é responsável por buscar os métodos no Firestore.
  static async buscarTodos() {
    console.log("(Classe Metodo) Buscando métodos no Firestore...");
    try {
      const baseCollection = collection(db, "metodo");
      // Cria a consulta com ordenação por nome
      const consultaFB = query(baseCollection, orderBy("nome"));

      const querySnapshot = await getDocs(consultaFB);

      // Retorna o array de documentos encontrados
      return querySnapshot.docs;
    } catch (error) {
      console.error("Erro na classe Metodo ao buscar dados:", error);
      throw error; // Propaga o erro
    }
  }
}
