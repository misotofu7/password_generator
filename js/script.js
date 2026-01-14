// retrieve DOM elements
const generateButton = document.getElementById("generate-password");
const againButton = document.getElementById("again");
const result = document.getElementById("result");
const generatorUI = document.getElementById("generator-ui");

const passwordInput = document.getElementById("password");
const copyButton = document.getElementById("copy-password");
const toggleButton = document.getElementById("toggle-visibility");

const modeInputs = document.querySelectorAll('input[name="mode"]');

const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("length-value");
const lengthLabel = document.getElementById("length-label");

const lowerOpt = document.getElementById("opt-lower");
const upperOpt = document.getElementById("opt-upper");
const digitsOpt = document.getElementById("opt-digits");
const symbolsOpt = document.getElementById("opt-symbols");
const charsetHint = document.getElementById("charset-hint");

const strengthBar = document.getElementById("strength-bar");

const strengthEl = document.getElementById("strength");
const crackTimeEl = document.getElementById("crack-time");

const appModeInputs = document.querySelectorAll('input[name="app-mode"]');
const analyzeBox = document.getElementById("analyze-box");
const userPasswordInput = document.getElementById("user-password");

if (modeInputs.length === 0) {
    throw new Error('Missing mode ratio inputs: input[name="mode"]');
}

if (!generateButton || !againButton || !result || !generatorUI || !passwordInput
    || !copyButton || !toggleButton || !modeInputs || !lengthInput || !lengthValue
    || !lengthLabel || !lowerOpt || !upperOpt || !digitsOpt || !symbolsOpt
    || !charsetHint || !strengthBar || !strengthEl || !crackTimeEl
    || !appModeInputs || !analyzeBox || !userPasswordInput) {
  throw new Error("Missing required DOM elements. Check your HTML IDs.");
}

// call once on load
syncLengthControlForMode(getMode());
syncAppModeUI();

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?~|";

const WORDS = [
    "apple", "river", "cloud", "stone", "battery",
    "forest", "orange", "silver", "mango", "planet",
    "coffee", "window", "rocket", "shadow", "sunset",
    "bottle", "tissue", "horse", "music", "language",
    "snack", "earbud", "charger", "keychain", "grapefruit"
];

function getAppMode() {
    const checked = [...appModeInputs].find(r => r.checked);
    return checked ? checked.value : "generate";
}

function getMode() {
    const checked = [...modeInputs].find(r => r.checked);
    return checked  ? checked.value : "random";
}

function buildCharset() {
    let charset = "";
    if (lowerOpt.checked)
        charset += LOWER
    if (upperOpt.checked)
        charset += UPPER;
    if (digitsOpt.checked)
        charset += DIGITS;
    if (symbolsOpt.checked)
        charset += SYMBOLS
    return charset
}

// generates random password (default length 16)
function generatePassword(length = 16, charset) {
    // create array of length numbers
    const arr = new Uint32Array(length);
    // fills arr with cryptographically secure random numbers from browser/OS
    crypto.getRandomValues(arr);
    // convert typed array into normal array and join into a string
    return Array.from(arr, x => charset[x % charset.length]).join("");
}

function generatePassphrase(wordsCount = 4, separator = "-") {
    const arr = new Uint32Array(wordsCount);
    crypto.getRandomValues(arr);
    return Array.from(arr, x => WORDS[x % WORDS.length]).join(separator);
}

function getCharsetSizeFromGenerator() {
    // match same character you set to generate
    // can later compute size from user input?
    return CHARSET.length;
}

// convert password length + all possible characters into total guessing difficulty (entropy)
// return entropy measured in bits
function entropyBits(length, charsetSize) {
    // log2(charsetSize) --> how many bits one character contributes
    // multiply by length because each char adds independent choice from charset
    return length * Math.log2(charsetSize);
}

function strengthKeyFromLabel(label) {
    // map to the CSS selectors above
    if (label == "Weak")
        return "weak";
    if (label == "Moderate")
        return "moderate";
    if (label == "Strong")
        return "strong";
    return "very-strong";
}

