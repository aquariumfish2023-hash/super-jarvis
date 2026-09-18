/* =========================================================
   SUPER JARVIS V2
   Cerebro local: entiende lenguaje natural sin depender de API
   ========================================================= */
"use strict";

const TASKS_KEY = "super_jarvis_v2_tasks";
const NOTES_KEY = "super_jarvis_v2_notes";
const VOICE_KEY = "super_jarvis_voice";
let tasks = loadArray(TASKS_KEY);
let notes = loadArray(NOTES_KEY);
let recognition = null;
let isListening = false;
let busyTimer = null;
let availableVoices = [];
let jarvisVoice = null;
let voiceSelect = null;
let voiceStatus = null;

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


document.addEventListener("DOMContentLoaded", () => {
  updateGreeting();
  renderTasks();
  setupVoiceControls();
  setupSpeechRecognition();
  setupJarvisVoice();
  sendBtn.addEventListener("click", submitCommand);
  commandInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); submitCommand(); }
  });
  btnTime.addEventListener("click", () => processCommand("dime la hora"));
  btnDate.addEventListener("click", () => processCommand("dime la fecha"));
  btnTasks.addEventListener("click", () => processCommand("muéstrame mis tareas"));
  btnHelp.addEventListener("click", () => processCommand("ayuda"));
  micBtn.addEventListener("click", () => isListening ? stopListening() : startListening());
});

function updateGreeting() {
  const h = new Date().getHours();
  greeting.textContent = h >= 5 && h < 12 ? "Buenos días. Estoy listo para ayudarte." : h < 19 ? "Buenas tardes. Estoy listo para ayudarte." : "Buenas noches. Estoy listo para ayudarte.";
}

