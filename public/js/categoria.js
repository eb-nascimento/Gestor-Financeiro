import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDoc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// =================================================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÃO
// =================================================================
let currentUser = null;
let todasCategorias = [];
let mostrandoOcultos = false;
let hiddenDefaultCategories = [];
let categoriaIdParaEditarIcone = null; // Guarda o ID da categoria cujo ícone está a ser editado

// LISTA DE ÍCONES DISPONÍVEIS (personalize com os nomes dos seus ficheiros .svg)
const iconList = [
  "tag",
  "shopping-cart",
  "receipt",
  "car",
  "home",
  "cash",
  "credit-card",
  "gift",
  "heart",
  "airplane",
  "pills",
  "graduation-cap",
  "wrench",
  "briefcase",
  "trash",
  // Adicione todos os seus nomes de ícones aqui
];

// =================================================================
// INICIALIZAÇÃO
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("Utilizador autenticado. A iniciar a página de categorias.");
      configurarEventListeners(); // Mova a configuração dos listeners para aqui
      carregarCategorias();
    } else {
      window.location.href = "login.html";
    }
  });
});

// =================================================================
// FUNÇÕES DE LÓGICA PRINCIPAL (CARREGAR, RENDERIZAR)
// =================================================================

async function carregarCategorias() {
  console.log("A carregar categorias e preferências...");
  try {
    const prefRef = doc(db, "user_preferences", currentUser.uid);
    const prefSnap = await getDoc(prefRef);
    hiddenDefaultCategories = prefSnap.exists()
      ? prefSnap.data().hiddenDefaultCategories || []
      : [];

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
    const estaOculta =
      hiddenDefaultCategories.includes(categoria.id) ||
      categoria.oculta === true;

    if (!estaOculta || (estaOculta && mostrandoOcultos)) {
      categoriasVisiveis++;
      const linha = document.createElement("tr");
      linha.dataset.id = categoria.id;

      if (categoria.tipo === "entrada") linha.classList.add("linha-entrada");
      else if (categoria.tipo === "saida") linha.classList.add("linha-saida");

      if (estaOculta) linha.classList.add("linha-oculta");

      const ehDoUsuario = categoria.userId === currentUser.uid;
      const iconName = categoria.iconName || "tag";

      const iconeHtml = ehDoUsuario
        ? `<button class="btn-editar-icone"><img src="img/icons/${iconName}.svg" alt="${categoria.nome}" /></button>`
        : `<img src="img/icons/${iconName}.svg" alt="${categoria.nome}" class="icone-categoria" />`;

      const nomeHtml = ehDoUsuario
        ? `<input type="text" class="input-nome-categoria" value="${categoria.nome}" data-field="nome" />`
        : categoria.nome;

      const iconeOcultar = estaOculta
        ? "img/eye.svg"
        : "img/eye-slash-blue-com.svg";
      const botaoOcultarHtml = `<button class="ocultar-categoria"><img src="${iconeOcultar}" alt="Ocultar/Exibir Categoria" /></button>`;

      const botaoExcluirHtml = `<button class="excluir-categoria" ${
        !ehDoUsuario ? "disabled" : ""
      }><img src="img/trash.svg" alt="Excluir Categoria" /></button>`;

      linha.innerHTML = `
                <td class="td-acao">${iconeHtml}</td>
                <td>${nomeHtml}</td>
                <td>
                    <select class="select-tipo" data-field="tipo" ${
                      !ehDoUsuario ? "disabled" : ""
                    }>
                        <option value="saida" ${
                          categoria.tipo === "saida" ? "selected" : ""
                        }>Saída</option>
                        <option value="entrada" ${
                          categoria.tipo === "entrada" ? "selected" : ""
                        }>Entrada</option>
                    </select>
                </td>
                <td>
                    <select class="select-classificacao" data-field="classificacao" ${
                      !ehDoUsuario ? "disabled" : ""
                    }>
                        <option value="variavel" ${
                          categoria.classificacao === "variavel"
                            ? "selected"
                            : ""
                        }>Variável</option>
                        <option value="fixa" ${
                          categoria.classificacao === "fixa" ? "selected" : ""
                        }>Fixa</option>
                    </select>
                </td>
                <td class="td-acao">${botaoOcultarHtml}</td>
                <td class="td-acao">${botaoExcluirHtml}</td>
            `;
      corpoTabela.appendChild(linha);
    }
  });

  if (categoriasVisiveis === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="6">Nenhuma categoria para exibir.</td></tr>`;
  }
}

// =================================================================
// FUNÇÕES DO MODAL DE ÍCONES (DEFINIDAS ANTES DE SEREM USADAS)
// =================================================================

function abrirModalIcones(targetId = null) {
  categoriaIdParaEditarIcone = targetId;
  const modal = document.getElementById("modal-icones-container");
  const grid = document.getElementById("grid-icones");
  grid.innerHTML = "";

  iconList.forEach((iconName) => {
    const iconButton = document.createElement("button");
    iconButton.classList.add("btn-selecionar-icone");
    iconButton.dataset.iconName = iconName;
    iconButton.innerHTML = `<img src="img/icons/${iconName}.svg" alt="${iconName}" />`;
    grid.appendChild(iconButton);
  });

  modal.classList.remove("hidden");
}

function fecharModalIcones() {
  document.getElementById("modal-icones-container").classList.add("hidden");
}

async function selecionarIcone(iconName) {
  if (categoriaIdParaEditarIcone) {
    try {
      const categoriaRef = doc(db, "categoria", categoriaIdParaEditarIcone);
      await updateDoc(categoriaRef, { iconName: iconName });
      carregarCategorias();
    } catch (error) {
      console.error("Erro ao atualizar ícone:", error);
    }
  } else {
    document.getElementById("img-novo-icone").src = `img/icons/${iconName}.svg`;
    document.getElementById("input-novo-icone-nome").value = iconName;
  }
  fecharModalIcones();
}

// =================================================================
// EVENT LISTENERS E AÇÕES
// =================================================================

function configurarEventListeners() {
  const btnAdicionar = document.getElementById("btn-adicionar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnToggleOcultos = document.getElementById("btn-toggle-ocultos");
  const corpoTabela = document.getElementById("corpo-tabela-categorias");
  const btnEscolherIcone = document.getElementById("btn-escolher-icone");
  const modalIcones = document.getElementById("modal-icones-container");
  const btnFecharModalIcones = document.getElementById(
    "btn-fechar-modal-icones"
  );

  if (
    !btnSalvar ||
    !btnToggleOcultos ||
    !corpoTabela ||
    !btnAdicionar ||
    !btnEscolherIcone ||
    !modalIcones ||
    !btnFecharModalIcones
  ) {
    console.error(
      "ERRO: Um ou mais elementos de controle não foram encontrados."
    );
    return;
  }

  btnAdicionar.addEventListener("click", adicionarNovaCategoria);
  btnSalvar.addEventListener("click", salvarAlteracoes);
  btnToggleOcultos.addEventListener("click", () => {
    mostrandoOcultos = !mostrandoOcultos;
    btnToggleOcultos.textContent = mostrandoOcultos
      ? "Esconder Ocultados"
      : "Exibir Ocultados";
    renderizarTabela();
  });

  btnEscolherIcone.addEventListener("click", () => abrirModalIcones(null));
  btnFecharModalIcones.addEventListener("click", fecharModalIcones);
  modalIcones.addEventListener("click", (event) => {
    if (event.target === modalIcones) fecharModalIcones();
    const iconButton = event.target.closest(".btn-selecionar-icone");
    if (iconButton) selecionarIcone(iconButton.dataset.iconName);
  });

  corpoTabela.addEventListener("click", (event) => {
    const btnEditarIcone = event.target.closest(".btn-editar-icone");
    if (btnEditarIcone) {
      const categoriaId = btnEditarIcone.closest("tr").dataset.id;
      abrirModalIcones(categoriaId);
      return;
    }

    const btnOcultar = event.target.closest(".ocultar-categoria");
    if (btnOcultar) {
      const categoriaId = btnOcultar.closest("tr").dataset.id;
      toggleOcultarCategoria(categoriaId);
      return;
    }

    const btnExcluir = event.target.closest(".excluir-categoria");
    if (btnExcluir) {
      if (btnExcluir.disabled) return;
      const categoriaId = btnExcluir.closest("tr").dataset.id;
      const nomeCategoria =
        btnExcluir.closest("tr").querySelector(".input-nome-categoria")
          ?.value || btnExcluir.closest("tr").cells[1].textContent;
      excluirCategoria(categoriaId, nomeCategoria);
    }
  });
}

async function adicionarNovaCategoria() {
  const inputNome = document.getElementById("input-nova-categoria");
  const selectTipo = document.getElementById("select-novo-tipo");
  const selectClassif = document.getElementById("select-nova-classificacao");
  const iconName = document.getElementById("input-novo-icone-nome").value;

  if (inputNome.value.trim() === "") {
    alert("Por favor, insira o nome da nova categoria.");
    inputNome.focus();
    return;
  }

  try {
    await addDoc(collection(db, "categoria"), {
      nome: inputNome.value.trim(),
      tipo: selectTipo.value,
      classificacao: selectClassif.value,
      iconName: iconName,
      oculta: false,
      userId: currentUser.uid,
    });
    alert(`Categoria "${inputNome.value.trim()}" adicionada com sucesso!`);
    inputNome.value = "";
    document.getElementById("input-novo-icone-nome").value = "tag";
    document.getElementById("img-novo-icone").src = "img/icons/tag.svg";
    carregarCategorias();
  } catch (error) {
    console.error("Erro ao adicionar nova categoria:", error);
    alert("Não foi possível adicionar a nova categoria.");
  }
}

async function salvarAlteracoes() {
  const promises = [];
  document
    .querySelectorAll("#corpo-tabela-categorias tr[data-id]")
    .forEach((linha) => {
      const id = linha.dataset.id;
      const categoriaOriginal = todasCategorias.find((c) => c.id === id);
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

  if (promises.length === 0) {
    alert("Nenhuma alteração para salvar nas suas categorias personalizadas.");
    return;
  }

  try {
    await Promise.all(promises);
    alert("Alterações salvas com sucesso!");
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
      const novoEstadoOculto = !(categoria.oculta === true);
      const categoriaRef = doc(db, "categoria", categoriaId);
      await updateDoc(categoriaRef, { oculta: novoEstadoOculto });
    } else {
      const prefRef = doc(db, "user_preferences", currentUser.uid);
      const isCurrentlyHidden = hiddenDefaultCategories.includes(categoriaId);
      let updatedHiddenList = isCurrentlyHidden
        ? hiddenDefaultCategories.filter((id) => id !== categoriaId)
        : [...hiddenDefaultCategories, categoriaId];
      await setDoc(
        prefRef,
        { hiddenDefaultCategories: updatedHiddenList },
        { merge: true }
      );
    }
    await carregarCategorias();
  } catch (error) {
    console.error("Erro ao atualizar visibilidade:", error);
    alert("Não foi possível alterar a visibilidade.");
  }
}

async function excluirCategoria(categoriaId, nomeCategoria) {
  if (
    !confirm(
      `Tem a certeza de que deseja excluir a categoria "${nomeCategoria}"?\nEsta ação não pode ser desfeita.`
    )
  ) {
    return;
  }
  try {
    const q = query(
      collection(db, "transacao"),
      where("idCategoria", "==", categoriaId),
      where("userId", "==", currentUser.uid)
    );
    const transacoesSnapshot = await getDocs(q);
    if (!transacoesSnapshot.empty) {
      alert(
        `Não é possível excluir a categoria "${nomeCategoria}", pois já está a ser utilizada em ${transacoesSnapshot.size} transação(ões).`
      );
      return;
    }
    await deleteDoc(doc(db, "categoria", categoriaId));
    alert(`Categoria "${nomeCategoria}" excluída com sucesso!`);
    carregarCategorias();
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    alert("Ocorreu um erro ao tentar excluir a categoria.");
  }
}
