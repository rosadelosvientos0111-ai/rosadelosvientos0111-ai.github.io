import { WHATSAPP_NUMERO } from "./firebase-config.js";

let carrito = [];

const panelCarrito = document.getElementById("panel-carrito");
const listaCarrito = document.getElementById("lista-carrito");
const totalCarrito = document.getElementById("total-carrito");
const contadorCarrito = document.getElementById("contador-carrito");
const btnAbrirCarrito = document.getElementById("btn-carrito");
const btnCerrarCarrito = document.getElementById("cerrar-carrito");
const btnEnviarPedido = document.getElementById("btn-enviar-pedido");

export function agregarAlCarrito(producto) {
  const existente = carrito.find((p) => p.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  actualizarVista();
  panelCarrito.classList.add("abierto");
}

function quitarDelCarrito(id) {
  carrito = carrito.filter((p) => p.id !== id);
  actualizarVista();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find((p) => p.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    quitarDelCarrito(id);
  } else {
    actualizarVista();
  }
}

function actualizarVista() {
  const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
  contadorCarrito.textContent = totalItems;
  contadorCarrito.classList.toggle("oculto", totalItems === 0);

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p class="carrito-vacio">Todavía no agregaste productos.</p>`;
    totalCarrito.textContent = "$0";
    return;
  }

  listaCarrito.innerHTML = carrito
    .map(
      (p) => `
    <div class="item-carrito">
      <div class="item-info">
        <strong>${p.nombre}</strong>
        <span>$${Number(p.precio).toLocaleString("es-AR")} c/u</span>
      </div>
      <div class="item-cantidad">
        <button data-accion="restar" data-id="${p.id}">−</button>
        <span>${p.cantidad}</span>
        <button data-accion="sumar" data-id="${p.id}">+</button>
      </div>
      <button class="item-quitar" data-accion="quitar" data-id="${p.id}" aria-label="Quitar">✕</button>
    </div>
  `
    )
    .join("");

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  totalCarrito.textContent = `$${total.toLocaleString("es-AR")}`;

  listaCarrito.querySelectorAll("button[data-accion]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.accion === "sumar") cambiarCantidad(id, 1);
      if (btn.dataset.accion === "restar") cambiarCantidad(id, -1);
      if (btn.dataset.accion === "quitar") quitarDelCarrito(id);
    });
  });
}

btnAbrirCarrito?.addEventListener("click", () => {
  panelCarrito.classList.add("abierto");
});
btnCerrarCarrito?.addEventListener("click", () => {
  panelCarrito.classList.remove("abierto");
});

btnEnviarPedido?.addEventListener("click", () => {
  if (carrito.length === 0) return;
  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  let mensaje = "¡Hola! Quiero hacer este pedido:%0A%0A";
  carrito.forEach((p) => {
    mensaje += `• ${p.cantidad}x ${p.nombre} - $${Number(p.precio).toLocaleString("es-AR")}%0A`;
  });
  mensaje += `%0ATotal: $${total.toLocaleString("es-AR")}`;
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensaje}`;
  window.open(url, "_blank");
});

actualizarVista();
