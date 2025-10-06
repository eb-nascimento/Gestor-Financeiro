import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Executa o código apenas se encontrar o elemento principal da página de transações
if (document.getElementById("novaMovimentacao")) {
  // =================================================================
  // CONSTANTES GLOBAIS
  // =================================================================
  const formPrincipal = document.getElementById("campos");
  const formEdicao = document.getElementById("edit-campos");
  const corpoTabela = document.getElementById("tabelaMovimentacoes");
  const modalContainer = document.getElementById("edit-modal-container");
  const btSaida = document.getElementById("btSaida");
  const btEntrada = document.getElementById("btEntrada");
  const valorInput = document.getElementById("valor");
  const editValorInput = document.getElementById("edit-valor");
  const categoriaSelect = document.getElementById("categoria");
  const metodoSelect = document.getElementById("metodo");
  const editCategoriaSelect = document.getElementById("edit-categoria");
  const editMetodoSelect = document.getElementById("edit-metodo");
  const parcelasContainer = document.getElementById("parcelas-container");
  const parcelasInput = document.getElementById("parcelas");
  const editParcelasContainer = document.getElementById(
    "edit-parcelas-container"
  );
  const editParcelasInput = document.getElementById("edit-parcelas");
  const btExcluir = document.getElementById("btExcluir");
  const closeModalBtn = document.getElementById("close-modal-btn");

  let tipoMovimentacao = "Saída";
  let mapaCategorias = new Map();
  let mapaMetodos = new Map();

  // =================================================================
  // FUNÇÕES DE UI E FORMATAÇÃO
  // =================================================================
  function formatarCampoComoMoeda(event) {
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

  function calcularEExibirTotais(transacoes) {
    const elementoSaida = document.querySelector("#valorSaida h2:last-child");
    const elementoEntrada = document.querySelector(
      "#valorEntrada h2:last-child"
    );
    const elementoCarteira = document.querySelector(
      "#valorCarteira h2:last-child"
    );
    if (!elementoSaida || !elementoEntrada || !elementoCarteira) return;
    let totalEntradas = 0,
      totalSaidas = 0;
    transacoes.forEach((transacao) => {
      if (transacao.tipo === "Entrada") totalEntradas += transacao.valor;
      else if (transacao.tipo === "Saída") totalSaidas += transacao.valor;
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
    elementoCarteira.style.color = saldoCarteira < 0 ? "#e74c3c" : "#2ecc71";
  }

  function atualizarDropdownCategorias(
    selectElement,
    tipo,
    categoriaSelecionadaId = null
  ) {
    selectElement.innerHTML =
      '<option value="">Selecione uma categoria</option>';
    const tipoFiltro = tipo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    mapaCategorias.forEach((data, id) => {
      if (data.tipo && data.tipo.toLowerCase() === tipoFiltro) {
        selectElement.appendChild(new Option(data.nome, id));
      }
    });
    if (categoriaSelecionadaId) selectElement.value = categoriaSelecionadaId;
  }

  // =================================================================
  // FUNÇÕES DE CARREGAMENTO DE DADOS
  // =================================================================
  async function carregarDadosIniciais(userId) {
    try {
      const [categoriasSnapshot, metodosSnapshot] = await Promise.all([
        getDocs(query(collection(db, "categoria"), orderBy("nome"))),
        getDocs(query(collection(db, "metodo"), orderBy("nome"))),
      ]);
      mapaCategorias.clear();
      mapaMetodos.clear();
      categoriasSnapshot.docs.forEach((doc) =>
        mapaCategorias.set(doc.id, doc.data())
      );
      metodosSnapshot.docs.forEach((doc) =>
        mapaMetodos.set(doc.id, { id: doc.id, ...doc.data() })
      );

      metodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
      editMetodoSelect.innerHTML = `<option value="">Selecione um método</option>`;
      mapaMetodos.forEach((data) => {
        if (data.tipo === "saida") {
          const option = new Option(data.nome, data.id);
          metodoSelect.appendChild(option.cloneNode(true));
          editMetodoSelect.appendChild(option.cloneNode(true));
        }
      });
      atualizarDropdownCategorias(categoriaSelect, tipoMovimentacao);
      await carregarTransacoesDoUsuario(userId);
    } catch (error) {
      console.error("Erro ao carregar dados globais:", error);
    }
  }

  async function carregarTransacoesDoUsuario(userId) {
    try {
      const consultaTransacoes = query(
        collection(db, "transacao"),
        where("userId", "==", userId),
        orderBy("data", "desc")
      );
      const transacoesSnapshot = await getDocs(consultaTransacoes);
      const transacoes = transacoesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      corpoTabela.innerHTML = "";
      if (transacoes.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="5">Nenhuma movimentação registrada.</td></tr>`;
      } else {
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
          const valorFormatado = transacao.valor.toLocaleString("pt-BR", {
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
      calcularEExibirTotais(transacoes);
    } catch (error) {
      console.error("Erro ao carregar transações do usuário:", error);
    }
  }

  // =================================================================
  // EVENT LISTENERS
  // =================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const dataInput = document.getElementById("data");
    if (dataInput) dataInput.value = new Date().toISOString().split("T")[0];
    if (btSaida) btSaida.classList.add("active");
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) carregarDadosIniciais(user.uid);
      else window.location.href = "login.html";
    });
  });

  btSaida.addEventListener("click", () => {
    if (tipoMovimentacao === "Saída") return;
    tipoMovimentacao = "Saída";
    btSaida.classList.add("active");
    btEntrada.classList.remove("active");
    document.getElementById("metodo").classList.remove("hidden");
    document.getElementById("gastoFixoLabel").classList.remove("hidden");
    atualizarDropdownCategorias(categoriaSelect, "Saída");
  });

  btEntrada.addEventListener("click", () => {
    if (tipoMovimentacao === "Entrada") return;
    tipoMovimentacao = "Entrada";
    btEntrada.classList.add("active");
    btSaida.classList.remove("active");
    document.getElementById("metodo").classList.add("hidden");
    document.getElementById("gastoFixoLabel").classList.add("hidden");
    parcelasContainer.classList.add("hidden");
    atualizarDropdownCategorias(categoriaSelect, "Entrada");
  });

  valorInput.addEventListener("input", formatarCampoComoMoeda);
  editValorInput.addEventListener("input", formatarCampoComoMoeda);

  metodoSelect.addEventListener("change", (e) => {
    const metodo = mapaMetodos.get(e.target.value);
    parcelasContainer.classList.toggle(
      "hidden",
      !metodo || metodo.forma !== "credito"
    );
    if (!metodo || metodo.forma !== "credito") parcelasInput.value = 1;
  });

  // CÓDIGO NOVO E CORRIGIDO
  editMetodoSelect.addEventListener("change", (e) => {
    const metodo = mapaMetodos.get(e.target.value);
    const isCredito =
      metodo && metodo.forma && metodo.forma.trim().toLowerCase() === "credito";

    if (isCredito) {
      editParcelasContainer.classList.remove("hidden");
    } else {
      editParcelasContainer.classList.add("hidden");
      editParcelasInput.value = 1; // Garante que o valor volta para 1
    }
  });

  corpoTabela.addEventListener("click", async (event) => {
    const linhaClicada = event.target.closest("tr[data-id]");
    if (linhaClicada) {
      const transacaoId = linhaClicada.dataset.id;
      try {
        const transacaoRef = doc(db, "transacao", transacaoId);
        const docSnap = await getDoc(transacaoRef);
        if (docSnap.exists()) {
          const transacao = docSnap.data();
          atualizarDropdownCategorias(
            editCategoriaSelect,
            transacao.tipo,
            transacao.idCategoria
          );
          document.getElementById("edit-transacao-id").value = transacaoId;
          document.getElementById("edit-data").value = transacao.data;
          document.getElementById("edit-valor").value =
            transacao.valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
          document.getElementById("edit-descricao").value = transacao.descricao;
          document.getElementById("edit-metodo").value = transacao.idMetodo;
          document.getElementById("edit-gastoFixo").checked =
            transacao.gastoFixo;

          const isEntrada = transacao.tipo === "Entrada";
          const editGastoFixoLabel = document.getElementById(
            "edit-gastoFixoLabel"
          ); // Definição correta

          editGastoFixoLabel.classList.toggle("hidden", isEntrada);
          document
            .getElementById("edit-metodo")
            .classList.toggle("hidden", isEntrada);

          if (transacao.tipo === "Entrada") {
            editParcelasContainer.classList.add("hidden");
          } else {
            const metodo = mapaMetodos.get(transacao.idMetodo);
            const isCredito =
              metodo &&
              metodo.forma &&
              metodo.forma.trim().toLowerCase() === "credito";

            if (isCredito) {
              editParcelasContainer.classList.remove("hidden");
              editParcelasInput.value = transacao.parcelas || 1;
            } else {
              editParcelasContainer.classList.add("hidden");
            }
          }

          modalContainer.classList.remove("hidden");
        } else {
          alert("Transação não encontrada.");
        }
      } catch (error) {
        console.error("Erro ao abrir edição: ", error);
        alert("Não foi possível carregar os dados para edição.");
      }
    }
  });

  formPrincipal.addEventListener("submit", async (event) => {
    event.preventDefault();
    const auth = getAuth();
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      alert("Utilizador não autenticado.");
      return;
    }

    const valorTotal = parseFloat(
      valorInput.value.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const data = document.getElementById("data").value;
    const categoriaId = categoriaSelect.value;
    if (isNaN(valorTotal) || valorTotal <= 0 || !data || !categoriaId) {
      alert("Preencha todos os campos obrigatórios (Data, Valor, Categoria).");
      return;
    }

    try {
      if (tipoMovimentacao === "Saída") {
        const metodoId = metodoSelect.value;
        const metodo = mapaMetodos.get(metodoId);
        const descricao = document.getElementById("descricao").value;
        if (!metodoId || !descricao) {
          return alert("Para saídas, preencha Método e Descrição!");
        }

        const idParcelamento =
          Date.now().toString(36) + Math.random().toString(36).substr(2);
        const numParcelas =
          metodo?.forma === "credito"
            ? parseInt(parcelasInput.value, 10) || 1
            : 1;
        const valorParcela = valorTotal / numParcelas;

        const transacaoBase = {
          valor: valorParcela,
          gastoFixo: document.getElementById("gastoFixo").checked,
          descricao,
          data,
          tipo: "Saída",
          idCategoria: categoriaId,
          idMetodo: metodoId,
          userId,
          parcelas: numParcelas,
          parcelaAtual: 1,
          idParcelamento: numParcelas > 1 ? idParcelamento : null,
        };

        if (numParcelas > 1) {
          const batch = writeBatch(db);
          for (let i = 1; i <= numParcelas; i++) {
            let dataParcela = new Date(data + "T00:00:00");
            dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
            const transacaoDaParcela = {
              ...transacaoBase,
              parcelaAtual: i,
              data: dataParcela.toISOString().split("T")[0],
            };
            batch.set(doc(collection(db, "transacao")), transacaoDaParcela);
          }
          await batch.commit();
        } else {
          await addDoc(collection(db, "transacao"), transacaoBase);
        }
      } else {
        await addDoc(collection(db, "transacao"), {
          valor: valorTotal,
          gastoFixo: false,
          descricao: "-",
          data,
          tipo: "Entrada",
          idCategoria: categoriaId,
          idMetodo: null,
          userId,
          parcelas: 1,
          parcelaAtual: 1,
          idParcelamento: null,
        });
      }
      alert("Transação salva!");
      formPrincipal.reset();
      document.getElementById("data").value = new Date()
        .toISOString()
        .split("T")[0];
      parcelasContainer.classList.add("hidden");
      await carregarTransacoesDoUsuario(userId);
    } catch (e) {
      console.error("Erro ao salvar: ", e);
    }
  });

  formEdicao.addEventListener("submit", async (event) => {
    event.preventDefault();
    const transacaoId = document.getElementById("edit-transacao-id").value;
    const valor = parseFloat(
      editValorInput.value.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const idCategoria = editCategoriaSelect.value;
    if (isNaN(valor) || valor <= 0 || !idCategoria) {
      return alert("Preencha todos os campos corretamente.");
    }

    const docRef = doc(db, "transacao", transacaoId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return alert("Erro: Transação não encontrada.");
    }

    const tipoTransacao = docSnap.data().tipo;
    const userId = docSnap.data().userId;

    let dadosAtualizados = {
      data: document.getElementById("edit-data").value,
      valor: valor,
      idCategoria: idCategoria,
    };

    if (tipoTransacao === "Saída") {
      const metodoId = editMetodoSelect.value;
      const metodo = mapaMetodos.get(metodoId);
      dadosAtualizados.gastoFixo =
        document.getElementById("edit-gastoFixo").checked;
      dadosAtualizados.descricao =
        document.getElementById("edit-descricao").value;
      dadosAtualizados.idMetodo = metodoId;
      if (metodo?.forma === "credito") {
        dadosAtualizados.parcelas = parseInt(editParcelasInput.value, 10) || 1;
      } else {
        dadosAtualizados.parcelas = 1;
        dadosAtualizados.parcelaAtual = 1;
      }
    }

    try {
      await updateDoc(docRef, dadosAtualizados);
      alert("Alterações salvas!");
      modalContainer.classList.add("hidden");
      await carregarTransacoesDoUsuario(userId);
    } catch (e) {
      console.error("Erro ao atualizar: ", e);
    }
  });

  btExcluir.addEventListener("click", async () => {
    const transacaoId = document.getElementById("edit-transacao-id").value;
    const userId = getAuth().currentUser.uid;
    if (
      confirm(
        "Isto irá remover TODAS as parcelas associadas, se existirem. Tem a certeza?"
      )
    ) {
      try {
        const docRef = doc(db, "transacao", transacaoId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          alert("Erro: Transação não encontrada.");
          return;
        }
        const { idParcelamento } = docSnap.data();

        if (idParcelamento) {
          const q = query(
            collection(db, "transacao"),
            where("idParcelamento", "==", idParcelamento),
            where("userId", "==", userId)
          );
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          alert("Todas as parcelas foram excluídas com sucesso!");
        } else {
          await deleteDoc(docRef);
          alert("Transação excluída!");
        }
        modalContainer.classList.add("hidden");
        await carregarTransacoesDoUsuario(userId);
      } catch (e) {
        console.error("Erro ao excluir:", e);
      }
    }
  });

  closeModalBtn.addEventListener("click", () =>
    modalContainer.classList.add("hidden")
  );
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  });
}
