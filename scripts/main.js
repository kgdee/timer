const timeEl = document.querySelector(".time");
const incrementButtons = document.querySelectorAll(".controls .increment");
const resetButton = document.querySelector(".controls .reset");
const startButton = document.querySelector(".controls .start");
const messageEl = document.querySelector(".message");
const ringtoneModal = document.querySelector(".ringtone-modal");
const volumeBtn = document.querySelector(".settings .volume");
const ringtoneInput = document.querySelector(".ringtone-input");

let countdown = null;
let totalSeconds = 0;
let currentAudio = new Audio("ringtone.mp3");
let currentVolume = load("currentVolume", 1);
let timerIsDone = false;

let darkTheme = load("darkTheme", false);

document.addEventListener("DOMContentLoaded", async function () {
  updateTimeEl();
  toggleTheme(darkTheme);
  loadRingtone();
  updateVolumeBtn();
});

function incrementTime(amount) {
  if (countdown) return;
  if (timerIsDone) resetTimer();

  totalSeconds += amount;
  updateTimeEl();
}

function reset() {
  timerIsDone = false;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  clearInterval(countdown);
  countdown = null;
  totalSeconds = 0;
  updateTimeEl();
  messageEl.classList.add("hidden");
  timeEl.classList.remove("alert");
}

function start() {
  if (totalSeconds <= 0 || countdown) return;

  const endTime = Date.now() + totalSeconds * 1000;

  countdown = setInterval(() => {
    const secondsLeft = Math.round((endTime - Date.now()) / 1000);

    if (secondsLeft <= 0) {
      timerIsDone = true;
      clearInterval(countdown);
      countdown = null;

      currentAudio.play();
      messageEl.classList.remove("hidden");
      timeEl.classList.add("alert");
    }

    totalSeconds = secondsLeft;
    updateTimeEl();
  }, 1000);
}

function updateTimeEl() {
  if (totalSeconds < 0) totalSeconds = 0;

  timeEl.textContent = formatDuration(totalSeconds);
}

function formatDuration(time) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const secs = time % 60;

  const format = (num) => String(num).padStart(2, "0");
  const formatted = `${hours ? format(hours) + ":" : ""}${format(minutes)}:${format(secs)}`;
  return formatted;
}

function changeVolume(value) {
  currentVolume = value || (currentAudio.volume + 0.25) % 1.25;
  currentAudio.volume = currentVolume;

  save("currentVolume", currentVolume);
}

function updateVolumeBtn() {
  volumeBtn.innerHTML = `${Math.round(currentVolume * 100)}%`;
}

function toggleTheme(force = undefined) {
  const toggle = document.querySelector(".theme-toggle");
  force === undefined ? (darkTheme = !darkTheme) : (darkTheme = force);
  save("darkTheme", darkTheme);
  document.body.classList.toggle("dark-theme", darkTheme);
  toggle.innerHTML = darkTheme ? `<i class="bi bi-sun"></i>` : `<i class="bi bi-moon"></i>`;
}

function toggleRingtoneModal() {
  ringtoneModal.classList.toggle("hidden");
}

async function changeRingtone(file) {
  await saveRingtone(file);
  await loadRingtone();
}

async function loadRingtone() {
  const ringtone = await DB.getItem("ringtones", 1);

  const isPlaying = currentAudio ? !currentAudio.paused : false;
  if (isPlaying) currentAudio.pause();

  const file = ringtone ? ringtone.file : "ringtone.mp3";
  currentAudio = new Audio(file);
  currentAudio.addEventListener("volumechange", updateVolumeBtn);
  currentAudio.volume = currentVolume;
  currentAudio.loop = true;

  if (isPlaying) {
    currentAudio.play();
  }
  ringtoneInput.querySelector(".text").textContent = ringtone ? ringtone.name : "Default";
}

async function saveRingtone(file) {
  const dataUrl = await getFileDataUrl(file);
  await DB.putItem("ringtones", { id: 1, name: getFileName(file), file: dataUrl });
}

async function resetRingtone() {
  await DB.deleteItem("ringtones", 1);
  await loadRingtone();
  currentAudio = new Audio("ringtone.mp3");
  changeVolume(1);
}
