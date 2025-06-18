// =================================================================
// IMPORTS - Apenas o que o script.js precisa
// =================================================================
import { db } from "./firebase.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// As classes são importadas, mas usadas apenas como "plantas" para o 'new Transacao'
import { Transacao } from "./transacao.js";

// =================================================================
// CONSTANTES GLOBAIS
// =================================================================
const formPrincipal = document.getElementById("campos");
const formEdicao = document.getElementById("edit-campos");
const corpoTabela = document.getElementById("tabelaMovimentacoes");
const modalContainer = document.getElementById("edit-modal-container");
const btSaida = document.getElementById("btSaida");
const btEntrada = document.getElementById("btEntrada");
const valorInput = document.getElementById("valor");
const editValorInput = document.getElementById("edit-valor");
let tipoMovimentacao = "Saída";

// =================================================================
// FUNÇÕES DE MANIPULAÇÃO DA INTERFACE (DOM)
// =================================================================

function formatarCampoComoMoeda(event) {
  const input = event.target;
  let valor = input.value.replace(/\D/g, "");
  if (!valor) {
    input.value = "";
    return;
  }
  valor = (parseFloat(valor) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  input.value = valor;
}

function calcularEExibirTotais(transacoes) {
  const elementoSaida = document.querySelector("#valorSaida h2:last-child");
  const elementoEntrada = document.querySelector("#valorEntrada h2:last-child");
  const elementoCarteira = document.querySelector(
    "#valorCarteira h2:last-child"
  );
  if (!elementoSaida || !elementoEntrada || !elementoCarteira) return;

  let totalEntradas = 0;
  let totalSaidas = 0;

  transacoes.forEach((transacao) => {
    if (transacao.tipo === "Entrada") {
      totalEntradas += transacao.valor;
    } else if (transacao.tipo === "Saída") {
      totalSaidas += transacao.valor;
    }
  });

  const saldoCarteira = totalEntradas - totalSaidas;
  elementoEntrada.textContent = totalEntradas.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  elementoSaida.textContent = totalSaidas.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  elementoCarteira.textContent = saldoCarteira.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  elementoCarteira.style.color = saldoCarteira < 0 ? "#e74c3c" : "#2ecc71";
}

async function carregarDados() {
  try {
    // Busca todos os dados necessários em paralelo
    const [categoriasSnapshot, metodosSnapshot, transacoesSnapshot] =
      await Promise.all([
        getDocs(query(collection(db, "categoria"), orderBy("nome"))),
        getDocs(query(collection(db, "metodo"), orderBy("nome"))),
        getDocs(query(collection(db, "transacao"), orderBy("data", "desc"))),
      ]);

    // Cria os mapas de consulta
    const mapaCategorias = new Map(
      categoriasSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );
    const mapaMetodos = new Map(
      metodosSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );

    // Extrai os dados das transações
    const transacoes = transacoesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Popula os dropdowns (principal e do modal)
    const categoriaSelect = document.getElementById("categoria");
    const metodoSelect = document.getElementById("metodo");
    const editCategoriaSelect = document.getElementById("edit-categoria");
    const editMetodoSelect = document.getElementById("edit-metodo");

    categoriaSelect.innerHTML = `<option value="">Selecione uma categoria</option>`;
    metodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
    editCategoriaSelect.innerHTML = `<option value="">Selecione uma categoria</option>`;
    editMetodoSelect.innerHTML = `<option value="">Selecione um método</option>`;

    mapaCategorias.forEach((data, id) => {
      const option = new Option(data.nome, id);
      if (data.tipo === "saida") {
        categoriaSelect.appendChild(option.cloneNode(true));
      }
      editCategoriaSelect.appendChild(option.cloneNode(true));
    });

    mapaMetodos.forEach((data, id) => {
      const option = new Option(data.nome, id);
      metodoSelect.appendChild(option.cloneNode(true));
      editMetodoSelect.appendChild(option.cloneNode(true));
    });

    // Renderiza a tabela
    corpoTabela.innerHTML = "";
    if (transacoes.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>`;
    } else {
      transacoes.forEach((transacao) => {
        const nomeCategoria =
          mapaCategorias.get(transacao.idCategoria)?.nome || "Não encontrada";
        const nomeMetodo = mapaMetodos.get(transacao.idMetodo)?.nome || "-";
        const novaLinha = document.createElement("tr");
        novaLinha.dataset.id = transacao.id;
        const classeValor =
          transacao.tipo === "Entrada" ? "valorEntrada" : "valorSaida";
        const valorFormatado = transacao.valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
        const dataFormatada = new Date(
          transacao.data + "T00:00:00"
        ).toLocaleDateString("pt-BR");
        novaLinha.innerHTML = `<td>${dataFormatada}</td><td class="${classeValor}">${valorFormatado}${
          transacao.gastoFixo && transacao.tipo === "Saída" ? "*" : ""
        }</td><td>${nomeMetodo}</td><td>${nomeCategoria}</td><td>${
          transacao.descricao
        }</td>`;
        corpoTabela.appendChild(novaLinha);
      });
    }

    // Calcula e exibe os totais
    calcularEExibirTotais(transacoes);
  } catch (error) {
    console.error("Erro ao carregar dados iniciais:", error);
    alert("Não foi possível carregar os dados da aplicação.");
  }
}

// =================================================================
// EVENT LISTENERS
// =================================================================

window.addEventListener("DOMContentLoaded", () => {
  console.log("Página carregada. Iniciando aplicação...");
  document.getElementById("data").value = new Date()
    .toISOString()
    .split("T")[0];
  btSaida.classList.add("active");
  carregarDados();
});

btSaida.addEventListener("click", () => {
  if (tipoMovimentacao === "Saída") return;
  tipoMovimentacao = "Saída";
  btSaida.classList.add("active");
  btEntrada.classList.remove("active");
  document.getElementById("metodo").classList.remove("hidden");
  document.getElementById("descricao").classList.remove("hidden");
  document.getElementById("gastoFixoLabel").classList.remove("hidden");
});

btEntrada.addEventListener("click", () => {
  if (tipoMovimentacao === "Entrada") return;
  tipoMovimentacao = "Entrada";
  btEntrada.classList.add("active");
  btSaida.classList.remove("active");
  document.getElementById("metodo").classList.add("hidden");
  document.getElementById("descricao").classList.add("hidden");
  document.getElementById("gastoFixoLabel").classList.add("hidden");
});

if (valorInput) valorInput.addEventListener("input", formatarCampoComoMoeda);
if (editValorInput)
  editValorInput.addEventListener("input", formatarCampoComoMoeda);

if (corpoTabela) {
  corpoTabela.addEventListener("click", async (event) => {
    const linhaClicada = event.target.closest("tr[data-id]");
    if (linhaClicada) {
      const transacaoId = linhaClicada.dataset.id;
      try {
        const transacaoRef = doc(db, "transacao", transacaoId);
        const docSnap = await getDoc(transacaoRef);
        if (docSnap.exists()) {
          const transacao = docSnap.data();
          document.getElementById("edit-transacao-id").value = transacaoId;
          document.getElementById("edit-data").value = transacao.data;
          document.getElementById("edit-valor").value =
            transacao.valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("edit-descricao").value = transacao.descricao;
          document.getElementById("edit-categoria").value =
            transacao.idCategoria;
          document.getElementById("edit-metodo").value = transacao.idMetodo;
          document.getElementById("edit-gastoFixo").checked =
            transacao.gastoFixo;
          const isSaida = transacao.tipo === "Saída";
          document
            .getElementById("edit-gastoFixoLabel")
            .classList.toggle("hidden", !isSaida);
          document
            .getElementById("edit-descricao")
            .classList.toggle("hidden", !isSaida);
          document
            .getElementById("edit-metodo")
            .classList.toggle("hidden", !isSaida);
          modalContainer.classList.remove("hidden");
        } else {
          alert("Transação não encontrada.");
        }
      } catch (error) {
        alert("Não foi possível carregar os dados para edição.");
      }
    }
  });
}

if (formPrincipal) {
  formPrincipal.addEventListener("submit", async (event) => {
    event.preventDefault();
    const valorBruto = document.getElementById("valor").value;
    const valor = parseFloat(
      valorBruto.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const gastoFixo = document.getElementById("gastoFixo").checked;
    const descricao = document.getElementById("descricao").value;
    const data = document.getElementById("data").value;
    const categoriaId = document.getElementById("categoria").value;
    const metodoId = document.getElementById("metodo").value;
    if (isNaN(valor) || valor <= 0) return alert("Valor inválido!");
    if (!data || !categoriaId) return alert("Preencha Data e Categoria!");
    if (tipoMovimentacao === "Saída" && (!metodoId || !descricao))
      return alert("Preencha Método e Descrição!");

    const novaTransacao = new Transacao(
      valor,
      tipoMovimentacao === "Saída" ? gastoFixo : false,
      tipoMovimentacao === "Saída" ? descricao : "-",
      data,
      undefined,
      undefined,
      tipoMovimentacao,
      categoriaId,
      tipoMovimentacao === "Saída" ? metodoId : null
    );
    try {
      await addDoc(collection(db, "transacao"), { ...novaTransacao });
      alert("Transação salva!");
      formPrincipal.reset();
      document.getElementById("data").value = new Date()
        .toISOString()
        .split("T")[0];
      await carregarDados(); // Recarrega todos os dados e a interface
    } catch (e) {
      alert("Erro ao salvar a transação.");
    }
  });
}

if (formEdicao) {
  formEdicao.addEventListener("submit", async (event) => {
    event.preventDefault();
    const transacaoId = document.getElementById("edit-transacao-id").value;
    const dadosAtualizados = {
      data: document.getElementById("edit-data").value,
      valor: parseFloat(
        document
          .getElementById("edit-valor")
          .value.replace(/[^\d,]/g, "")
          .replace(",", ".")
      ),
      gastoFixo: document.getElementById("edit-gastoFixo").checked,
      descricao: document.getElementById("edit-descricao").value,
      idCategoria: document.getElementById("edit-categoria").value,
      idMetodo: document.getElementById("edit-metodo").value,
    };
    try {
      const transacaoRef = doc(db, "transacao", transacaoId);
      await updateDoc(transacaoRef, dadosAtualizados);
      alert("Alterações salvas!");
      modalContainer.classList.add("hidden");
      await carregarDados(); // Recarrega todos os dados
    } catch (e) {
      alert("Erro ao atualizar.");
    }
  });
}

const btExcluir = document.getElementById("btExcluir");
if (btExcluir) {
  btExcluir.addEventListener("click", async () => {
    const transacaoId = document.getElementById("edit-transacao-id").value;
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await deleteDoc(doc(db, "transacao", transacaoId));
        alert("Transação excluída!");
        modalContainer.classList.add("hidden");
        await carregarDados(); // Recarrega todos os dados
      } catch (e) {
        alert("Erro ao excluir.");
      }
    }
  });
}

const closeModalBtn = document.getElementById("close-modal-btn");
if (closeModalBtn)
  closeModalBtn.addEventListener("click", () =>
    modalContainer.classList.add("hidden")
  );
if (modalContainer)
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  });
