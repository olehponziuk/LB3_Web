import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { push, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://llb3-402e4-default-rtdb.europe-west1.firebasedatabase.app"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const processDB = ref(database, "processes")

let interval;
let lastTime = 0;
let lastText = "";
let isTimerRunning = false;
const booksEl = document.getElementById("records")

document.getElementById('startTimer').addEventListener('click', function() {
  if (isTimerRunning) return;

  const timeInput = document.getElementById('timeInput').value;
  let timeLeft = parseInt(timeInput) * 60;

  const countdownElement = document.getElementById('countdown');
  const alarmSound = document.getElementById('alarmSound');
  const procName = document.getElementById("procName");
  const procInput = document.getElementById("processInput");

  lastText = procName.textContent = procInput.value;

  countdownElement.classList.remove('finished');
  updateCountdownDisplay(timeLeft);

  document.getElementById('stopTimer').disabled = false;
  isTimerRunning = true;

  interval = setInterval(() => {
    timeLeft--;
    lastTime = timeLeft;
    updateCountdownDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownElement.textContent = "Час вийшов!";
      countdownElement.classList.add('finished');
      alarmSound.play();
      document.getElementById('stopTimer').disabled = true;
      isTimerRunning = false;
    }
  }, 1000);
});



const recordEl = document.getElementById("records");
onValue(processDB, function(snapshot) {
  const items = snapshot.val();
  if (!items) return;

  const itemsArray = Object.entries(items);
  clearListEl();

  for (let i = itemsArray.length - 1; i >= 0; i--) {
    const currentItem = itemsArray[i];
    if (currentItem && currentItem[1]) {
      const currentItemId = currentItem[0];
      const currentItemText = currentItem[1].lastText || "Невідомий процес";
      const currentItemTime = currentItem[1].lastTime || "0";
      appendListEl(currentItemText, currentItemTime, currentItemId);
    }
  }
});

function updateCountdownDisplay(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('countdown').textContent = `${minutes} хвилин ${seconds} секунд залишилося`;
}



function clearListEl() {
    recordEl.innerHTML = "";
}

function appendListEl(name, time, itemId) {
  console.log(`Додаємо запис: Назва = ${name}, Час = ${time} сек., ID = ${itemId}`);
  
  const li = document.createElement('li');
  li.setAttribute("data-id", itemId); 
  li.innerHTML = `
    Назва: ${name}, Час: ${time} сек. 
    <button onclick="resumeTimer('${itemId}', '${name}', ${time})">Продовжити</button>
    <button onclick="deleteRecord('${itemId}')">Видалити</button>
  `;
  
  recordEl.appendChild(li); 
}



window.resumeTimer = function(itemId, lText, timeLeft) {
  // Якщо таймер уже запущений, зупиняємо його
  if (interval) clearInterval(interval);

  const countdownElement = document.getElementById('countdown');
  const alarmSound = document.getElementById('alarmSound');
  const procName = document.getElementById("procName");
  const procInput = document.getElementById("processInput"); // поле для вводу назви процесу

  // Встановлюємо значення тексту для відновленого процесу
  lastText = lText;
  procName.textContent = lastText;
  procInput.value = lastText; // Записуємо текст процесу в input для відображення

  countdownElement.classList.remove('finished');
  updateCountdownDisplay(timeLeft);

  document.getElementById('stopTimer').disabled = false;
  isTimerRunning = true;

  // Запускаємо таймер заново
  interval = setInterval(() => {
    timeLeft--;
    lastTime = timeLeft;

    updateCountdownDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownElement.textContent = "Час вийшов!";
      countdownElement.classList.add('finished');
      alarmSound.play();
      document.getElementById('stopTimer').disabled = true;
      isTimerRunning = false;
    }
  }, 1000);

  // Видаляємо запис із Firebase після запуску нового таймера
  const processRef = ref(database, `processes/${itemId}`);
  set(processRef, null)
    .then(() => {
      console.log(`Запис із ID ${itemId} успішно видалено з Firebase`);

      const liToRemove = document.querySelector(`li[data-id='${itemId}']`);
      if (liToRemove) {
        liToRemove.remove();
        console.log(`Елемент li з ID ${itemId} видалено з HTML`);
      } else {
        console.error(`Не вдалося знайти елемент li з ID ${itemId}`);
      }
    })
    .catch(error => console.error("Помилка при видаленні з Firebase:", error));
}

window.deleteRecord = function(itemId) {
  const processRef = ref(database, `processes/${itemId}`);
  
  set(processRef, null)
    .then(() => {
      console.log(`Запис із ID ${itemId} успішно видалено з Firebase`);
      
      const liToRemove = document.querySelector(`li[data-id='${itemId}']`);
      
      if (liToRemove) {
        liToRemove.remove();
        console.log(`Елемент li з ID ${itemId} видалено з HTML`);
      } else {
        console.error(`Не вдалося знайти елемент li з ID ${itemId}`);
        
        const allLis = document.querySelectorAll("li[data-id]");
        console.log("Список усіх елементів li з data-id у recordEl:");
        allLis.forEach(li => {
          console.log("Знайдено li з data-id:", li.getAttribute("data-id"));
        });
      }
    })
    .catch(error => console.error("Помилка при видаленні з Firebase:", error));
};

document.getElementById('stopTimer').addEventListener('click', function() {
  clearInterval(interval);
  document.getElementById('countdown').textContent = "Таймер зупинено.";
  document.getElementById('stopTimer').disabled = true;
  isTimerRunning = false;

  push(processDB, {lastText, lastTime});
});
