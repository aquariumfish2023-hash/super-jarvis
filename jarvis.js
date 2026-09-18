```javascript
/* =========================================================
   SUPER JARVIS V1
   Asistente personal
========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STORAGE_KEY = "super_jarvis_v1_tasks";

let tasks =
    JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );

let recognition = null;

let isListening = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const chat =
    document.getElementById("chat");

const textInput =
    document.getElementById("textInput");

const sendButton =
    document.getElementById("sendButton");

const micButton =
    document.getElementById("micButton");

const micStatus =
    document.getElementById("micStatus");

const coreLabel =
    document.getElementById("coreLabel");

const statusText =
    document.getElementById("statusText");

const tasksList =
    document.getElementById("tasksList");

const greeting =
    document.getElementById("greeting");

const subtitle =
    document.getElementById("subtitle");


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeSpeech();

        renderTasks();

        updateGreeting();

        setTimeout(() => {

            speak(
                "Sistema JARVIS iniciado. Estoy listo."
            );

        }, 900);

    }
);


/* =========================================================
   SALUDO
========================================================= */

function updateGreeting() {

    const hour =
        new Date().getHours();

    if (hour < 12) {

        greeting.textContent =
            "Buenos días";

    } else if (hour < 18) {

        greeting.textContent =
            "Buenas tardes";

    } else {

        greeting.textContent =
            "Buenas noches";

    }

    subtitle.textContent =
        "Tu asistente personal está listo.";

}


/* =========================================================
   RECONOCIMIENTO DE VOZ
========================================================= */

function initializeSpeech() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        micButton.disabled = true;

        micStatus.textContent =
            "El navegador no permite reconocimiento de voz.";

        return;

    }

    recognition =
        new SpeechRecognition();

    recognition.lang = "es-CO";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        isListening = true;

        micButton.classList.add(
            "listening"
        );

        micStatus.textContent =
            "Escuchando...";

        coreLabel.textContent =
            "ESCUCHANDO";

        statusText.textContent =
            "Escuchando";

    };


    recognition.onresult = event => {

        const transcript =
            event.results[0][0].transcript;

        textInput.value =
            transcript;

        addUserMessage(
            transcript
        );

        processCommand(
            transcript
        );

    };


    recognition.onerror = event => {

        console.log(
            "Error de reconocimiento:",
            event.error
        );

        if (
            event.error ===
            "not-allowed"
        ) {

            micStatus.textContent =
                "Permite el micrófono para usar JARVIS.";

        } else {

            micStatus.textContent =
                "No pude escuchar. Inténtalo nuevamente.";

        }

    };


    recognition.onend = () => {

        isListening = false;

        micButton.classList.remove(
            "listening"
        );

        micStatus.textContent =
            "Toca para hablar con JARVIS";

        coreLabel.textContent =
            "LISTO";

        statusText.textContent =
            "En línea";

    };

}


/* =========================================================
   BOTÓN MICRÓFONO
========================================================= */

micButton.addEventListener(
    "click",
    () => {

        if (!recognition) {

            addJarvisMessage(
                "El reconocimiento de voz no está disponible en este navegador."
            );

            return;

        }

        if (isListening) {

            recognition.stop();

            return;

        }

        try {

            recognition.start();

        } catch (error) {

            console.log(error);

        }

    }
);


/* =========================================================
   TEXTO
========================================================= */

sendButton.addEventListener(
    "click",
    sendTextCommand
);


textInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            sendTextCommand();

        }

    }
);


function sendTextCommand() {

    const text =
        textInput.value.trim();

    if (!text) return;

    addUserMessage(text);

    textInput.value = "";

    processCommand(text);

}


/* =========================================================
   BOTONES RÁPIDOS
========================================================= */

document
    .querySelectorAll(".quick-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const command =
                    button.dataset.command;

                addUserMessage(
                    command
                );

                processCommand(
                    command
                );

            }
        );

    });


/* =========================================================
   PROCESADOR PRINCIPAL
========================================================= */

function processCommand(command) {

    const original =
        command.trim();

    const text =
        normalize(original);


    /* -------------------------
       HORA
    ------------------------- */

    if (
        text.includes("que hora") ||
        text.includes("hora es")
    ) {

        const now =
            new Date();

        const time =
            now.toLocaleTimeString(
                "es-CO",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        respond(
            `Son las ${time}.`
        );

        return;
    }


    /* -------------------------
       FECHA
    ------------------------- */

    if (
        text.includes("que fecha") ||
        text.includes("fecha es") ||
        text.includes("que dia")
    ) {

        const date =
            new Date();

        const formatted =
            date.toLocaleDateString(
                "es-CO",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

        respond(
            `Hoy es ${formatted}.`
        );

        return;
    }


    /* -------------------------
       SALUDO
    ------------------------- */

    if (
        text === "hola" ||
        text.includes("hola jarvis") ||
        text.includes("buenos dias") ||
        text.includes("buenas tardes") ||
        text.includes("buenas noches")
    ) {

        respond(
            "Hola. Me alegra escucharte. ¿En qué puedo ayudarte?"
        );

        return;
    }


    /* -------------------------
       NOMBRE
    ------------------------- */

    if (
        text.includes("como te llamas") ||
        text.includes("quien eres")
    ) {

        respond(
            "Soy JARVIS, tu asistente personal."
        );

        return;
    }


    /* -------------------------
       TAREAS
    ------------------------- */

    if (
        text.includes("mis tareas") ||
        text.includes("mostrar tareas") ||
        text.includes("ver tareas")
    ) {

        showTasks();

        return;
    }


    /* -------------------------
       AGREGAR TAREA
    ------------------------- */

    if (
        text.startsWith("agrega tarea") ||
        text.startsWith("añade tarea") ||
        text.startsWith("crear tarea") ||
        text.startsWith("recuerdame")
    ) {

        let taskText =
            original
                .replace(
                    /^agrega tarea/i,
                    ""
                )
                .replace(
                    /^añade tarea/i,
                    ""
                )
                .replace(
                    /^crear tarea/i,
                    ""
                )
                .replace(
                    /^recuérdame/i,
                    ""
                )
                .trim();

        if (!taskText) {

            respond(
                "Claro. Dime qué quieres que recuerde."
            );

            return;

        }

        addTask(taskText);

        return;

    }


    /* -------------------------
       LIMPIAR TAREAS
    ------------------------- */

    if (
        text.includes(
            "borrar todas las tareas"
        )
    ) {

        tasks = [];

        saveTasks();

        renderTasks();

        respond(
            "He eliminado todas las tareas."
        );

        return;

    }


    /* -------------------------
       AYUDA
    ------------------------- */

    if (
        text === "ayuda" ||
        text.includes("que puedes hacer") ||
        text.includes("comandos")
    ) {

        respond(
`Por ahora puedo:

