import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "./firebase-init.js";
import { ADMIN_EMAIL } from "./firebase-config.js";

const bloqueAcceso = document.getElementById("bloque-sin-acceso");
const bloqueAdmin = document.getElementById("bloque-admin");
const form = document.getElementById("form-producto");
const tabla = document.getElementById("tabla-productos-body");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
const tituloForm = document.getElementById("titulo-form");

let editandoId = null;

onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    bloqueAcceso.classList.add("oculto");
    bloqueAdmin.classList.remove("oculto");
  } else {
    bloqueAcceso.classList.remove("oculto");
    bloqueAdmin.classList.add("oculto");
  }
});

const q = query(collection(db, "productos"), orderBy("nombre"));
onSnapshot(q, (snapshot) => {
  const productos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  tabla.innerHTML = productos
    .map(
      (p) => `
    <tr>
      <td><img src="${p.imagenUrl || "https://placehold.co/60x60/e8f5e0/2f6b4f?text=%20"}" alt="" class="miniatura"></td>
      <td>${p.nombre}</td>
      <td>${p.categoria}${p.subcategoria ? " · " + p.subcategoria : ""}</td>
      <td>$${Number(p.precio).toLocaleString("es-AR")}</td>
      <td>${p.oferta ? "Sí" : "No"}</td>
      <td class="acciones-tabla">
        <button data-accion="editar" data-id="${p.id}">Editar</button>
        <button data-accion="borrar" data-id="${p.id}" class="boton-borrar">Borrar</button>
      </td>
    </tr>
  `
    )
    .join("");

  tabla.querySelectorAll("button[data-accion]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const producto = productos.find((p) => p.id === btn.dataset.id);
      if (btn.dataset.accion === "editar") cargarParaEditar(producto);
      if (btn.dataset.accion === "borrar") borrarProducto(producto.id);
    });
  });
});

function cargarParaEditar(producto) {
  editandoId = producto.id;
  tituloForm.textContent = `Editando: ${producto.nombre}`;
  document.getElementById("input-nombre").value = producto.nombre;
  document.getElementById("input-categoria").value = producto.categoria;
  document.getElementById("input-subcategoria").value = producto.subcategoria || "";
  document.getElementById("input-precio").value = producto.precio;
  document.getElementById("input-imagen").value = producto.imagenUrl || "";
  document.getElementById("input-oferta").checked = !!producto.oferta;
  btnCancelarEdicion.classList.remove("oculto");
  window.scrollTo({ top: form.offsetTop - 20, behavior: "smooth" });
}

btnCancelarEdicion?.addEventListener("click", () => {
  resetForm();
});

function resetForm() {
  editandoId = null;
  form.reset();
  tituloForm.textContent = "Agregar producto nuevo";
  btnCancelarEdicion.classList.add("oculto");
}

async function borrarProducto(id) {
  if (!confirm("¿Seguro que querés borrar este producto? No se puede deshacer.")) return;
  await deleteDoc(doc(db, "productos", id));
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = {
    nombre: document.getElementById("input-nombre").value.trim(),
    categoria: document.getElementById("input-categoria").value,
    subcategoria: document.getElementById("input-subcategoria").value.trim(),
    precio: Number(document.getElementById("input-precio").value),
    imagenUrl: document.getElementById("input-imagen").value.trim(),
    oferta: document.getElementById("input-oferta").checked
  };

  const mensajeEstado = document.getElementById("mensaje-estado-form");
  try {
    if (editandoId) {
      await updateDoc(doc(db, "productos", editandoId), datos);
      mensajeEstado.textContent = "Producto actualizado ✓";
    } else {
      await addDoc(collection(db, "productos"), datos);
      mensajeEstado.textContent = "Producto agregado ✓";
    }
    resetForm();
    setTimeout(() => (mensajeEstado.textContent = ""), 3000);
  } catch (err) {
    mensajeEstado.textContent = "Hubo un error al guardar. Revisá las reglas de Firestore.";
    console.error(err);
  }
});
