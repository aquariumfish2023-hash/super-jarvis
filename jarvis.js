/* =========================================================
   SUPER JARVIS V1
   Asistente personal - versión corregida
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const TASKS_KEY = "super_jarvis_v1_tasks";

let tasks = loadTasks();

let recognition = null;
let isListening = false;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const chat = document.getElementById("chat");
const commandInput = document.getElementById("commandInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const micStatus = document.getElementById("micStatus");
const tasksList = document.getElementById("tasksList");
const greeting = document.getElementById("greeting");

const btnTime = document.getElementById("btnTime");
const btnDate = document.getElementById("btnDate");
const btnTasks = document.getElementById("btnTasks");
const btnHelp = document.getElementById("btnHelp");


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  updateGreeting();
  renderTasks();
  setupSpeechRecognition();

  /* Botón enviar */
  sendBtn.addEventListener("click", () => {
    submitCommand();
  });

  /* Enter en el cuadro de texto */
  commandInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
      event.preventDefault();
      submitCommand();
    }

  });

  /* Botones rápidos */

  btnTime.addEventListener("click", () => {
    processCommand("¿Qué hora es?");
  });

  btnDate.addEventListener("click", () => {
    processCommand("¿Qué fecha es hoy?");
  });

  btnTasks.addEventListener("click", () => {
    processCommand("muéstrame mis tareas");
  });

  btnHelp.addEventListener("click", () => {
    processCommand("ayuda");
  });

  /* Micrófono */

  micBtn.addEventListener("click", () => {

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }

  });

});


/* =========================================================
   SALUDO
   ========================================================= */

function updateGreeting() {

  const hour = new Date().getHours();

  let text = "Buenos días. Estoy listo para ayudarte.";

  if (hour >= 12 && hour < 19) {
    text = "Buenas tardes. Estoy listo para ayudarte.";
  }

  if (hour >= 19 || hour < 5) {
    text = "Buenas noches. Estoy listo para ayudarte.";
  }

  greeting.textContent = text;

}


/* =========================================================
   COMANDO ESCRITO
   ========================================================= */

function submitCommand() {

  const command = commandInput.value.trim();

  if (!command) {
    return;
  }

  processCommand(command);

  commandInput.value = "";
  commandInput.focus();

}


/* =========================================================
   PROCESADOR PRINCIPAL
   ========================================================= */

function processCommand(command) {

  const originalCommand = command.trim();

  if (!originalCommand) {
    return;
  }

  addMessage(originalCommand, "user");

  const text = normalizeText(originalCommand);

  let response = "";


  /* SALUDOS */

  if (
    text.includes("hola") ||
    text.includes("buenos dias") ||
    text.includes("buenas tardes") ||
    text.includes("buenas noches")
  ) {

    response = getGreetingResponse();

  }


  /* HORA */

  else if (
    text.includes("que hora es") ||
    text.includes("dime la hora") ||
    text === "hora"
  ) {

    response = getTime();

  }


  /* FECHA */

  else if (
    text.includes("que fecha es") ||
    text.includes("que dia es") ||
    text.includes("dime la fecha") ||
    text === "fecha"
  ) {

    response = getDate();

  }


  /* IDENTIDAD */

  else if (
    text.includes("quien eres") ||
    text.includes("como te llamas") ||
    text.includes("tu nombre")
  ) {

    response =
      "Soy Super JARVIS, tu asistente personal. " +
      "Estoy aquí para ayudarte a organizar tu día.";

  }


  /* TAREAS */

  else if (
    text.includes("mis tareas") ||
    text.includes("ver tareas") ||
    text.includes("mostrar tareas") ||
    text.includes("muestrame mis tareas") ||
    text.includes("que tengo pendiente")
  ) {

    response = showTasks();

  }


  /* BORRAR TODAS LAS TAREAS */

  else if (
    text.includes("borra todas las tareas") ||
    text.includes("elimina todas las tareas") ||
    text.includes("borrar todas las tareas")
  ) {

    tasks = [];
    saveTasks();
    renderTasks();

    response = "He eliminado todas las tareas.";

  }


  /* AYUDA */

  else if (
    text === "ayuda" ||
    text.includes("que puedes hacer") ||
    text.includes("comandos")
  ) {

    response =
      "Puedo decirte la hora y la fecha, guardar tareas, " +
      "mostrar tus tareas, saludarte y recibir comandos por voz.";

  }


  /* AGREGAR TAREA */

  else if (
    text.includes("agrega tarea") ||
    text.includes("añade tarea") ||
    text.includes("anade tarea") ||
    text.includes("crear tarea") ||
    text.includes("crea tarea") ||
    text.includes("nueva tarea") ||
    text.includes("recuérdame") ||
    text.includes("recuerdame") ||
    text.startsWith("tarea ")
  ) {

    response = createTaskFromCommand(originalCommand);

  }


  /* COMANDO DESCONOCIDO */

  else {

    response =
      "Entendido. Todavía estoy aprendiendo ese comando. " +
      "Prueba diciendo: ¿qué hora es?, ¿qué fecha es?, " +
      "mis tareas, o recuérdame comprar comida para los peces.";

  }


  addMessage(response, "jarvis");
  speak(response);

}


