// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// Se quiser usar analytics, adicione também:
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdiTGDvCyYTLdP5UTFqml2p-QJLrfakFs",
  authDomain: "gestor-financeiro-43435.firebaseapp.com",
  projectId: "gestor-financeiro-43435",
  storageBucket: "gestor-financeiro-43435.firebasestorage.app",
  messagingSenderId: "484962553511",
  appId: "1:484962553511:web:887fc9bbd50dbc2f859582",
  measurementId: "G-07V5TWV124",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
// Exporta o Firestore
export const db = getFirestore(app);
// Se quiser usar analytics, ative isso:
// const analytics = getAnalytics(app);
