export class ScrubEngine {
    constructor(totalFrames, pathPrefix, extension = 'jpg') {
        this.totalFrames = totalFrames;
        this.pathPrefix = pathPrefix;
        this.extension = extension;
        this.images = [];
        this.loadedCount = 0;
        this.onLoadCallback = null;
        this.isLoaded = false;
    }

    load(onLoad) {
        this.onLoadCallback = onLoad;
        console.log(`ScrubEngine: Starting load of ${this.totalFrames} frames from ${this.pathPrefix}`);

        for (let i = 1; i <= this.totalFrames; i++) {
            const img = new Image();
            // Assuming format: "Family Photos/1.jpg"
            img.src = `${this.pathPrefix}/${i}.${this.extension}`;

            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === this.totalFrames) {
                    this.isLoaded = true;
                    console.log('ScrubEngine: All frames loaded.');
                    if (this.onLoadCallback) this.onLoadCallback();
                }
            };

            img.onerror = (e) => {
                // console.warn(`ScrubEngine: Failed to load frame ${i}`, e);
                // Still count it as "processed"
                this.loadedCount++;
                if (this.loadedCount === this.totalFrames && this.onLoadCallback) {
                    this.onLoadCallback();
                }
            };

            this.images[i - 1] = img;
        }
    }

    /**
     * Returns the image object corresponding to the progress 0.0 - 1.0.
     */
    getFrame(progress) {
        if (!this.images.length) return null;

        // Clamp progress
        progress = Math.max(0, Math.min(1, progress));

        // Map to index
        let index = Math.floor(progress * (this.totalFrames - 1));

        // Safety check
        if (this.images[index] && this.images[index].complete) {
            return this.images[index];
        }
        return this.images[0]; // Fallback
    }
}
