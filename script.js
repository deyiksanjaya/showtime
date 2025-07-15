// app.js

// Impor koneksi 'db' dari file inisialisasi dan fungsi Firebase lainnya yang dibutuhkan
import { db } from './firebase-init.js'; 
import { ref, get, remove } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// --- BAGIAN 1: GERBANG LISENSI ---

// Fungsi untuk memblokir akses jika lisensi tidak valid
function blockAccess(message = "Kunci lisensi tidak valid atau sudah digunakan.") {
    // Sembunyikan konten aplikasi dan tampilkan pesan error
    const appContent = document.getElementById('app-content');
    const appPlaceholder = document.getElementById('app-placeholder');
    if(appContent) appContent.style.display = 'none';
    if(appPlaceholder) {
        appPlaceholder.style.display = 'flex';
        appPlaceholder.innerHTML = `
            <div style="color: #eb4534; text-align: center;">
                <h1 style="font-size: 1.5rem;">Akses Ditolak</h1>
                <p style="font-size: 1rem; color: #e5e5e5;">${message}</p>
            </div>
        `;
    }
    throw new Error("Invalid License. Halting script execution.");
}

// Fungsi ini berisi SEMUA kode stopwatch asli Anda, tidak diubah.
// Fungsi ini hanya akan dijalankan jika lisensi valid.
function launchApp() {
    
    // =======================================================================
    // MULAI: SALINAN PERSIS DARI SCRIPT ASLI ANDA
    // =======================================================================

    let startTime = 0;
    let elapsed = 0;
    let running = false;
    let laps = [];
    let animationFrame;
    let lastDisplay = "";
    let startButtonDisabled = false;
    let psychicTarget = null;
    let psychicTimeout = null;
    let mindReadingMode = false; // Mind Reading Mode flag
    let fixedStopMillis = null; // Stores the chosen "sum to 9" value for the main display when stopped

    let rememberedElapsed = 0;
    let rememberedLaps = [];
    let rememberedRunning = false;
    let rememberedMindReadingMode = false; // To remember the state of MRM


    // Array of "sum to 9" milliseconds for mind reading mode
    const sumOfNineMillis = ["09", "18", "27", "36", "45", "54", "63", "72", "81", "90"];
    let shuffledSumOfNineMillisPool = []; // The pool of available unique milliseconds

    const stopwatchEl = document.getElementById("stopwatch");
    const startBtn = document.getElementById("startBtn");
    const lapBtn = document.getElementById("lapBtn");
    const lapList = document.getElementById("lapList");
    const dotIndicators = document.querySelector(".dot-indicators");

    // Get references to all tab elements by their IDs
    const stopwatchTab = document.getElementById("stopwatchTab");
    const worldClockTab = document.getElementById("worldClockTab");
    const alarmsTab = document.getElementById("alarmsTab");
    const timerTab = document.getElementById("timerTab");


    const psychicOverlay = document.getElementById("psychicOverlay");
    const psychicInput = document.getElementById("psychicInput");
    const clearBtn = document.getElementById("clearBtn");
    // These elements are not present in your HTML, so they will remain null.
    // The code checks `if (psychicIndicator)` before using them, preventing errors.
    const psychicIndicator = document.getElementById("psychicIndicator");
    const mindReadingIndicator = document.getElementById("mindReadingIndicator");
    const numberBtns = document.querySelectorAll(".number-btn");


    // --- Helper function to shuffle an array (Fisher-Yates algorithm) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    // --- Initialize the shuffled pool ---
    // This function should be called when a new sequence of unique numbers is desired.
    function initializeSumOfNinePool() {
        shuffledSumOfNineMillisPool = shuffleArray([...sumOfNineMillis]); // Create a shallow copy and shuffle
        console.log("Sum of Nine Pool Initialized:", shuffledSumOfNineMillisPool);
    }

    // --- Get the next unique "sum to 9" millisecond from the pool ---
    // This function should ONLY be used for recorded laps and the final stop time.
    function getNextUniqueSumOfNineFromPool() {
        if (shuffledSumOfNineMillisPool.length === 0) {
            // If the pool is empty, refill it by shuffling the original list
            initializeSumOfNinePool();
            console.warn("Sum of Nine Pool exhausted, re-initializing.");
        }
        // Pop the last element from the shuffled array (efficient)
        const nextMillis = shuffledSumOfNineMillisPool.pop();
        console.log("Drawing from pool:", nextMillis, "Remaining:", shuffledSumOfNineMillisPool.length);
        return nextMillis;
    }

    // --- Get a dynamic "sum to 9" millisecond for the active lap display ---
    // This function cycles through the sumOfNineMillis array based on real time,
    // without consuming values from the unique pool. It's for visual effect only.
    function getDynamicSumOfNineMillis(ms) {
        // We want a smooth, continuous change for the active lap display.
        // Using the milliseconds directly to index into the array provides this.
        // The division by 10 makes it change every 10ms (0.01 seconds), matching the display format.
        const index = Math.floor((ms % 1000) / 10) % sumOfNineMillis.length;
        return sumOfNineMillis[index];
    }


    // --- Psychic Mode Logic ---

    worldClockTab.addEventListener("click", () => {
      // Only activate psychic overlay if stopwatch is not running
      if (!running) {
        psychicOverlay.classList.add("active");
        psychicInput.textContent = "--";
        psychicInput.classList.add("active");
      } else {
        console.log("Cannot enter Psychic Mode while stopwatch is running.");
      }
    });

    numberBtns.forEach(btn => {
      if (btn.dataset.number) {
        btn.addEventListener("click", () => {
          const digit = btn.dataset.number;
          let currentValue = psychicInput.textContent.replace(/[^0-9]/g, "");

          if (currentValue === "" || psychicInput.textContent === "--") {
              currentValue = digit;
          } else if (currentValue.length < 2) {
              currentValue = currentValue + digit;
          } else {
              currentValue = (currentValue.slice(1) + digit); // Replace first digit with new one
          }

          psychicInput.textContent = currentValue;

          if (currentValue.length === 2) {
            setTimeout(() => {
              psychicOverlay.classList.remove("active");
              psychicTarget = parseInt(currentValue);
              if (psychicTarget !== null && !isNaN(psychicTarget)) {
                  if (psychicIndicator) {
                    psychicIndicator.classList.add("active");
                  }
              } else {
                  if (psychicIndicator) {
                    psychicIndicator.classList.remove("active");
                  }
              }
            }, 300);
          }
        });
      }
    });

    clearBtn.addEventListener("click", () => {
      psychicInput.textContent = "--";
    });


    // --- Mind Reading Mode Toggle (Alarms Tab) ---

    alarmsTab.addEventListener("click", () => {
      mindReadingMode = !mindReadingMode; // Toggle the mode

      if (mindReadingMode) { // If Mind Reading Mode was JUST ACTIVATED
        if (mindReadingIndicator) {
          mindReadingIndicator.classList.add("active");
        }
        console.log("Mind Reading Mode: Activated");
        // ALWAYS re-initialize the pool when MRM is activated to start a fresh sequence
        initializeSumOfNinePool();

        if (!running) { // If stopwatch is STOPPED when MRM is activated
          elapsed = 0; // Reset total elapsed time
          fixedStopMillis = null; // No fixed milliseconds on reset
          stopwatchEl.textContent = "00:00.00"; // Display zeros
          lastDisplay = stopwatchEl.textContent; // Update lastDisplay for consistency
          laps = []; // Clear all lap data
          lapList.innerHTML = ""; // Clear lap display
          lapBtn.disabled = true; // Disable lap button until started
          lapBtn.textContent = "Lap"; // Reset lap button text
        }
      } else { // If Mind Reading Mode was JUST DEACTIVATED
        if (mindReadingIndicator) {
          mindReadingIndicator.classList.remove("active");
        }
        console.log("Mind Reading Mode: Deactivated");

        if (!running) { // If stopwatch is STOPPED when MRM is deactivated
          fixedStopMillis = null; // Ensure fixed milliseconds are cleared
          // Re-display main stopwatch time to show real milliseconds
          stopwatchEl.textContent = formatMainDisplayTime(elapsed);
          lastDisplay = stopwatchEl.textContent;
        }
      }

      // Always rebuild lap list and update colors to reflect mode changes
      rebuildLapListDisplay();
      updateLapColors();
    });


    // --- Time Formatting Functions ---

    // This function formats time for the main stopwatch display.
    // It will apply "sum to 9" milliseconds ONLY IF mindReadingMode is active AND
    // the stopwatch is currently stopped (indicated by fixedStopMillis not being null).
    function formatMainDisplayTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
      const seconds = (totalSeconds % 60).toString().padStart(2, "0");
      let milliseconds;

      // Only apply fixedStopMillis if mindReadingMode is active AND stopwatch is stopped AND fixedStopMillis is set
      if (mindReadingMode && !running && fixedStopMillis !== null) {
        milliseconds = fixedStopMillis;
      } else {
        // Otherwise, use real milliseconds.
        milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
      }

      return `${minutes}:${seconds}.${milliseconds}`;
    }

    // Formats time specifically for the actively running Lap 1 or for newly recorded laps.
    // Completed laps store their fixed formatted string.
    function formatLapDisplayTime(ms, isLiveActiveLap = false) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
      const seconds = (totalSeconds % 60).toString().padStart(2, "0");
      let milliseconds;

      if (mindReadingMode && isLiveActiveLap) {
        // For the active, live lap, get a dynamic sum-of-9 millisecond
        milliseconds = getDynamicSumOfNineMillis(ms);
      } else if (mindReadingMode && !isLiveActiveLap) {
        // For a newly recorded lap (not live) or a stopped lap, get a unique sum-of-9 millisecond from the pool
        milliseconds = getNextUniqueSumOfNineFromPool();
      }
      else {
        // Otherwise, use real milliseconds for the active lap display
        milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
      }

      return `${minutes}:${seconds}.${milliseconds}`;
    }


    // --- Stopwatch Core Functions ---

    function updateDisplay() {
      const now = performance.now();
      const diff = elapsed + (now - startTime);
      // Main stopwatch display always uses real time when running.
      // fixedStopMillis is null here because it's cleared on start.
      const formatted = formatMainDisplayTime(diff);

      if (formatted !== lastDisplay) {
        stopwatchEl.textContent = formatted;
        lastDisplay = formatted;
      }

      updateActiveLap(now);
      updateLapColors(); // Call after lap times are updated (important for consistency)

      if (running) {
        animationFrame = requestAnimationFrame(updateDisplay);
      }
    }

    function updateActiveLap(now) {
      if (laps.length === 0) return;

      const totalTime = elapsed + (now - startTime);
      const lapTimeDuration = totalTime - (laps[1] ? laps[1].total : 0);

      laps[0].raw = lapTimeDuration; // Store raw duration for calculations

      // Lap 1 (the active lap) displays based on mindReadingMode and refreshes rapidly
      // Pass true for isLiveActiveLap to trigger mind-reading logic for active lap
      laps[0].time = formatLapDisplayTime(lapTimeDuration, true);

      const lap1El = lapList.firstElementChild?.querySelector(".lap-time");
      if (lap1El) {
        lap1El.textContent = laps[0].time;
      }
    }

    function updateLapColors() {
        const lapItems = Array.from(lapList.children);
        // Exclude the currently running lap (laps[0]) from comparison
        const completedLapsData = laps.slice(1);

        // Clear existing colors from all lap items
        lapItems.forEach(li => li.classList.remove("fastest", "slowest"));

        if (completedLapsData.length < 2) {
            return; // Need at least two completed laps for comparison
        }

        const completedLapTimes = completedLapsData.map(l => l.raw); // Use raw times for comparison
        const fastest = Math.min(...completedLapTimes);
        const slowest = Math.max(...completedLapTimes);

        if (fastest === slowest) {
            return; // All are the same duration, no coloring
        }

        // Apply colors to completed laps in the DOM
        completedLapsData.forEach((lapData, i) => {
            // laps array is newest first (laps[0] is current, laps[1] is last completed)
            // DOM is also newest first due to rebuildLapListDisplay's appendChild.
            // So completedLapsData[i] corresponds to lapItems[i + 1] (since lapItems[0] is current lap)
            const liElement = lapItems[i + 1];
            if (!liElement) return;

            if (lapData.raw === fastest) {
                liElement.classList.add("fastest");
            } else if (lapData.raw === slowest) {
                liElement.classList.add("slowest");
            }
        });
    }


    startBtn.onclick = () => {
      if (startButtonDisabled) return;
      startButtonDisabled = true;
      setTimeout(() => (startButtonDisabled = false), 300);

      if (!running) { // START the stopwatch
        running = true;
        startTime = performance.now();
        fixedStopMillis = null; // Clear fixedStopMillis when starting
        // IMPORTANT: Do NOT re-initialize the pool here. It should only reset on MRM activation or full stopwatch reset.
        animationFrame = requestAnimationFrame(updateDisplay);
        startBtn.textContent = "Stop";
        startBtn.classList.remove("start-btn");
        startBtn.classList.add("stop-btn");
        lapBtn.textContent = "Lap";
        lapBtn.disabled = false;

        // Start psychic mode if target is set
        if (psychicTarget !== null && !isNaN(psychicTarget)) {
          psychicTimeout = setTimeout(() => {
            if (running) { // Ensure stopwatch is still running when timeout fires
              running = false;
              const now = performance.now();
              elapsed += now - startTime;
              cancelAnimationFrame(animationFrame);

              // Force milliseconds to psychic target for the main display
              const totalMs = elapsed;
              const secondsPart = Math.floor(totalMs / 1000) * 1000;
              const adjustedMs = secondsPart + (psychicTarget * 10);

              elapsed = adjustedMs;
              // Psychic stop always forces main display to real time for its final value.
              fixedStopMillis = null; // Ensure no mind-read effect here
              stopwatchEl.textContent = formatMainDisplayTime(elapsed);
              lastDisplay = stopwatchEl.textContent;

              startBtn.textContent = "Start";
              startBtn.classList.remove("stop-btn");
              startBtn.classList.add("start-btn");
              lapBtn.textContent = "Reset";

              // When stopped by psychic mode, the active lap should also reflect the final real time.
              if (laps.length > 0) {
                // Even if MRM is active, psychic stop overrides it for the final display
                laps[0].raw = elapsed - (laps[1] ? laps[1].total : 0); // Update Lap 1's raw duration based on actual stop time
                laps[0].time = formatMainDisplayTime(laps[0].raw); // Active lap is real here
                const lap1El = lapList.firstElementChild?.querySelector(".lap-time");
                if (lap1El) {
                  lap1El.textContent = laps[0].time;
                }
              }

              psychicTarget = null;
              if (psychicIndicator) {
                psychicIndicator.classList.remove("active");
              }
            }
          }, 6000); // About 6 seconds (6000ms)
        }

        // Initialize Lap 1 when the stopwatch starts if no laps exist
        if (laps.length === 0) {
          // Lap 1 display starts as live, potentially mind-read if mode is on.
          // Its 'time' property will be dynamically updated by updateActiveLap.
          const lapObj = { time: formatLapDisplayTime(0, true), raw: 0, total: 0 };
          laps.unshift(lapObj);

          const li = document.createElement("li");
          li.innerHTML = `<span>Lap 1</span><span class="lap-time">${lapObj.time}</span>`;
          lapList.prepend(li); // Keep initial lap at the top
        }
      } else { // STOP the stopwatch
        if (psychicTimeout) {
          clearTimeout(psychicTimeout);
          psychicTimeout = null;
          psychicTarget = null;
          if (psychicIndicator) {
            psychicIndicator.classList.remove("active");
          }
        }

        running = false;
        elapsed += performance.now() - startTime;
        cancelAnimationFrame(animationFrame);
        startBtn.textContent = "Start";
        startBtn.classList.remove("stop-btn");
        startBtn.classList.add("start-btn");
        lapBtn.textContent = "Reset";

        // When stopped, if mindReadingMode is active, generate and fix the millisecond from the pool.
        if (mindReadingMode) {
            fixedStopMillis = getNextUniqueSumOfNineFromPool();
        } else {
            fixedStopMillis = null; // Ensure it's null if MRM is off
        }
        stopwatchEl.textContent = formatMainDisplayTime(elapsed); // formatMainDisplayTime now uses fixedStopMillis if MRM active
        lastDisplay = stopwatchEl.textContent; // Update lastDisplay with the new formatted string

        // When stopwatch stops, the active lap (laps[0]) becomes a completed lap.
        // Its time property should now be fixed with a unique sum-to-9 from the pool.
        if (laps.length > 0) {
            const currentActiveLapDuration = elapsed - (laps[1] ? laps[1].total : 0); // Calculate its final duration
            laps[0].raw = currentActiveLapDuration; // Update its raw duration

            if (mindReadingMode) {
                laps[0].time = formatLapDisplayTime(currentActiveLapDuration, false); // isLiveActiveLap: false to get unique from pool
            } else {
                laps[0].time = formatMainDisplayTime(currentActiveLapDuration); // Active lap is real here
            }
            const lap1El = lapList.firstElementChild?.querySelector(".lap-time");
            if (lap1El) {
                lap1El.textContent = laps[0].time;
            }
        }
      }
      updateLapColors(); // Update colors after start/stop
    };

    lapBtn.onclick = () => {
      if (!running) { // RESET the stopwatch
        console.log("Resetting stopwatch...");
        rememberedElapsed = elapsed;
        rememberedMindReadingMode = mindReadingMode; // Remember MRM state
        // When remembering, store the *current displayed string* of each lap
        rememberedLaps = laps.map(l => ({
          ...l,
          // For remembered laps, store the 'time' property which already holds the fixed string for completed laps
          // The active lap (laps[0]) will have its final real value stored here.
          time: l.time
        }));
        rememberedRunning = running;

        stopwatchEl.textContent = "00:00.00";
        lapList.innerHTML = "";
        laps = [];
        elapsed = 0;
        lapBtn.disabled = true;
        lapBtn.textContent = "Lap";
        lastDisplay = "";
        fixedStopMillis = null; // Clear fixedStopMillis on reset
        initializeSumOfNinePool(); // Re-initialize pool on explicit reset
        
        if (psychicTarget) {
          psychicTarget = null;
          if (psychicIndicator) {
            clearTimeout(psychicTimeout); // Clear any pending psychic timeout
            psychicTimeout = null;
            psychicIndicator.classList.remove("active");
          }
        }
      } else { // RECORD a LAP
        const now = performance.now();
        const totalTime = elapsed + (now - startTime); // Current total stopwatch time

        // The current active lap is laps[0]. Its duration is totalTime - (previous_lap_total_time).
        // The previous_lap_total_time is stored in laps[1].total if laps[1] exists.
        const previousLapTotal = laps.length > 1 ? laps[1].total : 0; // Correctly get total of previous completed lap
        const currentActiveLapDuration = totalTime - previousLapTotal;

        // Fix the milliseconds for the CURRENTLY ACTIVE LAP (laps[0]) as it's now completed.
        laps[0].raw = currentActiveLapDuration; // Update its raw duration
        laps[0].total = totalTime; // Update its total time

        if (mindReadingMode) {
            laps[0].time = formatLapDisplayTime(currentActiveLapDuration, false); // isLiveActiveLap: false to get unique from pool
        } else {
            laps[0].time = formatMainDisplayTime(currentActiveLapDuration); // Fix with real time if MRM is off
        }
        
        // Now, create a NEW active lap (Lap 1) for the next segment.
        const newActiveLapObj = {
            time: formatLapDisplayTime(0, true), // Starts at 0, dynamically updated
            raw: 0,
            total: totalTime // New active lap starts from the current total time
        };
        laps.unshift(newActiveLapObj); // Add the new active lap to the beginning

        rebuildLapListDisplay(); // Rebuild the entire list
        updateLapColors(); // Recalculate colors
      }
    };

    function rebuildLapListDisplay() {
        lapList.innerHTML = ""; // Clear existing DOM elements

        for (let i = 0; i < laps.length; i++) {
            const lapData = laps[i];
            const displayLapNum = laps.length - i;

            const li = document.createElement("li");
            let lapTimeContent;

            if (i === 0 && running) {
                lapTimeContent = formatLapDisplayTime(lapData.raw, true);
            } else {
                lapTimeContent = lapData.time;
            }

            li.innerHTML = `<span>Lap ${displayLapNum}</span><span class="lap-time">${lapTimeContent}</span>`;
            lapList.appendChild(li);
        }
    }


    function showRememberedState() {
      if (rememberedLaps.length === 0) return;

      if (running) {
        cancelAnimationFrame(animationFrame);
      }

      const tempMindReadingMode = mindReadingMode;
      const tempFixedStopMillis = fixedStopMillis;

      mindReadingMode = rememberedMindReadingMode;
      fixedStopMillis = null;

      stopwatchEl.textContent = formatMainDisplayTime(rememberedElapsed);

      mindReadingMode = tempMindReadingMode;
      fixedStopMillis = tempFixedStopMillis;

      lapList.innerHTML = "";
      for (let i = 0; i < rememberedLaps.length; i++) {
        const lap = rememberedLaps[i];
        const lapNum = rememberedLaps.length - i;
        const li = document.createElement("li");
        li.innerHTML = `<span>Lap ${lapNum}</span><span class="lap-time">${lap.time}</span>`;
        lapList.appendChild(li);
      }

      updateLapColors();

      setTimeout(() => {
        if (rememberedRunning) {
          startTime = performance.now();
          animationFrame = requestAnimationFrame(updateDisplay);
        } else {
          stopwatchEl.textContent = formatMainDisplayTime(elapsed);
        }
        rebuildLapListDisplay();
        updateLapColors();
      }, 2000);
    }

    dotIndicators.addEventListener("click", showRememberedState);

    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (psychicOverlay.classList.contains("active") && tab.id !== "worldClockTab") {
            return;
        }

        worldClockTab.classList.remove("active");
        alarmsTab.classList.remove("active");
        timerTab.classList.remove("active");
        stopwatchTab.classList.add("active");

        if (tab.id === "worldClockTab") {
          if (!running) {
            psychicOverlay.classList.add("active");
            psychicInput.textContent = "--";
            psychicInput.classList.add("active");
          }
          return;
        }
        if (tab.id === "alarmsTab") {
            return;
        }
        if (tab.id === "timerTab") {
            console.log("Timer button clicked! Attempting page reload.");
            location.reload();
            return;
        }
      });
    });

    // Kode dari DOMContentLoaded asli Anda dipindahkan ke sini
    stopwatchTab.classList.add("active");
    initializeSumOfNinePool();

    // =======================================================================
    // AKHIR: SALINAN PERSIS DARI SCRIPT ASLI ANDA
    // =======================================================================
}

