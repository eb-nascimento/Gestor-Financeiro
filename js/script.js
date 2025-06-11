// Imports das suas classes locais (onde a lógica de dados agora reside)
import { Metodo } from "./metodo.js";
import { Categoria } from "./categoria.js";
import { Transacao } from "./transacao.js";
import { db } from "./firebase.js";
// No seu script.js
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  doc, // <<< ADICIONE ESTA
  getDoc, // <<< ADICIONE ESTA
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// --- CONSTANTES DOS ELEMENTOS DO FORMULÁRIO ---
const btSaida = document.getElementById("btSaida");
const btEntrada = document.getElementById("btEntrada");
const metodoInput = document.getElementById("metodo");
const descricaoInput = document.getElementById("descricao");
const labelGastoFixo = document.getElementById("gastoFixoLabel");
const valorInput = document.getElementById("valor");
const editValorInput = document.getElementById("edit-valor");
const form = document.getElementById("campos");
const corpoTabela = document.getElementById("tabelaMovimentacoes");
const modalContainer = document.getElementById("edit-modal-container");
const closeModalBtn = document.getElementById("close-modal-btn");
const formEdicao = document.getElementById("edit-campos");
const btExcluir = document.getElementById("btExcluir");
let tipoMovimentacao = "Saída"; // Define o tipo padrão

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    modalContainer.classList.add("hidden");
  });
}
// Opcional: Adiciona evento para fechar o modal ao clicar fora da área de conteúdo
if (modalContainer) {
  modalContainer.addEventListener("click", (event) => {
    // Se o alvo do clique for o próprio container de fundo (e não o formulário dentro dele)
    if (event.target === modalContainer) {
      modalContainer.classList.add("hidden");
    }
  });
}

if (valorInput) {
  valorInput.addEventListener("input", formatarCampoComoMoeda);
}

if (editValorInput) {
  editValorInput.addEventListener("input", formatarCampoComoMoeda);
}

if (btExcluir) {
  // Usamos 'click' pois o botão não é type="submit"
  btExcluir.addEventListener("click", async () => {
    const transacaoId = document.getElementById("edit-transacao-id").value;
    if (!transacaoId) {
      return alert("Erro: ID da transação não encontrado para exclusão.");
    }

    // Pede confirmação ao usuário antes de uma ação destrutiva
    const confirmouExclusao = confirm(
      "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
    );

    if (confirmouExclusao) {
      console.log(
        `Usuário confirmou a exclusão da transação ID: ${transacaoId}`
      );
      try {
        // 1. Chama o método da classe Transacao para fazer a exclusão
        await Transacao.excluir(transacaoId);

        alert("Transação excluída com sucesso!");

        // 2. Fecha o modal e atualiza a tabela na tela principal
        document.getElementById("edit-modal-container").classList.add("hidden");
        await carregarTransacoes(); // Recarrega a tabela para mostrar a lista atualizada
      } catch (error) {
        console.error("Erro ao excluir transação:", error);
        alert("Não foi possível excluir a transação.");
      }
    } else {
      console.log("Exclusão cancelada pelo usuário.");
    }
  });
}
// --- FUNÇÕES DE INTERFACE (População de Dropdowns e Tabela) ---
// Função para popular o dropdown de CATEGORIAS
async function carregarCategorias(selectElementId, tipoFiltro = null) {
  const categoriaSelect = document.getElementById(selectElementId);
  if (!categoriaSelect) {
    console.error(
      `Elemento select com ID '${selectElementId}' não foi encontrado!`
    );
    return;
  }

  categoriaSelect.innerHTML =
    '<option value="">Selecione uma categoria</option>';
  try {
    const documentos = await Categoria.buscarTodas(tipoFiltro); // Usaremos um novo nome para clareza

    documentos.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.data().nome;
      categoriaSelect.appendChild(option);
    });
  } catch (error) {
    console.error(
      `Erro ao carregar categorias para o select #${selectElementId}:`,
      error
    );
  }
}
// Função para popular o dropdown de MÉTODOS
// A função agora recebe o ID do elemento select
async function carregarMetodos(selectElementId) {
  const metodoSelect = document.getElementById(selectElementId);
  if (!metodoSelect) {
    console.error(
      `Elemento select com ID '${selectElementId}' não foi encontrado!`
    );
    return;
  }

  metodoSelect.innerHTML = '<option value="">Selecione um método</option>';
  try {
    const documentos = await Metodo.buscarTodos();
    documentos.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.data().nome;
      metodoSelect.appendChild(option);
    });
  } catch (error) {
    console.error(
      `Erro ao carregar métodos para o select #${selectElementId}:`,
      error
    );
  }
}

