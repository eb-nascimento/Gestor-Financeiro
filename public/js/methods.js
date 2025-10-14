import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  const sectionMetodos = document.getElementById("section-metodos");
  const divMetodos = document.getElementById("div-metodos");
  const btExibirOcultos = document.getElementById("btExibirOcultos");

  let currentUser = null;
  let hiddenMethods = [];
  let mostrandoOcultos = false;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await carregarPreferencias();
      await carregarMetodos();
    } else {
      window.location.href = "login.html";
    }
  });

  btExibirOcultos.addEventListener("click", () => {
    mostrandoOcultos = !mostrandoOcultos;
    btExibirOcultos.textContent = mostrandoOcultos
      ? "Esconder Ocultos"
      : "Exibir Ocultos";
    carregarMetodos();
  });

  async function carregarPreferencias() {
    if (!currentUser) return;
    const prefRef = doc(db, "user_preferences", currentUser.uid);
    const docSnap = await getDoc(prefRef);
    if (docSnap.exists() && docSnap.data().hidden_methods) {
      hiddenMethods = docSnap.data().hidden_methods;
    } else {
      hiddenMethods = [];
    }
  }

  async function carregarMetodos() {
    try {
      const metodosQuery = query(collection(db, "metodo"), orderBy("nome"));
      const querySnapshot = await getDocs(metodosQuery);
      divMetodos.innerHTML = "";

      if (querySnapshot.empty) {
        divMetodos.innerHTML = "<p>Nenhum método de pagamento encontrado.</p>";
        return;
      }

      querySnapshot.forEach((doc) => {
        const metodo = doc.data();
        const metodoId = doc.id;
        const isOculto = hiddenMethods.includes(metodoId);

        if (isOculto && !mostrandoOcultos) {
          return;
        }

        const isCartaoDeCredito = metodo.categoria === "Cartão de Crédito";
        const metodoElement = document.createElement("div");
        metodoElement.classList.add("metodo");
        if (isOculto) {
          metodoElement.classList.add("oculto");
        }
        metodoElement.dataset.id = metodoId;

        const backgroundColor = metodo.cor || "#334666";
        const expandirButtonHTML = isCartaoDeCredito
          ? `<button class="btExpandir"><img src="img/ArrowDown.svg" alt="expandir" /></button>`
          : '<div class="placeholder-button" style="width: 40px; margin: 0 10px;"></div>';

        const ocultarIcon = isOculto
          ? "img/eye.svg"
          : "img/eye-slash-white.svg";

        const infoMetodoHTML = isCartaoDeCredito
          ? `<div class="info-metodo hidden">
              <div class="info"><label>Limite do Cartão</label><input type="text" class="limite-cartao" placeholder="R$ 0,00" value="${
                metodo.limite ? formatarMoeda(metodo.limite) : ""
              }"/></div>
              <div class="info"><label>Vencimento da Fatura (dia)</label><input type="number" class="vencimento-fatura" min="1" max="31" value="${
                metodo.vencimento || ""
              }"/></div>
              <div class="info"><label>Fechamento da Fatura (dia)</label><input type="number" class="fechamento-fatura" min="1" max="31" value="${
                metodo.fechamento || ""
              }"/></div>
              <button class="btSalvar">Salvar</button>
            </div>`
          : "";

        metodoElement.innerHTML = `
          <div class="nome-metodo" style="background-color: ${backgroundColor};">
            <h3>${metodo.nome}</h3>
            <button class="btOcultar">
              <img src="${ocultarIcon}" alt="Ocultar" />
            </button>
            ${expandirButtonHTML}
          </div>
          ${infoMetodoHTML}`;
        divMetodos.appendChild(metodoElement);
      });
    } catch (error) {
      console.error("Erro ao carregar métodos:", error);
      divMetodos.innerHTML = "<p>Ocorreu um erro ao carregar os métodos.</p>";
    }
  }

  function formatarMoeda(valor) {
    if (isNaN(valor)) return "";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function validarInputDia(event) {
    let valor = parseInt(event.target.value, 10);
    if (valor > 31) event.target.value = 31;
    else if (valor < 1) event.target.value = "";
  }

  // --- NOVA FUNÇÃO PARA FORMATAR MOEDA AO VIVO ---
  function formatarInputMoeda(event) {
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

  // Delegação de eventos para click
  sectionMetodos.addEventListener("click", (event) => {
    if (event.target.closest(".btExpandir"))
      handleExpandir(event.target.closest(".btExpandir"));
    if (event.target.closest(".btSalvar"))
      handleSalvar(event.target.closest(".btSalvar"));
    if (event.target.closest(".btOcultar"))
      handleOcultar(event.target.closest(".btOcultar"));
  });

  // Delegação de eventos para input (digitação)
  sectionMetodos.addEventListener("input", (event) => {
    // Validação dos campos de dia
    if (
      event.target.classList.contains("vencimento-fatura") ||
      event.target.classList.contains("fechamento-fatura")
    ) {
      validarInputDia(event);
    }
    // --- NOVO: Formatação do campo de limite ---
    if (event.target.classList.contains("limite-cartao")) {
      formatarInputMoeda(event);
    }
  });

  function handleExpandir(button) {
    const metodoDiv = button.closest(".metodo");
    const infoMetodoDiv = metodoDiv.querySelector(".info-metodo");
    if (infoMetodoDiv) {
      const arrowImg = button.querySelector("img");
      infoMetodoDiv.classList.toggle("hidden");
      arrowImg.style.transform = infoMetodoDiv.classList.contains("hidden")
        ? "rotate(0deg)"
        : "rotate(180deg)";
    }
  }

  async function handleOcultar(button) {
    if (!currentUser) return;
    const metodoDiv = button.closest(".metodo");
    const metodoId = metodoDiv.dataset.id;
    const isCurrentlyHidden = hiddenMethods.includes(metodoId);

    if (isCurrentlyHidden) {
      hiddenMethods = hiddenMethods.filter((id) => id !== metodoId);
    } else {
      hiddenMethods.push(metodoId);
    }

    try {
      const prefRef = doc(db, "user_preferences", currentUser.uid);
      await setDoc(prefRef, { hidden_methods: hiddenMethods }, { merge: true });

      if (!mostrandoOcultos) {
        metodoDiv.remove();
      } else {
        metodoDiv.classList.toggle("oculto", !isCurrentlyHidden);
        const icon = button.querySelector("img");
        icon.src = !isCurrentlyHidden
          ? "img/eye.svg"
          : "img/eye-slash-white.svg";
      }
    } catch (error) {
      console.error("Erro ao salvar preferência de ocultar:", error);
      alert("Não foi possível salvar sua preferência.");
      hiddenMethods = isCurrentlyHidden
        ? [...hiddenMethods, metodoId]
        : hiddenMethods.filter((id) => id !== metodoId);
    }
  }

  async function handleSalvar(button) {
    const metodoDiv = button.closest(".metodo");
    const metodoId = metodoDiv.dataset.id;
    const limiteInput = metodoDiv.querySelector(".limite-cartao");
    const vencimentoInput = metodoDiv.querySelector(".vencimento-fatura");
    const fechamentoInput = metodoDiv.querySelector(".fechamento-fatura");
    const limiteValor = parseFloat(limiteInput.value.replace(/\D/g, "")) / 100;

    const dadosParaAtualizar = {
      limite: isNaN(limiteValor) ? 0 : limiteValor,
      vencimento: parseInt(vencimentoInput.value) || null,
      fechamento: parseInt(fechamentoInput.value) || null,
    };

    try {
      const metodoRef = doc(db, "metodo", metodoId);
      await updateDoc(metodoRef, dadosParaAtualizar);
      alert(`Método atualizado com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar o método:", error);
      alert("Ocorreu um erro ao salvar as alterações.");
    }
  }
});