function addMessage(text, type) {
  if (!chat) return;
  const el = document.createElement("div");
  el.className = `message ${type === "user" ? "user-message" : "jarvis-message"}`;
  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent = type === "user" ? "TÚ" : "JARVIS";
  const body = document.createElement("div");
  body.textContent = text;
  el.append(name, body);
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function submitCommand() {
  const command = commandInput.value.trim();
  if (!command) return;
  processCommand(command);
  commandInput.value = "";
  commandInput.focus();
}

/* =========================================================
   CEREBRO / INTENCIONES
   ========================================================= */
function processCommand(command) {
  const original = command.trim();
  if (!original) return;
  addMessage(original, "user");
  setThinking(true);

  const text = normalizeText(original);
  let response;

  if (isGreeting(text)) response = getGreetingResponse();
  else if (isTime(text)) response = getTime();
  else if (isDate(text)) response = getDate();
  else if (isIdentity(text)) response = "Soy Super JARVIS, tu asistente personal. Puedo entender varias formas de pedir las mismas cosas y ayudarte con tareas, notas, cálculos, fecha y hora.";
  else if (isHelp(text)) response = getHelp();
  else if (isClearTasks(text)) response = clearAllTasks();
  else if (isCompleteTask(text)) response = completeTaskFromCommand(original, text);
  else if (isDeleteTask(text)) response = deleteTaskFromCommand(original, text);
  else if (isShowTasks(text)) response = showTasks();
  else if (isCreateTask(text)) response = createTaskFromCommand(original);
  else if (isShowNotes(text)) response = showNotes();
  else if (isCreateNote(text)) response = createNoteFromCommand(original);
  else if (isClearNotes(text)) response = clearNotes();
  else if (isCalculator(text)) response = calculateFromCommand(original);
  else response = smartFallback(original);

  window.setTimeout(() => {
    setThinking(false);
    addMessage(response, "jarvis");
    speak(response);
  }, 180);
}

function isGreeting(t) { return /^(hola|holi|hey|buenos dias|buenas tardes|buenas noches|saludos)(\s|$)/.test(t); }
function isTime(t) { return /(que|dime|me dices|puedes decirme)?\s*la hora|hora actual|hora es/.test(t) || t === "hora"; }
function isDate(t) { return /(que|dime|me dices|puedes decirme)?\s*(fecha|dia).*hoy|fecha actual/.test(t) || t === "fecha"; }
function isIdentity(t) { return /quien eres|como te llamas|cual es tu nombre|tu nombre/.test(t); }
function isHelp(t) { return t === "ayuda" || /que puedes hacer|como te puedo usar|comandos|opciones/.test(t); }
function isShowTasks(t) { return /mis tareas|ver tareas|mostrar tareas|muestrame.*tareas|que tengo pendiente|pendientes/.test(t); }
function isClearTasks(t) { return /borra|elimina|limpia|vac(a|í)a|quitar.*tareas/.test(t) && /todas|todo|mis tareas/.test(t); }
function isCreateTask(t) { return /(?:recu[eé]rdame|acuerdame|recuerda(?:me)?|acuerda(?:me)?|agrega(?:r)? (?:una )?tarea|anade(?:r)? (?:una )?tarea|a[nn]ade(?:r)? (?:una )?tarea|crear (?:una )?tarea|crea(?:r)? (?:una )?tarea|nueva tarea|tarea\s+)/.test(t); }
function isCompleteTask(t) { return /marca(r)? .*complet|completa(r)? .*tarea|termin(e|a|ar) .*tarea|ya hice|ya termine/.test(t); }
function isDeleteTask(t) { return /borra(r)? .*tarea|elimina(r)? .*tarea|quita(r)? .*tarea/.test(t); }
function isCreateNote(t) { return /anota|apunta|guarda.*nota|crea.*nota|nueva nota/.test(t); }
function isShowNotes(t) { return /mis notas|ver notas|mostrar notas|muestrame.*notas/.test(t); }
function isClearNotes(t) { return /borra|elimina|limpia/.test(t) && /todas|mis notas/.test(t); }
function isCalculator(t) { return /cu[aá]nto es|calcula|calcular|suma|resta|multiplica|multiplicado|divide|dividido|por ciento|%/.test(t) || /^[0-9\s+\-*/().,%x×÷]+$/.test(t); }

function getGreetingResponse() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? "Buenos días. ¿En qué puedo ayudarte?" : h < 19 ? "Buenas tardes. ¿En qué puedo ayudarte?" : "Buenas noches. ¿En qué puedo ayudarte?";
}
function getTime() { return `Son las ${new Date().toLocaleTimeString("es-CO", {hour:"2-digit", minute:"2-digit"})}.`; }
function getDate() { return `Hoy es ${new Date().toLocaleDateString("es-CO", {weekday:"long", day:"numeric", month:"long", year:"numeric"})}.`; }
function getHelp() {
  return "Puedo ayudarte con hora y fecha, crear, completar y borrar tareas, guardar notas, hacer cálculos y mantener esta conversación. Por ejemplo: 'recuérdame comprar comida', 'completa la tarea 2', 'anota llamar a Juan' o 'cuánto es 25 por 4'.";
}

/* =========================================================
   TAREAS
   ========================================================= */
