const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'assets/family-photos';
const TARGET_DIR = 'Family Photos';
const TOTAL_FRAMES = 190;

async function populate() {
    try {
        const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith('.png'));
        if (sourceFiles.length === 0) {
            console.error('No source images found in ' + SOURCE_DIR);
            return;
        }

        console.log(`Found ${sourceFiles.length} source images. Creating ${TOTAL_FRAMES} frames...`);

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const sourceFile = sourceFiles[(i - 1) % sourceFiles.length];
            const sourcePath = path.join(SOURCE_DIR, sourceFile);
            const targetPath = path.join(TARGET_DIR, `${i}.png`); // Using .png as updated in main.js

            fs.copyFileSync(sourcePath, targetPath);
        }

        console.log('Tunnel sequence populated successfully!');
    } catch (err) {
        console.error('Error populating tunnel:', err);
    }
}

populate();
