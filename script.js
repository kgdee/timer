const storagePrefix = 'timer_'

// Cache DOM elements to avoid multiple DOM queries
const timerDisplay = document.querySelector(".timer-display");
const incrementButtons = document.querySelectorAll(".controls .increment")
const resetButton = document.querySelector(".controls .reset");
const startButton = document.querySelector(".controls .start");
const audioInput = document.querySelector(".controls .audio-input")
const volumeButton = document.querySelector(".controls .volume")
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

  await storeAudio(audioFile)
  loadAudio()
})
volumeButton.addEventListener("click", changeVolume)


document.addEventListener("DOMContentLoaded", async function() {
  updateDisplay(0);
  
  await initDB();
  await loadAudio()
  updateVolumeButton();
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


async function loadAudio() {
  const fileBlob = await loadFile()

  const url = fileBlob ? URL.createObjectURL(fileBlob) : "ringtone.mp3"

  currentAudio = new Audio(url)
  currentAudio.volume = 0.5
  currentAudio.loop = true

  currentAudio.addEventListener('volumechange', updateVolumeButton);
}

async function storeAudio(file) {
  await saveFile(file)
}

function changeVolume() {
  let volume = currentAudio.volume

  volume += 0.25
  if (volume > 1) volume = 0.25
  
  currentAudio.volume = volume
}

function updateVolumeButton() {
  volumeButton.innerHTML = `${Math.round(currentAudio.volume * 100)}%`;
}



// File handling
// Initialize IndexedDB
const dbName = 'fileStorageDB';
const storeName = 'files';
let db;


function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('Error initializing database:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Save File to IndexedDB
function saveFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const fileRecord = {
      id: 'userFile',
      file: file
    };

    const request = store.put(fileRecord);

    request.onsuccess = () => {
      console.log('File saved successfully.');
      resolve('File saved successfully.');
    };

    request.onerror = (event) => {
      console.error('Error saving file:', event.target.error);
      reject(new Error('Error saving file: ' + event.target.error));
    };
  });
}

// Load File from IndexedDB
function loadFile() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const request = store.get('userFile');

    request.onsuccess = (event) => {
      const record = event.target.result;

      if (record) {
        const fileBlob = record.file;

        resolve(fileBlob)
      } else {
        console.log('No file found in the database.');
        resolve(null)
      }
    };

    request.onerror = (event) => {
      console.error('Error loading file:', event.target.error);
      reject(event.target.error)
    };
  })
}




// Error handling
window.addEventListener("error", (event) => {
  const error = `${event.type}: ${event.message}`
  console.error(error)
  alert(error)
})