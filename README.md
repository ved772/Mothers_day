# Birthday Website for Mom - Setup Guide

This website is designed as a cinematic, emotional tribute. To complete the experience, please follow these steps:

## 1. Tunnel Animation Sequence
The "Tunnel of Memories" relies on a sequence of **190 images**.
- Place your 190 tunnel images into the `Family Photos` folder.
- **IMPORTANT:** Rename them sequentially: `1.jpg`, `2.jpg`, `3.jpg`, ..., `190.jpg`.
- **Quick Start:** run `node populate.js` to automatically fill the tunnel with your existing 7 photos (looping them) so you can see the effect immediately.
- If your images are `.png`, update `CONFIG.frameExt` in `main.js` to `'png'` (currently set to 'png' for the demo).

## 2. Audio Files
For the emotional music and bell sound:
- Create a folder named `assets` if it doesn't fully exist (it should contain `family-photos` already).
- Add `music.mp3` (soft instrumental) to `assets/`.
- Add `bell.mp3` (temple bell sound) to `assets/`.

## 3. Running the Website
You can use the included script if you have Python installed:
`npm install -g serve` (if you prefer Node)
`npx serve`
OR
`python -m http.server`

Open your browser to `http://localhost:8000`.

## 4. Customizing Text
Edit `index.html` and `main.js` to change the specific messages and dates.

Made with love. ❤️
