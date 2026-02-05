const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secreto_dev";

const USERS_FILE = path.join(__dirname, "Usuarios.json");
const TASKS_FILE = path.join(__dirname, "Tareas.json");
const PUBLIC_DIR = path.join(__dirname, "public");

async function ensureFile(filePath, defaultValue) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

async function readJSON(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw e;
  }
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) return res.status(401).json({ error: "Token requerido" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "../../index.html"));
});

app.post(["/register", "/api/register"], async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username y password son requeridos" });

    const users = await readJSON(USERS_FILE, []);
    if (users.some((u) => u.username === username)) return res.status(409).json({ error: "Usuario ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ id: Date.now().toString(), username, passwordHash });
    await writeJSON(USERS_FILE, users);

    res.status(201).json({ message: "Registro exitoso" });
  } catch (err) {
    next(err);
  }
});

app.post(["/login", "/api/login"], async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username y password son requeridos" });

    const users = await readJSON(USERS_FILE, []);
    const user = users.find((u) => u.username === username);
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

app.get(["/tareas", "/api/tareas"], auth, async (req, res, next) => {
  try {
    const tareas = await readJSON(TASKS_FILE, []);
    res.json(tareas);
  } catch (err) {
    next(err);
  }
});

app.post(["/tareas", "/api/tareas"], auth, async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body || {};
    if (!titulo || !descripcion) return res.status(400).json({ error: "titulo y descripcion son requeridos" });

    const tareas = await readJSON(TASKS_FILE, []);
    const nueva = { id: Date.now().toString(), titulo, descripcion };
    tareas.push(nueva);
    await writeJSON(TASKS_FILE, tareas);

    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
});

app.put(["/tareas/:id", "/api/tareas/:id"], auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body || {};

    const tareas = await readJSON(TASKS_FILE, []);
    const idx = tareas.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Tarea no encontrada" });

    if (titulo !== undefined) tareas[idx].titulo = titulo;
    if (descripcion !== undefined) tareas[idx].descripcion = descripcion;

    await writeJSON(TASKS_FILE, tareas);
    res.json(tareas[idx]);
  } catch (err) {
    next(err);
  }
});

app.delete(["/tareas/:id", "/api/tareas/:id"], auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const tareas = await readJSON(TASKS_FILE, []);
    const idx = tareas.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: "Tarea no encontrada" });

    const [deleted] = tareas.splice(idx, 1);
    await writeJSON(TASKS_FILE, tareas);

    res.json({ message: "Eliminada", tarea: deleted });
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

(async () => {
  await ensureFile(USERS_FILE, []);
  await ensureFile(TASKS_FILE, []);
  app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
})();
