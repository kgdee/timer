const storagePrefix = 'timer_'

// Cache DOM elements to avoid multiple DOM queries
const timerDisplay = document.querySelector(".timer-display");
const incrementButtons = document.querySelectorAll(".increment-button")
const resetButton = document.querySelector(".reset-button");
const startButton = document.querySelector(".start-button");
const audioInput = document.querySelector(".audio-input")
const timerAlert = document.querySelector(".timer-alert")

let countdown = null;
let totalSeconds = 0;
let currentAudio = null;

// Add event listeners
incrementButtons.forEach(button => {
  button.addEventListener("click", () => {
    incrementTime(parseInt(button.getAttribute("data-seconds"))) 
  });
});
startButton.addEventListener("click", startTimer);
resetButton.addEventListener("click", resetTimer);
audioInput.addEventListener("change", async function(event) {
  const audioFile = event.target.files[0]
  if (!audioFile) return

  storeAudio(audioFile)
})

document.addEventListener("DOMContentLoaded", function() {
  updateDisplay(0);
  loadAudio()
})


function incrementTime(amount) {
  totalSeconds += amount
  updateDisplay(totalSeconds);
}

function startTimer() {
  if (totalSeconds <= 0 || countdown) return

  startCountdown(totalSeconds)
}

function resetTimer() {
  if (totalSeconds <= 0 && !countdown) return

  currentAudio.pause()
  clearInterval(countdown);
  countdown = null;
  totalSeconds = 0;
  updateDisplay(0);
  timerAlert.classList.add("hidden")
}

function startCountdown(seconds) {
  let secondsLeft = seconds

  countdown = setInterval(() => {

    secondsLeft--

    if (secondsLeft <= 0) {
      clearInterval(countdown);
      countdown = null;

      currentAudio.play()
      timerAlert.classList.remove("hidden")
    }

    totalSeconds = secondsLeft
    updateDisplay(secondsLeft);
  }, 1000);
}

function updateDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}



// File handling
async function storeAudio(file) {
  
  const base64 = await fileToBase64(file);
  localStorage.setItem(storagePrefix + 'audioFile', base64);
  console.log("Audio file stored: " + file.name)
}

function loadAudio() {
  const base64 = localStorage.getItem(storagePrefix + 'audioFile');
  if (base64) {
    const audioBlob = base64ToBlob(base64);
    const audioUrl = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(audioUrl)
  } else {
    currentAudio = new Audio("ringtone.mp3")
  }

  currentAudio.loop = true
}

// Convert file to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Convert Base64 back to a Blob
function base64ToBlob(base64) {
  const [metadata, data] = base64.split(',');
  const mime = metadata.match(/:(.*?);/)[1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}