function createTaskFromCommand(command) {
  let taskText = command.replace(/recu[eé]rdame/ig, "").replace(/acu[eé]rdame/ig, "").replace(/recuerda(?:me)?/ig, "").replace(/acuerda(?:me)?/ig, "").replace(/agrega(r)? (una )?tarea/ig, "").replace(/anade(r)? (una )?tarea/ig, "").replace(/a[nñ]ade(r)? (una )?tarea/ig, "").replace(/crear (una )?tarea/ig, "").replace(/crea(r)? (una )?tarea/ig, "").replace(/nueva tarea/ig, "").replace(/^tarea/ig, "").trim();
  taskText = taskText.replace(/^(que|de|para)\s+/i, "").replace(/^(que|de|para)\s+/i, "").trim();
  if (!taskText) return "Claro. ¿Qué tarea quieres que recuerde?";
  addTask(taskText);
  return `He guardado la tarea: ${taskText}.`;
}
function addTask(text) { tasks.push({id: Date.now(), text, completed:false, createdAt:new Date().toISOString()}); saveArray(TASKS_KEY, tasks); renderTasks(); }
function showTasks() {
  const pending = tasks.filter(t => !t.completed);
  if (!pending.length) return tasks.length ? "No tienes tareas pendientes. Todas están completadas." : "No tienes tareas pendientes.";
  return `Tienes ${pending.length} tarea${pending.length === 1 ? "" : "s"} pendiente${pending.length === 1 ? "" : "s"}: ${pending.map((t,i)=>`${i+1}. ${t.text}`).join("; ")}.`;
}
function clearAllTasks() { tasks=[]; saveArray(TASKS_KEY,tasks); renderTasks(); return "He eliminado todas las tareas."; }
function completeTaskFromCommand(original, text) {
  const index = extractTaskNumber(text);
  const target = index !== null ? pendingTasks()[index - 1] : findTaskByWords(original, false);
  if (!target) return "Dime el número de la tarea que quieres completar, por ejemplo: 'completa la tarea 2'.";
  target.completed = true; saveArray(TASKS_KEY,tasks); renderTasks(); return `Tarea completada: ${target.text}.`;
}
function deleteTaskFromCommand(original, text) {
  const index = extractTaskNumber(text);
  const target = index !== null ? pendingTasks()[index - 1] : findTaskByWords(original, false);
  if (!target) return "Dime el número de la tarea que quieres borrar, por ejemplo: 'borra la tarea 2'.";
  tasks = tasks.filter(t => t.id !== target.id); saveArray(TASKS_KEY,tasks); renderTasks(); return `He eliminado la tarea: ${target.text}.`;
}
function pendingTasks() { return tasks.filter(t=>!t.completed); }
function extractTaskNumber(text) { const m = text.match(/tarea\s*(?:n[uú]mero\s*)?(\d+)/); return m ? Number(m[1]) : null; }
function findTaskByWords(original, includeCompleted) {
  const q = normalizeText(original).replace(/completa(r)?|marca(r)?|termin(e|a|ar)|borra(r)?|elimina(r)?|quita(r)?|tarea/g, " ").trim();
  const words = q.split(/\s+/).filter(w=>w.length>2);
  const candidates = tasks.filter(t=>includeCompleted || !t.completed);
  return candidates.map(t=>({t,score:words.filter(w=>normalizeText(t.text).includes(w)).length})).sort((a,b)=>b.score-a.score)[0]?.score ? candidates.map(t=>({t,score:words.filter(w=>normalizeText(t.text).includes(w)).length})).sort((a,b)=>b.score-a.score)[0].t : null;
}
function renderTasks() {
  if (!tasksList) return;
  if (!tasks.length) { tasksList.innerHTML='<div class="empty-tasks">No tienes tareas pendientes.</div>'; return; }
  tasksList.innerHTML="";
  tasks.forEach(task=>{
    const el=document.createElement("div"); el.className="task"+(task.completed?" completed":"");
    const cb=document.createElement("input"); cb.type="checkbox"; cb.className="task-checkbox"; cb.checked=task.completed;
    cb.addEventListener("change",()=>{task.completed=cb.checked;saveArray(TASKS_KEY,tasks);renderTasks();});
    const tx=document.createElement("div"); tx.className="task-text"; tx.textContent=task.text;
    const del=document.createElement("button"); del.className="delete-task"; del.textContent="✕"; del.title="Eliminar tarea";
    del.addEventListener("click",()=>{tasks=tasks.filter(x=>x.id!==task.id);saveArray(TASKS_KEY,tasks);renderTasks();});
    el.append(cb,tx,del); tasksList.appendChild(el);
  });
}

/* =========================================================
   NOTAS
   ========================================================= */
