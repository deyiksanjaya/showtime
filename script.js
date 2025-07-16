let startTime = 0;
let elapsed = 0;
let running = false;
let laps = [];
let animationFrame;
let lastDisplay = "";
let startButtonDisabled = false;
let psychicTarget = null;
let psychicTimeout = null;
let mindReadingMode = false;
let fixedStopMillis = null;

let rememberedElapsed = 0;
let rememberedLaps = [];
let rememberedRunning = false;
let rememberedMindReadingMode = false;

let worldClockReady = false;
let worldClockTriggered = false;
let worldClockDelayStartTimer = null;
let worldClockAutoStopTimer = null;
let worldClockStartElapsedAtStop = 0;

const sumOfNineMillis = ["09", "18", "27", "36", "45", "54", "63", "72", "81", "90"];
let shuffledSumOfNineMillisPool = [];

const stopwatchEl = document.getElementById("stopwatch");
const startBtn = document.getElementById("startBtn");
const lapBtn = document.getElementById("lapBtn");
const lapList = document.getElementById("lapList");
const dotIndicators = document.querySelector(".dot-indicators");

const stopwatchTab = document.getElementById("stopwatchTab");
const worldClockTab = document.getElementById("worldClockTab");
const alarmsTab = document.getElementById("alarmsTab");
const timerTab = document.getElementById("timerTab");

const psychicOverlay = document.getElementById("psychicOverlay");
const psychicInput = document.getElementById("psychicInput");
const clearBtn = document.getElementById("clearBtn");
const psychicIndicator = document.getElementById("psychicIndicator");
const mindReadingIndicator = document.getElementById("mindReadingIndicator");
const numberBtns = document.querySelectorAll(".number-btn");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initializeSumOfNinePool() {
    shuffledSumOfNineMillisPool = shuffleArray([...sumOfNineMillis]);
    console.log("Sum of Nine Pool Initialized:", shuffledSumOfNineMillisPool);
}

function getNextUniqueSumOfNineFromPool() {
    if (shuffledSumOfNineMillisPool.length === 0) {
        initializeSumOfNinePool();
        console.warn("Sum of Nine Pool exhausted, re-initializing.");
    }
    const nextMillis = shuffledSumOfNineMillisPool.pop();
    console.log("Drawing from pool:", nextMillis, "Remaining:", shuffledSumOfNineMillisPool.length);
    return nextMillis;
}

function getDynamicSumOfNineMillis(ms) {
    const index = Math.floor((ms % 1000) / 10) % sumOfNineMillis.length;
    return sumOfNineMillis[index];
}

worldClockTab.addEventListener("click", () => {
    if (!running) {
        psychicOverlay.classList.add("active");
        psychicInput.textContent = "--";
        psychicInput.classList.add("active");
        worldClockReady = false;
        psychicTarget = null;
        worldClockTriggered = false;
        clearTimeout(worldClockDelayStartTimer);
        clearTimeout(worldClockAutoStopTimer);
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
                currentValue = (currentValue.slice(1) + digit);
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
                        worldClockReady = true;
                        console.log("Psychic Target set:", psychicTarget, "World Clock Ready:", worldClockReady);
                    } else {
                        if (psychicIndicator) {
                            psychicIndicator.classList.remove("active");
                        }
                        worldClockReady = false;
                        psychicTarget = null;
                        worldClockTriggered = false;
                    }
                }, 300);
            }
        });
    }
});

clearBtn.addEventListener("click", () => {
    psychicInput.textContent = "--";
    worldClockReady = false;
    psychicTarget = null;
    worldClockTriggered = false;
    if (psychicIndicator) {
        psychicIndicator.classList.remove("active");
    }
    clearTimeout(worldClockDelayStartTimer);
    clearTimeout(worldClockAutoStopTimer);
});

