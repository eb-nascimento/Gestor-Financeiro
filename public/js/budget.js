import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// =================================================================
// VARIÁVEIS DE ESTADO GLOBAIS
// =================================================================
let currentUser;
let categoriasCache = [];
let metodosCache = [];
let dataAtual = new Date(); // Começa com a data de hoje

// =================================================================
// INICIALIZAÇÃO
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await carregarDadosIniciais();
      await carregarDadosDoOrcamento();
      adicionarEventListenersGlobais();
    } else {
      window.location.href = "login.html";
    }
  });
});

async function carregarDadosIniciais() {
  try {
    const categoriasQuery = query(collection(db, "categoria"), orderBy("nome"));
    const metodosQuery = query(collection(db, "metodo"), orderBy("nome"));

    const [categoriasSnapshot, metodosSnapshot] = await Promise.all([
      getDocs(categoriasQuery),
      getDocs(metodosQuery),
    ]);

    categoriasCache = categoriasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    metodosCache = metodosSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(
      "Erro ao carregar dados iniciais (categorias/métodos):",
      error
    );
  }
}

// =================================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// =================================================================
async function carregarDadosDoOrcamento() {
  if (!currentUser) return;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth(); // 0-11
  const mesAnoString = `${ano}-${(mes + 1).toString().padStart(2, "0")}`;

  document.querySelector(".span-titulo").textContent =
    formatarMes(mesAnoString);

  try {
    const [transacoes, orcamentos] = await Promise.all([
      buscarTransacoesDoMes(ano, mes), // Função corrigida
      buscarOrcamentosDoMes(mesAnoString),
    ]);

    const totalSaidas = transacoes
      .filter((t) => t.tipo === "Saída")
      .reduce((acc, t) => acc + t.valor, 0);
    const totalOrcamentado = orcamentos
      .filter((o) => {
        const cat = categoriasCache.find((c) => c.id === o.idCategoria);
        return cat && cat.tipo === "saida";
      })
      .reduce((acc, o) => acc + o.valorPrevisto, 0);

    const elSaida = document.querySelector("#valorSaida h2:last-child");
    const elOrcado = document.querySelector("#valorOrçado h2:last-child");

    if (elSaida) elSaida.textContent = formatarMoeda(totalSaidas);
    if (elOrcado) elOrcado.textContent = formatarMoeda(totalOrcamentado);

    preencherTabelaOrcamento("despesa", orcamentos, transacoes);
    preencherTabelaOrcamento("economia", orcamentos, transacoes);
    preencherTabelaOrcamento("receita", orcamentos, transacoes);
    preencherTabelaMetodos(transacoes);
  } catch (error) {
    console.error("Erro ao carregar dados do orçamento:", error);
  }
}