function createNoteFromCommand(command) {
  const text=command.replace(/anota(\s+que)?/ig,"").replace(/apunta(\s+que)?/ig,"").replace(/guarda.*nota/ig,"").replace(/crea.*nota/ig,"").replace(/nueva nota/ig,"").trim();
  if(!text) return "Claro. ¿Qué quieres que anote?";
  notes.push({id:Date.now(),text,createdAt:new Date().toISOString()}); saveArray(NOTES_KEY,notes);
  return `He guardado la nota: ${text}.`;
}
function showNotes(){ if(!notes.length)return "No tienes notas guardadas."; return `Tienes ${notes.length} nota${notes.length===1?"":"s"}: ${notes.map((n,i)=>`${i+1}. ${n.text}`).join("; ")}.`; }
function clearNotes(){notes=[];saveArray(NOTES_KEY,notes);return "He eliminado todas tus notas.";}

/* =========================================================
   CALCULADORA SEGURA
   ========================================================= */
function calculateFromCommand(command){
  let expr=normalizeText(command).replace(/cuanto es|calcula(r)?|calcular|por ciento/g," ").replace(/multiplicado por|multiplica(do)? por|por/g,"*").replace(/dividido entre|dividido por|divide entre|divide por/g,"/").replace(/suma(r)?|resta(r)?/g," ").replace(/x/g,"*").replace(/×/g,"*").replace(/÷/g,"/").replace(/,/g,".").replace(/[^0-9+\-*/().%\s]/g,"").trim();
  expr=expr.replace(/(\d+(?:\.\d+)?)\s*%/g,"($1/100)");
  if(!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) return "No pude interpretar el cálculo. Prueba, por ejemplo: 'cuánto es 25 por 4'.";
  try { const result=Function(`"use strict"; return (${expr})`)(); if(!Number.isFinite(result)) throw new Error(); return `El resultado es ${Number.isInteger(result)?result:result.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}.`; } catch { return "No pude realizar ese cálculo."; }
}

function smartFallback(command){
  return `Entiendo tu mensaje, pero esa función todavía no está disponible en esta versión. Puedes pedirme tareas, notas, cálculos, fecha, hora o ayuda. Dijiste: “${command}”.`;
}

function setupSpeechRecognition(){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    if(micStatus) micStatus.textContent="El reconocimiento de voz no está disponible en este navegador.";
    if(micBtn){micBtn.disabled=true;micBtn.style.opacity=".45";}
    return;
  }
  recognition=new SpeechRecognition();
  recognition.lang="es-CO";
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  recognition.onstart=()=>{isListening=true;micBtn.classList.add("listening");micStatus.textContent="JARVIS está escuchando...";};
  recognition.onresult=e=>{
    const result=e.results[0][0].transcript;
    commandInput.value=result;
    micStatus.textContent="Comando recibido.";
    processCommand(result);
    commandInput.value="";
  };
  recognition.onerror=e=>{
    isListening=false;
    micBtn.classList.remove("listening");
    micStatus.textContent=e.error==="not-allowed"?"Debes permitir el acceso al micrófono.":e.error==="no-speech"?"No escuché nada. Inténtalo nuevamente.":"No pude escuchar. Inténtalo nuevamente.";
  };
  recognition.onend=()=>{
    isListening=false;
    micBtn.classList.remove("listening");
    if(micStatus.textContent==="JARVIS está escuchando...") micStatus.textContent="Pulsa el micrófono para hablar";
  };
}
function startListening(){
  stopJarvisSpeech();
  if(!recognition){setupSpeechRecognition();if(!recognition)return;}
  try{recognition.start();}catch(e){console.log("Micrófono:",e);}
}
function stopListening(){if(!recognition)return;try{recognition.stop();}catch(e){console.log("Micrófono:",e);}}
function setThinking(on){
  clearTimeout(busyTimer);
  if(on){
    if(micStatus) micStatus.textContent="JARVIS está pensando...";
    busyTimer=setTimeout(()=>{if(!isListening&&micStatus)micStatus.textContent="Listo.";},900);
  }else if(!isListening&&micStatus) micStatus.textContent="Listo.";
}
function normalizeText(text){return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();}
function loadArray(key){try{const v=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(v)?v:[];}catch{return[];}}
function saveArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){console.error("Error guardando datos:",e);}}

