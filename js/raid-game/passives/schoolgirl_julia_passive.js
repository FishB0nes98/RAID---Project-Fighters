// --- Schoolgirl Julia Passive Handler ---
class SchoolgirlJuliaPassiveHandler {
    constructor() {
        this.id = 'schoolgirl_julia_passive';
        this.name = 'Healing Empowerment';
        this.character = null;
        this.passiveName = "Healing Empowerment"; // Store passive name for logging
        this.vfxClass = "julia-passive-gain-vfx"; // Reference CSS class for gain VFX
        this.damageGained = 0; // Track total damage gained from passive
        console.log("Schoolgirl Julia Passive Handler Initialized");
    }

    initialize(character) {
        this.character = character;
        // Initialize with base physical damage to track passive gains accurately
        this.initialPhysicalDamage = character.stats.physicalDamage || 0;
        this.damageGained = 0;
        console.log(`Julia passive initialized for ${character.name} with base physical damage: ${this.initialPhysicalDamage}`);
        
        // Create enhanced passive display similar to Siegfried's
        this.enhanceJuliaPassiveDisplay();
    }

    enhanceJuliaPassiveDisplay() {
        if (!this.character) return;
        
        const charElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!charElement) return;
        
        // Add Julia-specific passive indicator
        this.updatePassiveIndicator();
        
        // Hook into UI updates if possible
        if (window.gameManager && window.gameManager.uiManager) {
            const originalUpdateCharacterUI = window.gameManager.uiManager.updateCharacterUI;
            
            window.gameManager.uiManager.updateCharacterUI = function(character) {
                originalUpdateCharacterUI.call(this, character);
                
                if (character.id === 'schoolgirl_julia') {
                    const handler = character.passiveHandler;
                    if (handler && handler.updatePassiveIndicator) {
                        handler.updatePassiveIndicator();
                    }
                }
            };
        }
    }

    updatePassiveIndicator() {
        if (!this.character) return;
        
        const charElement = document.getElementById(`character-${this.character.instanceId || this.character.id}`);
        if (!charElement) return;
        
        const imageContainer = charElement.querySelector('.image-container');
        if (!imageContainer) return;
        
        // Remove old passive display if it exists
        const oldPassive = charElement.querySelector('.julia-passive-counter');
        if (oldPassive) {
            oldPassive.remove();
        }
        
        // Create new subtle passive indicator
        if (this.damageGained > 0) {
            // Add glow effect to image container
            if (!imageContainer.classList.contains('julia-healing-glow')) {
                imageContainer.classList.add('julia-healing-glow');
            }
            
            // Create small passive indicator
            const passiveIndicator = document.createElement('div');
            passiveIndicator.className = 'julia-passive-indicator';
            
            const iconElement = document.createElement('div');
            iconElement.className = 'julia-passive-icon';
            iconElement.textContent = '⚡'; // Healing energy symbol
            
            const valueElement = document.createElement('div');
            valueElement.className = 'julia-passive-value';
            valueElement.textContent = `+${this.damageGained}`;
            
            passiveIndicator.appendChild(iconElement);
            passiveIndicator.appendChild(valueElement);
            charElement.appendChild(passiveIndicator);
            
            // Add tier styling based on damage gained
            if (this.damageGained >= 400) {
                passiveIndicator.classList.add('tier3');
            } else if (this.damageGained >= 200) {
                passiveIndicator.classList.add('tier2');
            } else {
                passiveIndicator.classList.add('tier1');
            }
        } else {
            // Remove glow if no damage gained
            imageContainer.classList.remove('julia-healing-glow');
        }
    }

    // Called when Julia heals someone (including herself)
    onHealDealt(caster, target, healAmount) {
        if (!caster || caster.id !== 'schoolgirl_julia') {
            return; // Only trigger for Julia
        }

        const damageGain = 5; // Fixed +5 Physical Damage per heal
        if (damageGain > 0) {
            // Store original damage before modification
            const originalDamage = caster.stats.physicalDamage;
            
            // Apply the damage gain
            caster.stats.physicalDamage += damageGain;
            this.damageGained += damageGain;
            
            console.log(`Julia's Healing Empowerment triggered: +${damageGain} Physical Damage (Total: +${this.damageGained})`);
            
            // Update passive indicator
            this.updatePassiveIndicator();
            
            // Show floating text VFX
            const charElement = document.getElementById(`character-${caster.instanceId || caster.id}`);
            if (charElement) {
                const vfxElement = document.createElement('div');
                vfxElement.className = 'julia-passive-gain-vfx';
                vfxElement.textContent = `+${damageGain} DMG`;
                charElement.appendChild(vfxElement);
                
                // Remove VFX after animation
                setTimeout(() => {
                    if (vfxElement.parentNode) {
                        vfxElement.remove();
                    }
                }, 1000);
            }
            
            // Update UI
            if (window.gameManager && window.gameManager.uiManager) {
                window.gameManager.uiManager.updateCharacterUI(caster);
            } else if (typeof updateCharacterUI === 'function') {
                updateCharacterUI(caster);
            }
            
            // Add log entry
            if (window.gameManager && window.gameManager.addLogEntry) {
                window.gameManager.addLogEntry(`${caster.name}'s Healing Empowerment grants +${damageGain} Physical Damage!`);
            }
        }
    }

    // Called when Julia receives healing
    onHealReceived(target, healer, healAmount) {
        // Currently no effect when Julia receives healing, but could be extended
    }
}

