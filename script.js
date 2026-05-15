let timer;
let timeLeft = 25 * 60;
let status = 'work'; // work, short, long

const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const body = document.body;

function updateDisplay() {
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timer);
            timer = null;
            switchMode();
        }
    }, 1000);
}

function switchMode() {
    if (status === 'work') {
        status = 'short';
        timeLeft = 5 * 60;
        statusText.textContent = "¡Descanso Corto!";
        body.className = 'short-break';
    } else {
        status = 'work';
        timeLeft = 25 * 60;
        statusText.textContent = "Tiempo de Enfoque";
        body.className = 'work-mode';
    }
    updateDisplay();
}

// Gestión de Tareas Simple
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

document.getElementById('add-btn').onclick = () => {
    if (taskInput.value) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `<span>${taskInput.value}</span> <button onclick="this.parentElement.remove()">X</button>`;
        taskList.appendChild(li);
        taskInput.value = '';
    }
};

startBtn.onclick = startTimer;
document.getElementById('reset-btn').onclick = () => {
    clearInterval(timer);
    timer = null;
    timeLeft = 25 * 60;
    updateDisplay();
};