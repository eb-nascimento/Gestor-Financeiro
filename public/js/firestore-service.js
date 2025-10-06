// js/firestore-service.js
import { db } from "./firebase.js"; // Mantém a importação que você já tinha
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/** Carrega os dados iniciais (categorias e métodos) */
export async function carregarDadosIniciais() {
  const categoriasSnapshot = await getDocs(
    query(collection(db, "categoria"), orderBy("nome"))
  );
  const metodosSnapshot = await getDocs(
    query(collection(db, "metodo"), orderBy("nome"))
  );
  return { categoriasSnapshot, metodosSnapshot };
}

/** Busca todas as transações de um usuário */
export async function buscarTransacoes(userId) {
  const consultaTransacoes = query(
    collection(db, "transacao"),
    where("userId", "==", userId),
    orderBy("data", "desc")
  );
  return await getDocs(consultaTransacoes);
}

/** Busca uma única transação pelo seu ID */
export async function buscarTransacaoPorId(transacaoId) {
  const transacaoRef = doc(db, "transacao", transacaoId);
  return await getDoc(transacaoRef);
}

/** Salva uma nova transação (única ou parcelada) */
export async function salvarNovaTransacao(transacaoData, numParcelas) {
  if (numParcelas > 1) {
    const batch = writeBatch(db);
    for (let i = 1; i <= numParcelas; i++) {
      let dataParcela = new Date(transacaoData.data + "T00:00:00");
      dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
      const transacaoDaParcela = {
        ...transacaoData,
        parcelaAtual: i,
        data: dataParcela.toISOString().split("T")[0],
      };
      batch.set(doc(collection(db, "transacao")), transacaoDaParcela);
    }
    await batch.commit();
  } else {
    await addDoc(collection(db, "transacao"), transacaoData);
  }
}

/** Atualiza uma transação existente */
export async function atualizarTransacao(transacaoId, dadosAtualizados) {
  const docRef = doc(db, "transacao", transacaoId);
  await updateDoc(docRef, dadosAtualizados);
}

/** Exclui uma transação (e suas parcelas, se houver) */
export async function excluirTransacao(transacaoId, idParcelamento, userId) {
  const docRef = doc(db, "transacao", transacaoId);
  if (idParcelamento) {
    const q = query(
      collection(db, "transacao"),
      where("idParcelamento", "==", idParcelamento),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  } else {
    await deleteDoc(docRef);
  }
}
