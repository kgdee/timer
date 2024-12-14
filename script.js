const storagePrefix = 'timer_'

// Cache DOM elements to avoid multiple DOM queries
const timerDisplay = document.querySelector(".timer-display");
const incrementButtons = document.querySelectorAll(".controls .increment")
const resetButton = document.querySelector(".controls .reset");
const startButton = document.querySelector(".controls .start");
const audioInput = document.querySelector(".ringtone-modal .audio-input")
const ringtoneButton = document.querySelector(".controls .ringtone")
const timerAlert = document.querySelector(".timer-alert")
const ringtoneModal = document.querySelector('.ringtone-modal');
const volumeButton = document.querySelector(".ringtone-modal .volume")
const resetRingtoneBtn = document.querySelector(".ringtone-modal .reset")

let countdown = null;
let totalSeconds = 0;
let currentAudio = null;
let currentVolume = parseFloat(localStorage.getItem(storagePrefix + "currentVolume")) || 0.5

// Add event listeners
incrementButtons.forEach(button => {
  button.addEventListener("click", () => {
    incrementTime(parseInt(button.getAttribute("data-seconds"))) 
  });
});
startButton.addEventListener("click", startTimer);
resetButton.addEventListener("click", resetTimer);
ringtoneButton.addEventListener("click", toggleRingtoneModal)
audioInput.addEventListener("change", async function(event) {
  const audioFile = event.target.files[0]
  if (!audioFile) return

  await saveRingtone(audioFile)
  await loadRingtone()
})
volumeButton.addEventListener("click", changeVolume)
resetRingtoneBtn.addEventListener("click", resetRingtone)


document.addEventListener("DOMContentLoaded", async function() {
  updateDisplay(0);
  
  await initDB();
  await loadRingtone()
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
  timerDisplay.classList.remove("alert")
}

function startCountdown(seconds) {
  const endTime = Date.now() + 5 * 1000;

  countdown = setInterval(() => {

    const secondsLeft = Math.round((endTime - Date.now()) / 1000);

    if (secondsLeft <= 0) {
      clearInterval(countdown);
      countdown = null;

      currentAudio.play()
      timerAlert.classList.remove("hidden")
      timerDisplay.classList.add("alert")
    }

    totalSeconds = secondsLeft
    updateDisplay(secondsLeft);
  }, 1000);
}

function updateDisplay(seconds) {
  if (seconds < 0) seconds = 0

  // Calculate hours, minutes, and remaining seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Format each part to ensure two digits
  const format = (num) => String(num).padStart(2, '0');

  timerDisplay.textContent = `${hours ? format(hours) + ":" : ""}${format(minutes)}:${format(secs)}`;
}

function changeVolume(value) {
  let volume = 0

  if (isFinite(value)) {
    volume = value
  } else {
    volume = currentAudio.volume
    volume += 0.25
    if (volume > 1) volume = 0.25
  }
  
  currentVolume = volume
  currentAudio.volume = currentVolume

  localStorage.setItem(storagePrefix + "currentVolume", currentVolume)
}

function updateVolumeButton() {
  volumeButton.innerHTML = `${Math.round(currentVolume * 100)}%`;
}


function toggleRingtoneModal() {
  ringtoneModal.classList.toggle('hidden');
}



async function loadRingtone() {
  const fileBlob = await loadFile()

  const url = fileBlob ? URL.createObjectURL(fileBlob) : "ringtone.mp3"

  currentAudio = new Audio(url)
  currentAudio.volume = currentVolume
  currentAudio.loop = true

  currentAudio.addEventListener('volumechange', updateVolumeButton);
  audioInput.querySelector(".text").textContent = fileBlob?.name || "Default"
}

async function saveRingtone(file) {
  await saveFile(file)
}

async function resetRingtone() {
  await deleteFile()
  await loadRingtone()
  changeVolume(0.5)
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

// Delete File from IndexedDB
function deleteFile() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const request = store.delete('userFile');

    request.onsuccess = () => {
      console.log('File deleted successfully.');
      resolve('File deleted successfully.');
    };

    request.onerror = (event) => {
      console.error('Error deleting file:', event.target.error);
      reject(new Error('Error deleting file: ' + event.target.error));
    };
  });
}







// Error handling
window.addEventListener("error", (event) => {
  const error = `${event.type}: ${event.message}`
  console.error(error)
  alert(error)
})