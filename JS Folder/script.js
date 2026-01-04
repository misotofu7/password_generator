// retrieve DOM elements
const generateButton = document.getElementById("generate-password");
const againButton = document.getElementById("again");
const result = document.getElementById("result");

const passwordInput = document.getElementById("password");
const copyButton = document.getElementById("copy-password");
const toggleButton = document.getElementById("toggle-visibility");

// generates random password (default length 16)
function generatePassword(length = 16) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?~|";
    // create array of length numbers
    const arr = new Uint32Array(length);
    // fills arr with cryptographically secure random numbers from browser/OS
    crypto.getRandomValues(arr);
    // convert typed array into normal array and join into a string
    return Array.from(arr, x => chars[x % chars.length]).join("");
}

// helper function updating the UI
function setNewPassword() {
    passwordInput.value = generatePassword(16);
    // hide password upon generation each time
    passwordInput.type = "password";
    toggleButton.textContent = "Show";
    // remove the .hidden class
    result.classList.remove("hidden");
    // keep visible the "generate another password"
    generateButton.classList.add("hidden");
}

generateButton.addEventListener("click", setNewPassword);
againButton.addEventListener("click", setNewPassword);

// for showing and hiding generated password
toggleButton.addEventListener("click", () => {
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