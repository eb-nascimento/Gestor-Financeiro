import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDoc, // Adicionado
  setDoc, // Adicionado
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;
let todasCategorias = [];
let mostrandoOcultos = false;
let hiddenDefaultCategories = []; // <-- ADICIONE ESTA LINHA

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("Utilizador autenticado. A iniciar a página de categorias.");
      carregarCategorias();
      configurarEventListeners();
    } else {
      window.location.href = "login.html";
    }
  });
});

// --- FUNÇÕES PRINCIPAIS ---

// Em public/js/categoria.js
async function carregarCategorias() {
  console.log("A carregar categorias e preferências...");
  try {
    // 1. Busca as preferências de visibilidade do utilizador
    const prefRef = doc(db, "user_preferences", currentUser.uid);
    const prefSnap = await getDoc(prefRef);
    hiddenDefaultCategories = prefSnap.exists()
      ? prefSnap.data().hiddenDefaultCategories || []
      : [];

    // 2. Busca as categorias (padrão e do utilizador)
    const qPadrao = query(
      collection(db, "categoria"),
      where("userId", "==", null)
    );
    const qUsuario = query(
      collection(db, "categoria"),
      where("userId", "==", currentUser.uid)
    );

    const [snapshotPadrao, snapshotUsuario] = await Promise.all([
      getDocs(qPadrao),
      getDocs(qUsuario),
    ]);

    const categoriasPadrao = snapshotPadrao.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const categoriasUsuario = snapshotUsuario.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    todasCategorias = [...categoriasPadrao, ...categoriasUsuario];

    renderizarTabela();
  } catch (error) {
    console.error("Erro CRÍTICO ao carregar dados:", error);
  }
}

function renderizarTabela() {
  const corpoTabela = document.getElementById("corpo-tabela-categorias");
  if (!corpoTabela) return;

  todasCategorias.sort((a, b) => {
    // A sua lógica de ordenação continua igual
    const classOrder = { fixa: 3, variavel: 2 };
    const classA = classOrder[a.classificacao] || 1;
    const classB = classOrder[b.classificacao] || 1;
    if (classA !== classB) return classB - classA;
    const tipoOrder = { saida: 2, entrada: 1 };
    const tipoA = tipoOrder[a.tipo] || 0;
    const tipoB = tipoOrder[b.tipo] || 0;
    if (tipoA !== tipoB) return tipoB - tipoA;
    return (a.nome || "").localeCompare(b.nome || "");
  });

  corpoTabela.innerHTML = "";
  let categoriasVisiveis = 0;

  todasCategorias.forEach((categoria) => {
    const ehDoUsuario = categoria.userId === currentUser.uid;
    let estaOculta;

    // A lógica de verificação de "oculta" agora é dividida
    if (ehDoUsuario) {
      estaOculta = categoria.oculta === true;
    } else {
      // Se for uma categoria padrão...
      estaOculta = hiddenDefaultCategories.includes(categoria.id);
    }

    if (!estaOculta || (estaOculta && mostrandoOcultos)) {
      categoriasVisiveis++;
      const linha = document.createElement("tr");
      linha.dataset.id = categoria.id;
      if (estaOculta) {
        linha.classList.add("linha-oculta");
      }

      const nomeHtml = ehDoUsuario
        ? `<input type="text" class="input-nome-categoria" value="${categoria.nome}" />`
        : categoria.nome;

      const iconeBotao = estaOculta
        ? "img/eye.svg"
        : "img/eye-slash-blue-com.svg";
      const botaoOcultarHtml = `<button class="ocultar-categoria"><img src="${iconeBotao}" alt="Ocultar/Exibir" /></button>`;

      linha.innerHTML = `
        <td>${nomeHtml}</td>
        <td><select class="select-tipo" ${
          !ehDoUsuario ? "disabled" : ""
        }>...</select></td>
        <td><select class="select-classificacao" ${
          !ehDoUsuario ? "disabled" : ""
        }>...</select></td>
        <td class="td-ocultar">${botaoOcultarHtml}</td>
      `;
      // Preenchendo os selects (código omitido por brevidade, o seu já está correto)
      corpoTabela.appendChild(linha);
      const selectTipo = linha.querySelector(".select-tipo");
      selectTipo.innerHTML = `<option value="saida" ${
        categoria.tipo === "saida" ? "selected" : ""
      }>Saída</option><option value="entrada" ${
        categoria.tipo === "entrada" ? "selected" : ""
      }>Entrada</option>`;
      const selectClassif = linha.querySelector(".select-classificacao");
      selectClassif.innerHTML = `<option value="variavel" ${
        categoria.classificacao === "variavel" ? "selected" : ""
      }>Variável</option><option value="fixa" ${
        categoria.classificacao === "fixa" ? "selected" : ""
      }>Fixa</option>`;
    }
  });

  if (categoriasVisiveis === 0) {
    // Lógica para tabela vazia
    corpoTabela.innerHTML = `<tr><td colspan="4">Nenhuma categoria para exibir.</td></tr>`;
  }
}

