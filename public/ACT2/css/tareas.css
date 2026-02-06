const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

const makeId = () => `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

const escapeHTML = (str) => {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
};

const redirectToIndex = () => location.replace("/index.html");
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
if (!payload?.username || (payload.exp && Date.now() >= payload.exp * 1000)) redirectToIndex();

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
const btnAgregar = $("#btn-agregar");
const btnCancelarEdicion = $("#btn-cancelar-edicion");
const editId = $("#edit-id");

let tareaEditandoId = null;

if (inputCreado) {
  inputCreado.value = LOGGED_USER;
  inputCreado.readOnly = true;
}

const formatDate = (dateStr) => {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = meses[d.getMonth()];
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

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
    Object.assign(this, {
      id,
      nombre,
      descripcion,
      creadoPor,
      asignadoA,
      estado,
      fechaCreacion,
      fechaAsignacion,
      deadline
    });
  }

  toggle() {
    this.estado = this.estado === "completada" ? "pendiente" : "completada";
  }
}

class GestorDeTareas {
  constructor() {
    this.tareas = [];
    this.filtro = "todas";
    this.scope = "todas";
    this.cargar();
  }

  agregar(datos) {
    this.tareas.unshift(
      new Tarea(
        datos.nombre,
        datos.descripcion,
        LOGGED_USER,
        datos.asignadoA,
        datos.estado,
        makeId(),
        Date.now(),
        datos.asignadoA ? Date.now() : null,
        datos.deadline
      )
    );
    this.guardar();
  }

  editar(id, datos) {
    const t = this.tareas.find((t) => t.id === id);
    if (!t) return;
    Object.assign(t, datos);
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
    if (this.scope === "asignadas") return arr.filter((t) => t.asignadoA === LOGGED_USER);
    return arr;
  }

  filtrarPorEstado(arr) {
    if (this.filtro === "pendientes") return arr.filter((t) => t.estado === "pendiente");
    if (this.filtro === "completadas") return arr.filter((t) => t.estado === "completada");
    return arr;
  }

  obtenerFiltradas() {
    return this.filtrarPorEstado(this.filtrarPorScope(this.tareas));
  }

  statsFiltradas() {
    const base = this.filtrarPorScope(this.tareas);
    const done = base.filter((t) => t.estado === "completada").length;
    return { total: base.length, done, pend: base.length - done };
  }

  guardar() {
    localStorage.setItem("totalplay_tareas", JSON.stringify(this.tareas));
  }

  cargar() {
    const raw = localStorage.getItem("totalplay_tareas");
    if (raw) {
      this.tareas = JSON.parse(raw).map(
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

  if (statTotal) statTotal.textContent = total;
  if (statDone) statDone.textContent = done;
  if (statPend) statPend.textContent = pend;

  listaUI.innerHTML = filtradas.length
    ? filtradas
        .map(
          (t) => `
      <li class="task-item" data-id="${t.id}">
        <div class="task-left">
          <div class="task-topline">
            <span class="badge ${t.estado === "completada" ? "done" : "todo"}">
              ${t.estado === "completada" ? "Completada" : "Pendiente"}
            </span>
            <span class="task-name ${t.estado === "completada" ? "is-done" : ""}">
              ${escapeHTML(t.nombre)}
            </span>
          </div>

          <div class="task-meta" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px 20px;">
              <span>Creado por: <strong>${escapeHTML(t.creadoPor || "---")}</strong></span>
              <span>Para: <strong>${escapeHTML(t.asignadoA.trim() || "---")}</strong></span>
              <span>Fecha Creación: <strong>${formatDate(t.fechaCreacion)}</strong></span>
              <span>Fecha límite: <strong style="color: #e74c3c;">${formatDate(t.deadline)}</strong></span>
          </div>

          ${t.descripcion ? `<p>${escapeHTML(t.descripcion)}</p>` : ""}
        </div>

        <div class="task-actions">
          <button class="icon-btn primary" data-action="toggle">
            ${t.estado === "completada" ? "Reabrir" : "Completar"}
          </button>
          <button class="icon-btn" data-action="edit">Editar</button>
          <button class="icon-btn danger" data-action="delete">Eliminar</button>
        </div>
      </li>
    `
        )
        .join("")
    : `<li class="task-item"><em>No hay tareas</em></li>`;
};

const resetForm = () => {
  form.reset();
  if (inputCreado) inputCreado.value = LOGGED_USER;
  tareaEditandoId = null;
  editId.value = "";
  btnAgregar.textContent = "Agregar Tarea";
  btnCancelarEdicion.hidden = true;
};

const handleFilterActive = (clickedBtn) => {
  const group = clickedBtn.closest('.filters');
  if (group) {
    group.querySelectorAll('.chip').forEach(btn => btn.classList.remove('is-active'));
    clickedBtn.classList.add('is-active');
  }
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = {
    nombre: inputNombre.value.trim(),
    descripcion: inputDesc.value,
    asignadoA: inputAsignado.value.trim(),
    deadline: inputDeadline.value,
    estado: checkCompletada.checked ? "completada" : "pendiente"
  };
  if (!datos.nombre) return;
  if (tareaEditandoId) {
    gestor.editar(tareaEditandoId, datos);
  } else {
    gestor.agregar(datos);
  }
  resetForm();
  render();
});

listaUI.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const li = btn.closest("li");
  const id = li.dataset.id;

  if (btn.dataset.action === "edit") {
    const t = gestor.tareas.find((t) => t.id === id);
    if (!t) return;
    inputNombre.value = t.nombre;
    inputDesc.value = t.descripcion;
    inputAsignado.value = t.asignadoA;
    inputDeadline.value = t.deadline;
    checkCompletada.checked = t.estado === "completada";
    tareaEditandoId = id;
    editId.value = id;
    btnAgregar.textContent = "Guardar cambios";
    btnCancelarEdicion.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (btn.dataset.action === "toggle") gestor.toggle(id);
  if (btn.dataset.action === "delete") gestor.eliminar(id);
  render();
});

document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', (e) => {
    handleFilterActive(e.target);
    const id = e.target.id;
    if (id === 'btn-todas') gestor.filtro = "todas";
    if (id === 'btn-pendientes') gestor.filtro = "pendientes";
    if (id === 'btn-completadas') gestor.filtro = "completadas";
    if (id === 'btn-ver-todas') gestor.scope = "todas";
    if (id === 'btn-creadas-mi') gestor.scope = "creadas";
    if (id === 'btn-asignadas-mi') gestor.scope = "asignadas";
    render();
  });
});

btnCancelarEdicion.onclick = () => resetForm();
if ($("#btn-limpiar")) $("#btn-limpiar").onclick = () => resetForm();
if ($("#btn-borrar-todo")) {
    $("#btn-borrar-todo").onclick = () => {
        if(confirm("¿Eliminar todas las tareas?")) {
            gestor.tareas = [];
            gestor.guardar();
            render();
        }
    };
}

if ($("#btn-borrar-todo")) {
    $("#btn-borrar-todo").onclick = () => {
        if(confirm("¿Eliminar todas las tareas?")) {
            gestor.tareas = [];
            gestor.guardar();
            render();
        }
    };
}


if ($("#logoutLink")) {
  $("#logoutLink").onclick = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    redirectToIndex();
  };
}


render();
