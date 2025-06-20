import { Metodo } from "./metodo.js";
import { Categoria } from "./categoria.js";
import { Transacao } from "./transacao.js";
import { db } from "./firebase.js";
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

  //MOSTRAR CATEGORIA E DESCRIÇÃO
  metodoInput.classList.remove("hidden");
  descricaoInput.classList.remove("hidden");
  label.classList.remove("hidden");
  categoria.classList.remove("margem");

  console.log(tipoMovimentacao);
});

btEntrada.addEventListener("click", function () {
  tipoMovimentacao = "Entrada";
  btEntrada.classList.add("active");
  btSaida.classList.remove("active");

  metodoInput.classList.add("hidden");
  descricaoInput.classList.add("hidden");
  label.classList.add("hidden");
  categoria.classList.add("margem");

  console.log(tipoMovimentacao);
});

//BOTÃO SALVAR-------------------------------------------------------------------------------
const form = document.getElementById("campos");
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Impede o recarregamento do formulário

  let valorBruto = document.getElementById("valor").value;
  let valor = parseFloat(
    valorBruto
      .replace("R$", "") // remove o símbolo de moeda
      .replace(/\./g, "") // remove todos os pontos (milhar)
      .replace(",", ".") // troca vírgula decimal por ponto
      .trim()
  );
  if (isNaN(valor) || valor <= 0) {
    alert("Digite um valor numérico válido!");
    return;
  }
  const checkbox = document.getElementById("gastoFixo");
  const gastoFixo = checkbox.checked;
  const descricao = document.getElementById("descricao").value;
  const data = document.getElementById("data").value;
  // Verifica se o valor é uma data válida
  const regexData = /^\d{4}-\d{2}-\d{2}$/;
  if (!regexData.test(data)) {
    alert("Data inválida! Use o formato DD-MM-AAAA.");
    return;
  }
  const categoria = document.getElementById("categoria").value;
  const metodo = document.getElementById("metodo").value;
  const corpoTabela = document.getElementById("tabelaMovimentacoes");
  const novaLinha = document.createElement("tr");
  const classeValor =
    tipoMovimentacao === "Entrada" ? "valorEntrada" : "valorSaida";

  if (tipoMovimentacao === "Saída") {
    if (!metodo || !descricao) {
      alert("Preencha todos os campos!");
      return;
    }
  }

  if (!data || !valor || !categoria) {
    alert("Preencha todos os campos!");
    return;
  }

  console.log(valor, gastoFixo, descricao, data, categoria, metodo);
  //Limpar os campos do formulário
  form.reset();

  //CRIAR NOVA LINHA NA TABELA

  const valorFormatado = valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  // Adicionar a nova transação na tabela
  novaLinha.innerHTML = `
    <td>${data}</td>
    <td class="${classeValor}">${valorFormatado}${gastoFixo ? "*" : ""}</td>
    <td>${tipoMovimentacao === "Saída" ? metodo : "-"}</td>
    <td>${categoria}</td>
    <td>${tipoMovimentacao === "Saída" ? descricao : "-"}</td>
  `;

  corpoTabela.appendChild(novaLinha);
});
