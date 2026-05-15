// --- CONFIGURACIÓN DEL TEMPORIZADOR ---
const TIEMPOS = {
  work: 1 * 60,
  shortBreak: 1 * 60,
  longBreak: 1 * 60,
};

let tiempoRestante = TIEMPOS.work;
let intervalo = null;
let modoActual = "work";
let pomodorosCompletados = 0;

// Elementos del DOM - Temporizador
const displayTiempo = document.getElementById("time-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnReset = document.getElementById("btn-reset");
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const botonesModo = {
  work: document.getElementById("btn-work"),
  shortBreak: document.getElementById("btn-short-break"),
  longBreak: document.getElementById("btn-long-break"),
};

// --- LÓGICA DEL ANILLO DE PROGRESO ---
const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI; // Fórmula de la circunferencia (2 * π * r)

// Configuración inicial del trazo del círculo
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = 0;

function setProgreso(porcentaje) {
  // Calcula cuánto borde debe ocultarse
  const offset = circumference - (porcentaje / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

// --- ACTUALIZAR FUNCIÓN EXISTENTE ---
function actualizarDisplay() {
  const tiempoFormateado = formatearTiempo(tiempoRestante);
  displayTiempo.textContent = tiempoFormateado;
  document.title = `${tiempoFormateado} - FocusFlow`;

  // Lógica para reducir el círculo
  const tiempoTotalModoActual = TIEMPOS[modoActual];
  const porcentajeRestante = (tiempoRestante / tiempoTotalModoActual) * 100;

  setProgreso(porcentajeRestante);
}

// Formatear tiempo (MM:SS)
function formatearTiempo(segundosTotales) {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
}

// Cambiar de modo (Trabajo / Descanso)
function cambiarModo(nuevoModo) {
  modoActual = nuevoModo;
  tiempoRestante = TIEMPOS[nuevoModo];

  // Mapear los nombres de JS (camelCase) a las clases de CSS (kebab-case)
  const claseCSS = nuevoModo === "shortBreak" ? "short-break" : nuevoModo === "longBreak" ? "long-break" : "work";

  // Cambiar clases de color de fondo (Psicología del color)
  document.body.className = "";
  document.body.classList.add(`mode-${claseCSS}`);

  // Actualizar botones activos
  Object.values(botonesModo).forEach((btn) => btn.classList.remove("active"));
  botonesModo[nuevoModo].classList.add("active");

  detenerTemporizador();
  actualizarDisplay();

  reproducirBeep();
}

// Iniciar temporizador
function iniciarTemporizador() {
  if (intervalo !== null) return;

  intervalo = setInterval(() => {
    tiempoRestante--;
    actualizarDisplay();

    if (tiempoRestante <= 0) {
      detenerTemporizador();
      transicionAutomatica();
    }
  }, 1000);
}

function detenerTemporizador() {
  clearInterval(intervalo);
  intervalo = null;
}

function reiniciarTemporizador() {
  detenerTemporizador();
  tiempoRestante = TIEMPOS[modoActual];
  actualizarDisplay();
}

// Transición automática al finalizar el tiempo
function transicionAutomatica() {
  if (modoActual === "work") {
    pomodorosCompletados++;
    // Descanso largo cada 4 pomodoros
    if (pomodorosCompletados % 4 === 0) {
      cambiarModo("longBreak");
    } else {
      cambiarModo("shortBreak");
    }
  } else {
    cambiarModo("work");
  }
  // Opcional: Sonido de notificación podría ir aquí
  iniciarTemporizador();
}

function reproducirBeep() {
  // Los navegadores pausan el audio hasta que el usuario interactúa, esto lo reanuda
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const oscilador = audioCtx.createOscillator();
  const ganancia = audioCtx.createGain();

  // Configuración del sonido
  oscilador.type = "triangle"; // Onda triangular para mayor intensidad
  oscilador.frequency.setValueAtTime(800, audioCtx.currentTime); // Frecuencia del beep

  // Control de volumen y duración
  const duracion = 0.8; // Aumentado a 0.8 segundos
  ganancia.gain.setValueAtTime(0.8, audioCtx.currentTime); // Volumen inicial más alto (0.8)
  ganancia.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duracion);

  // Conectar los nodos de audio
  oscilador.connect(ganancia);
  ganancia.connect(audioCtx.destination);

  // Iniciar y detener
  oscilador.start();
  oscilador.stop(audioCtx.currentTime + duracion);
}

// Event Listeners del Temporizador
btnStart.addEventListener("click", iniciarTemporizador);
btnPause.addEventListener("click", detenerTemporizador);
btnReset.addEventListener("click", reiniciarTemporizador);

Object.keys(botonesModo).forEach((modo) => {
  botonesModo[modo].addEventListener("click", () => cambiarModo(modo));
});

// --- GESTIÓN DE TAREAS (LOCALSTORAGE) ---
const inputTarea = document.getElementById("task-input");
const btnAñadirTarea = document.getElementById("btn-add-task");
const listaTareas = document.getElementById("task-list");

// Cargar tareas guardadas
let tareas = JSON.parse(localStorage.getItem("focusflow_tareas")) || [];

function guardarTareas() {
  localStorage.setItem("focusflow_tareas", JSON.stringify(tareas));
}

function renderizarTareas() {
  listaTareas.innerHTML = "";
  tareas.forEach((tarea, index) => {
    const li = document.createElement("li");
    if (tarea.completada) li.classList.add("completed");

    li.innerHTML = `
            <span style="cursor:pointer;" onclick="toggleTarea(${index})">${tarea.texto}</span>
            <button class="delete-btn" onclick="eliminarTarea(${index})">✖</button>
        `;
    listaTareas.appendChild(li);
  });
}

function añadirTarea() {
  const texto = inputTarea.value.trim();
  if (texto !== "") {
    tareas.push({ texto, completada: false });
    inputTarea.value = "";
    guardarTareas();
    renderizarTareas();
  }
}

// Hacer globales para poder llamarlas desde los atributos onclick
window.toggleTarea = function (index) {
  tareas[index].completada = !tareas[index].completada;
  guardarTareas();
  renderizarTareas();
};

window.eliminarTarea = function (index) {
  tareas.splice(index, 1);
  guardarTareas();
  renderizarTareas();
};

// Event Listeners de Tareas
btnAñadirTarea.addEventListener("click", añadirTarea);
inputTarea.addEventListener("keypress", (e) => {
  if (e.key === "Enter") añadirTarea();
});

// Inicialización
actualizarDisplay();
renderizarTareas();