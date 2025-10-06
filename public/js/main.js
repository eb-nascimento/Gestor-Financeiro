// js/main.js
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import * as service from "./firestore-service.js";
import * as ui from "./ui.js";

// Variáveis de estado da aplicação
let currentUser = null;
let tipoMovimentacao = "Saída";
let mapaCategorias = new Map();
let mapaMetodos = new Map();

/** Carrega todos os dados e renderiza a página inteira */
async function carregarTudo() {
  const transacoesSnapshot = await service.buscarTransacoes(currentUser.uid);
  const transacoes = transacoesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  ui.renderizarTabela(transacoes, mapaCategorias, mapaMetodos);
  ui.exibirTotais(transacoes);
}

/** Função de inicialização da página */
async function inicializar() {
  const { categoriasSnapshot, metodosSnapshot } =
    await service.carregarDadosIniciais();
  mapaCategorias.clear();
  mapaMetodos.clear();
  categoriasSnapshot.docs.forEach((doc) =>
    mapaCategorias.set(doc.id, doc.data())
  );
  metodosSnapshot.docs.forEach((doc) =>
    mapaMetodos.set(doc.id, { id: doc.id, ...doc.data() })
  );

  ui.DOMElements.metodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
  ui.DOMElements.editMetodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
  mapaMetodos.forEach((data) => {
    if (data.tipo === "saida") {
      const option = new Option(data.nome, data.id);
      ui.DOMElements.metodoSelect.appendChild(option.cloneNode(true));
      ui.DOMElements.editMetodoSelect.appendChild(option.cloneNode(true));
    }
  });

  ui.atualizarDropdownCategorias(
    ui.DOMElements.categoriaSelect,
    tipoMovimentacao,
    mapaCategorias
  );
  await carregarTudo();
}

// ===============================================
// EVENT LISTENERS (CONTROLES DA PÁGINA)
// ===============================================

// Botões de Entrada/Saída
ui.DOMElements.btSaida.addEventListener("click", () => {
  tipoMovimentacao = "Saída";
  ui.DOMElements.btSaida.classList.add("active");
  ui.DOMElements.btEntrada.classList.remove("active");
  document.getElementById("metodo").classList.remove("hidden");
  document.getElementById("gastoFixoLabel").classList.remove("hidden");
  ui.atualizarDropdownCategorias(
    ui.DOMElements.categoriaSelect,
    "Saída",
    mapaCategorias
  );
});

ui.DOMElements.btEntrada.addEventListener("click", () => {
  tipoMovimentacao = "Entrada";
  ui.DOMElements.btEntrada.classList.add("active");
  ui.DOMElements.btSaida.classList.remove("active");
  document.getElementById("metodo").classList.add("hidden");
  document.getElementById("gastoFixoLabel").classList.add("hidden");
  ui.DOMElements.parcelasContainer.classList.add("hidden");
  ui.DOMElements.parcelasInput.value = 1;
  ui.atualizarDropdownCategorias(
    ui.DOMElements.categoriaSelect,
    "Entrada",
    mapaCategorias
  );
});

// Formatação de moeda
ui.DOMElements.valorInput.addEventListener("input", ui.formatarCampoComoMoeda);
ui.DOMElements.editValorInput.addEventListener(
  "input",
  ui.formatarCampoComoMoeda
);

// Visibilidade das parcelas
ui.DOMElements.metodoSelect.addEventListener("change", () =>
  ui.gerenciarVisibilidadeParcelas(
    ui.DOMElements.metodoSelect,
    ui.DOMElements.parcelasContainer,
    ui.DOMElements.parcelasInput,
    mapaMetodos
  )
);
ui.DOMElements.editMetodoSelect.addEventListener("change", () =>
  ui.gerenciarVisibilidadeParcelas(
    ui.DOMElements.editMetodoSelect,
    ui.DOMElements.editParcelasContainer,
    ui.DOMElements.editParcelasInput,
    mapaMetodos
  )
);