alarmsTab.addEventListener("click", () => {
    mindReadingMode = !mindReadingMode;

    if (mindReadingMode) {
        if (mindReadingIndicator) {
            mindReadingIndicator.classList.add("active");
        }
        console.log("Mind Reading Mode: Activated");
        initializeSumOfNinePool();

        if (!running) {
            elapsed = 0;
            fixedStopMillis = null;
            stopwatchEl.textContent = "00:00.00";
            lastDisplay = stopwatchEl.textContent;
            laps = [];
            lapList.innerHTML = "";
            lapBtn.disabled = true;
            lapBtn.textContent = "Lap";
        }
    } else {
        if (mindReadingIndicator) {
            mindReadingIndicator.classList.remove("active");
        }
        console.log("Mind Reading Mode: Deactivated");

        if (!running) {
            fixedStopMillis = null;
            stopwatchEl.textContent = formatMainDisplayTime(elapsed);
            lastDisplay = stopwatchEl.textContent;
        }
    }
    rebuildLapListDisplay();
    updateLapColors();
});

function formatMainDisplayTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    let milliseconds;

    if (mindReadingMode && !running && fixedStopMillis !== null) {
        milliseconds = fixedStopMillis;
    } else {
        milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
    }

    return `${minutes}:${seconds}.${milliseconds}`;
}

function formatLapDisplayTime(ms, isLiveActiveLap = false) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    let milliseconds;

    if (mindReadingMode && isLiveActiveLap) {
        milliseconds = getDynamicSumOfNineMillis(ms);
    } else if (mindReadingMode && !isLiveActiveLap) {
        milliseconds = getNextUniqueSumOfNineFromPool();
    } else {
        milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
    }

    return `${minutes}:${seconds}.${milliseconds}`;
}

function updateDisplay() {
    const now = performance.now();
    const diff = elapsed + (now - startTime);
    const formatted = formatMainDisplayTime(diff);

    if (formatted !== lastDisplay) {
        stopwatchEl.textContent = formatted;
        lastDisplay = formatted;
    }

    updateActiveLap(now);
    updateLapColors();

    if (running) {
        animationFrame = requestAnimationFrame(updateDisplay);
    }
}

function updateActiveLap(now) {
    if (laps.length === 0) return;

    const totalTime = elapsed + (now - startTime);
    const lapTimeDuration = totalTime - (laps[1] ? laps[1].total : 0);

    laps[0].raw = lapTimeDuration;

    laps[0].time = formatLapDisplayTime(lapTimeDuration, true);

    const lap1El = lapList.firstElementChild?.querySelector(".lap-time");
    if (lap1El) {
        lap1El.textContent = laps[0].time;
    }
}