// Função para popular a TABELA de TRANSAÇÕES
async function carregarTransacoes() {
  const corpoTabela = document.getElementById("tabelaMovimentacoes");
  if (!corpoTabela) {
    console.error("Elemento da tabela não encontrado.");
    return;
  }

  corpoTabela.innerHTML = ""; // Limpa a tabela para evitar duplicatas

  try {
    // 1. OTIMIZAÇÃO: Busca transações, categorias e métodos AO MESMO TEMPO
    console.log("Buscando transações, categorias e métodos simultaneamente...");
    const [documentosDeTransacoes, categoriasDocs, metodosDocs] =
      await Promise.all([
        Transacao.buscarTodas(), // Chama o método da sua classe
        Categoria.buscarTodas(), // Chama o método da sua classe
        Metodo.buscarTodos(), // Chama o método da sua classe
      ]);
    console.log(
      `Dados recebidos: ${documentosDeTransacoes.length} transações, ${categoriasDocs.length} categorias, ${metodosDocs.length} métodos.`
    );

    if (documentosDeTransacoes.length === 0) {
      console.log("Nenhuma transação encontrada no banco de dados.");
      // Você pode adicionar uma mensagem na tabela aqui, se quiser
      // corpoTabela.innerHTML = '<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>';
      return;
    }

    // 2. Cria os mapas de consulta para traduzir IDs em Nomes
    const mapaCategorias = new Map(
      categoriasDocs.map((doc) => [doc.id, doc.data().nome])
    );
    const mapaMetodos = new Map(
      metodosDocs.map((doc) => [doc.id, doc.data().nome])
    );

    // 3. Itera sobre os documentos de transações e popula a tabela (seu código original aqui está perfeito)
    documentosDeTransacoes.forEach((doc) => {
      const transacao = doc.data();
      const nomeCategoria =
        mapaCategorias.get(transacao.idCategoria) || "Não encontrada";
      const nomeMetodo = mapaMetodos.get(transacao.idMetodo) || "-";

      const novaLinha = document.createElement("tr");
      novaLinha.dataset.id = doc.id; // Importante para o futuro (editar/excluir)

      const classeValor =
        transacao.tipo === "Entrada" ? "valorEntrada" : "valorSaida";
      const valorFormatado = transacao.valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const dataFormatada = new Date(
        transacao.data + "T00:00:00"
      ).toLocaleDateString("pt-BR");

      novaLinha.innerHTML = `
        <td>${dataFormatada}</td>
        <td class="${classeValor}">${valorFormatado}${
        transacao.gastoFixo && transacao.tipo === "Saída" ? "*" : ""
      }</td>
        <td>${nomeMetodo}</td>
        <td>${nomeCategoria}</td>
        <td>${transacao.descricao}</td>
      `;
      corpoTabela.appendChild(novaLinha);
    });
  } catch (error) {
    console.error("Erro ao carregar e exibir transações:", error);
    alert("Não foi possível carregar o histórico de transações.");
  }
}
// --- LÓGICA DE INTERFACE (Botões Entrada/Saída, Formatação de Valor) ---
function ajustarInterfacePorTipoMovimentacao() {
  const categoriaSelect = document.getElementById("categoria");
  if (tipoMovimentacao === "Saída") {
    btSaida.classList.add("active");
    btEntrada.classList.remove("active");
    carregarCategorias("categoria", "saida");
    metodoInput.classList.remove("hidden");
    descricaoInput.classList.remove("hidden");
    labelGastoFixo.classList.remove("hidden");
    if (categoriaSelect) categoriaSelect.classList.remove("margem");
  } else {
    // Entrada
    btEntrada.classList.add("active");
    btSaida.classList.remove("active");
    carregarCategorias("categoria", "entrada");
    metodoInput.classList.add("hidden");
    descricaoInput.classList.add("hidden");
    labelGastoFixo.classList.add("hidden");
    if (categoriaSelect) categoriaSelect.classList.add("margem");
  }
}
// Adicione esta função reutilizável ao seu script.js
function formatarCampoComoMoeda(event) {
  const input = event.target; // Pega o campo que disparou o evento (seja o #valor ou o #edit-valor)
  let numeros = input.value.replace(/\D/g, ""); // Remove tudo que não for dígito

  if (numeros === "") {
    input.value = "";
    return;
  }

  // Limite de 9 dígitos para evitar valores absurdos (até 9.999.999,99)
  if (numeros.length > 9) numeros = numeros.slice(0, 9);

  // Converte para número e formata como moeda brasileira
  const valorNumero = parseFloat(numeros) / 100;
  const valorFormatado = valorNumero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  input.value = valorFormatado;

  // Coloca o cursor no fim (funciona para qualquer input)
  const len = input.value.length;
  if (input.setSelectionRange) {
    // Verifica se o método existe
    input.setSelectionRange(len, len);
  }
}