// Salvar nova transação
ui.DOMElements.formPrincipal.addEventListener("submit", async (event) => {
  event.preventDefault();
  // ESTA É A LINHA QUE CONSERTA O ERRO NA ORIGEM
  const valorTotal =
    parseFloat(
      ui.DOMElements.valorInput.value.replace(/[^\d,]/g, "").replace(",", ".")
    ) || 0;

  if (valorTotal <= 0) {
    return alert("O valor da transação deve ser maior que zero.");
  }

  const numParcelas = parseInt(ui.DOMElements.parcelasInput.value, 10) || 1;
  const transacaoBase = {
    valor: valorTotal / numParcelas,
    gastoFixo: document.getElementById("gastoFixo").checked,
    descricao: document.getElementById("descricao").value,
    data: document.getElementById("data").value,
    tipo: tipoMovimentacao,
    idCategoria: ui.DOMElements.categoriaSelect.value,
    idMetodo:
      tipoMovimentacao === "Saída" ? ui.DOMElements.metodoSelect.value : null,
    userId: currentUser.uid,
    parcelas: numParcelas,
    parcelaAtual: 1,
    idParcelamento:
      numParcelas > 1
        ? Date.now().toString(36) + Math.random().toString(36).substr(2)
        : null,
  };

  await service.salvarNovaTransacao(transacaoBase, numParcelas);
  alert("Transação salva!");
  ui.DOMElements.formPrincipal.reset();
  document.getElementById("data").value = new Date()
    .toISOString()
    .split("T")[0];
  await carregarTudo();
});

// Abrir modal para edição
ui.DOMElements.corpoTabela.addEventListener("click", async (event) => {
  const linha = event.target.closest("tr[data-id]");
  if (!linha) return;

  const docSnap = await service.buscarTransacaoPorId(linha.dataset.id);
  if (docSnap.exists()) {
    const transacao = docSnap.data();
    document.getElementById("edit-transacao-id").value = linha.dataset.id;
    document.getElementById("edit-data").value = transacao.data;
    const valorNumerico = Number(transacao.valor) || 0;
    ui.DOMElements.editValorInput.value = valorNumerico.toLocaleString(
      "pt-BR",
      { style: "currency", currency: "BRL" }
    );
    document.getElementById("edit-descricao").value = transacao.descricao;
    document.getElementById("edit-gastoFixo").checked = transacao.gastoFixo;
    ui.atualizarDropdownCategorias(
      ui.DOMElements.editCategoriaSelect,
      transacao.tipo,
      mapaCategorias,
      transacao.idCategoria
    );
    ui.DOMElements.editMetodoSelect.value = transacao.idMetodo;

    const isEntrada = transacao.tipo === "Entrada";
    document
      .getElementById("edit-gastoFixoLabel")
      .classList.toggle("hidden", isEntrada);
    ui.DOMElements.editMetodoSelect.classList.toggle("hidden", isEntrada);

    ui.DOMElements.modalContainer.classList.remove("hidden");
  }
});

// Salvar edição
ui.DOMElements.formEdicao.addEventListener("submit", async (event) => {
  event.preventDefault();
  const transacaoId = document.getElementById("edit-transacao-id").value;
  // CONSERTO AQUI TAMBÉM
  const valorEditado =
    parseFloat(
      ui.DOMElements.editValorInput.value
        .replace(/[^\d,]/g, "")
        .replace(",", ".")
    ) || 0;

  const dadosAtualizados = {
    data: document.getElementById("edit-data").value,
    valor: valorEditado,
    idCategoria: ui.DOMElements.editCategoriaSelect.value,
    descricao: document.getElementById("edit-descricao").value,
    gastoFixo: document.getElementById("edit-gastoFixo").checked,
    idMetodo: ui.DOMElements.editMetodoSelect.value,
  };
  await service.atualizarTransacao(transacaoId, dadosAtualizados);
  alert("Alterações salvas!");
  ui.DOMElements.modalContainer.classList.add("hidden");
  await carregarTudo();
});

// Excluir transação
ui.DOMElements.btExcluir.addEventListener("click", async () => {
  const transacaoId = document.getElementById("edit-transacao-id").value;
  if (confirm("Isto irá remover TODAS as parcelas associadas. Tem certeza?")) {
    const docSnap = await service.buscarTransacaoPorId(transacaoId);
    if (docSnap.exists()) {
      const { idParcelamento } = docSnap.data();
      await service.excluirTransacao(
        transacaoId,
        idParcelamento,
        currentUser.uid
      );
      alert("Transação excluída!");
      ui.DOMElements.modalContainer.classList.add("hidden");
      await carregarTudo();
    }
  }
});

// Fechar modal
ui.DOMElements.closeModalBtn.addEventListener("click", () =>
  ui.DOMElements.modalContainer.classList.add("hidden")
);
ui.DOMElements.modalContainer.addEventListener("click", (e) => {
  if (e.target === ui.DOMElements.modalContainer)
    ui.DOMElements.modalContainer.classList.add("hidden");
});

// ===============================================
// PONTO DE ENTRADA DA APLICAÇÃO
// ===============================================
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    // Executa o código apenas se estiver na página principal
    if (document.getElementById("novaMovimentacao")) {
      document.getElementById("data").value = new Date()
        .toISOString()
        .split("T")[0];
      ui.DOMElements.btSaida.classList.add("active");
      inicializar();
    }
  } else {
    window.location.href = "login.html";
  }
});
