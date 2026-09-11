import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase-init.js";
import { ADMIN_EMAIL } from "./firebase-config.js";

const modal = document.getElementById("auth-modal");
const btnAbrirLogin = document.getElementById("btn-cuenta");
const btnCerrarModal = document.getElementById("cerrar-modal");
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const linkMostrarRegistro = document.getElementById("mostrar-registro");
const linkMostrarLogin = document.getElementById("mostrar-login");
const vistaLogin = document.getElementById("vista-login");
const vistaRegistro = document.getElementById("vista-registro");
const errorLogin = document.getElementById("error-login");
const errorRegistro = document.getElementById("error-registro");
const btnCuentaTexto = document.getElementById("btn-cuenta-texto");
const linkAdmin = document.getElementById("link-admin");

function abrirModal() {
  modal.classList.add("abierto");
}
function cerrarModal() {
  modal.classList.remove("abierto");
  errorLogin.textContent = "";
  errorRegistro.textContent = "";
}

btnAbrirLogin?.addEventListener("click", () => {
  if (auth.currentUser) {
    signOut(auth);
  } else {
    abrirModal();
  }
});
btnCerrarModal?.addEventListener("click", cerrarModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

linkMostrarRegistro?.addEventListener("click", (e) => {
  e.preventDefault();
  vistaLogin.classList.add("oculto");
  vistaRegistro.classList.remove("oculto");
});
linkMostrarLogin?.addEventListener("click", (e) => {
  e.preventDefault();
  vistaRegistro.classList.add("oculto");
  vistaLogin.classList.remove("oculto");
});

formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorLogin.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    cerrarModal();
  } catch (err) {
    errorLogin.textContent = traducirError(err.code);
  }
});

formRegistro?.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorRegistro.textContent = "";
  const email = document.getElementById("registro-email").value.trim();
  const pass = document.getElementById("registro-password").value;
  const pass2 = document.getElementById("registro-password2").value;
  if (pass !== pass2) {
    errorRegistro.textContent = "Las contraseñas no coinciden.";
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    cerrarModal();
  } catch (err) {
    errorRegistro.textContent = traducirError(err.code);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    btnCuentaTexto.textContent = `Salir (${user.email.split("@")[0]})`;
    if (user.email === ADMIN_EMAIL && linkAdmin) {
      linkAdmin.classList.remove("oculto");
    } else if (linkAdmin) {
      linkAdmin.classList.add("oculto");
    }
  } else {
    btnCuentaTexto.textContent = "Ingresar";
    linkAdmin?.classList.add("oculto");
  }
});

function traducirError(codigo) {
  const errores = {
    "auth/email-already-in-use": "Ese email ya tiene una cuenta creada.",
    "auth/invalid-email": "El email no es válido.",
    "auth/weak-password": "La contraseña necesita al menos 6 caracteres.",
    "auth/user-not-found": "No existe una cuenta con ese email.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/invalid-credential": "Email o contraseña incorrectos."
  };
  return errores[codigo] || "Ocurrió un error. Probá de nuevo.";
}