function meterPercentFromBits(bits) {
    // treat ~100 bits as full
    const pct = (bits / 100) * 100;
    return Math.max(0, Math.min(100, pct));
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

function estimateCharsetSize(password) {
    let size = 0;
    if (/[a-z]/.test(password))
        size += 26;
    if (/[A-Z]/.test(password))
        size += 26;
    if (/[0-9]/.test(password))
        size += 10;
    if (/[^a-zA-Z0-9]/.test(password))
        size += SYMBOLS.length;
    return size || 1;
}

function updateStrengthUI(password, mode) {
    let bits;

    if (mode === "passphrase") {
        const wordsCount = password.split("-").filter(Boolean).length;
        bits = wordsCount * Math.log2(WORDS.length);
    }
    else if (mode === "analyze") {
        const charsetSize = estimateCharsetSize(password);
        bits = entropyBits(password.length, charsetSize);
    }
    else {
        const charsetSize = buildCharset().length;
        if (charsetSize === 0){
            return;
        }
        bits = entropyBits(password.length, charsetSize);
    }

    if (!strengthEl || !crackTimeEl)
        return;

    const label = strengthLabel(bits);

    let message = `Strength: ${label} - ~${bits.toFixed(1)} bits of entropy`;
    // warn if password length is too short (making it weak)
    if (bits < 50) {
        message += " ⚠️ Consider increasing length.";
    }
    strengthEl.textContent = message;

    if (strengthBar) {
        const pct = meterPercentFromBits(bits);
        strengthBar.style.width = `${pct}%`;
        result.dataset.strength = strengthKeyFromLabel(label)
    }

    const times = crackTimeEstimates(bits);
    crackTimeEl.textContent = 
        `Estimated time to crack (average): Online ~${formatDuration(times.onlineAverageSeconds)}; ` + 
        `Offline ~${formatDuration(times.offlineAverageSeconds)}.`;
}

// helper function updating the UI
function setNewPassword() {
    lengthValue.textContent = lengthInput.value;
    const mode = getMode();
    const length = Number(lengthInput.value);
    let pw;

    if (mode === "passphrase") {
        pw = generatePassphrase(length);
    }
    else {
        const charset = buildCharset();

        if (charset.length === 0) {
            charsetHint.textContent = "Select at least one character set to generate a password.";
            return;
        }

        charsetHint.textContent = `Character set size: ${charset.length}`;
        pw = generatePassword(length, charset);
    }
        
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

    updateStrengthUI(pw, mode);
}

function syncAppModeUI() {
    const mode = getAppMode();

    // always show result panel in either mode
    // strength meter, entropy bits analysis, password length
    result.classList.remove("hidden");

    if (mode === "analyze") {
        analyzeBox.classList.remove("hidden");
        generatorUI.classList.add("hidden");
        generateButton.classList.add("hidden");
    }
    else {
        analyzeBox.classList.add("hidden");
        generatorUI.classList.remove("hidden");
        generateButton.classList.remove("hidden");
    }

    if (mode === "analyze" && userPasswordInput.value) {
        updateStrengthUI(userPasswordInput.value, "analyze");
    }
    
    if (mode === "generate" && passwordInput.value) {
        updateStrengthUI(passwordInput.value, getMode());
    }
}

function syncLengthControlForMode(mode) {
    if (lengthLabel) {
        lengthLabel.textContent = mode === "passphrase" ? "Passphrase Words" : "Password Length";
    }

    if (mode == "passphrase") {
        // word count range
        lengthInput.min = "3";
        lengthInput.max = "8";
        lengthInput.step = "1";

        // if current value out of range, pick reasonable default
        const v = Number(lengthInput.value);
        if (v < 3 || v > 8)
            lengthInput.value = "4";
    }
    else {
        // character length range
        lengthInput.min = "8";
        lengthInput.max = "64";
        lengthInput.step = "1";

        const v = Number(lengthInput.value);
        if (v < 8 || v > 64)
            lengthInput.value = "16";
    }

    lengthValue.textContent = lengthInput.value;
}

lengthInput.addEventListener("input", () => {
    lengthValue.textContent = lengthInput.value;

    // if the password already exists, regenerate another one!
    if (passwordInput.value) {
        setNewPassword();
    }
});

[lowerOpt, upperOpt, digitsOpt, symbolsOpt].forEach(opt => {
    opt.addEventListener("change", () => {
        const charsetSize = buildCharset().length;

        if (charsetSize === 0) {
            charsetHint.textContent = "Select at least one character set.";
            return;
        }

        charsetHint.textContent = `Character set size: ${charsetSize}`;

        // password is generated and is in random mode --> regenerate password
        if (passwordInput.value && getMode() === "random") {
            setNewPassword();
        }
    });
});

generateButton.addEventListener("click", setNewPassword);
againButton.addEventListener("click", setNewPassword);

modeInputs.forEach(radio => {
    radio.addEventListener("change", () => {
        const mode = getMode();
        syncLengthControlForMode(mode);

        // if password exists already, regenerate using new mode settings
        if (passwordInput.value)
            setNewPassword()
    });
});

appModeInputs.forEach(radio => {
    radio.addEventListener("change", syncAppModeUI);
});

userPasswordInput.addEventListener("input", () => {
    const pw = userPasswordInput.value;
    if (!pw){
        // clear analysis display if empty
        strengthEl.textContent = "";
        crackTimeEl.textContent = "";
        strengthBar.style.width = "0%";
        delete result.dataset.strength;
        return;
    }

    updateStrengthUI(pw, "analyze");
});

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