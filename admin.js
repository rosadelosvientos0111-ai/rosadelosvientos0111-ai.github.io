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
  getDocsFromServer,
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
const inputArchivoImagen = document.getElementById("input-archivo-imagen");
const mensajeImagen = document.getElementById("mensaje-imagen");
const vistaPreviaImagen = document.getElementById("vista-previa-imagen");

const CLOUDINARY_CLOUD_NAME = "bdlkfwhf";
const CLOUDINARY_UPLOAD_PRESET = "Rosa de los vientos";
const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
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
inputArchivoImagen?.addEventListener("change", async () => {
  const archivo = inputArchivoImagen.files[0];

  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = (e) => {
    vistaPreviaImagen.src = e.target.result;
    vistaPreviaImagen.style.display = "block";
  };

  lector.readAsDataURL(archivo);

  mensajeImagen.textContent = "Subiendo imagen...";

  try {
    const datos = new FormData();
    datos.append("file", archivo);
    datos.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const respuesta = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: datos
    });

    if (!respuesta.ok) {
      throw new Error("Error al subir la imagen");
    }

    const resultado = await respuesta.json();

    document.getElementById("input-imagen").value =
      resultado.secure_url;

  } catch (error) {
    console.error(error);
    mensajeImagen.textContent =
      "❌ No se pudo cargar la imagen";
  }
});
const q = query(collection(db, "productos"), orderBy("nombre"));

getDocsFromServer(q)
  .then((snapshot) => {
    console.log("🧪 LECTURA DIRECTA DEL SERVIDOR:", snapshot.docs.length);
    console.log(
      "🧪 DATOS DEL SERVIDOR:",
      snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))
    );
  })
  .catch((error) => {
    console.error("🔴 ERROR LECTURA DIRECTA DEL SERVIDOR");
    console.error("📌 CÓDIGO:", error.code);
    console.error("📌 NOMBRE:", error.name);
    console.error("📌 MENSAJE:", error.message);
    console.error("📌 ERROR COMPLETO:", error);
  });

onSnapshot(
  q,
  { includeMetadataChanges: true },
  (snapshot) => {
    console.log("🟢 PRODUCTOS LEÍDOS:", snapshot.docs.length);
    console.log("🌐 ¿VIENE DE CACHÉ?:", snapshot.metadata.fromCache);
    console.log("⏳ ¿HAY CAMBIOS PENDIENTES?:", snapshot.metadata.hasPendingWrites);

    const productos = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    console.log("📦 PRODUCTOS:", productos);

    tabla.innerHTML = productos
    .map(
      (p) => `
    <tr>
      <td><img src="${p.imagenUrl || "https://placehold.co/60x60/e8f5e0/2f6b4f?text=%20"}" alt="" class="miniatura"></td>
      <td>${p.nombre}</td>
      <td>${p.categoria}${p.subcategoria ? " · " + p.subcategoria : ""}</td>
      <td>$${Number(p.precio).toLocaleString("es-AR")}</td>
      <td>
        <select class="selector-stock" data-id="${p.id}">
          <option value="disponible" ${(p.disponible !== false) ? "selected" : ""}>
            🟢 En stock
          </option>
          <option value="sin-stock" ${p.disponible === false ? "selected" : ""}>
            🟠 Sin stock
          </option>
        </select>
      </td>
      <td>${p.oferta ? "Sí" : "No"}</td>
      <td class="acciones-tabla">
        <button data-accion="guardar" data-id="${p.id}">💾 Guardar</button>
        <button data-accion="editar" data-id="${p.id}">Editar</button>
        <button data-accion="borrar" data-id="${p.id}" class="boton-borrar">🗑️ Eliminar</button>
      </td>
    </tr>
  `
    )
    .join("");

  tabla.querySelectorAll("button[data-accion]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const producto = productos.find((p) => p.id === btn.dataset.id);
      if (btn.dataset.accion === "guardar") guardarEstadoProducto(producto.id);
      if (btn.dataset.accion === "editar") cargarParaEditar(producto);
      if (btn.dataset.accion === "borrar") borrarProducto(producto.id);
    });
  });

  },
  (error) => {
    console.error("🔴 ERROR AL LEER PRODUCTOS:", error);
  }
);
async function guardarEstadoProducto(id) {
  const selector = document.querySelector(
    `.selector-stock[data-id="${id}"]`
  );

  const disponible = selector.value === "disponible";

  try {
    await updateDoc(doc(db, "productos", id), {
      disponible
    });
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el estado del producto.");
  }
}
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
  inputArchivoImagen.value = "";
  mensajeImagen.textContent = "";
  vistaPreviaImagen.style.display = "none";
  vistaPreviaImagen.src = "";
  tituloForm.textContent = "Agregar producto nuevo";
  btnCancelarEdicion.classList.add("oculto");
}
async function borrarProducto(id) {
  if (!confirm("¿Seguro que querés borrar este producto? No se puede deshacer.")) return;
  await deleteDoc(doc(db, "productos", id));
}

form?.addEventListener("submit", async (e) => {
  console.log("🔥 SE EJECUTÓ EL SUBMIT");
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
     console.log("✅ Producto actualizado:", editandoId);
     mensajeEstado.textContent = "Producto actualizado ✓";
   } else {
     const docRef = await addDoc(collection(db, "productos"), {
       ...datos,
       disponible: true
     });

     console.log("✅ PRODUCTO GUARDADO EN FIRESTORE");
     console.log("🆔 ID del producto:", docRef.id);
     console.log("📦 Datos:", datos);

  mensajeEstado.textContent = "Producto agregado ✓";
}

    form.reset();
    inputArchivoImagen.value = "";
    mensajeImagen.textContent = "";
    vistaPreviaImagen.style.display = "none";
    vistaPreviaImagen.src = "";
    editandoId = null;
    tituloForm.textContent = "Agregar producto nuevo";
    btnCancelarEdicion.classList.add("oculto");

    setTimeout(() => (mensajeEstado.textContent = ""), 3000);
  } catch (err) {
    mensajeEstado.textContent = "Hubo un error al guardar. Revisá las reglas de Firestore.";
    console.error(err);
  }
});
