// js/metodo.js
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
  static async buscarTodos() {
    // Nome no plural para consistência
    try {
      const consulta = query(collection(db, "metodo"), orderBy("nome"));
      const querySnapshot = await getDocs(consulta);
      return querySnapshot.docs;
    } catch (error) {
      console.error("Erro na classe Metodo ao buscar dados:", error);
      throw error;
    }
  }
}