/* =========================================================
   RESPUESTAS BÁSICAS
   ========================================================= */

function getGreetingResponse() {

  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Buenos días. ¿En qué puedo ayudarte?";
  }

  if (hour >= 12 && hour < 19) {
    return "Buenas tardes. ¿En qué puedo ayudarte?";
  }

  return "Buenas noches. ¿En qué puedo ayudarte?";

}


function getTime() {

  const now = new Date();

  return "Son las " +
    now.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit"
    }) + ".";

}


function getDate() {

  const now = new Date();

  return "Hoy es " +
    now.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }) + ".";

}


/* =========================================================
   TAREAS
   ========================================================= */

function createTaskFromCommand(command) {

  let taskText = command;

  const patterns = [
    /recuérdame/i,
    /recuerdame/i,
    /agrega tarea/i,
    /añade tarea/i,
    /anade tarea/i,
    /crear tarea/i,
    /crea tarea/i,
    /nueva tarea/i,
    /^tarea/i
  ];

  for (const pattern of patterns) {
    taskText = taskText.replace(pattern, "");
  }

  taskText = taskText.trim();

  taskText = taskText.replace(
    /^(que|de|para)\s+/i,
    ""
  ).trim();

  if (!taskText) {

    return "Claro. ¿Qué tarea quieres que recuerde?";

  }

  addTask(taskText);

  return `He guardado la tarea: ${taskText}.`;

}


function addTask(text) {

  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);

  saveTasks();
  renderTasks();

}


function showTasks() {

  if (tasks.length === 0) {

    return "No tienes tareas pendientes.";

  }

  const pending = tasks.filter(task => !task.completed);

  if (pending.length === 0) {

    return "No tienes tareas pendientes. Todas están completadas.";

  }

  const list = pending
    .map((task, index) => `${index + 1}. ${task.text}`)
    .join(". ");

  return `Tienes ${pending.length} tarea(s) pendiente(s): ${list}.`;

}


/* =========================================================
   RENDERIZAR TAREAS
   ========================================================= */

