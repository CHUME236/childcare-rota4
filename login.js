import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBekbb2wy8cO1zJ9lTj7eC64sOZBYa-4PM",
  authDomain: "childcare-rota-4.firebaseapp.com",
  projectId: "childcare-rota-4",
  storageBucket: "childcare-rota-4.firebasestorage.app",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const authError = document.getElementById("authError");

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "index.html";
  }
});

// Login
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "index.html";
  } catch (err) {
    authError.textContent = "Login failed: " + err.message;
  }
});

// Sign up
signupBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    window.location.href = "index.html";
  } catch (err) {
    authError.textContent = "Signup failed: " + err.message;
  }
});