function configurarEventListeners() {
  const btnSalvar = document.getElementById("btn-salvar");
  const btnToggleOcultos = document.getElementById("btn-toggle-ocultos");
  const corpoTabela = document.getElementById("corpo-tabela-categorias");

  if (!btnSalvar || !btnToggleOcultos || !corpoTabela) {
    console.error(
      "ERRO: Um ou mais elementos de controle (botões, tabela) não foram encontrados. Verifique os IDs no HTML."
    );
    return;
  }

  btnSalvar.addEventListener("click", salvarAlteracoes);
  btnToggleOcultos.addEventListener("click", () => {
    mostrandoOcultos = !mostrandoOcultos;
    btnToggleOcultos.textContent = mostrandoOcultos
      ? "Esconder Ocultados"
      : "Exibir Ocultados";
    renderizarTabela();
  });
  corpoTabela.addEventListener("click", (event) => {
    const button = event.target.closest(".ocultar-categoria");
    if (button) {
      const linha = button.closest("tr");
      const categoriaId = linha.dataset.id;
      toggleOcultarCategoria(categoriaId);
    }
  });
}

// Em public/js/categoria.js
async function salvarAlteracoes() {
  const inputNome = document.getElementById("input-nova-categoria");
  const selectTipo = document.getElementById("select-novo-tipo");
  const selectClassif = document.getElementById("select-nova-classificacao");

  // Adicionar nova categoria (agora com userId)
  if (inputNome.value.trim() !== "") {
    try {
      await addDoc(collection(db, "categoria"), {
        nome: inputNome.value.trim(),
        tipo: selectTipo.value || "saida",
        classificacao: selectClassif.value || "variavel",
        oculta: false,
        userId: currentUser.uid, // ADICIONADO: A nova categoria pertence a este utilizador
      });
    } catch (error) {
      console.error("Erro ao adicionar nova categoria:", error);
      alert("Não foi possível adicionar a nova categoria.");
    }
  }

  // Atualizar categorias existentes
  const promises = [];
  document
    .querySelectorAll("#corpo-tabela-categorias tr[data-id]")
    .forEach((linha) => {
      const id = linha.dataset.id;
      const categoriaOriginal = todasCategorias.find((c) => c.id === id);

      // SÓ TENTA ATUALIZAR SE A CATEGORIA PERTENCER AO UTILIZADOR
      if (categoriaOriginal && categoriaOriginal.userId === currentUser.uid) {
        const nome = linha.querySelector(".input-nome-categoria").value;
        const tipo = linha.querySelector(".select-tipo").value;
        const classificacao = linha.querySelector(
          ".select-classificacao"
        ).value;

        const categoriaRef = doc(db, "categoria", id);
        promises.push(updateDoc(categoriaRef, { nome, tipo, classificacao }));
      }
    });

  try {
    await Promise.all(promises);
    alert("Alterações salvas com sucesso!");
    inputNome.value = "";
    selectTipo.value = "";
    selectClassif.value = "";
    carregarCategorias();
  } catch (error) {
    console.error("Erro ao salvar alterações:", error);
    alert("Ocorreu um erro ao salvar as alterações.");
  }
}

async function toggleOcultarCategoria(categoriaId) {
  const categoria = todasCategorias.find((c) => c.id === categoriaId);
  if (!categoria) return;

  const ehDoUsuario = categoria.userId === currentUser.uid;

  try {
    if (ehDoUsuario) {
      // Se a categoria é do utilizador, altera o campo 'oculta' no próprio documento.
      const novoEstadoOculto = !(categoria.oculta === true);
      const categoriaRef = doc(db, "categoria", categoriaId);
      await updateDoc(categoriaRef, { oculta: novoEstadoOculto });
    } else {
      // Se a categoria é padrão, altera a lista de preferências do utilizador.
      const prefRef = doc(db, "user_preferences", currentUser.uid);
      const isCurrentlyHidden = hiddenDefaultCategories.includes(categoriaId);

      let updatedHiddenList;
      if (isCurrentlyHidden) {
        // Remove o ID da lista
        updatedHiddenList = hiddenDefaultCategories.filter(
          (id) => id !== categoriaId
        );
      } else {
        // Adiciona o ID à lista
        updatedHiddenList = [...hiddenDefaultCategories, categoriaId];
      }
      // Salva a lista atualizada no documento de preferências
      await setDoc(
        prefRef,
        { hiddenDefaultCategories: updatedHiddenList },
        { merge: true }
      );
    }
    // Recarrega tudo para a interface refletir a alteração
    await carregarCategorias();
  } catch (error) {
    console.error("Erro ao atualizar visibilidade:", error);
    alert("Não foi possível alterar a visibilidade.");
  }
}
