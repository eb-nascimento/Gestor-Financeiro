import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUser = null;
let todasCategorias = [];
let mostrandoOcultos = false;

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

async function carregarCategorias() {
  console.log("A função carregarCategorias foi chamada.");
  try {
    const q = query(collection(db, "categoria"));
    const querySnapshot = await getDocs(q);

    console.log(`Firebase retornou ${querySnapshot.size} categorias.`);

    todasCategorias = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      "Dados das categorias guardados localmente:",
      JSON.parse(JSON.stringify(todasCategorias))
    );

    renderizarTabela();
  } catch (error) {
    console.error("Erro CRÍTICO ao carregar categorias:", error);
    const corpoTabela = document.getElementById("corpo-tabela-categorias");
    if (corpoTabela)
      corpoTabela.innerHTML =
        '<tr><td colspan="4">Erro ao carregar categorias. Verifique a consola.</td></tr>';
  }
}

function renderizarTabela() {
  console.log("A função renderizarTabela foi chamada.");
  const corpoTabela = document.getElementById("corpo-tabela-categorias");
  if (!corpoTabela) {
    console.error(
      "ERRO: Elemento com id 'corpo-tabela-categorias' não foi encontrado."
    );
    return;
  }

  // Ordenação (mantida como estava)
  todasCategorias.sort((a, b) => {
    const classOrder = { fixa: 3, variavel: 2 };
    const classA = classOrder[a.classificacao] || 1;
    const classB = classOrder[b.classificacao] || 1;
    if (classA !== classB) return classB - classA;

    const tipoOrder = { saida: 2, entrada: 1 };
    const tipoA = tipoOrder[a.tipo] || 0;
    const tipoB = tipoOrder[b.tipo] || 0;
    if (tipoA !== tipoB) return tipoB - tipoA;

    return a.nome.localeCompare(b.nome);
  });

  corpoTabela.innerHTML = "";

  let categoriasVisiveis = 0;
  todasCategorias.forEach((categoria) => {
    const estaOculta = categoria.oculta === true;

    if (!estaOculta || (estaOculta && mostrandoOcultos)) {
      categoriasVisiveis++;
      const linha = document.createElement("tr");
      linha.dataset.id = categoria.id;
      if (estaOculta) {
        linha.classList.add("linha-oculta");
      }

      const iconeBotao = estaOculta
        ? "img/eye.svg"
        : "img/eye-slash-blue-com.svg";

      linha.innerHTML = `
                <td>${categoria.nome}</td>
                <td>
                    <select class="select-tipo" data-field="tipo">
                        <option value="saida" ${
                          categoria.tipo === "saida" ? "selected" : ""
                        }>Saída</option>
                        <option value="entrada" ${
                          categoria.tipo === "entrada" ? "selected" : ""
                        }>Entrada</option>
                    </select>
                </td>
                <td>
                    <select class="select-classificacao" data-field="classificacao">
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
                <td class="td-ocultar">
                    <button class="ocultar-categoria">
                        <img src="${iconeBotao}" alt="Ocultar/Exibir Categoria" />
                    </button>
                </td>
            `;
      corpoTabela.appendChild(linha);
    }
  });

  console.log(`${categoriasVisiveis} categorias foram renderizadas na tabela.`);
  if (categoriasVisiveis === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="4">Nenhuma categoria para exibir.</td></tr>`;
    if (todasCategorias.length > 0) {
      console.warn(
        "Aviso: Existem categorias carregadas, mas nenhuma está visível. Verifique o estado 'oculta' das categorias ou clique em 'Exibir Ocultados'."
      );
    }
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

async function salvarAlteracoes() {
  const inputNome = document.getElementById("input-nova-categoria");
  const selectTipo = document.getElementById("select-novo-tipo");
  const selectClassif = document.getElementById("select-nova-classificacao");

  if (inputNome.value.trim() !== "") {
    try {
      await addDoc(collection(db, "categoria"), {
        nome: inputNome.value.trim(),
        tipo: selectTipo.value || "saida",
        classificacao: selectClassif.value || "variavel",
        oculta: false,
      });
    } catch (error) {
      console.error("Erro ao adicionar nova categoria:", error);
      alert("Não foi possível adicionar a nova categoria.");
    }
  }

  const promises = [];
  document.querySelectorAll("#corpo-tabela-categorias tr").forEach((linha) => {
    const id = linha.dataset.id;
    const tipo = linha.querySelector(".select-tipo").value;
    const classificacao = linha.querySelector(".select-classificacao").value;

    const categoriaRef = doc(db, "categoria", id);
    promises.push(updateDoc(categoriaRef, { tipo, classificacao }));
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

  const novoEstadoOculto = !(categoria.oculta === true);

  try {
    const categoriaRef = doc(db, "categoria", categoriaId);
    await updateDoc(categoriaRef, { oculta: novoEstadoOculto });

    categoria.oculta = novoEstadoOculto;
    renderizarTabela();
  } catch (error) {
    console.error("Erro ao atualizar visibilidade:", error);
    alert("Não foi possível alterar a visibilidade.");
  }
}
