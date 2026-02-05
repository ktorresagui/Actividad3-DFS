const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

const makeId = () => `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

const escapeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
};

const formatDate = (ts) => {
  if (!ts) return "---";
  const d = new Date(ts);
  const opciones = { day: "2-digit", month: "short", year: "numeric" };
  return d.toLocaleDateString("es-MX", opciones).replace(/\./g, "").replace(/ /g, "/");
};

const redirectToIndex = () => {
  location.replace("/index.html");
};

const getToken = () => localStorage.getItem("token");

const decodeJwtPayload = (token) => {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const token = getToken();
if (!token) redirectToIndex();

const payload = decodeJwtPayload(token);
if (!payload || !payload.username) redirectToIndex();
if (payload.exp && Date.now() >= payload.exp * 1000) redirectToIndex();

const LOGGED_USER = payload.username;

const form = $("#form-tarea");
const inputNombre = $("#nombre-tarea");
const inputDesc = $("#desc-tarea");
const inputCreado = $("#creado-por");
const inputAsignado = $("#asignado-a");
const inputDeadline = $("#fecha-limite");
const checkCompletada = $("#tarea-completa");
const listaUI = $("#lista-tareas");
const statTotal = $("#stat-total");
const statPend = $("#stat-pend");
const statDone = $("#stat-done");

if (inputCreado) {
  inputCreado.value = LOGGED_USER;
  inputCreado.readOnly = true;
}

class Tarea {
  constructor(
    nombre,
    descripcion = "",
    creadoPor = "",
    asignadoA = "",
    estado = "pendiente",
    id = makeId(),
    fechaCreacion = Date.now(),
    fechaAsignacion = null,
    deadline = null
  ) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.creadoPor = creadoPor;
    this.asignadoA = asignadoA;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.fechaAsignacion = fechaAsignacion;
    this.deadline = deadline;
  }

  toggle() {
    this.estado = this.estado === "completada" ? "pendiente" : "completada";
  }
}

class GestorDeTareas {
  constructor() {
    this.tareas = [];
    this.filtro = "todas";
    this.scope = "creadas";
    this.cargar();
  }

  agregar(datos) {
    const asignado = (datos.asignadoA || "").trim();
    const t = new Tarea(
      datos.nombre,
      datos.descripcion,
      LOGGED_USER,
      asignado,
      datos.estado,
      makeId(),
      Date.now(),
      asignado ? Date.now() : null,
      datos.deadline || null
    );
    this.tareas.unshift(t);
    this.guardar();
  }

  eliminar(id) {
    this.tareas = this.tareas.filter((t) => t.id !== id);
    this.guardar();
  }

  toggle(id) {
    const t = this.tareas.find((t) => t.id === id);
    if (t) t.toggle();
    this.guardar();
  }

  filtrarPorScope(arr) {
    if (this.scope === "creadas") return arr.filter((t) => t.creadoPor === LOGGED_USER);
    if (this.scope === "asignadas") return arr.filter((t) => (t.asignadoA || "").trim() === LOGGED_USER);
    return arr;
  }

  filtrarPorEstado(arr) {
    if (this.filtro === "pendientes") return arr.filter((t) => t.estado === "pendiente");
    if (this.filtro === "completadas") return arr.filter((t) => t.estado === "completada");
    return arr;
  }

  obtenerFiltradas() {
    const porScope = this.filtrarPorScope(this.tareas);
    return this.filtrarPorEstado(porScope);
  }

  statsFiltradas() {
    const base = this.filtrarPorScope(this.tareas);
    const total = base.length;
    const done = base.filter((t) => t.estado === "completada").length;
    return { total, done, pend: total - done };
  }

  guardar() {
    localStorage.setItem("totalplay_tareas", JSON.stringify(this.tareas));
  }

  cargar() {
    const raw = localStorage.getItem("totalplay_tareas");
    if (raw) {
      const datos = JSON.parse(raw);
      this.tareas = datos.map(
        (d) =>
          new Tarea(
            d.nombre,
            d.descripcion,
            d.creadoPor,
            d.asignadoA,
            d.estado,
            d.id,
            d.fechaCreacion,
            d.fechaAsignacion,
            d.deadline
          )
      );
    }
  }
}

const gestor = new GestorDeTareas();

const render = () => {
  const filtradas = gestor.obtenerFiltradas();
  const { total, done, pend } = gestor.statsFiltradas();

  statTotal.textContent = total;
  statDone.textContent = done;
  statPend.textContent = pend;

  listaUI.innerHTML =
    filtradas.length > 0
      ? filtradas
          .map((t) => {
            const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.estado !== "completada";
            return `
            <li class="task-item" data-id="${t.id}">
              <div class="task-left">
                <div class="task-topline">
                  <span class="badge ${t.estado === "completada" ? "done" : "todo"}">${t.estado}</span>
                  <span class="task-name ${t.estado === "completada" ? "is-done" : ""}">${escapeHTML(t.nombre)}</span>
                </div>

                <div style="margin: 5px 0; font-size: 0.9em; color: #555;">
                  ${escapeHTML(t.descripcion) || "Sin descripción"}
                </div>

                <div class="task-meta" style="font-size: 0.8em; color: #777; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                  <span> Por: ${escapeHTML(t.creadoPor) || "---"}</span>
                  <span> Para: ${escapeHTML(t.asignadoA) || "---"}</span>
                  <span style="${isOverdue ? "color: #e74c3c; font-weight: bold;" : ""}"> Límite: ${formatDate(t.deadline)}</span>
                  <span> Registro: ${formatDate(t.fechaCreacion)}</span>
                </div>
              </div>

              <div class="task-actions">
                <button class="icon-btn primary" data-action="toggle">${t.estado === "completada" ? "Reabrir" : "Completar"}</button>
                <button class="icon-btn danger" data-action="delete">Eliminar</button>
              </div>
            </li>`;
          })
          .join("")
      : `<li style="padding: 20px; text-align: center; color: #888;">No hay tareas.</li>`;
};

const logout = document.getElementById("logoutLink");
if (logout) {
  logout.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    location.replace("../../ACT3/pages/login.html");
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  if (!nombre) return;

  gestor.agregar({
    nombre,
    descripcion: inputDesc.value,
    asignadoA: inputAsignado.value,
    deadline: inputDeadline.value,
    estado: checkCompletada.checked ? "completada" : "pendiente"
  });

  form.reset();
  if (inputCreado) inputCreado.value = LOGGED_USER;
  render();
});

listaUI.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const li = btn.closest("li");
  if (!li) return;

  const id = li.dataset.id;
  const action = btn.dataset.action;

  if (action === "toggle") gestor.toggle(id);
  if (action === "delete") gestor.eliminar(id);

  render();
});

$$(".chip[data-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".chip[data-filter]").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    gestor.filtro = btn.dataset.filter;
    render();
  });
});


$$(".chip[data-scope]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".chip[data-scope]").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    gestor.scope = btn.dataset.scope;
    render();
  });
});

$("#btn-borrar-todo").addEventListener("click", () => {
  if (confirm("¿Borrar todo?")) {
    gestor.tareas = [];
    gestor.guardar();
    render();
  }
});

$("#btn-limpiar").addEventListener("click", () => {
  form.reset();
  if (inputCreado) inputCreado.value = LOGGED_USER;
});

render();