btSaida.addEventListener("click", () => {
  if (tipoMovimentacao !== "Saída") {
    tipoMovimentacao = "Saída";
    ajustarInterfacePorTipoMovimentacao();
  }
});

btEntrada.addEventListener("click", () => {
  if (tipoMovimentacao !== "Entrada") {
    tipoMovimentacao = "Entrada";
    ajustarInterfacePorTipoMovimentacao();
  }
});

valorInput.addEventListener("input", (e) => {
  let valor = e.target.value.replace(/\D/g, "");
  valor = (parseFloat(valor) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  e.target.value = valor;
});
// --- SUBMISSÃO DO FORMULÁRIO ---
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Coleta dos dados
  const valorBruto = document.getElementById("valor").value;
  const valor = parseFloat(valorBruto.replace(/[^\d,]/g, "").replace(",", "."));
  const gastoFixo = document.getElementById("gastoFixo").checked;
  const descricao = document.getElementById("descricao").value;
  const data = document.getElementById("data").value;
  const categoriaId = document.getElementById("categoria").value;
  const metodoId = document.getElementById("metodo").value;

  // Validações
  if (isNaN(valor) || valor <= 0)
    return alert("Digite um valor numérico válido!");
  if (!data || !categoriaId)
    return alert("Preencha os campos Data e Categoria!");
  if (tipoMovimentacao === "Saída" && (!metodoId || !descricao))
    return alert("Para Saída, preencha Método e Descrição!");

  // Monta o objeto com os dados para salvar
  const dadosParaSalvar = {
    valor: valor,
    gastoFixo: tipoMovimentacao === "Saída" ? gastoFixo : false,
    descricao: tipoMovimentacao === "Saída" ? descricao : "-",
    data: data,
    tipo: tipoMovimentacao,
    idCategoria: categoriaId,
    idMetodo: tipoMovimentacao === "Saída" ? metodoId : null,
  };

  try {
    // Chama o método estático da classe Transacao para salvar
    await Transacao.salvar(dadosParaSalvar);
    alert("Transação salva com sucesso!");

    // Atualiza a tabela com a nova transação
    await carregarTransacoes();

    // Limpa e reseta o formulário
    form.reset();
    document.getElementById("data").value = new Date()
      .toISOString()
      .split("T")[0];
    tipoMovimentacao = "Saída";
    ajustarInterfacePorTipoMovimentacao();
  } catch (e) {
    console.error("Erro no processo de salvamento:", e);
    alert("Erro ao salvar a transação.");
  }
});

window.addEventListener("DOMContentLoaded", () => {
  console.log("Página carregada. Iniciando aplicação...");

  // Define a data inicial
  document.getElementById("data").value = new Date()
    .toISOString()
    .split("T")[0];

  // Carrega dados dos dropdowns
  carregarCategorias("categoria", "saida"); // Filtro inicial para 'saida'
  carregarMetodos("metodo");

  ajustarInterfacePorTipoMovimentacao();

  // Carrega os dados para os dropdowns DO MODAL DE EDIÇÃO
  // No modal, queremos TODAS as categorias e métodos disponíveis para o usuário poder trocar.
  carregarCategorias("edit-categoria", null); // 'null' para não filtrar por tipo
  carregarMetodos("edit-metodo");

  // Carrega o histórico de transações na tabela
  carregarTransacoes();
});

corpoTabela.addEventListener("click", (event) => {
  // A partir do alvo do clique (ex: uma <td>),
  // encontramos o elemento <tr> pai mais próximo que tenha um 'data-id'
  const linhaClicada = event.target.closest("tr[data-id]");

  if (linhaClicada) {
    // Se uma linha válida foi clicada, pegamos o ID que armazenamos nela
    const transacaoId = linhaClicada.dataset.id;
    console.log("Clique detectado na linha da transação com ID:", transacaoId);

    // --- PRÓXIMOS PASSOS VÊM AQUI ---
    // 1. Abrir a "telinha" (modal) de edição.
    abrirModalDeEdicao(transacaoId);
    // 2. Usar o 'transacaoId' para buscar os dados completos dessa transação no Firestore.
    // 3. Preencher os campos da telinha de edição com esses dados.

    // alert(
    //   `Você clicou na transação com ID: ${transacaoId}. Aqui abriríamos o modal de edição!`
    // );
  }
});

