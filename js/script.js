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
import { Transacao } from "./transacao.js";

// =================================================================
// CONSTANTES GLOBAIS E VARIÁVEIS DE ESTADO
// =================================================================
const formPrincipal = document.getElementById("campos");
const formEdicao = document.getElementById("edit-campos");
const corpoTabela = document.getElementById("tabelaMovimentacoes");
const modalContainer = document.getElementById("edit-modal-container");
const btSaida = document.getElementById("btSaida");
const btEntrada = document.getElementById("btEntrada");
const valorInput = document.getElementById("valor");
const editValorInput = document.getElementById("edit-valor");
const categoriaSelect = document.getElementById("categoria");
const metodoSelect = document.getElementById("metodo");
const editCategoriaSelect = document.getElementById("edit-categoria");
const editMetodoSelect = document.getElementById("edit-metodo");

let tipoMovimentacao = "Saída"; // Estado inicial
let mapaCategorias = new Map(); // Mapa para armazenar categorias
let mapaMetodos = new Map(); // Mapa para armazenar métodos

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

// **NOVA FUNÇÃO** para atualizar o dropdown de categorias
function atualizarDropdownCategorias(tipo) {
  categoriaSelect.innerHTML =
    '<option value="">Selecione uma categoria</option>';
  // Normaliza o texto: converte para minúsculas e remove acentos.
  // Ex: "Saída" -> "saida"
  const tipoFiltro = tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  mapaCategorias.forEach((data, id) => {
    // Garante que a comparação funcione mesmo se 'data.tipo' for nulo ou indefinido
    if (data.tipo && data.tipo.toLowerCase() === tipoFiltro) {
      const option = new Option(data.nome, id);
      categoriaSelect.appendChild(option);
    }
  });
}

async function carregarDados() {
  try {
    const [categoriasSnapshot, metodosSnapshot, transacoesSnapshot] =
      await Promise.all([
        getDocs(query(collection(db, "categoria"), orderBy("nome"))),
        getDocs(query(collection(db, "metodo"), orderBy("nome"))),
        getDocs(query(collection(db, "transacao"), orderBy("data", "desc"))),
      ]);

    // Limpa e preenche os mapas
    mapaCategorias.clear();
    mapaMetodos.clear();
    categoriasSnapshot.docs.forEach((doc) =>
      mapaCategorias.set(doc.id, doc.data())
    );
    metodosSnapshot.docs.forEach((doc) => mapaMetodos.set(doc.id, doc.data()));

    const transacoes = transacoesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Popula dropdowns de método (principal e modal)
    metodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
    editMetodoSelect.innerHTML = `<option value="">Selecione um método</option>`; // Corrigido para carregar todas as categorias no modal

    mapaMetodos.forEach((data, id) => {
      const option = new Option(data.nome, id);
      metodoSelect.appendChild(option.cloneNode(true));
      editMetodoSelect.appendChild(option.cloneNode(true));
    });

    // Popula o dropdown de categoria do modal de edição com todas as categorias
    editCategoriaSelect.innerHTML = `<option value="">Selecione uma categoria</option>`;
    mapaCategorias.forEach((data, id) => {
      const option = new Option(data.nome, id);
      editCategoriaSelect.appendChild(option);
    });

    // Atualiza o dropdown de categorias do formulário principal para o estado inicial
    atualizarDropdownCategorias(tipoMovimentacao);

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

  // Mostra campos relevantes para Saída
  document.getElementById("categoria").classList.remove("hidden");
  document.getElementById("metodo").classList.remove("hidden");
  document.getElementById("descricao").classList.remove("hidden");
  document.getElementById("gastoFixoLabel").classList.remove("hidden");

  atualizarDropdownCategorias("Saída");
});

