/**
 * Default Images Module
 * Creates placeholder SVG images for missing enemy/reward icons
 */
(function() {
    // Create default enemy placeholder
    function createDefaultEnemyImage() {
        const svgImage = document.createElement('div');
        svgImage.className = 'default-enemy-image';
        svgImage.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="25" fill="#3a3a3a" stroke="#7e57c2" stroke-width="2" />
                <text x="30" y="35" font-size="12" font-family="Arial" fill="#f5f5f5" text-anchor="middle">Enemy</text>
                <path d="M20,20 L40,40 M40,20 L20,40" stroke="#e53935" stroke-width="3" />
            </svg>
        `;
        
        // Add to the document
        document.body.appendChild(svgImage);
        
        // Set style to be hidden but available for image sources
        const style = document.createElement('style');
        style.textContent = `
            .default-enemy-image {
                position: absolute;
                width: 0;
                height: 0;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
        
        // Create an actual image path
        const directoryPath = 'Icons/enemies';
        ensureDirectoryExists(directoryPath);
        
        return svgImage;
    }
    
    // Create default reward placeholder
    function createDefaultRewardImage() {
        const svgImage = document.createElement('div');
        svgImage.className = 'default-reward-image';
        svgImage.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="25" fill="#3a3a3a" stroke="#ffb636" stroke-width="2" />
                <text x="30" y="35" font-size="10" font-family="Arial" fill="#f5f5f5" text-anchor="middle">Reward</text>
                <polygon points="30,15 35,25 45,27 38,35 40,45 30,40 20,45 22,35 15,27 25,25" fill="#ffb636" />
            </svg>
        `;
        
        // Add to the document
        document.body.appendChild(svgImage);
        
        // Set style to be hidden but available for image sources
        const style = document.createElement('style');
        style.textContent = `
            .default-reward-image {
                position: absolute;
                width: 0;
                height: 0;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
        
        // Create an actual image path
        const directoryPath = 'Icons/rewards';
        ensureDirectoryExists(directoryPath);
        
        return svgImage;
    }
    
    // Ensure the directory exists (this is a mock function since we can't create directories client-side)
    function ensureDirectoryExists(path) {
        console.log(`Ensuring directory exists: ${path}`);
        // In a real scenario, this would be handled server-side
    }
    
    // Create an Object URL for the SVG
    function getSvgUrl(svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement.querySelector('svg'));
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        return URL.createObjectURL(svgBlob);
    }
    
    // Create the default images on page load
    document.addEventListener('DOMContentLoaded', () => {
        const enemyImage = createDefaultEnemyImage();
        const rewardImage = createDefaultRewardImage();
        
        // Create global references
        window.DEFAULT_ENEMY_IMAGE = getSvgUrl(enemyImage);
        window.DEFAULT_REWARD_IMAGE = getSvgUrl(rewardImage);
        
        // Update paths in CSS
        document.documentElement.style.setProperty('--default-enemy-image', `url(${window.DEFAULT_ENEMY_IMAGE})`);
        document.documentElement.style.setProperty('--default-reward-image', `url(${window.DEFAULT_REWARD_IMAGE})`);
    });
})(); 