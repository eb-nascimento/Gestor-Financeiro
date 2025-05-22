import { Metodo } from "./metodo.js";
import { Categoria } from "./categoria.js";
import { Transacao } from "./transacao.js";

//BOTÃO ENTRADA/SAÍDA------------------------------------------------------------------------
const btSaida = document.getElementById("btSaida");
const btEntrada = document.getElementById("btEntrada");
const metodoInput = document.getElementById("metodo");
const descricaoInput = document.getElementById("descricao");

let tipoMovimentacao = "Saída";

btSaida.classList.add("active"); //BOTÃO ATIVO

btSaida.addEventListener("click", function () {
  tipoMovimentacao = "Saída";
  btSaida.classList.add("active");
  btEntrada.classList.remove("active");

  //MOSTRAR CATEGORIA E DESCRIÇÃO
  metodoInput.classList.remove("hidden");
  descricaoInput.classList.remove("hidden");

  console.log(tipoMovimentacao);
});

btEntrada.addEventListener("click", function () {
  tipoMovimentacao = "Entrada";
  btEntrada.classList.add("active");
  btSaida.classList.remove("active");

  metodoInput.classList.add("hidden");
  descricaoInput.classList.add("hidden");

  console.log(tipoMovimentacao);
});

//BOTÃO SALVAR-------------------------------------------------------------------------------
const form = document.getElementById("campos");
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Impede o recarregamento do formulário

  const valor = parseFloat(document.getElementById("valor").value);
  const descricao = document.getElementById("descricao").value;
  const data = document.getElementById("data").value;
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

  console.log(valor, descricao, data, categoria, metodo);
  //Limpar os campos do formulário
  form.reset();

  //CRIAR NOVA LINHA NA TABELA
  novaLinha.innerHTML = `
    <td>${data}</td>
    <td class = "${classeValor}">${valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}</td>
    <td>${tipoMovimentacao === "Saída" ? metodo : "-"}</td>
    <td>${categoria}</td>
    <td>${tipoMovimentacao === "Saída" ? descricao : "-"}</td>
  `;

  corpoTabela.appendChild(novaLinha);
});