// CSS for enhanced Julia passive display
const juliaPassiveStyle = document.createElement('style');
juliaPassiveStyle.textContent = `
/* Julia Healing Glow - Similar to Siegfried's power glow */
.image-container.julia-healing-glow {
    box-shadow: 0 0 15px rgba(144, 238, 144, 0.6);
    transition: box-shadow 0.5s ease-in-out;
}

.image-container.julia-healing-glow img {
    filter: drop-shadow(0 0 5px rgba(144, 238, 144, 0.7));
    transition: filter 0.5s ease-in-out;
}

/* Julia Passive Indicator - Small, subtle overlay */
.julia-passive-indicator {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 12;
    border: 1px solid #90ee90;
    box-shadow: 0 0 5px rgba(144, 238, 144, 0.5);
    transition: all 0.3s ease;
    font-size: 12px;
}

.julia-passive-icon {
    font-size: 14px;
    color: #90ee90;
    animation: juliaPassiveGlow 2s infinite alternate;
}

.julia-passive-value {
    color: #ffffff;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

@keyframes juliaPassiveGlow {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
}

/* Tier styling for passive indicator */
.julia-passive-indicator.tier1 {
    border-color: #90ee90;
    background: rgba(0, 0, 0, 0.8);
}

.julia-passive-indicator.tier2 {
    border-color: #ffeb99;
    background: rgba(0, 0, 0, 0.85);
    box-shadow: 0 0 8px rgba(255, 235, 153, 0.6);
}

.julia-passive-indicator.tier2 .julia-passive-icon {
    color: #ffeb99;
}

.julia-passive-indicator.tier3 {
    border-color: #ff99cc;
    background: rgba(0, 0, 0, 0.9);
    box-shadow: 0 0 12px rgba(255, 153, 204, 0.7);
    animation: tier3Pulse 1.5s infinite alternate;
}

.julia-passive-indicator.tier3 .julia-passive-icon {
    color: #ff99cc;
}

@keyframes tier3Pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
}

/* Passive gain VFX - floating text */
.julia-passive-gain-vfx {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    color: #90ee90;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 0 0 3px black, 0 0 6px rgba(144, 238, 144, 0.8);
    animation: floatUpFade 1.2s ease-out forwards;
    pointer-events: none;
    white-space: nowrap;
    z-index: 15;
}

@keyframes floatUpFade {
    0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
    }
    50% {
        opacity: 1;
        transform: translateX(-50%) translateY(-15px) scale(1.1);
    }
    100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-35px) scale(0.9);
    }
}
`;

// Add the styles to the document
if (!document.getElementById('julia-passive-styles')) {
    juliaPassiveStyle.id = 'julia-passive-styles';
    document.head.appendChild(juliaPassiveStyle);
}

// Make the handler available globally
window.PassiveHandlers = window.PassiveHandlers || {};
window.PassiveHandlers.schoolgirl_julia_passive = SchoolgirlJuliaPassiveHandler;

// Also register it in the global scope for direct access
window.SchoolgirlJuliaPassiveHandler = SchoolgirlJuliaPassiveHandler;

// Register with the expected naming convention from getPassiveClassName
window.SchoolgirlJuliaPassive = SchoolgirlJuliaPassiveHandler;

console.log("Registered SchoolgirlJuliaPassiveHandler.");