// --- BAGIAN 2: LOGIKA VERIFIKASI ---

// Fungsi untuk memeriksa lisensi saat halaman dimuat
async function verifyLicense() {
    const urlParams = new URLSearchParams(window.location.search);
    const licenseKey = urlParams.get('license_key');
    const appPlaceholder = document.getElementById('app-placeholder');
    const appContent = document.getElementById('app-content');

    if (!licenseKey) {
        console.error("Tidak ada kunci lisensi di URL.");
        blockAccess();
        return;
    }

    const licenseRef = ref(db, 'data/licenses/' + licenseKey);

    try {
        const snapshot = await get(licenseRef);
        if (snapshot.exists()) {
            console.log("Lisensi valid, akses diberikan.");
            await remove(licenseRef);
            console.log("Lisensi telah digunakan dan dihapus.");
            
            if(appPlaceholder) appPlaceholder.style.display = 'none';
            if(appContent) appContent.style.display = 'flex'; // Tampilkan konten aplikasi
            
            launchApp(); // Jalankan logika aplikasi utama
        } else {
            console.error("Kunci lisensi tidak ditemukan atau sudah digunakan.");
            blockAccess();
        }
    } catch (error) {
        console.error("Error saat verifikasi lisensi:", error);
        blockAccess("Tidak dapat terhubung ke server verifikasi.");
    }
}

// Jalankan verifikasi lisensi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    verifyLicense().catch(err => {
        // Menangkap error dari blockAccess agar tidak muncul di konsol
        console.warn(err.message);
    });
});