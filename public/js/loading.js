export function showLoading() {
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";
  loadingScreen.innerHTML = `
    <div class="spinner"></div>
    <p>Verificando sua sessão...</p>
  `;
  document.body.appendChild(loadingScreen);
}

export function hideLoading() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

// Estilos CSS para o spinner e a tela de carregamento
const loadingStyles = `
  #loading-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #c1cbd7;
    color: #334666;
    font-size: 20px;
    z-index: 9999;
  }
  .spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #334666;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Adiciona os estilos ao documento
const styleSheet = document.createElement("style");
styleSheet.innerText = loadingStyles;
document.head.appendChild(styleSheet);
