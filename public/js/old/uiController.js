/**
 * Calcula os totais de entrada, saída e carteira e atualiza os elementos no HTML.
 * @param {Array} transacoesDocs - Um array de documentos de transação do Firestore.
 */

export function calcularEExibirTotais(transacoesDocs) {
  // Pega os elementos do HTML onde os totais serão exibidos
  const elementoSaida = document.querySelector("#valorSaida h2:last-child");
  const elementoEntrada = document.querySelector("#valorEntrada h2:last-child");
  const elementoCarteira = document.querySelector(
    "#valorCarteira h2:last-child"
  );

  if (!elementoSaida || !elementoEntrada || !elementoCarteira) {
    console.error("Elementos para exibir os totais não foram encontrados!");
    return;
  }

  let totalEntradas = 0;
  let totalSaidas = 0;

  transacoesDocs.forEach((doc) => {
    const transacao = doc.data();
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

  if (elementoCarteira) {
    elementoCarteira.style.color = saldoCarteira < 0 ? "#e74c3c" : "#2ecc71";
  }
}
