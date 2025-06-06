// Imports das suas classes locais (onde a lógica de dados agora reside)
import { Metodo } from "./metodo.js";
import { Categoria } from "./categoria.js";
import { Transacao } from "./transacao.js";

// --- CONSTANTES DOS ELEMENTOS DO FORMULÁRIO ---
const btSaida = document.getElementById("btSaida");
const btEntrada = document.getElementById("btEntrada");
const metodoInput = document.getElementById("metodo");
const descricaoInput = document.getElementById("descricao");
const labelGastoFixo = document.getElementById("gastoFixoLabel");
const valorInput = document.getElementById("valor");
const form = document.getElementById("campos");
let tipoMovimentacao = "Saída"; // Define o tipo padrão

// --- FUNÇÕES DE INTERFACE (População de Dropdowns e Tabela) ---

// Função para popular o dropdown de CATEGORIAS
async function carregarCategorias(tipoFiltro = null) {
  const categoriaSelect = document.getElementById("categoria");
  if (!categoriaSelect) return;
  categoriaSelect.innerHTML =
    '<option value="">Selecione uma categoria</option>';
  try {
    const documentos = await Categoria.buscarTodas(tipoFiltro);
    documentos.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = doc.data().nome;
      categoriaSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar categorias na interface:", error);
    alert("Não foi possível carregar as categorias.");
  }
}

// Função para popular o dropdown de MÉTODOS
async function carregarMetodos() {
  const metodoSelect = document.getElementById("metodo");
  if (!metodoSelect) return;
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
    console.error("Erro ao carregar métodos na interface:", error);
    alert("Não foi possível carregar os métodos.");
  }
}

// Função para popular a TABELA de TRANSAÇÕES
async function carregarTransacoes() {
  const corpoTabela = document.getElementById("tabelaMovimentacoes");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";

  try {
    const documentos = await Transacao.buscarTodas(); // Chama o método da classe
    if (documentos.length === 0) {
      console.log("Nenhuma transação encontrada no banco de dados.");
      return;
    }

    // Para traduzir IDs em nomes, precisamos dos mapas. Vamos buscá-los aqui.
    // (Esta parte pode ser otimizada, mas para clareza, vamos mantê-la simples por enquanto)
    const [categoriasDocs, metodosDocs] = await Promise.all([
      Categoria.buscarTodas(),
      Metodo.buscarTodos(),
    ]);
    const mapaCategorias = new Map(
      categoriasDocs.map((doc) => [doc.id, doc.data().nome])
    );
    const mapaMetodos = new Map(
      metodosDocs.map((doc) => [doc.id, doc.data().nome])
    );

    documentos.forEach((doc) => {
      const transacao = doc.data();
      const nomeCategoria =
        mapaCategorias.get(transacao.idCategoria) || "Não encontrada";
      const nomeMetodo = mapaMetodos.get(transacao.idMetodo) || "-";

      const novaLinha = document.createElement("tr");
      novaLinha.dataset.id = doc.id;
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
    carregarCategorias("saida");
    metodoInput.classList.remove("hidden");
    descricaoInput.classList.remove("hidden");
    labelGastoFixo.classList.remove("hidden");
    if (categoriaSelect) categoriaSelect.classList.remove("margem");
  } else {
    // Entrada
    btEntrada.classList.add("active");
    btSaida.classList.remove("active");
    carregarCategorias("entrada");
    metodoInput.classList.add("hidden");
    descricaoInput.classList.add("hidden");
    labelGastoFixo.classList.add("hidden");
    if (categoriaSelect) categoriaSelect.classList.add("margem");
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

// --- INICIALIZAÇÃO DA PÁGINA ---
window.addEventListener("DOMContentLoaded", () => {
  console.log("Página carregada. Iniciando aplicação...");

  // Define a data inicial
  document.getElementById("data").value = new Date()
    .toISOString()
    .split("T")[0];

  // Carrega dados dos dropdowns
  carregarMetodos();

  // Configura a interface inicial (para 'Saída') e carrega as categorias filtradas
  ajustarInterfacePorTipoMovimentacao();

  // Carrega e exibe o histórico de transações na tabela
  carregarTransacoes();
});
