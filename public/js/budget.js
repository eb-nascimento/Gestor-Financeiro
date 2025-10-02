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
let dataAtual = new Date();

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
}

// =================================================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// =================================================================
async function carregarDadosDoOrcamento() {
  if (!currentUser) return;

  const mesAno = dataAtual.toISOString().slice(0, 7);
  document.querySelector(".span-titulo").textContent = formatarMes(mesAno);

  try {
    const [transacoes, orcamentos] = await Promise.all([
      buscarTransacoesDoMes(mesAno),
      buscarOrcamentosDoMes(mesAno),
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

async function buscarTransacoesDoMes(mesAno) {
  const q = query(
    collection(db, "transacao"),
    where("userId", "==", currentUser.uid),
    where("data", ">=", `${mesAno}-01`),
    where("data", "<=", `${mesAno}-31`)
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
// FUNÇÕES DE RENDERIZAÇÃO E UI
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

  // Cria um mapa de transações por categoria para acesso rápido
  const transacoesPorCategoria = transacoes.reduce((acc, t) => {
    if (!acc[t.idCategoria]) acc[t.idCategoria] = 0;
    acc[t.idCategoria] += t.valor;
    return acc;
  }, {});

  // Filtra as categorias que devem aparecer na tabela (mesmo que não tenham orçamento)
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

    // Só exibe a linha se houver um orçamento para ela OU se houver transações nela
    if (orcamentoItem || totalRealizado > 0) {
      const linha = document.createElement("tr");
      const valorPrevisto = orcamentoItem ? orcamentoItem.valorPrevisto : 0;
      const orcamentoId = orcamentoItem
        ? orcamentoItem.id
        : `new-${categoria.id}`; // ID temporário para novos itens

      linha.innerHTML = `
        <td>${categoria.nome}</td>
        <td><input type="text" class="input-orcamento" data-id="${orcamentoId}" data-categoria-id="${
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
    // Se o item de orçamento ainda não existe, cria um novo
    if (orcamentoId.startsWith("new-")) {
      const novoDocRef = await addDoc(collection(db, "orcamentos"), {
        userId: currentUser.uid,
        mes: mesAno,
        idCategoria: categoriaId,
        valorPrevisto: novoValor,
        tipo: categoria.tipo,
      });
      orcamentoId = novoDocRef.id;
      input.dataset.id = orcamentoId; // Atualiza o ID no input
    } else {
      // Se já existe, apenas atualiza
      await setDoc(
        doc(db, "orcamentos", orcamentoId),
        { valorPrevisto: novoValor },
        { merge: true }
      );
    }

    input.style.borderColor = "green";
    setTimeout(() => {
      input.style.borderColor = "#ccc";
    }, 2000);
    await carregarDadosDoOrcamento(); // Recarrega tudo para atualizar os totais
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
  return data.toLocaleString("pt-BR", { month: "long", year: "numeric" });
}
