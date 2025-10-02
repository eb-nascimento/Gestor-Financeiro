import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase.js";
import { showLoading, hideLoading } from "./loading.js";

// =================================================================
// INICIALIZAÇÃO
// =================================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// =================================================================
// ELEMENTOS DA INTERFACE (DOM)
// =================================================================
const loginContainer = document.getElementById("login-container");
const welcomeContainer = document.getElementById("bem-vindo");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const googleLoginBtn = document.getElementById("googleLoginBtn");

// =================================================================
// GESTÃO DE ESTADO DE AUTENTICAÇÃO
// =================================================================
showLoading();
onAuthStateChanged(auth, (user) => {
  hideLoading();
  if (user) {
    window.location.href = "index.html";
  } else {
    if (loginContainer) loginContainer.classList.remove("hidden");
    if (welcomeContainer) welcomeContainer.classList.remove("hidden");
  }
});

// =================================================================
// LÓGICA DE REGISTRO
// =================================================================
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Conta criada com sucesso! Faça login para continuar.");
      window.location.href = "login.html";
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Erro no registro:", errorCode, errorMessage);
      alert(`Erro no registro: ${errorMessage}`);
    }
  });
}

// =================================================================
// LÓGICA DE LOGIN
// =================================================================
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Erro no login:", errorCode, errorMessage);
      alert(`Erro de login: ${errorMessage}`);
    }
  });
}

// =================================================================
// LÓGICA DE LOGIN COM GOOGLE
// =================================================================
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Erro no login com Google:", errorCode, errorMessage);
      alert(`Erro de login com Google: ${errorMessage}`);
    }
  });
}
