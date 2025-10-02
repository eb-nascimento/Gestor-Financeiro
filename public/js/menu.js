import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const btMenu = document.getElementById("btMenu");
  const menuLateral = document.getElementById("menuLateral");
  const btSignOut = document.querySelectorAll(".btSignOut, #btSignOut"); // Pega todos os botões de sair

  // Event listener para o botão que abre o menu lateral
  if (btMenu && menuLateral) {
    btMenu.addEventListener("click", () => {
      menuLateral.classList.toggle("show");
    });

    // Event listener para fechar o menu ao clicar fora
    document.addEventListener("click", (event) => {
      if (
        !menuLateral.contains(event.target) &&
        !btMenu.contains(event.target)
      ) {
        menuLateral.classList.remove("show");
      }
    });
  }

  // Event listener para todos os botões de sair
  btSignOut.forEach((button) => {
    button.addEventListener("click", async () => {
      const auth = getAuth();
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao sair. Tente novamente.");
      }
    });
  });
});