async function abrirModalDeEdicao(transacaoId) {
  // Pega os elementos do modal
  const modalContainer = document.getElementById("edit-modal-container");
  if (!modalContainer) {
    console.error("Container do modal de edição não encontrado!");
    return;
  }

  try {
    // 1. BUSCAR OS DADOS DA TRANSAÇÃO ESPECÍFICA NO FIREBASE
    console.log(`Buscando dados da transação com ID: ${transacaoId}`);
    const transacaoRef = doc(db, "transacao", transacaoId); // Cria a referência para o documento
    const docSnap = await getDoc(transacaoRef); // Busca o documento

    if (docSnap.exists()) {
      const transacao = docSnap.data();
      console.log("Dados da transação encontrados:", transacao);

      // 2. PREENCHER OS CAMPOS DO MODAL COM OS DADOS ENCONTRADOS
      document.getElementById("edit-data").value = transacao.data;
      // Para o valor, precisamos formatá-lo como R$ novamente
      document.getElementById("edit-valor").value =
        transacao.valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      document.getElementById("edit-gastoFixo").checked = transacao.gastoFixo;
      document.getElementById("edit-descricao").value = transacao.descricao;

      // Para os selects, precisamos pré-selecionar a opção correta
      document.getElementById("edit-categoria").value = transacao.idCategoria;
      document.getElementById("edit-metodo").value = transacao.idMetodo;

      // Guarda o ID no campo escondido para usar ao salvar as alterações
      document.getElementById("edit-transacao-id").value = transacaoId;

      // Se for uma entrada, alguns campos são ocultos
      if (transacao.tipo === "Entrada") {
        document.getElementById("edit-gastoFixoLabel").classList.add("hidden");
        document.getElementById("edit-descricao").classList.add("hidden");
        document.getElementById("edit-metodo").classList.add("hidden");
      } else {
        document
          .getElementById("edit-gastoFixoLabel")
          .classList.remove("hidden");
        document.getElementById("edit-descricao").classList.remove("hidden");
        document.getElementById("edit-metodo").classList.remove("hidden");
      }

      // 3. MOSTRAR O MODAL
      modalContainer.classList.remove("hidden");
    } else {
      console.error("Nenhum documento encontrado com o ID fornecido!");
      alert("Erro: Não foi possível encontrar os dados desta transação.");
    }
  } catch (error) {
    console.error("Erro ao buscar ou preencher dados da transação:", error);
    alert("Ocorreu um erro ao abrir a edição.");
  }
}

if (formEdicao) {
  formEdicao.addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o recarregamento da página

    // 1. Coleta os dados dos campos do modal de edição
    const transacaoId = document.getElementById("edit-transacao-id").value;
    if (!transacaoId) {
      return alert("Erro: ID da transação não encontrado.");
    }

    const data = document.getElementById("edit-data").value;
    const valorBruto = document.getElementById("edit-valor").value;
    const gastoFixo = document.getElementById("edit-gastoFixo").checked;
    const descricao = document.getElementById("edit-descricao").value;
    const idCategoria = document.getElementById("edit-categoria").value;
    const idMetodo = document.getElementById("edit-metodo").value;

    // Validação e formatação do valor
    const valor = parseFloat(
      valorBruto.replace(/[^\d,]/g, "").replace(",", ".")
    );
    if (isNaN(valor) || valor <= 0) {
      return alert("O valor inserido é inválido.");
    }
    // Adicione outras validações que achar necessárias...

    // 2. Monta um objeto SOMENTE com os dados que podem ser atualizados
    const dadosAtualizados = {
      data: data,
      valor: valor,
      gastoFixo: gastoFixo,
      descricao: descricao,
      idCategoria: idCategoria,
      idMetodo: idMetodo,
      // Note que não incluímos 'tipo', pois geralmente não se muda o tipo de uma transação (de entrada para saída)
    };

    try {
      // 3. Chama o método da classe Transacao para fazer a atualização
      await Transacao.atualizar(transacaoId, dadosAtualizados);

      alert("Alterações salvas com sucesso!");

      // 4. Fecha o modal e atualiza a tabela na tela principal
      document.getElementById("edit-modal-container").classList.add("hidden");
      await carregarTransacoes(); // Recarrega a tabela para mostrar os dados atualizados
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      alert("Não foi possível salvar as alterações.");
    }
  });
}
