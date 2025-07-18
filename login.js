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
  storageBucket: "childcare-rota-4.appspot.com",
  messagingSenderId: "703216575309",
  appId: "1:703216575309:web:c69096afd83ce1bce40d04",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Redirect to index.html if already logged in and currently on login page
onAuthStateChanged(auth, (user) => {
  const onLoginPage = window.location.pathname.includes("login");
  if (user && onLoginPage) {
    window.location.href = "index.html";
  }
});

// Login
document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const authError = document.getElementById("authError");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Firebase will trigger onAuthStateChanged which redirects automatically
  } catch (err) {
    authError.textContent = "Login failed: " + err.message;
  }
});

// Sign up
document.getElementById("signupBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const authError = document.getElementById("authError");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // Firebase will trigger onAuthStateChanged which redirects automatically
  } catch (err) {
    authError.textContent = "Signup failed: " + err.message;
  }
});
