// testing
console.log("script.js loaded");

// retrieve DOM elements
const generateButton = document.getElementById("generate-password");
const againButton = document.getElementById("again");
const result = document.getElementById("result");

const passwordInput = document.getElementById("password");
const copyButton = document.getElementById("copy-password");
const toggleButton = document.getElementById("toggle-visibility");

const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("length-value");

const strengthEl = document.getElementById("strength");
const crackTimeEl = document.getElementById("crack-time");

if (!generateButton || !againButton || !result|| !passwordInput || !copyButton
    || !toggleButton || !lengthInput || !lengthValue || !strengthEl || !crackTimeEl) {
  throw new Error("Missing required DOM elements. Check your HTML IDs.");
}

const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?~|";

// generates random password (default length 16)
function generatePassword(length = 16) {
    // create array of length numbers
    const arr = new Uint32Array(length);
    // fills arr with cryptographically secure random numbers from browser/OS
    crypto.getRandomValues(arr);
    // convert typed array into normal array and join into a string
    return Array.from(arr, x => CHARSET[x % CHARSET.length]).join("");
}

function getCharsetSizeFromGenerator() {
    // match same character you set to generate
    // can later compute size from user input?
    return CHARSET.length;
}

function entropyBits(length, charsetSize) {
    // bits = length * log2(charsetSize);
    return length * Math.log2(charsetSize);
}

function formatDuration(seconds) {
    if (seconds < 1)
        return "less than 1 second";
    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;
    const year = 365 * day;

    if (seconds < minute)
        return `${Math.round(seconds)} seconds`;
    if (seconds < hour)
        return `${Math.round(seconds / minute)} minutes`;
    if (seconds < day)
        return `${Math.round(seconds / hour)} hours`;
    if (seconds < year)
        return `${Math.round(seconds / day)} days`;
    return `${(seconds / year).toFixed(1)} years`;
}

// roughly calculates time to crack password
function crackTimeEstimates(entropy) {
    // online guessing --> rate limited
    // offline hashes --> extremely fast
    // attacker likes this
    const onlineGuessesPerSec = 10;
    // 10 billion/sec (although this varies by hardware & hash)
    const offlineGuessesPerSec = 1e10;

    // expected guesses on average roughly 2^(entropy - 1)
    // worst-case is 2^entropy
    const averageGuesses = Math.pow(2, entropy - 1);

    return {
        onlineAverageSeconds: averageGuesses / onlineGuessesPerSec,
        offlineAverageSeconds: averageGuesses / offlineGuessesPerSec
    };
}

function strengthLabel(entropy) {
    // can change these values later if inaccurate
    if (entropy < 40)
        return "Weak";
    if (entropy < 60)
        return "Moderate";
    if (entropy < 80)
        return "Strong";
    return "Very strong";
}

function updateStrengthUI(password) {
    if (!strengthEl || !crackTimeEl)
        return;

    const length = password.length;
    const charsetSize = getCharsetSizeFromGenerator();
    const bits = entropyBits(length, charsetSize);

    // warn if password length is too short (making it weak)
    if (bits < 50) {
        strengthEl.textContent += "⚠️ Consider increasing length."
    }

    const label = strengthLabel(bits);
    strengthEl.textContent = `Strength: ${label} - ${length} chars, ~${bits.toFixed(1)} bits of entropy`;

    const times = crackTimeEstimates(bits);
    crackTimeEl.textContent = 
        `Estimated time to crack (average): ` + 
        `Online ~${formatDuration(times.onlineAverageSeconds)}; ` + 
        `Offline ~${formatDuration(times.offlineAverageSeconds)}. ` +
        `Estimates vary widely by site and hashing.`;
}

// helper function updating the UI
function setNewPassword() {
    lengthValue.textContent = lengthInput.value;
    const length = Number(lengthInput.value);
    const pw = generatePassword(length);

    passwordInput.value = pw;
    // reset copied button in case they pressed copy button before
    copyButton.textContent = "Copy";
    // hide password upon generation each time
    passwordInput.type = "password";
    toggleButton.textContent = "Show";
    // remove the .hidden class
    result.classList.remove("hidden");
    // keep visible the "generate another password"
    generateButton.classList.add("hidden");

    updateStrengthUI(pw);
}

lengthInput.addEventListener("input", () => {
    lengthValue.textContent = lengthInput.value;

    // if the password already exists, regenerate another one!
    if (passwordInput.value) {
        setNewPassword();
    }
});

generateButton.addEventListener("click", setNewPassword);
againButton.addEventListener("click", setNewPassword);

// for showing and hiding generated password
toggleButton.addEventListener("click", () => {
    if (!passwordInput.value)
        return;

    // "text" means visible, "password" means hidden
    const showing = passwordInput.type === "text";
    // if currently showing, switch to hidden (v.v.)
    passwordInput.type = showing ? "password" : "text";
    // update button label to match toggle status
    toggleButton.textContent = showing ? "Show" : "Hide";
});

// copy password
copyButton.addEventListener("click", async () => {
    if (!passwordInput.value) return;
    // copy current password text to user's clipboard
    await navigator.clipboard.writeText(passwordInput.value);
    // provide instant feedback
    copyButton.textContent = "Copied!";
    // after 1s, change button text back to "Copy"
    setTimeout(() => (copyButton.textContent = "Copy"), 1000);
});