// ... (no início do seu ficheiro methods.js, junto com os outros event listeners)

document.addEventListener("DOMContentLoaded", () => {
  // ... (seu código de autenticação)

  const sectionMetodos = document.getElementById("section-metodos");

  sectionMetodos.addEventListener("click", (event) => {
    // Procura pelo botão de expandir mais próximo do clique
    const expandirBtn = event.target.closest("#btExpandir");

    if (expandirBtn) {
      // Encontra o 'pai' do método que foi clicado
      const metodoDiv = expandirBtn.closest(".metodo");
      // Encontra o container de informações dentro desse método
      const infoMetodoDiv = metodoDiv.querySelector(".info-metodo");

      // Mostra ou esconde a secção de detalhes
      infoMetodoDiv.classList.toggle("hidden");

      // Gira a seta para indicar o estado (aberto/fechado)
      const arrowImg = expandirBtn.querySelector("img");
      arrowImg.style.transform = infoMetodoDiv.classList.contains("hidden")
        ? "rotate(0deg)"
        : "rotate(180deg)";
    }
  });

  // ... (resto do seu código)
});