function updateLapColors() {
    const lapItems = Array.from(lapList.children);
    const completedLapsData = laps.slice(1);

    lapItems.forEach(li => li.classList.remove("fastest", "slowest"));

    if (completedLapsData.length < 2) {
        return;
    }

    const completedLapTimes = completedLapsData.map(l => l.raw);
    const fastest = Math.min(...completedLapTimes);
    const slowest = Math.max(...completedLapTimes);

    if (fastest === slowest) {
        return;
    }

    completedLapsData.forEach((lapData, i) => {
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

    if (!running) {
        clearTimeout(worldClockDelayStartTimer);
        clearTimeout(worldClockAutoStopTimer);
        worldClockTriggered = false;

        running = true;
        startTime = performance.now();
        fixedStopMillis = null;
        animationFrame = requestAnimationFrame(updateDisplay);
        startBtn.textContent = "Stop";
        startBtn.classList.remove("start-btn");
        startBtn.classList.add("stop-btn");
        lapBtn.textContent = "Lap";
        lapBtn.disabled = false;

        if (laps.length === 0) {
            const lapObj = {
                time: formatLapDisplayTime(0, true),
                raw: 0,
                total: 0
            };
            laps.unshift(lapObj);

            const li = document.createElement("li");
            li.innerHTML = `<span>Lap 1</span><span class="lap-time">${lapObj.time}</span>`;
            lapList.prepend(li);
        }
    } else {
        running = false;
        elapsed += performance.now() - startTime;
        cancelAnimationFrame(animationFrame);

        if (psychicTimeout) {
            clearTimeout(psychicTimeout);
            psychicTimeout = null;
            if (psychicIndicator) {
                psychicIndicator.classList.remove("active");
            }
        }

        if (worldClockReady && psychicTarget !== null && !isNaN(psychicTarget)) {
            console.log("Stopwatch stopped, Psychic Mode target set. Triggering World Clock sequence.");
            worldClockTriggered = true;
            worldClockStartElapsedAtStop = elapsed;
            fixedStopMillis = Math.floor((elapsed % 1000) / 10).toString().padStart(2, "0");
            stopwatchEl.textContent = formatMainDisplayTime(elapsed);
            lastDisplay = stopwatchEl.textContent;

            startBtn.textContent = "Start";
            startBtn.classList.remove("stop-btn");
            startBtn.classList.add("start-btn");
            lapBtn.textContent = "Reset";

            const wcLabel = document.querySelector("#worldClockTab div");
            // Set label to "World Clock." 1 second before the stopwatch resumes (i.e., after 4 seconds of delay)
            worldClockDelayStartTimer = setTimeout(() => {
                if (wcLabel) wcLabel.textContent = "World Clock.";
                console.log("Label changed to 'World Clock.' (1 second before resume)");

                // After 1 more second (total 5 seconds delay), resume stopwatch
                setTimeout(() => {
                    if (wcLabel) wcLabel.textContent = "World Clock"; // Revert label
                    console.log("5-second delay finished. Resuming stopwatch from", formatMainDisplayTime(worldClockStartElapsedAtStop));

                    running = true;
                    startTime = performance.now();
                    elapsed = worldClockStartElapsedAtStop;
                    fixedStopMillis = null;
                    animationFrame = requestAnimationFrame(updateDisplay);

                    startBtn.textContent = "Stop";
                    startBtn.classList.remove("start-btn");
                    startBtn.classList.add("stop-btn");
                    lapBtn.textContent = "Lap";
                    lapBtn.disabled = false;

                    worldClockAutoStopTimer = setTimeout(() => {
                        if (running) {
                            running = false;
                            const now = performance.now();
                            elapsed += now - startTime;

                            cancelAnimationFrame(animationFrame);

                            const totalMs = elapsed;
                            const secondsPart = Math.floor(totalMs / 1000) * 1000;
                            const adjustedMs = secondsPart + (psychicTarget * 10);

                            elapsed = adjustedMs;
                            fixedStopMillis = null;
                            stopwatchEl.textContent = formatMainDisplayTime(elapsed);
                            lastDisplay = stopwatchEl.textContent;

                            startBtn.textContent = "Start";
                            startBtn.classList.remove("stop-btn");
                            startBtn.classList.add("start-btn");
                            lapBtn.textContent = "Reset";

                            if (laps.length > 0) {
                                laps[0].raw = elapsed - (laps[1] ? laps[1].total : 0);
                                laps[0].time = formatMainDisplayTime(laps[0].raw);
                                const lap1El = lapList.firstElementChild?.querySelector(".lap-time");
                                if (lap1El) {
                                    lap1El.textContent = laps[0].time;
                                }
                            }

                            if (psychicIndicator) {
                                psychicIndicator.classList.remove("active");
                            }
                            worldClockReady = false;
                            psychicTarget = null;
                            worldClockTriggered = false;
                            worldClockStartElapsedAtStop = 0;
                            console.log("Auto-stop & adjusted to target.");
                        }
                    }, 6000); // 6 seconds after resume
                }, 1000); // 1 second after label change (total 5s delay)
            }, 4000); // 4 seconds into the 5-second delay
        } else {
            if (mindReadingMode) {
                fixedStopMillis = getNextUniqueSumOfNineFromPool();
            } else {
                fixedStopMillis = null;
            }
            stopwatchEl.textContent = formatMainDisplayTime(elapsed);
            lastDisplay = stopwatchEl.textContent;

            startBtn.textContent = "Start";
            startBtn.classList.remove("stop-btn");
            startBtn.classList.add("start-btn");
            lapBtn.textContent = "Reset";

            if (laps.length > 0) {
                const currentActiveLapDuration = elapsed - (laps[1] ? laps[1].total : 0);
                laps[0].raw = currentActiveLapDuration;

                if (mindReadingMode) {
                    laps[0].time = formatLapDisplayTime(currentActiveLapDuration, false);
                } else {
                    laps[0].time = formatMainDisplayTime(currentActiveLapDuration);
                }
                const lap1El = lapList.firstElementChild?.querySelector(".lap-time");
                if (lap1El) {
                    lap1El.textContent = laps[0].time;
                }
            }
        }
    }
    updateLapColors();
};

lapBtn.onclick = () => {
    if (!running) {
        console.log("Resetting stopwatch...");
        rememberedElapsed = elapsed;
        rememberedMindReadingMode = mindReadingMode;
        rememberedLaps = laps.map(l => ({
            ...l,
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
        fixedStopMillis = null;
        initializeSumOfNinePool();

        if (psychicTimeout) clearTimeout(psychicTimeout);
        if (worldClockDelayStartTimer) clearTimeout(worldClockDelayStartTimer);
        if (worldClockAutoStopTimer) clearTimeout(worldClockAutoStopTimer);
        psychicTimeout = null;
        worldClockDelayStartTimer = null;
        worldClockAutoStopTimer = null;

        psychicTarget = null;
        worldClockReady = false;
        worldClockTriggered = false;
        worldClockStartElapsedAtStop = 0;

        if (psychicIndicator) {
            psychicIndicator.classList.remove("active");
        }
    } else {
        const now = performance.now();
        const totalTime = elapsed + (now - startTime);
        const previousLapTotal = laps.length > 1 ? laps[1].total : 0;
        const currentActiveLapDuration = totalTime - previousLapTotal;

        laps[0].raw = currentActiveLapDuration;
        laps[0].total = totalTime;

        if (mindReadingMode) {
            laps[0].time = formatLapDisplayTime(currentActiveLapDuration, false);
        } else {
            laps[0].time = formatMainDisplayTime(currentActiveLapDuration);
        }

        const newActiveLapObj = {
            time: formatLapDisplayTime(0, true),
            raw: 0,
            total: totalTime
        };
        laps.unshift(newActiveLapObj);

        rebuildLapListDisplay();
        updateLapColors();
    }
};

function rebuildLapListDisplay() {
    lapList.innerHTML = "";

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
                worldClockReady = false;
                psychicTarget = null;
                worldClockTriggered = false;
                clearTimeout(worldClockDelayStartTimer);
                clearTimeout(worldClockAutoStopTimer);
            }
            return;
        }
        if (tab.id === "alarmsTab") {
            return;
        }
        if (tab.id === "timerTab") {
  let holdTimeout;
  let isHeld = false;

  // 🖱️ Mouse support
  timerTab.addEventListener("mousedown", () => {
    isHeld = false;
    holdTimeout = setTimeout(() => {
      isHeld = true;
      const timerData = stopwatchEl.textContent;
      const shortcutUrl = `shortcuts://run-shortcut?name=ShowTime&input=${encodeURIComponent(timerData)}`;
      window.location.href = shortcutUrl;
    }, 600);
  });

  timerTab.addEventListener("mouseup", () => {
    clearTimeout(holdTimeout);
    if (!isHeld) {
      const shortcutUrl = `shortcuts://run-shortcut?name=ShowTime`;
      window.location.href = shortcutUrl;
    }
  });

  timerTab.addEventListener("mouseleave", () => {
    clearTimeout(holdTimeout);
  });

  // 📱 Touch support (penting di iPhone/iPad)
  timerTab.addEventListener("touchstart", () => {
    isHeld = false;
    holdTimeout = setTimeout(() => {
      isHeld = true;
      const timerData = stopwatchEl.textContent;
      const shortcutUrl = `shortcuts://run-shortcut?name=ShowTime&input=${encodeURIComponent(timerData)}`;
      window.location.href = shortcutUrl;
    }, 600);
  });

  timerTab.addEventListener("touchend", () => {
    clearTimeout(holdTimeout);
    if (!isHeld) {
      const shortcutUrl = `shortcuts://run-shortcut?name=ShowTime`;
      window.location.href = shortcutUrl;
    }
  });

  return;
}
    });
});

document.addEventListener('DOMContentLoaded', () => {
    stopwatchTab.classList.add("active");
    initializeSumOfNinePool();
});
