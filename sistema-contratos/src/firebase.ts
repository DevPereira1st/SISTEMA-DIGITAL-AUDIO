import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Importa o Storage do Firebase

const firebaseConfig = {
  // SUAS CHAVES AQUI (Mantenha as chaves que copiou do painel do Firebase)
  apiKey: "AIzaSyC7ufP085nXCs-oZY1PR_jkyJJuas1vPvQ",
  authDomain: "digitalaudio-cfcf0.firebaseapp.com",
  projectId: "digitalaudio-cfcf0",
  storageBucket: "digitalaudio-cfcf0.firebasestorage.app",
  messagingSenderId: "425899185779",
  appId: "1:425899185779:web:26252ad885804b57bdfc06"
};

const app = initializeApp(firebaseConfig);

// 2. Exporta todas as ferramentas necessárias para a aplicação
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <--- Adicione esta linha para corrigir o erro