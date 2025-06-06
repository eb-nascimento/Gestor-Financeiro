// Adicione estas importações no topo do arquivo js/transacao.js

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// A sua classe Transacao vem logo abaixo...
export class Transacao {
  // Seu construtor atual
  constructor(valor, gastoFixo /* ... etc */) {
    // ...
  }

  // Seu método estático para salvar (static async salvar...)
  // ...

  // Seu método estático para buscar (static async buscarTodas...)
  // Agora ele funcionará, pois 'query', 'collection' e 'orderBy' foram importados neste arquivo.
  static async buscarTodas() {
    console.log(
      "(Classe Transacao) Buscando todas as transações no Firestore..."
    );
    try {
      const consulta = query(
        collection(db, "transacao"),
        orderBy("data", "desc")
      );
      const querySnapshot = await getDocs(consulta);
      return querySnapshot.docs;
    } catch (error) {
      console.error("Erro na classe Transacao ao buscar dados:", error);
      throw new Error(
        "Não foi possível buscar as transações no banco de dados."
      );
    }
  }
}
