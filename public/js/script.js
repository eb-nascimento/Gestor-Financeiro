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
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Executa o código apenas se encontrar o elemento principal da página de transações
if (document.getElementById("novaMovimentacao")) {
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
    const elementoEntrada = document.querySelector(
      "#valorEntrada h2:last-child"
    );
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

  function atualizarDropdownCategorias(
    selectElement,
    tipo,
    categoriaSelecionadaId = null
  ) {
    selectElement.innerHTML =
      '<option value="">Selecione uma categoria</option>';
    const tipoFiltro = tipo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    mapaCategorias.forEach((data, id) => {
      if (data.tipo && data.tipo.toLowerCase() === tipoFiltro) {
        const option = new Option(data.nome, id);
        selectElement.appendChild(option);
      }
    });

    if (categoriaSelecionadaId) {
      selectElement.value = categoriaSelecionadaId;
    }
  }

  async function carregarTransacoesDoUsuario(userId) {
    try {
      const consultaTransacoes = query(
        collection(db, "transacao"),
        where("userId", "==", userId),
        orderBy("data", "desc")
      );
      const transacoesSnapshot = await getDocs(consultaTransacoes);

      const transacoes = transacoesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

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
      console.error("Erro ao carregar transações do usuário:", error);
      alert("Não foi possível carregar as transações.");
    }
  }

  async function carregarDadosIniciais(userId) {
    try {
      const [categoriasSnapshot, metodosSnapshot] = await Promise.all([
        getDocs(query(collection(db, "categoria"), orderBy("nome"))),
        getDocs(query(collection(db, "metodo"), orderBy("nome"))),
      ]);

      mapaCategorias.clear();
      mapaMetodos.clear();
      categoriasSnapshot.docs.forEach((doc) =>
        mapaCategorias.set(doc.id, doc.data())
      );
      metodosSnapshot.docs.forEach((doc) =>
        mapaMetodos.set(doc.id, doc.data())
      );

      metodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
      editMetodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
      mapaMetodos.forEach((data, id) => {
        const option = new Option(data.nome, id);
        metodoSelect.appendChild(option.cloneNode(true));
        editMetodoSelect.appendChild(option.cloneNode(true));
      });

      atualizarDropdownCategorias(categoriaSelect, tipoMovimentacao);
      await carregarTransacoesDoUsuario(userId);
    } catch (error) {
      console.error("Erro ao carregar dados globais:", error);
      alert("Não foi possível carregar os dados da aplicação.");
    }
  }

  // =================================================================
  // EVENT LISTENERS
  // =================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const dataInput = document.getElementById("data");
    if (dataInput) dataInput.value = new Date().toISOString().split("T")[0];
    if (btSaida) btSaida.classList.add("active");

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarDadosIniciais(user.uid);
      } else {
        window.location.href = "login.html";
      }
    });
  });

  btSaida.addEventListener("click", () => {
    if (tipoMovimentacao === "Saída") return;
    tipoMovimentacao = "Saída";
    btSaida.classList.add("active");
    btEntrada.classList.remove("active");

    document.getElementById("categoria").classList.remove("hidden");
    document.getElementById("metodo").classList.remove("hidden");
    document.getElementById("descricao").classList.remove("hidden");
    document.getElementById("gastoFixoLabel").classList.remove("hidden");

    atualizarDropdownCategorias(categoriaSelect, "Saída");
  });

  btEntrada.addEventListener("click", () => {
    if (tipoMovimentacao === "Entrada") return;
    tipoMovimentacao = "Entrada";
    btEntrada.classList.add("active");
    btSaida.classList.remove("active");

    document.getElementById("categoria").classList.remove("hidden");
    document.getElementById("metodo").classList.add("hidden");
    document.getElementById("descricao").classList.add("hidden");
    document.getElementById("gastoFixoLabel").classList.add("hidden");

    atualizarDropdownCategorias(categoriaSelect, "Entrada");
  });

  valorInput.addEventListener("input", formatarCampoComoMoeda);
  editValorInput.addEventListener("input", formatarCampoComoMoeda);

  corpoTabela.addEventListener("click", async (event) => {
    const linhaClicada = event.target.closest("tr[data-id]");
    if (linhaClicada) {
      const transacaoId = linhaClicada.dataset.id;
      try {
        const transacaoRef = doc(db, "transacao", transacaoId);
        const docSnap = await getDoc(transacaoRef);
        if (docSnap.exists()) {
          const transacao = docSnap.data();

          atualizarDropdownCategorias(
            editCategoriaSelect,
            transacao.tipo,
            transacao.idCategoria
          );

          document.getElementById("edit-transacao-id").value = transacaoId;
          document.getElementById("edit-data").value = transacao.data;
          document.getElementById("edit-valor").value =
            transacao.valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("edit-descricao").value = transacao.descricao;
          document.getElementById("edit-metodo").value = transacao.idMetodo;
          document.getElementById("edit-gastoFixo").checked =
            transacao.gastoFixo;

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

  formPrincipal.addEventListener("submit", async (event) => {
    event.preventDefault();
    const auth = getAuth();
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    if (!userId) {
      alert("Usuário não autenticado. Por favor, faça login novamente.");
      return;
    }

    const valorBruto = valorInput.value;
    const valor = parseFloat(
      valorBruto.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const data = document.getElementById("data").value;
    const categoriaId = categoriaSelect.value;

    if (isNaN(valor) || valor <= 0) return alert("Valor inválido!");
    if (!data || !categoriaId) return alert("Preencha Data e Categoria!");

    let novaTransacao;

    if (tipoMovimentacao === "Saída") {
      const metodoId = metodoSelect.value;
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
        userId: userId,
      };
    } else {
      novaTransacao = {
        valor,
        gastoFixo: false,
        descricao: "-",
        data,
        tipo: "Entrada",
        idCategoria: categoriaId,
        idMetodo: null,
        userId: userId,
      };
    }

    try {
      await addDoc(collection(db, "transacao"), novaTransacao);
      alert("Transação salva!");
      formPrincipal.reset();
      document.getElementById("data").value = new Date()
        .toISOString()
        .split("T")[0];
      await carregarTransacoesDoUsuario(userId);
    } catch (e) {
      console.error("Erro ao salvar: ", e);
      alert("Erro ao salvar a transação.");
    }
  });

  formEdicao.addEventListener("submit", async (event) => {
    event.preventDefault();
    const transacaoId = document.getElementById("edit-transacao-id").value;
    const valor = parseFloat(
      editValorInput.value.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const idCategoria = editCategoriaSelect.value;

    if (isNaN(valor) || valor <= 0 || !idCategoria) {
      return alert("Preencha todos os campos corretamente.");
    }

    const docRef = doc(db, "transacao", transacaoId);
    const docSnap = await getDoc(docRef);
    const tipoTransacao = docSnap.data().tipo;
    const userId = docSnap.data().userId;

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
      await carregarTransacoesDoUsuario(userId);
    } catch (e) {
      console.error("Erro ao atualizar: ", e);
      alert("Erro ao atualizar.");
    }
  });

  const btExcluir = document.getElementById("btExcluir");
  btExcluir.addEventListener("click", async () => {
    const transacaoId = document.getElementById("edit-transacao-id").value;
    const userId = getAuth().currentUser.uid;

    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await deleteDoc(doc(db, "transacao", transacaoId));
        alert("Transação excluída!");
        modalContainer.classList.add("hidden");
        await carregarTransacoesDoUsuario(userId);
      } catch (e) {
        alert("Erro ao excluir.");
      }
    }
  });

  const closeModalBtn = document.getElementById("close-modal-btn");
  closeModalBtn.addEventListener("click", () =>
    modalContainer.classList.add("hidden")
  );

  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  });
} // Fim do IF principal
