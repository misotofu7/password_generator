# Password Generator & Analyzer 🔐

A client-side password generator and strength analyzer that runs entirely in the browser.

## Features

- **2 Modes**
    1. Generate secure passwords (random or memorable word-based passphrase) using the Web Crypto API
    2. Analyze user-provided passwords
- Control password length using a slider
- Select character sets for random password generation
    - Lowercase letters
    - Uppercase letters
    - Numbers
    - Symbols
- Password analysis includes:
    * Estimated entropy (bits)
    * Strength rating
    * Time-to-crack estimates (online vs offline)
* Toggle password visibility
* Copy passwords to clipboard
* No server, tracking, or password storage

## Demo / Screenshots

![2 Modes](./images/default_page.png)
![Random password generator mode](./images/random_mode.png)
![Memorable passphrase generator mode](./images/memorable_mode.png)
![Analyze user password mode](./images/analyze_password.png)

## Usage

1. Clone the repository
2. Open the project folder
3. Open `index.html` in a browser
    * Double right click the mouse on top of the `index.html` file on the left bar
    * Click "Open with Live Server"
4. Explore and enjoy!

## Security / Privacy
* Uses `crypto.getRandomValues()` for cryptographically secure randomness
* No network requests after page load
* Passwords not stored, logged, or transmitted
* Optional: disconnect from the internet after loading