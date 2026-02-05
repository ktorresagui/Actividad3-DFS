const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const msg = document.getElementById("msg");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const togglePass = document.getElementById("togglePass");
const loginPass = document.getElementById("loginPass");

const HIDE_CLASS = "is-hidden";

if (localStorage.getItem("token")) {
  location.href = "../../ACT2/pages/tareas.html";
}

function setMsg(text, type) {
  if (!msg) return;
  msg.textContent = text || "";
  msg.className = "msg" + (type ? ` msg--${type}` : "");
}

function setLoading(form, loading) {
  if (!form) return;
  const btn = form.querySelector("button[type='submit']");
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Procesando..." : (form.id === "loginForm" ? "Entrar" : "Registrarme");
}

function showRegisterView() {
  setMsg("");
  if (loginForm) loginForm.classList.add(HIDE_CLASS);
  if (registerForm) registerForm.classList.remove(HIDE_CLASS);
}

function showLoginView() {
  setMsg("");
  if (registerForm) registerForm.classList.add(HIDE_CLASS);
  if (loginForm) loginForm.classList.remove(HIDE_CLASS);
}

if (showRegister) {
  showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    showRegisterView();
  });
}

if (showLogin) {
  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginView();
  });
}

if (togglePass && loginPass) {
  togglePass.addEventListener("click", () => {
    const isPass = loginPass.type === "password";
    loginPass.type = isPass ? "text" : "password";
    togglePass.textContent = isPass ? "Ocultar" : "Ver";
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(loginForm, true);

    const username = document.getElementById("loginUser")?.value.trim();
    const password = loginPass?.value;

    if (!username || !password) {
      setMsg("Completa usuario y contraseña.", "err");
      setLoading(loginForm, false);
      return;
    }

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        setMsg(data.error || "No se pudo iniciar sesión", "err");
        return;
      }

      localStorage.setItem("token", data.token);
      setMsg("Login exitoso. Redirigiendo...", "ok");
      setTimeout(() => (location.href = "../../ACT2/pages/tareas.html"), 350);
    } catch {
      setMsg("Error de red o servidor apagado", "err");
    } finally {
      setLoading(loginForm, false);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(registerForm, true);

    const username = document.getElementById("regUser")?.value.trim();
    const password = document.getElementById("regPass")?.value;

    if (!username || !password) {
      setMsg("Completa usuario y contraseña.", "err");
      setLoading(registerForm, false);
      return;
    }

    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        setMsg(data.error || "No se pudo registrar", "err");
        return;
      }

      setMsg("Registro exitoso. Ahora inicia sesión.", "ok");
      registerForm.reset();
      showLoginView();
    } catch {
      setMsg("Error de red o servidor apagado", "err");
    } finally {
      setLoading(registerForm, false);
    }
  });
}
