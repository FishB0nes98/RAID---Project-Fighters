/**
 * Story Slideshow Manager
 * Handles the display and progression of image-based story sequences.
 */
class StorySlideshow {
    constructor(storyManager, uiManager, containerId = 'story-slideshow-container') {
        this.storyManager = storyManager;
        this.uiManager = uiManager;
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Slideshow container with ID '${containerId}' not found!`);
            throw new Error(`Slideshow container '${containerId}' missing.`);
        }
        this.currentSlideIndex = 0;
        this.slides = []; // Array of { image: string, text: string } objects
        this.isActive = false;

        // DOM elements for the slideshow
        this.slideshowContent = null;
        this.slideImage = null;
        this.slideText = null;
        this.nextButton = null;
        this.skipButton = null;

        this.initializeElements();
    }

    initializeElements() {
        this.container.innerHTML = `
            <div class="slideshow-content">
                <img class="slide-image" src="" alt="Story Image">
                <div class="slide-text-overlay">
                    <p class="slide-text"></p>
                </div>
                <button class="slideshow-button next-button">Next ▶</button>
                <button class="slideshow-button skip-button">Skip Slideshow</button>
            </div>
        `;
        this.slideshowContent = this.container.querySelector('.slideshow-content');
        // Keep references to existing elements for single image slides
        this.slideImage = this.container.querySelector('.slide-image');
        this.slideTextOverlay = this.container.querySelector('.slide-text-overlay');
        this.slideText = this.container.querySelector('.slide-text');
        this.nextButton = this.container.querySelector('.next-button');
        this.skipButton = this.container.querySelector('.skip-button');

        this.nextButton.addEventListener('click', () => this.showNextSlide());
        this.skipButton.addEventListener('click', () => this.skipSlideshow());
    }

    /**
     * Starts the slideshow with the given slides data.
     * @param {Array} slidesData - An array of slide objects { image: string, text: string }.
     */
    startSlideshow(slidesData) {
        console.log('[StorySlideshow] Starting slideshow with data:', slidesData);
        this.slides = slidesData;
        this.currentSlideIndex = 0;
        this.isActive = true;
        this.container.classList.add('active'); // Show the container

        // Explicitly clear any inline styles that might be setting dimensions
        this.container.removeAttribute('style');
        if (this.slideshowContent) {
            this.slideshowContent.removeAttribute('style');
        }

        this.uiManager.closeStageDetails(); // Hide stage details when slideshow starts
        this.uiManager.showLoadingOverlay('Loading slideshow...');

        // Preload images for smoother transition
        const imagePromises = this.slides.map(slide => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = slide.image;
                img.onload = resolve;
                img.onerror = () => {
                    console.warn(`Failed to load image: ${slide.image}. Using fallback.`);
                    slide.image = 'images/stages/default.png'; // Fallback image
                    resolve();
                };
            });
        });

        Promise.all(imagePromises).then(() => {
            this.uiManager.hideLoadingOverlay();
            this.showSlide(this.currentSlideIndex);
        }).catch(error => {
            console.error('[StorySlideshow] Error preloading images:', error);
            this.uiManager.hideLoadingOverlay();
            this.uiManager.showPopupMessage('Failed to load slideshow. Skipping.', 'error');
            this.completeSlideshow(); // Complete if images fail to load
        });

    }

    showSlide(index) {
        if (index < 0 || index >= this.slides.length) {
            console.warn('[StorySlideshow] Invalid slide index:', index);
            this.completeSlideshow();
            return;
        }

        const slide = this.slides[index];
        this.slideText.textContent = slide.text;

        // Clear previous image content
        this.slideshowContent.innerHTML = '';
        this.slideshowContent.appendChild(this.slideTextOverlay); // Re-add text overlay
        this.slideshowContent.appendChild(this.nextButton); // Re-add buttons
        this.slideshowContent.appendChild(this.skipButton);

        if (index === 0 || index === 1) { // Special handling for the first two slides
            const imageContainer = document.createElement('div');
            imageContainer.className = 'two-image-container';

            const img02 = document.createElement('img');
            img02.className = 'slide-image slide-image-left';
            img02.src = 'storyimg/a_date_in_the_forest/02.png';
            img02.alt = 'Image 02';
            imageContainer.appendChild(img02);

            const img01 = document.createElement('img');
            img01.className = 'slide-image slide-image-right';
            img01.src = 'storyimg/a_date_in_the_forest/01.png';
            img01.alt = 'Image 01';
            imageContainer.appendChild(img01);

            this.slideshowContent.insertBefore(imageContainer, this.slideTextOverlay); // Insert image container before text
            this.slideshowContent.classList.add('two-images-layout');

            // Preload these two images for the first two slides
            const preloadPromises = [img01, img02].map(imgElem => {
                return new Promise(resolve => {
                    if (imgElem.complete) {
                        resolve();
                    } else {
                        imgElem.onload = resolve;
                        imgElem.onerror = () => {
                            console.warn(`Failed to load image: ${imgElem.src}. Using fallback.`);
                            imgElem.src = 'images/stages/default.png';
                            resolve();
                        };
                    }
                });
            });
            Promise.all(preloadPromises).then(() => {
                console.log('Two images preloaded for slide', index);
            });

        } else { // Standard single image display for other slides
            this.slideshowContent.classList.remove('two-images-layout');
            this.slideshowContent.insertBefore(this.slideImage, this.slideTextOverlay); // Re-add single image

            this.slideImage.src = slide.image;

            // Dynamically adjust image object-fit based on aspect ratio
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                if (aspectRatio < 1) { // Portrait (e.g., 9:16)
                    this.slideImage.style.objectFit = 'contain';
                    this.slideImage.style.width = 'auto'; // Allow width to adjust
                    this.slideImage.style.height = '100%';
                } else { // Landscape (e.g., 16:9) or square
                    this.slideImage.style.objectFit = 'cover';
                    this.slideImage.style.width = '100%';
                    this.slideImage.style.height = '100%';
                }
            };
            img.src = slide.image; // Trigger onload
        }

        // Update button text for the last slide
        if (index === this.slides.length - 1) {
            this.nextButton.textContent = 'Continue ▶';
        } else {
            this.nextButton.textContent = 'Next ▶';
        }
    }

    showNextSlide() {
        this.currentSlideIndex++;
        if (this.currentSlideIndex < this.slides.length) {
            this.showSlide(this.currentSlideIndex);
        } else {
            this.completeSlideshow();
        }
    }

    skipSlideshow() {
        console.log('[StorySlideshow] Slideshow skipped.');
        this.completeSlideshow();
    }

    completeSlideshow() {
        console.log('[StorySlideshow] Slideshow completed.');
        this.isActive = false;
        this.container.classList.remove('active'); // Hide the container
        this.uiManager.showLoadingOverlay('Advancing story...');
        this.storyManager.advanceToNextStage().then((hasMoreStages) => {
            this.uiManager.hideLoadingOverlay();
            if (!hasMoreStages) {
                this.uiManager.showStoryCompleteScreen();
            } else {
                // Re-render map and team to show progression
                this.uiManager.renderStoryMap();
                this.uiManager.renderPlayerTeam();
            }
        }).catch(error => {
            console.error('[StorySlideshow] Error advancing stage after slideshow:', error);
            this.uiManager.hideLoadingOverlay();
            this.uiManager.showPopupMessage('Error advancing story. Please try again.', 'error');
        });
    }

    addSlideshowStyles() {
        if (document.getElementById('slideshow-styles')) return;

        const style = document.createElement('style');
        style.id = 'slideshow-styles';
        style.textContent = `
            #story-slideshow-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 100;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.5s ease, visibility 0.5s ease;
            }

            #story-slideshow-container.active {
                opacity: 1;
                visibility: visible;
            }

            .slideshow-content {
                position: relative;
                width: 90%;
                max-width: 800px;
                height: 90%;
                max-height: 500px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            }

            .slide-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: absolute;
                top: 0;
                left: 0;
                filter: brightness(0.7); /* Slightly dim the image for text readability */
            }

            .slide-text-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
                padding: 20px;
                box-sizing: border-box;
                text-align: center;
            }

            .slide-text {
                color: white;
                font-size: 1.5em;
                font-family: 'Exo 2', sans-serif;
                font-weight: 600;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            }

            .slideshow-button {
                position: absolute;
                bottom: 20px;
                padding: 10px 20px;
                font-size: 1.2em;
                font-weight: bold;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                background-color: var(--primary);
                color: white;
                transition: background-color 0.3s ease;
                z-index: 1; /* Ensure buttons are above overlays */
            }

            .slideshow-button:hover {
                background-color: var(--primary-dark);
            }

            .next-button {
                right: 20px;
            }

            .skip-button {
                left: 20px;
                background-color: var(--secondary);
            }

            .skip-button:hover {
                background-color: var(--secondary-dark);
            }
        `;
    }
}
