// js/ui.js

// Exporta as referências para os elementos do DOM
export const DOMElements = {
  formPrincipal: document.getElementById("campos"),
  formEdicao: document.getElementById("edit-campos"),
  corpoTabela: document.getElementById("tabelaMovimentacoes"),
  modalContainer: document.getElementById("edit-modal-container"),
  btSaida: document.getElementById("btSaida"),
  btEntrada: document.getElementById("btEntrada"),
  valorInput: document.getElementById("valor"),
  editValorInput: document.getElementById("edit-valor"),
  categoriaSelect: document.getElementById("categoria"),
  metodoSelect: document.getElementById("metodo"),
  editCategoriaSelect: document.getElementById("edit-categoria"),
  editMetodoSelect: document.getElementById("edit-metodo"),
  parcelasContainer: document.getElementById("parcelas-container"),
  parcelasInput: document.getElementById("parcelas"),
  editParcelasContainer: document.getElementById("edit-parcelas-container"),
  editParcelasInput: document.getElementById("edit-parcelas"),
  btExcluir: document.getElementById("btExcluir"),
  closeModalBtn: document.getElementById("close-modal-btn"),
};

/** Formata um campo de input como moeda brasileira (BRL) */
export function formatarCampoComoMoeda(event) {
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

/** Controla a visibilidade do container de parcelas */
export function gerenciarVisibilidadeParcelas(
  selectElement,
  container,
  input,
  mapaMetodos
) {
  const metodoId = selectElement.value;
  const metodo = mapaMetodos.get(metodoId);
  const isCredito = metodo?.forma?.trim().toLowerCase() === "credito";
  container.classList.toggle("hidden", !isCredito);
  if (!isCredito) input.value = 1;
}

/** Atualiza os totais na tela */
export function exibirTotais(transacoes) {
  let totalEntradas = 0,
    totalSaidas = 0;
  transacoes.forEach((transacao) => {
    // Garante que o valor é um número antes de somar
    const valorNumerico = Number(transacao.valor) || 0;
    if (transacao.tipo === "Entrada") totalEntradas += valorNumerico;
    else if (transacao.tipo === "Saída") totalSaidas += valorNumerico;
  });
  const saldoCarteira = totalEntradas - totalSaidas;

  const elementoEntrada = document.querySelector("#valorEntrada h2:last-child");
  const elementoSaida = document.querySelector("#valorSaida h2:last-child");
  const elementoCarteira = document.querySelector(
    "#valorCarteira h2:last-child"
  );

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

/** Atualiza um dropdown de categorias com base no tipo (Entrada/Saída) */
export function atualizarDropdownCategorias(
  selectElement,
  tipo,
  mapaCategorias,
  categoriaSelecionadaId = null
) {
  selectElement.innerHTML = '<option value="">Selecione uma categoria</option>';
  const tipoFiltro = tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  mapaCategorias.forEach((data, id) => {
    if (data.tipo?.toLowerCase() === tipoFiltro) {
      selectElement.appendChild(new Option(data.nome, id));
    }
  });
  if (categoriaSelecionadaId) selectElement.value = categoriaSelecionadaId;
}

/** Renderiza a tabela de transações com os dados fornecidos */
export function renderizarTabela(transacoes, mapaCategorias, mapaMetodos) {
  const { corpoTabela } = DOMElements;
  corpoTabela.innerHTML = "";
  if (transacoes.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>`;
    return;
  }
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
    // Garante que o valor é um número antes de formatar
    const valorNumerico = Number(transacao.valor) || 0;
    const valorFormatado = valorNumerico.toLocaleString("pt-BR", {
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
