import {
  db,
  collection,
  getDocs,
  query,
  orderBy
} from "./firebase-init.js";

import { agregarAlCarrito } from "./cart.js";

const grilla = document.getElementById("grilla-productos");
const filtros = document.querySelectorAll(".filtro-categoria");
const mensajeVacio = document.getElementById("mensaje-vacio");

let productos = [];
let categoriaActiva = "Todas";

async function cargarProductos() {
  try {
    console.log("🔄 Cargando productos desde Firestore...");

    const q = query(
      collection(db, "productos"),
      orderBy("nombre")
    );

    const snapshot = await getDocs(q);

    productos = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    console.log("🟢 PRODUCTOS CARGADOS:", productos.length);
    console.log("📦 PRODUCTOS:", productos);

    render();

  } catch (error) {
    console.error("🔴 ERROR CARGANDO PRODUCTOS:", error);

    grilla.innerHTML = `
      <p class="error-catalogo">
        No se pudo cargar el catálogo.
      </p>
    `;
  }
}

filtros.forEach((btn) => {
  btn.addEventListener("click", () => {
    filtros.forEach((b) => b.classList.remove("activo"));

    btn.classList.add("activo");

    categoriaActiva = btn.dataset.categoria;

    render();
  });
});

function render() {
  const lista =
    categoriaActiva === "Todas"
      ? productos
      : productos.filter(
          (p) => p.categoria === categoriaActiva
        );

  if (lista.length === 0) {
    grilla.innerHTML = "";

    mensajeVacio.classList.remove("oculto");

    return;
  }

  mensajeVacio.classList.add("oculto");

  grilla.innerHTML = lista
    .map(
      (p) => `
        <article class="tarjeta-producto">

          <div class="marco-imagen">

            <img
              src="${
                p.imagenUrl ||
                "https://placehold.co/400x400/e8f5e0/2f6b4f?text=Sin+foto"
              }"
              alt="${p.nombre}"
              loading="lazy"
            >

            ${
              p.oferta
                ? '<span class="etiqueta-oferta">Oferta</span>'
                : ""
            }

          </div>

          <h3>${p.nombre}</h3>

          <p class="categoria-chip">
            ${p.categoria}
            ${p.subcategoria ? " · " + p.subcategoria : ""}
          </p>

          <p class="precio">
            $${Number(p.precio).toLocaleString("es-AR")}
          </p>

          ${
            p.disponible !== false
              ? `
                <p class="estado-stock disponible">
                  🟢 En stock
                </p>

                <button
                  class="boton-agregar"
                  data-id="${p.id}"
                >
                  Agregar al pedido
                </button>
              `
              : `
                <p class="estado-stock sin-stock">
                  🟠 Sin stock
                </p>

                <button
                  class="boton-agregar"
                  disabled
                >
                  Sin stock
                </button>
              `
          }

        </article>
      `
    )
    .join("");

  grilla
    .querySelectorAll(".boton-agregar")
    .forEach((btn) => {

      btn.addEventListener("click", () => {

        const producto = lista.find(
          (p) => p.id === btn.dataset.id
        );

        if (producto) {
          agregarAlCarrito(producto);
        }

      });

    });
}

// Cargar productos al abrir la página
cargarProductos();
