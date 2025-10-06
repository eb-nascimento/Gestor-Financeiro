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
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Executa o código apenas se estiver na página principal
if (document.getElementById("novaMovimentacao")) {
  // =================================================================
  // CONSTANTES GLOBAIS DE ELEMENTOS DO DOM
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
  const parcelasContainer = document.getElementById("parcelas-container");
  const parcelasInput = document.getElementById("parcelas");
  const editParcelasContainer = document.getElementById(
    "edit-parcelas-container"
  );
  const editParcelasInput = document.getElementById("edit-parcelas");
  const btExcluir = document.getElementById("btExcluir");
  const closeModalBtn = document.getElementById("close-modal-btn");

  // =================================================================
  // VARIÁVEIS DE ESTADO
  // =================================================================
  let tipoMovimentacao = "Saída";
  let mapaCategorias = new Map();
  let mapaMetodos = new Map();
  let currentUser = null;

  // =================================================================
  // FUNÇÕES DE UI E LÓGICA
  // =================================================================

  /**
   * Formata um campo de input como moeda brasileira (BRL).
   */
  function formatarCampoComoMoeda(event) {
    const input = event.target;
    let valor = input.value.replace(/\D/g, "");
    if (!valor) {
      input.value = "";
      return;
    }
    input.value = (parseFloat(valor) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  /**
   * Controla a visibilidade do container de parcelas com base no método selecionado.
   * @param {HTMLSelectElement} selectElement - O <select> de métodos.
   * @param {HTMLElement} containerParcelas - O div que contém o input de parcelas.
   * @param {HTMLInputElement} inputParcelas - O <input> numérico das parcelas.
   */
  function gerenciarVisibilidadeParcelas(
    selectElement,
    containerParcelas,
    inputParcelas
  ) {
    const metodoId = selectElement.value;
    const metodo = mapaMetodos.get(metodoId);

    // Verifica de forma segura se o método é de crédito
    const isCredito =
      metodo && metodo.forma && metodo.forma.trim().toLowerCase() === "credito";

    if (isCredito) {
      containerParcelas.classList.remove("hidden");
    } else {
      containerParcelas.classList.add("hidden");
      inputParcelas.value = 1; // Reseta para 1 parcela se não for crédito
    }
  }

  /**
   * Calcula e exibe os totais de entrada, saída e saldo na carteira.
   */
  function calcularEExibirTotais(transacoes) {
    const elementoSaida = document.querySelector("#valorSaida h2:last-child");
    const elementoEntrada = document.querySelector(
      "#valorEntrada h2:last-child"
    );
    const elementoCarteira = document.querySelector(
      "#valorCarteira h2:last-child"
    );

    if (!elementoSaida || !elementoEntrada || !elementoCarteira) return;

    let totalEntradas = 0,
      totalSaidas = 0;
    transacoes.forEach((transacao) => {
      if (transacao.tipo === "Entrada") totalEntradas += transacao.valor;
      else if (transacao.tipo === "Saída") totalSaidas += transacao.valor;
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

  /**
   * Atualiza os dropdowns de categoria com base no tipo de movimentação.
   */
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
        selectElement.appendChild(new Option(data.nome, id));
      }
    });

    if (categoriaSelecionadaId) selectElement.value = categoriaSelecionadaId;
  }

  // =================================================================
  // CARREGAMENTO DE DADOS (FIREBASE)
  // =================================================================

  /**
   * Carrega categorias e métodos do Firestore e popula os mapas e selects.
   */
  async function carregarDadosIniciais() {
    if (!currentUser) return;
    try {
      const [categoriasSnapshot, metodosSnapshot] = await Promise.all([
        getDocs(query(collection(db, "categoria"), orderBy("nome"))),
        getDocs(query(collection(db, "metodo"), orderBy("nome"))),
      ]);

      mapaCategorias.clear();
      categoriasSnapshot.docs.forEach((doc) =>
        mapaCategorias.set(doc.id, doc.data())
      );

      mapaMetodos.clear();
      metodosSnapshot.docs.forEach((doc) =>
        mapaMetodos.set(doc.id, { id: doc.id, ...doc.data() })
      );

      // Popula os selects de método
      metodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
      editMetodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
      mapaMetodos.forEach((data) => {
        if (data.tipo === "saida") {
          const option = new Option(data.nome, data.id);
          metodoSelect.appendChild(option.cloneNode(true));
          editMetodoSelect.appendChild(option.cloneNode(true));
        }
      });

      atualizarDropdownCategorias(categoriaSelect, tipoMovimentacao);
      await carregarTransacoesDoUsuario();
    } catch (error) {
      console.error("Erro ao carregar dados globais:", error);
    }
  }

  /**
   * Busca e renderiza as transações do usuário logado na tabela.
   */
  async function carregarTransacoesDoUsuario() {
    if (!currentUser) return;
    try {
      const consultaTransacoes = query(
        collection(db, "transacao"),
        where("userId", "==", currentUser.uid),
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
          let descricao = transacao.descricao;
          if (transacao.parcelas && transacao.parcelas > 1) {
            descricao += ` (${transacao.parcelaAtual}/${transacao.parcelas})`;
          }
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
          }</td><td>${nomeMetodo}</td><td>${nomeCategoria}</td><td>${descricao}</td>`;
          corpoTabela.appendChild(novaLinha);
        });
      }
      calcularEExibirTotais(transacoes);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  }

  // =================================================================
  // EVENT LISTENERS
  // =================================================================

  /**
   * Inicializa a aplicação quando o DOM está pronto.
   */
  document.addEventListener("DOMContentLoaded", () => {
    controlarVisibilidadeParcelas(parcelasContainer, false);
    document.getElementById("data").value = new Date()
      .toISOString()
      .split("T")[0];
    btSaida.classList.add("active");

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = user;
        carregarDadosIniciais();
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
    document.getElementById("metodo").classList.remove("hidden");
    document.getElementById("gastoFixoLabel").classList.remove("hidden");
    atualizarDropdownCategorias(categoriaSelect, "Saída");
  });

  btEntrada.addEventListener("click", () => {
    if (tipoMovimentacao === "Entrada") return;
    tipoMovimentacao = "Entrada";
    btEntrada.classList.add("active");
    btSaida.classList.remove("active");
    document.getElementById("metodo").classList.add("hidden");
    document.getElementById("gastoFixoLabel").classList.add("hidden");
    controlarVisibilidadeParcelas(parcelasContainer, false);
    atualizarDropdownCategorias(categoriaSelect, "Entrada");
  });

  // Aplica a formatação de moeda aos campos de valor
  valorInput.addEventListener("input", formatarCampoComoMoeda);
  editValorInput.addEventListener("input", formatarCampoComoMoeda);

  // ** LÓGICA CORRIGIDA E CENTRALIZADA PARA PARCELAS **
  metodoSelect.addEventListener("change", () =>
    gerenciarVisibilidadeParcelas(
      metodoSelect,
      parcelasContainer,
      parcelasInput
    )
  );
  editMetodoSelect.addEventListener("change", () =>
    gerenciarVisibilidadeParcelas(
      editMetodoSelect,
      editParcelasContainer,
      editParcelasInput
    )
  );

  /**
   * Lida com o clique em uma linha da tabela para abrir o modal de edição.
   */
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
          editValorInput.value = transacao.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          document.getElementById("edit-descricao").value = transacao.descricao;
          document.getElementById("edit-gastoFixo").checked =
            transacao.gastoFixo;

          // Atualiza os selects
          atualizarDropdownCategorias(
            editCategoriaSelect,
            transacao.tipo,
            transacao.idCategoria
          );
          editMetodoSelect.value = transacao.idMetodo;

          // Controla visibilidade dos campos específicos de Saída/Entrada
          const isEntrada = transacao.tipo === "Entrada";
          document
            .getElementById("edit-gastoFixoLabel")
            .classList.toggle("hidden", isEntrada);
          editMetodoSelect.classList.toggle("hidden", isEntrada);

          // Lógica para exibir parcelas no modal
          // Lógica para exibir parcelas no modal
          const metodoId = editMetodoSelect.value;
          const metodo = mapaMetodos.get(metodoId);
          const isCredito =
            metodo &&
            metodo.forma &&
            metodo.forma.trim().toLowerCase() === "credito";
          controlarVisibilidadeParcelas(editParcelasContainer, isCredito);
          if (isCredito) {
            editParcelasInput.value = transacao.parcelas || 1;
          }

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

  /**
   * Lida com o envio do formulário de nova transação.
   */
  formPrincipal.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return alert("Utilizador não autenticado.");

    const valorTotal = parseFloat(
      valorInput.value.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const data = document.getElementById("data").value;
    const categoriaId = categoriaSelect.value;
    if (isNaN(valorTotal) || valorTotal <= 0 || !data || !categoriaId) {
      return alert(
        "Preencha todos os campos obrigatórios (Data, Valor, Categoria)."
      );
    }

    try {
      if (tipoMovimentacao === "Saída") {
        const metodoId = metodoSelect.value;
        const metodo = mapaMetodos.get(metodoId);
        if (!metodoId) return alert("Para saídas, selecione um Método!");

        const idParcelamento =
          Date.now().toString(36) + Math.random().toString(36).substr(2);
        const numParcelas =
          metodo?.forma === "credito"
            ? parseInt(parcelasInput.value, 10) || 1
            : 1;
        const valorParcela = valorTotal / numParcelas;

        const transacaoBase = {
          valor: valorParcela,
          gastoFixo: document.getElementById("gastoFixo").checked,
          descricao: document.getElementById("descricao").value,
          data,
          tipo: "Saída",
          idCategoria: categoriaId,
          idMetodo: metodoId,
          userId: currentUser.uid,
          parcelas: numParcelas,
          parcelaAtual: 1,
          idParcelamento: numParcelas > 1 ? idParcelamento : null,
        };

        if (numParcelas > 1) {
          const batch = writeBatch(db);
          for (let i = 1; i <= numParcelas; i++) {
            let dataParcela = new Date(data + "T00:00:00");
            dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
            const transacaoDaParcela = {
              ...transacaoBase,
              parcelaAtual: i,
              data: dataParcela.toISOString().split("T")[0],
            };
            batch.set(doc(collection(db, "transacao")), transacaoDaParcela);
          }
          await batch.commit();
        } else {
          await addDoc(collection(db, "transacao"), transacaoBase);
        }
      } else {
        // Entrada
        await addDoc(collection(db, "transacao"), {
          valor: valorTotal,
          gastoFixo: false,
          descricao: document.getElementById("descricao").value || "-",
          data,
          tipo: "Entrada",
          idCategoria: categoriaId,
          idMetodo: null,
          userId: currentUser.uid,
          parcelas: 1,
          parcelaAtual: 1,
          idParcelamento: null,
        });
      }
      alert("Transação salva!");
      formPrincipal.reset();
      document.getElementById("data").value = new Date()
        .toISOString()
        .split("T")[0];
      controlarVisibilidadeParcelas(parcelasContainer, false);

      await carregarTransacoesDoUsuario();
    } catch (e) {
      console.error("Erro ao salvar: ", e);
    }
  });

  /**
   * Lida com o envio do formulário de edição de transação.
   */
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
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return alert("Erro: Transação não encontrada.");

      const tipoTransacao = docSnap.data().tipo;

      let dadosAtualizados = {
        data: document.getElementById("edit-data").value,
        valor: valor,
        idCategoria: idCategoria,
        descricao: document.getElementById("edit-descricao").value,
      };

      if (tipoTransacao === "Saída") {
        dadosAtualizados.gastoFixo =
          document.getElementById("edit-gastoFixo").checked;
        dadosAtualizados.idMetodo = editMetodoSelect.value;
      }

      await updateDoc(docRef, dadosAtualizados);
      alert("Alterações salvas!");
      modalContainer.classList.add("hidden");
      await carregarTransacoesDoUsuario();
    } catch (e) {
      console.error("Erro ao atualizar: ", e);
    }
  });

  /**
   * Lida com a exclusão de uma transação (e suas parcelas, se houver).
   */
  btExcluir.addEventListener("click", async () => {
    const transacaoId = document.getElementById("edit-transacao-id").value;
    if (
      confirm(
        "Isto irá remover TODAS as parcelas associadas, se existirem. Tem certeza?"
      )
    ) {
      try {
        const docRef = doc(db, "transacao", transacaoId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return alert("Erro: Transação não encontrada.");

        const { idParcelamento } = docSnap.data();

        if (idParcelamento) {
          const q = query(
            collection(db, "transacao"),
            where("idParcelamento", "==", idParcelamento),
            where("userId", "==", currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          alert("Todas as parcelas foram excluídas com sucesso!");
        } else {
          await deleteDoc(docRef);
          alert("Transação excluída!");
        }

        modalContainer.classList.add("hidden");
        await carregarTransacoesDoUsuario();
      } catch (e) {
        console.error("Erro ao excluir:", e);
      }
    }
  });

  /**
   * Fecha o modal.
   */
  closeModalBtn.addEventListener("click", () =>
    modalContainer.classList.add("hidden")
  );
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  });
}

/**
 * Mostra ou oculta um elemento manipulando diretamente o seu estilo de display.
 * @param {HTMLElement} container - O elemento a ser mostrado/ocultado (ex: parcelasContainer).
 * @param {boolean} mostrar - 'true' para mostrar (display: flex), 'false' para ocultar (display: none).
 */
function controlarVisibilidadeParcelas(container, mostrar) {
  if (!container) return; // Segurança caso o elemento não exista

  // Define o estilo de display diretamente para garantir que a regra seja aplicada
  container.style.display = mostrar ? "flex" : "none";
}

// Listener para o dropdown do formulário principal
metodoSelect.addEventListener("change", () => {
  const metodoId = metodoSelect.value;
  const metodo = mapaMetodos.get(metodoId);
  const isCredito =
    metodo && metodo.forma && metodo.forma.trim().toLowerCase() === "credito";

  // Chama a nova função para mostrar ou ocultar o container de parcelas
  controlarVisibilidadeParcelas(parcelasContainer, isCredito);
});

// Listener para o dropdown do modal de edição
editMetodoSelect.addEventListener("change", () => {
  const metodoId = editMetodoSelect.value;
  const metodo = mapaMetodos.get(metodoId);
  const isCredito =
    metodo && metodo.forma && metodo.forma.trim().toLowerCase() === "credito";

  // Chama a nova função para o container de parcelas da edição
  controlarVisibilidadeParcelas(editParcelasContainer, isCredito);
});