function renderTasks() {

  if (!tasksList) {
    return;
  }

  if (tasks.length === 0) {

    tasksList.innerHTML =
      '<div class="empty-tasks">No tienes tareas pendientes.</div>';

    return;

  }

  tasksList.innerHTML = "";

  tasks.forEach(task => {

    const taskElement = document.createElement("div");

    taskElement.className =
      "task" + (task.completed ? " completed" : "");

    /* Checkbox */

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", () => {

      task.completed = checkbox.checked;

      saveTasks();
      renderTasks();

    });


    /* Texto */

    const textElement = document.createElement("div");

    textElement.className = "task-text";
    textElement.textContent = task.text;


    /* Eliminar */

    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-task";
    deleteButton.textContent = "✕";
    deleteButton.title = "Eliminar tarea";

    deleteButton.addEventListener("click", () => {

      tasks = tasks.filter(item => item.id !== task.id);

      saveTasks();
      renderTasks();

    });


    taskElement.appendChild(checkbox);
    taskElement.appendChild(textElement);
    taskElement.appendChild(deleteButton);

    tasksList.appendChild(taskElement);

  });

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadTasks() {

  try {

    const saved = localStorage.getItem(TASKS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {

    console.error("Error cargando tareas:", error);

    return [];

  }

}


function saveTasks() {

  try {

    localStorage.setItem(
      TASKS_KEY,
      JSON.stringify(tasks)
    );

  } catch (error) {

    console.error("Error guardando tareas:", error);

  }

}


/* =========================================================
   CHAT
   ========================================================= */

function addMessage(text, sender) {

  if (!chat) {
    return;
  }

  const message = document.createElement("div");

  message.className =
    sender === "user"
      ? "message user-message"
      : "message jarvis-message";

  if (sender === "jarvis") {

    message.innerHTML =
      '<div class="message-name">JARVIS</div>';

    const content = document.createElement("div");
    content.textContent = text;

    message.appendChild(content);

  } else {

    message.textContent = text;

  }

  chat.appendChild(message);

  message.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });

}


/* =========================================================
   VOZ - SÍNTESIS
   ========================================================= */

function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = "es-CO";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);

}


/* =========================================================
   RECONOCIMIENTO DE VOZ
   ========================================================= */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    micStatus.textContent =
      "El reconocimiento de voz no está disponible en este navegador.";

    micBtn.disabled = true;
    micBtn.style.opacity = "0.45";

    return;

  }

  recognition = new SpeechRecognition();

  recognition.lang = "es-CO";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;


  recognition.onstart = () => {

    isListening = true;

    micBtn.classList.add("listening");

    micStatus.textContent =
      "JARVIS está escuchando...";

  };


  recognition.onresult = (event) => {

    const result =
      event.results[0][0].transcript;

    commandInput.value = result;

    micStatus.textContent =
      "Comando recibido.";

    processCommand(result);

    commandInput.value = "";

  };


  recognition.onerror = (event) => {

    console.error("Error de reconocimiento:", event.error);

    isListening = false;

    micBtn.classList.remove("listening");

    if (event.error === "not-allowed") {

      micStatus.textContent =
        "Debes permitir el acceso al micrófono.";

    } else if (event.error === "no-speech") {

      micStatus.textContent =
        "No escuché nada. Inténtalo nuevamente.";

    } else {

      micStatus.textContent =
        "No pude escuchar. Inténtalo nuevamente.";

    }

  };


  recognition.onend = () => {

    isListening = false;

    micBtn.classList.remove("listening");

    if (
      micStatus.textContent ===
      "JARVIS está escuchando..."
    ) {

      micStatus.textContent =
        "Pulsa el micrófono para hablar";

    }

  };

}


/* =========================================================
   ACTIVAR MICRÓFONO
   ========================================================= */

function startListening() {

  if (!recognition) {

    setupSpeechRecognition();

    if (!recognition) {
      return;
    }

  }

  try {

    recognition.start();

  } catch (error) {

    console.log("Micrófono:", error);

  }

}


/* =========================================================
   DETENER MICRÓFONO
   ========================================================= */

function stopListening() {

  if (!recognition) {
    return;
  }

  try {

    recognition.stop();

  } catch (error) {

    console.log("Micrófono:", error);

  }

}


/* =========================================================
   NORMALIZAR TEXTO
   ========================================================= */

function normalizeText(text) {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}


/* =========================================================
   API INTERNA PARA FUTURAS VERSIONES
   ========================================================= */

window.JARVIS = {

  processCommand,
  addTask,
  showTasks,
  speak,

  getTasks: () => [...tasks],

  clearTasks: () => {

    tasks = [];

    saveTasks();
    renderTasks();

  }

};