// =================================================================
// FUNÇÃO CORRIGIDA
// =================================================================
async function buscarTransacoesDoMes(ano, mes) {
  // Cria o primeiro dia do mês selecionado
  const dataInicio = new Date(ano, mes, 1);
  // Cria o primeiro dia do mês SEGUINTE
  const dataFim = new Date(ano, mes + 1, 1);

  // Formata para o padrão YYYY-MM-DD que o Firestore entende
  const inicioString = dataInicio.toISOString().slice(0, 10);
  const fimString = dataFim.toISOString().slice(0, 10);

  const q = query(
    collection(db, "transacao"),
    where("userId", "==", currentUser.uid),
    where("data", ">=", inicioString), // Maior ou igual ao primeiro dia do mês
    where("data", "<", fimString) // Menor que o primeiro dia do mês seguinte
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

async function buscarOrcamentosDoMes(mesAno) {
  const q = query(
    collection(db, "orcamentos"),
    where("userId", "==", currentUser.uid),
    where("mes", "==", mesAno)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// =================================================================
// FUNÇÕES DE RENDERIZAÇÃO E UI (O RESTO DO CÓDIGO PERMANECE IGUAL)
// =================================================================
function preencherTabelaOrcamento(tipoTabela, orcamentos, transacoes) {
  const seletorTabela = {
    despesa: "#corpoTabelaDespesas",
    economia: "#corpoTabelaEconomias",
    receita: "#corpoTabelaReceitas",
  };
  const corpoTabela = document.querySelector(seletorTabela[tipoTabela]);
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";

  const transacoesPorCategoria = transacoes.reduce((acc, t) => {
    if (!acc[t.idCategoria]) acc[t.idCategoria] = 0;
    acc[t.idCategoria] += t.valor;
    return acc;
  }, {});

  const categoriasDoTipo = categoriasCache.filter((c) => {
    const ehEconomia =
      c.nome === "Investimentos" || c.nome === "Reserva de Emergência";
    if (tipoTabela === "receita") return c.tipo === "entrada";
    if (tipoTabela === "economia") return c.tipo === "saida" && ehEconomia;
    if (tipoTabela === "despesa") return c.tipo === "saida" && !ehEconomia;
    return false;
  });

  categoriasDoTipo.forEach((categoria) => {
    const orcamentoItem = orcamentos.find(
      (o) => o.idCategoria === categoria.id
    );
    const totalRealizado = transacoesPorCategoria[categoria.id] || 0;

    if (orcamentoItem || totalRealizado > 0) {
      const linha = document.createElement("tr");
      const valorPrevisto = orcamentoItem ? orcamentoItem.valorPrevisto : 0;
      const orcamentoId = orcamentoItem
        ? orcamentoItem.id
        : `new-${categoria.id}`;

      linha.innerHTML = `
        <td>${categoria.nome}</td>
        <td class="td-input"><input type="text" class="input-orcamento" data-id="${orcamentoId}" data-categoria-id="${
        categoria.id
      }" value="${formatarMoeda(valorPrevisto)}"></td>
        <td>${formatarMoeda(totalRealizado)}</td>
      `;
      corpoTabela.appendChild(linha);
    }
  });

  if (corpoTabela.innerHTML === "") {
    corpoTabela.innerHTML = `<tr><td colspan="3">Nenhum dado para este mês.</td></tr>`;
  }

  corpoTabela.querySelectorAll(".input-orcamento").forEach((input) => {
    input.addEventListener("blur", salvarValorOrcamento);
    input.addEventListener(
      "keypress",
      (e) => e.key === "Enter" && input.blur()
    );
    input.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      valor = (parseFloat(valor) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      e.target.value = valor;
    });
  });
}

function preencherTabelaMetodos(transacoes) {
  const corpoTabela = document.getElementById("corpoTabelaMetodos");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";

  const gastosPorMetodo = transacoes
    .filter((t) => t.tipo === "Saída" && t.idMetodo)
    .reduce((acc, t) => {
      if (!acc[t.idMetodo]) acc[t.idMetodo] = 0;
      acc[t.idMetodo] += t.valor;
      return acc;
    }, {});

  if (Object.keys(gastosPorMetodo).length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="3">Nenhum gasto no mês.</td></tr>`;
    return;
  }

  for (const idMetodo in gastosPorMetodo) {
    const metodo = metodosCache.find((m) => m.id === idMetodo);
    corpoTabela.innerHTML += `<tr><td>${
      metodo ? metodo.nome : "Desconhecido"
    }</td><td>${formatarMoeda(gastosPorMetodo[idMetodo])}</td><td>-</td></tr>`;
  }
}

// =================================================================
// MANIPULADORES DE EVENTOS
// =================================================================
function adicionarEventListenersGlobais() {
  document.querySelectorAll(".troca-mes").forEach((button) => {
    button.addEventListener("click", () =>
      mudarMes(parseInt(button.dataset.direction, 10))
    );
  });

  document.querySelectorAll(".adicionar-btn").forEach((button) => {
    button.addEventListener("click", () => {
      alert(
        "Para adicionar um item ao relatório, basta registar uma transação nessa categoria. Para definir um orçamento, edite o campo na tabela."
      );
    });
  });
}

async function salvarValorOrcamento(event) {
  const input = event.target;
  let orcamentoId = input.dataset.id;
  const categoriaId = input.dataset.categoriaId;
  const valorString = input.value.replace(/\D/g, "");
  const novoValor = parseFloat(valorString) / 100;

  if (isNaN(novoValor)) {
    alert("Valor inválido");
    carregarDadosDoOrcamento();
    return;
  }
  input.value = formatarMoeda(novoValor);

  const categoria = categoriasCache.find((c) => c.id === categoriaId);
  const mesAno = dataAtual.toISOString().slice(0, 7);

  try {
    if (orcamentoId.startsWith("new-")) {
      const novoDocRef = await addDoc(collection(db, "orcamentos"), {
        userId: currentUser.uid,
        mes: mesAno,
        idCategoria: categoriaId,
        valorPrevisto: novoValor,
        tipo: categoria.tipo,
      });
      orcamentoId = novoDocRef.id;
      input.dataset.id = orcamentoId;
    } else {
      await setDoc(
        doc(db, "orcamentos", orcamentoId),
        { valorPrevisto: novoValor },
        { merge: true }
      );
    }

    input.style.borderColor = "green";
    setTimeout(() => {
      input.style.borderColor = "";
    }, 2000);
    await carregarDadosDoOrcamento();
  } catch (error) {
    console.error("Erro ao salvar:", error);
    input.style.borderColor = "red";
  }
}

function mudarMes(direcao) {
  dataAtual.setMonth(dataAtual.getMonth() + direcao);
  carregarDadosDoOrcamento();
}

// =================================================================
// FUNÇÕES UTILITÁRIAS
// =================================================================
function formatarMoeda(valor) {
  return (valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarMes(mesAno) {
  const [ano, mes] = mesAno.split("-");
  const data = new Date(ano, mes - 1);
  const nomeMes = data.toLocaleString("pt-BR", { month: "short" });
  const anoCurto = data.getFullYear().toString().slice(-2);
  const mesFormatado =
    nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1).replace(".", "");
  return `${mesFormatado}/${anoCurto}`;
}
