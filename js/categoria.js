// Conteúdo completo para o arquivo: js/categoria.js

// Importe as dependências do Firebase aqui, pois a classe agora acessa o banco
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export class Categoria {
  constructor(nome, tipo) {
    this.nome = nome;
    this.tipo = tipo; // 'entrada' ou 'saída'
  }

  // --- MÉTODO ESTÁTICO ADICIONADO ---
  // Este método pertence à classe Categoria e é responsável por buscar os dados no Firestore.
  // A palavra 'static' é crucial aqui.
  static async buscarTodas(tipoFiltro = null) {
    console.log(
      `(Classe Categoria) Buscando categorias no Firestore com filtro: ${tipoFiltro}`
    );
    try {
      const baseCollection = collection(db, "categoria");
      let consultaFB;

      if (tipoFiltro) {
        // Cria a consulta com filtro de tipo e ordenação por nome
        consultaFB = query(
          baseCollection,
          where("tipo", "==", tipoFiltro),
          orderBy("nome")
        );
      } else {
        // Cria a consulta com apenas ordenação por nome
        consultaFB = query(baseCollection, orderBy("nome"));
      }

      const querySnapshot = await getDocs(consultaFB);

      // O método retorna o array de documentos encontrados
      return querySnapshot.docs;
    } catch (error) {
      console.error(
        "Erro na classe Categoria ao buscar dados do Firestore:",
        error
      );
      // Propaga o erro para que a função em script.js possa tratá-lo (ex: com um alert)
      throw error;
    }
  }
}