btEntrada.addEventListener("click", () => {
  if (tipoMovimentacao === "Entrada") return;
  tipoMovimentacao = "Entrada";
  btEntrada.classList.add("active");
  btSaida.classList.remove("active");

  // Mostra e esconde campos conforme a lógica de Entrada
  document.getElementById("categoria").classList.remove("hidden"); // Garante que categoria seja visível
  document.getElementById("metodo").classList.add("hidden"); // Esconde método para entrada
  document.getElementById("descricao").classList.add("hidden"); // Esconde descrição para entrada
  document.getElementById("gastoFixoLabel").classList.add("hidden");

  atualizarDropdownCategorias("Entrada");
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

          // Controla visibilidade no modal de edição
          const isEntrada = transacao.tipo === "Entrada";
          document
            .getElementById("edit-gastoFixoLabel")
            .classList.toggle("hidden", isEntrada);
          document
            .getElementById("edit-descricao")
            .classList.toggle("hidden", isEntrada);
          document
            .getElementById("edit-metodo")
            .classList.toggle("hidden", isEntrada);

          modalContainer.classList.remove("hidden");
        } else {
          alert("Transação não encontrada.");
        }
      } catch (error) {
        console.error("Erro ao abrir edição: ", error);
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
    const data = document.getElementById("data").value;
    const categoriaId = document.getElementById("categoria").value;

    if (isNaN(valor) || valor <= 0) return alert("Valor inválido!");
    if (!data || !categoriaId) return alert("Preencha Data e Categoria!");

    let novaTransacao;

    if (tipoMovimentacao === "Saída") {
      const metodoId = document.getElementById("metodo").value;
      const descricao = document.getElementById("descricao").value;
      const gastoFixo = document.getElementById("gastoFixo").checked;

      if (!metodoId || !descricao) {
        return alert("Para saídas, preencha Método e Descrição!");
      }
      novaTransacao = {
        valor,
        gastoFixo,
        descricao,
        data,
        tipo: "Saída",
        idCategoria: categoriaId,
        idMetodo: metodoId,
      };
    } else {
      // Entrada
      novaTransacao = {
        valor,
        gastoFixo: false,
        descricao: "-",
        data,
        tipo: "Entrada",
        idCategoria: categoriaId,
        idMetodo: null,
      };
    }

    try {
      await addDoc(collection(db, "transacao"), novaTransacao);
      alert("Transação salva!");
      formPrincipal.reset();
      document.getElementById("data").value = new Date()
        .toISOString()
        .split("T")[0];
      await carregarDados();
    } catch (e) {
      console.error("Erro ao salvar: ", e);
      alert("Erro ao salvar a transação.");
    }
  });
}

if (formEdicao) {
  formEdicao.addEventListener("submit", async (event) => {
    event.preventDefault();
    const transacaoId = document.getElementById("edit-transacao-id").value;
    const valor = parseFloat(
      document
        .getElementById("edit-valor")
        .value.replace(/[^\d,]/g, "")
        .replace(",", ".")
    );
    const idCategoria = document.getElementById("edit-categoria").value;

    if (isNaN(valor) || valor <= 0 || !idCategoria) {
      return alert("Preencha todos os campos corretamente.");
    }

    const docRef = doc(db, "transacao", transacaoId);
    const docSnap = await getDoc(docRef);
    const tipoTransacao = docSnap.data().tipo;

    let dadosAtualizados = {
      data: document.getElementById("edit-data").value,
      valor: valor,
      idCategoria: idCategoria,
    };

    if (tipoTransacao === "Saída") {
      dadosAtualizados.gastoFixo =
        document.getElementById("edit-gastoFixo").checked;
      dadosAtualizados.descricao =
        document.getElementById("edit-descricao").value;
      dadosAtualizados.idMetodo = document.getElementById("edit-metodo").value;
    }

    try {
      await updateDoc(docRef, dadosAtualizados);
      alert("Alterações salvas!");
      modalContainer.classList.add("hidden");
      await carregarDados();
    } catch (e) {
      console.error("Erro ao atualizar: ", e);
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
        await carregarDados();
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