• Decirte la hora.
• Decirte la fecha.
• Crear tareas.
• Mostrar tus tareas.
• Eliminar todas las tareas.
• Responder saludos.

Y esto apenas es la V1. Podemos seguir ampliando mis capacidades.`
        );

        return;

    }


    /* -------------------------
       RESPUESTA GENERAL
    ------------------------- */

    respond(
        `He recibido: "${original}". Esta función todavía está en desarrollo. Podemos enseñarme nuevas acciones en las siguientes versiones.`
    );

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalize(text) {

    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


/* =========================================================
   RESPONDER
========================================================= */

function respond(message) {

    addJarvisMessage(
        message
    );

    speak(message);

}


/* =========================================================
   VOZ
========================================================= */

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    utterance.lang = "es-CO";

    utterance.rate = 0.95;

    utterance.pitch = 0.9;

    utterance.volume = 1;

    window.speechSynthesis.speak(
        utterance
    );

}


/* =========================================================
   MENSAJE JARVIS
========================================================= */

function addJarvisMessage(message) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "message jarvis-message";

    element.innerHTML = `
        <div class="message-avatar">
            J
        </div>

        <div class="message-content">

            <strong>JARVIS</strong>

            <p></p>

        </div>
    `;

    element
        .querySelector("p")
        .textContent = message;

    chat.appendChild(
        element
    );

    scrollChat();

}


/* =========================================================
   MENSAJE USUARIO
========================================================= */

function addUserMessage(message) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "message user-message";

    element.innerHTML = `
        <div class="message-avatar">
            U
        </div>

        <div class="message-content">

            <strong>TÚ</strong>

            <p></p>

        </div>
    `;

    element
        .querySelector("p")
        .textContent = message;

    chat.appendChild(
        element
    );

    scrollChat();

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChat() {

    chat.scrollTop =
        chat.scrollHeight;

}


/* =========================================================
   TAREAS
========================================================= */

function addTask(text) {

    const task = {

        id:
            Date.now(),

        text:
            text,

        completed:
            false,

        created:
            new Date().toISOString()

    };

    tasks.push(task);

    saveTasks();

    renderTasks();

    respond(
        `Listo. He agregado la tarea: ${text}`
    );

}


/* =========================================================
   GUARDAR TAREAS
========================================================= */

function saveTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );

}


/* =========================================================
   MOSTRAR TAREAS
========================================================= */

function showTasks() {

    if (!tasks.length) {

        respond(
            "No tienes tareas pendientes."
        );

        return;

    }

    const pending =
        tasks.filter(
            task =>
                !task.completed
        );

    if (!pending.length) {

        respond(
            "No tienes tareas pendientes. Todas están completadas."
        );

        return;

    }

    let message =
        "Tienes estas tareas pendientes:\n";

    pending.forEach(
        (task, index) => {

            message +=
                `${index + 1}. ${task.text}\n`;

        }
    );

    respond(message);

}


/* =========================================================
   RENDERIZAR TAREAS
========================================================= */

function renderTasks() {

    tasksList.innerHTML = "";

    if (!tasks.length) {

        tasksList.innerHTML = `
            <p class="empty-tasks">
                No tienes tareas pendientes.
            </p>
        `;

        return;

    }

    tasks.forEach(task => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "task";

        item.innerHTML = `

            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? "checked" : ""}
            >

            <span class="task-text">
                ${escapeHtml(task.text)}
            </span>

            <button
                class="task-delete"
                title="Eliminar tarea">
                ✕
            </button>

        `;


        const checkbox =
            item.querySelector(
                ".task-checkbox"
            );

        checkbox.addEventListener(
            "change",
            () => {

                task.completed =
                    checkbox.checked;

                saveTasks();

                renderTasks();

            }
        );


        const deleteButton =
            item.querySelector(
                ".task-delete"
            );

        deleteButton.addEventListener(
            "click",
            () => {

                tasks =
                    tasks.filter(
                        current =>
                            current.id !==
                            task.id
                    );

                saveTasks();

                renderTasks();

            }
        );


        tasksList.appendChild(
            item
        );

    });

}


/* =========================================================
   SEGURIDAD HTML
========================================================= */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}


/* =========================================================
   EXPONER PARA PRUEBAS
========================================================= */

window.JARVIS = {

    processCommand,

    addTask,

    showTasks,

    speak

};
```