/* =========================================================
   VOZ JARVIS — ESPAÑOL
   Una sola configuración de voz. Sin modelos, perfiles ni
   selección manual: usa la voz en español disponible en el
   navegador/dispositivo.
   ========================================================= */
const JARVIS_LANG = "es-CO";
let jarvisVoice = null;

function setupJarvisVoice(){
  if(!("speechSynthesis" in window)){
    if(voiceStatus) voiceStatus.textContent =
      "La síntesis de voz no está disponible en este navegador.";
    return;
  }

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices() || [];

    // Preferimos español de Colombia, luego cualquier español.
    jarvisVoice =
      voices.find(v => /^es-CO$/i.test(v.lang)) ||
      voices.find(v => /^es-MX$/i.test(v.lang)) ||
      voices.find(v => /^es-ES$/i.test(v.lang)) ||
      voices.find(v => /^es(?:-|_)/i.test(v.lang)) ||
      null;

    if(voiceStatus){
      voiceStatus.textContent = jarvisVoice
        ? "Voz en español activa."
        : "Usando la voz en español del navegador.";
    }
  };

  loadVoices();
  // Chrome/Edge cargan algunas voces después de iniciar la página.
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function splitSpeech(text){
  return String(text)
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?;:])\s+/)
    .filter(Boolean);
}

let speechRunId = 0;

function speak(text){
  if(!("speechSynthesis" in window) || !text) return;

  const voices = window.speechSynthesis.getVoices() || [];

  // Reintenta localizar una voz española si todavía no estaba cargada.
  if(!jarvisVoice){
    jarvisVoice =
      voices.find(v => /^es-CO$/i.test(v.lang)) ||
      voices.find(v => /^es-MX$/i.test(v.lang)) ||
      voices.find(v => /^es-ES$/i.test(v.lang)) ||
      voices.find(v => /^es(?:-|_)/i.test(v.lang)) ||
      null;
  }

  const run = ++speechRunId;
  window.speechSynthesis.cancel();

  const parts = splitSpeech(text);
  let index = 0;

  document.body.classList.add("jarvis-speaking");
  if(micStatus && !isListening) micStatus.textContent = "JARVIS está hablando...";

  const next = () => {
    if(run !== speechRunId || index >= parts.length){
      if(run === speechRunId){
        document.body.classList.remove("jarvis-speaking");
        if(micStatus && !isListening) micStatus.textContent = "Listo.";
      }
      return;
    }

    const u = new SpeechSynthesisUtterance(parts[index++]);

    // Siempre español. Si existe una voz española del sistema, la usamos.
    // Si no existe una voz seleccionable, el navegador usa su voz disponible
    // pero conserva el idioma español.
    u.lang = JARVIS_LANG;
    if(jarvisVoice) u.voice = jarvisVoice;

    u.rate = 0.90;
    u.pitch = 0.78;
    u.volume = 1;

    u.onend = () => setTimeout(next, 120);
    u.onerror = () => {
      if(run === speechRunId){
        document.body.classList.remove("jarvis-speaking");
        if(micStatus && !isListening) micStatus.textContent = "Listo.";
      }
    };

    window.speechSynthesis.speak(u);
  };

  next();
}

function stopJarvisSpeech(){
  speechRunId++;
  if("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.body.classList.remove("jarvis-speaking");
  if(micStatus && !isListening) micStatus.textContent = "Listo.";
}

function setupVoiceControls(){
  voiceStatus = document.getElementById("voiceStatus");
  const test = document.getElementById("testVoiceBtn");

  if(test){
    test.addEventListener("click", () =>
      speak("Hola. Soy JARVIS. Estoy listo para ayudarte. ¿En qué puedo ayudarte?")
    );
  }
}

window.JARVIS={
  processCommand,
  addTask,
  showTasks,
  speak,
  getTasks:()=>[...tasks],
  getNotes:()=>[...notes],
  clearTasks:clearAllTasks,
  clearNotes:clearNotes
};
