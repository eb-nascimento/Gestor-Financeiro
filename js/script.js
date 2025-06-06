// Imports das suas classes locais
import { Metodo } from "./metodo.js";
import { Categoria } from "./categoria.js";
import { Transacao } from "./transacao.js";

// Import da instância 'db' do seu arquivo firebase.js
import { db } from "./firebase.js";

// Imports de funções específicas do Firestore SDK que você usará no script.js
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc, // << VERIFIQUE SE ESTÁ AQUI
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// BOTÃO ENTRADA/SAÍDA------------------------------------------------------------------------
async function carregarCategorias(tipoFiltro = null) {
  console.log(
    `1. Função carregarCategorias iniciada. Filtro de tipo: ${tipoFiltro}`
  );
  const categoriaSelect = document.getElementById("categoria");

  if (!categoriaSelect) return;

  categoriaSelect.innerHTML =
    '<option value="">Selecione uma categoria</option>';

  try {
    const documentosDeCategorias = await Categoria.buscarTodas(tipoFiltro);

    if (documentosDeCategorias.length === 0) {
      console.warn(
        `Nenhuma categoria encontrada para o filtro '${tipoFiltro}'.`
      );
    }

    documentosDeCategorias.forEach((doc) => {
      const categoriaData = doc.data();
      const option = document.createElement("option");
      option.value = doc.id; // O valor da opção será o ID do documento no Firestore
      option.textContent = categoriaData.nome; // O texto visível será o nome da categoria
      categoriaSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
    alert(
      "Ocorreu um erro ao carregar as categorias. Verifique o console para mais detalhes."
    );
  }
}

async function carregarMetodos() {
  console.log("Populando dropdown de métodos...");
  const metodoSelect = document.getElementById("metodo");

  if (!metodoSelect) return;

  metodoSelect.innerHTML = '<option value="">Selecione um método</option>';

  try {
    // 1. CHAMA O MÉTODO ESTÁTICO DA CLASSE METODO
    const documentosDeMetodos = await Metodo.buscarTodos();

    // 2. USA O RESULTADO PARA POPULAR O DOM
    if (documentosDeMetodos.length === 0) {
      console.warn("Nenhum método encontrado.");
    }

    documentosDeMetodos.forEach((doc) => {
      const metodoData = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = metodoData.nome;
      metodoSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar e popular métodos na interface:", error);
    alert("Não foi possível carregar os métodos.");
  }
}

// E não se esqueça de chamar a nova função dentro do seu listener DOMContentLoaded:
window.addEventListener("DOMContentLoaded", () => {
  console.log("A. Evento DOMContentLoaded disparado.");

  // 1. Preencher a data (uma vez)
  const inputDataHoje = document.getElementById("data");
  if (inputDataHoje && !inputDataHoje.value) {
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split("T")[0];
    inputDataHoje.value = dataFormatada;
  }

  // 2. Carregar dropdowns com filtro inicial para "Saída"
  carregarCategorias("saida"); // MODIFICADO: Chama com filtro "saida"
  carregarMetodos();
});

//BOTÃO ENTRADA/SAÍDA------------------------------------------------------------------------
const btSaida = document.getElementById("btSaida");
const label = document.getElementById("gastoFixoLabel");
const btEntrada = document.getElementById("btEntrada");
const metodoInput = document.getElementById("metodo");
const descricaoInput = document.getElementById("descricao");

let tipoMovimentacao = "Saída";
// Ao carregar a página, preencher o campo data com a data de hoje
const inputData = document.getElementById("data");
const hoje = new Date();
const dataFormatada = hoje.toISOString().split("T")[0]; // Formato YYYY-MM-DD
inputData.value = dataFormatada;
// Preencher o campo data com a data de hoje
window.addEventListener("DOMContentLoaded", () => {
  const inputData = document.getElementById("data");
  const hoje = new Date();
  const dataFormatada = hoje.toISOString().split("T")[0];
  inputData.value = dataFormatada;
});
const valorInput = document.getElementById("valor");

valorInput.addEventListener("input", (e) => {
  let numeros = e.target.value.replace(/\D/g, ""); // Só dígitos

  if (numeros === "") {
    e.target.value = "";
    return;
  }

  // Limite de 9 dígitos para evitar valores absurdos (até 9.999.999,99)
  if (numeros.length > 9) numeros = numeros.slice(0, 9);

  // Converte centavos → reais mantendo as casas decimais
  const valorNumero = parseFloat(numeros) / 100;

  // Formata como moeda brasileira
  const valorFormatado = valorNumero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Atualiza o campo
  e.target.value = valorFormatado;

  // Coloca o cursor no fim
  const len = e.target.value.length;
  valorInput.setSelectionRange(len, len);
});

// Inicialmente, o botão de saída está ativo
btSaida.classList.add("active"); //BOTÃO ATIVO

btSaida.addEventListener("click", function () {
  tipoMovimentacao = "Saída";
  btSaida.classList.add("active");
  btEntrada.classList.remove("active");

  carregarCategorias("saida"); // MODIFICADO: Chama com filtro "saida"

  metodoInput.classList.remove("hidden");
  descricaoInput.classList.remove("hidden");
  label.classList.remove("hidden");
  const categoriaSelect = document.getElementById("categoria");
  if (categoriaSelect) {
    categoriaSelect.classList.remove("margem");
  }
  console.log(tipoMovimentacao);
});

btEntrada.addEventListener("click", function () {
  tipoMovimentacao = "Entrada";
  btEntrada.classList.add("active");
  btSaida.classList.remove("active");

  carregarCategorias("entrada"); // SUGESTÃO: Chama com filtro "entrada" (confirme se é isso)

  metodoInput.classList.add("hidden"); // Método oculto para Entrada (conforme sua última decisão)
  descricaoInput.classList.add("hidden");
  label.classList.add("hidden");
  const categoriaSelect = document.getElementById("categoria");
  if (categoriaSelect) {
    categoriaSelect.classList.add("margem");
  }
  console.log(tipoMovimentacao);
});

//BOTÃO SALVAR-------------------------------------------------------------------------------
const form = document.getElementById("campos");

// Lembre-se de garantir que 'addDoc' está importado no topo do seu script.js

form.addEventListener("submit", async function (event) {
  // Mantenha 'async'
  event.preventDefault();

  // --- COLETA E VALIDAÇÃO DE DADOS (Usando seus nomes de variáveis) ---
  let valorBruto = document.getElementById("valor").value;
  let valor = parseFloat(
    valorBruto.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
  );
  if (isNaN(valor) || valor <= 0) {
    alert("Digite um valor numérico válido!");
    return;
  }
  const checkbox = document.getElementById("gastoFixo");
  const gastoFixo = checkbox.checked;
  const descricao = document.getElementById("descricao").value;
  const data = document.getElementById("data").value;

  const regexData = /^\d{4}-\d{2}-\d{2}$/;
  if (!regexData.test(data)) {
    alert("Data inválida! Use o formato AAAA-MM-DD.");
    return;
  }

  // Pegando os IDs dos selects com seus nomes de variáveis originais
  const categoria = document.getElementById("categoria").value;
  const metodo = document.getElementById("metodo").value;

  // Validações
  if (!data || !valor || !categoria) {
    // Usa a variável 'categoria'
    alert("Preencha os campos Data, Valor e Categoria!");
    return;
  }
  if (tipoMovimentacao === "Saída") {
    if (!metodo || !descricao) {
      // Usa as variáveis 'metodo' e 'descricao'
      alert("Para Saída, preencha Método e Descrição!");
      return;
    }
  }

  // --- CRIAÇÃO DO OBJETO TRANSAÇÃO (Usando seus nomes de variáveis) ---
  const novaTransacao = new Transacao(
    valor,
    tipoMovimentacao === "Saída" ? gastoFixo : false,
    tipoMovimentacao === "Saída" ? descricao : "-",
    data,
    undefined,
    undefined,
    tipoMovimentacao,
    categoria, // << CORRIGIDO: Usando sua variável 'categoria'
    tipoMovimentacao === "Saída" ? metodo : null // << CORRIGIDO: Usando sua variável 'metodo'
  );

  const transacaoParaSalvar = { ...novaTransacao };

  // --- SALVAR NO FIREBASE ---
  try {
    const docRef = await addDoc(
      collection(db, "transacao"),
      transacaoParaSalvar
    );
    console.log("Transação salva com ID no Firestore: ", docRef.id);
    alert("Transação salva com sucesso!");

    // --- ATUALIZAR INTERFACE APÓS SUCESSO ---
    const corpoTabela = document.getElementById("tabelaMovimentacoes");
    const novaLinha = document.createElement("tr");
    const classeValor =
      tipoMovimentacao === "Entrada" ? "valorEntrada" : "valorSaida";

    const nomeCategoria =
      document.getElementById("categoria").selectedOptions[0]?.textContent ||
      categoria;
    const nomeMetodo =
      tipoMovimentacao === "Saída"
        ? document.getElementById("metodo").selectedOptions[0]?.textContent ||
          metodo
        : "-";
    const valorFormatado = valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    novaLinha.innerHTML = `
      <td>${new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
      <td class="${classeValor}">${valorFormatado}${
      tipoMovimentacao === "Saída" && gastoFixo ? "*" : ""
    }</td>
      <td>${nomeMetodo}</td>
      <td>${nomeCategoria}</td>
      <td>${tipoMovimentacao === "Saída" && descricao ? descricao : "-"}</td>
    `;
    corpoTabela.appendChild(novaLinha);

    form.reset();
    document.getElementById("data").value = new Date()
      .toISOString()
      .split("T")[0];
    tipoMovimentacao = "Saída";

    // Reajustar a interface para o estado padrão "Saída"
    btSaida.classList.add("active");
    btEntrada.classList.remove("active");
    carregarCategorias("saida");
    metodoInput.classList.remove("hidden");
    descricaoInput.classList.remove("hidden");
    const labelGastoFixo = document.getElementById("gastoFixoLabel");
    if (labelGastoFixo) labelGastoFixo.classList.remove("hidden");

    const categoriaSelect = document.getElementById("categoria");
    if (categoriaSelect) categoriaSelect.classList.remove("margem");
  } catch (e) {
    console.error("Erro ao salvar transação no Firestore: ", e);
    alert("Erro ao salvar transação. Verifique o console.");
  }
});
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------
