/**
 * Atlantean Kagome Passive: Atlantean Blessing
 * Heals HP equal to 15% of missing mana at the start of each turn
 */

class AtlanteanKagomePassive {
    constructor() {
        this.id = 'atlantean_kagome_passive';
        this.name = 'Atlantean Blessing';
        this.description = 'Heals HP equal to 15% of missing mana at the start of each turn.';
    }

    /**
     * Called at the start of each turn
     * @param {Character} character - The character with this passive
     * @param {number} turnNumber - Current turn number
     */
    onTurnStart(character, turnNumber) {
        if (!character || character.isDead()) {
            return;
        }

        // Get mana values with proper fallbacks
        const maxMana = character.stats.maxMana || character.stats.mana || 0;
        const currentMana = character.stats.currentMana !== undefined ? character.stats.currentMana : (character.stats.mana || 0);
        const missingMana = maxMana - currentMana;
        
        // Debug logging
        console.log(`[Atlantean Passive Debug] ${character.name}: maxMana=${maxMana}, currentMana=${currentMana}, missingMana=${missingMana}`);
        
        if (missingMana > 0) {
            // Calculate heal amount: 15% of missing mana with healing power modifier
            const baseHealAmount = missingMana * 0.15;
            const healingPower = character.stats.healingPower || 0;
            const healAmount = baseHealAmount * (1 + healingPower);
            
            // Debug the calculation
            console.log(`[Atlantean Passive Debug] baseHealAmount=${baseHealAmount}, healingPower=${healingPower}, healAmount=${healAmount}`);
            
            // Apply the healing using the proper heal method for statistics tracking
            const healResult = character.heal(healAmount, character, { 
                abilityId: 'atlantean_kagome_passive',
                source: 'passive'
            });
            
            // Extract heal amount from the returned object
            const actualHealAmount = healResult && typeof healResult === 'object' ? healResult.healAmount : healResult;
            
            // Debug the heal result
            console.log(`[Atlantean Passive Debug] healResult=`, healResult, `actualHealAmount=${actualHealAmount}`);
            
            // Ensure actualHealAmount is a valid number
            const safeHealAmount = isNaN(actualHealAmount) ? 0 : actualHealAmount;
            
            // Log the passive effect
            const logFunction = window.gameManager ? 
                window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
            logFunction(`${character.name}'s Atlantean Blessing healed for ${Math.round(safeHealAmount)} HP (15% of ${Math.round(missingMana)} missing mana)!`, 'passive-heal');
            
            // Add visual effect for healing from missing mana
            this.showAtlanteanHealVFX(character, safeHealAmount);
            
            // Track passive usage statistics
            this.trackPassiveStats(character, safeHealAmount, missingMana);
        }
    }

    /**
     * Show Atlantean-themed healing VFX
     * @param {Character} character - The character being healed
     * @param {number} healAmount - Amount healed
     */
    showAtlanteanHealVFX(character, healAmount) {
        const charElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (charElement) {
            // Ensure heal amount is valid
            const safeHealAmount = isNaN(healAmount) ? 0 : healAmount;
            
            // Create healing VFX container
            const healContainer = document.createElement('div');
            healContainer.className = 'atlantean-passive-heal-container';
            charElement.appendChild(healContainer);
            
            // Create main healing number with atlantean styling
            const healVfx = document.createElement('div');
            healVfx.className = 'heal-vfx atlantean-passive-heal';
            healVfx.textContent = `+${Math.round(safeHealAmount)} HP`;
            healVfx.style.color = '#4fb3d9';
            healVfx.style.textShadow = '0 0 10px #4fb3d9, 0 0 20px rgba(79, 179, 217, 0.5)';
            healVfx.style.fontSize = '16px';
            healVfx.style.fontWeight = 'bold';
            healContainer.appendChild(healVfx);
            
            // Create atlantean aura around character
            const atlanteanAura = document.createElement('div');
            atlanteanAura.className = 'atlantean-healing-aura';
            atlanteanAura.style.cssText = `
                position: absolute;
                top: -10px;
                left: -10px;
                right: -10px;
                bottom: -10px;
                background: radial-gradient(circle, rgba(79, 179, 217, 0.3), rgba(79, 179, 217, 0.1), transparent);
                border-radius: 50%;
                animation: atlanteanAuraPulse 2s ease-in-out;
                pointer-events: none;
                z-index: 5;
            `;
            healContainer.appendChild(atlanteanAura);
            
            // Create water droplets
            for (let i = 0; i < 6; i++) {
                const droplet = document.createElement('div');
                droplet.className = 'atlantean-water-droplet';
                droplet.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 6px;
                    background: linear-gradient(to bottom, #87ceeb, #4fb3d9);
                    border-radius: 0 0 50% 50%;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 50}%;
                    animation: atlanteanDropletFall ${1 + Math.random() * 0.5}s ease-in-out;
                    animation-delay: ${Math.random() * 0.5}s;
                    pointer-events: none;
                    z-index: 10;
                `;
                healContainer.appendChild(droplet);
            }
            
            // === NEW: spawn expanding ripples around character ===
            for (let i = 0; i < 3; i++) {
                const ripple = document.createElement('div');
                ripple.className = 'atlantean-ripple';
                ripple.style.left = '50%';
                ripple.style.top = '50%';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.animationDelay = `${i * 0.25}s`;
                healContainer.appendChild(ripple);
            }
            
            // Create mana-to-health conversion particles
            for (let i = 0; i < 4; i++) {
                const particle = document.createElement('div');
                particle.className = 'mana-conversion-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle, #87ceeb, #4fb3d9);
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: manaConversionFloat 1.5s ease-out;
                    animation-delay: ${Math.random() * 0.3}s;
                    pointer-events: none;
                    z-index: 8;
                `;
                healContainer.appendChild(particle);
            }
            
            // Add passive indicator text
            const passiveText = document.createElement('div');
            passiveText.className = 'atlantean-passive-text';
            passiveText.textContent = 'Atlantean Blessing';
            passiveText.style.cssText = `
                position: absolute;
                top: -50px;
                left: 50%;
                transform: translateX(-50%);
                color: #4fb3d9;
                font-size: 12px;
                font-weight: bold;
                text-shadow: 0 0 5px rgba(79, 179, 217, 0.8);
                animation: atlanteanPassiveTextFade 2s ease-out;
                pointer-events: none;
                z-index: 15;
            `;
            healContainer.appendChild(passiveText);
            
            // Remove the VFX elements after animation completes
            setTimeout(() => {
                if (healContainer && healContainer.parentNode) {
                    healContainer.parentNode.removeChild(healContainer);
                }
            }, 2000);
        }
    }

    /**
     * Track passive statistics for battle analytics
     * @param {Character} character - The character using the passive
     * @param {number} healAmount - Amount healed
     * @param {number} missingMana - Amount of missing mana that triggered the heal
     */
    trackPassiveStats(character, healAmount, missingMana) {
        // Ensure numbers are valid
        const safeHealAmount = isNaN(healAmount) ? 0 : healAmount;
        const safeMissingMana = isNaN(missingMana) ? 0 : missingMana;
        
        if (window.StatisticsManager && typeof window.StatisticsManager.recordHealingDone === 'function') {
            // Track healing done by the passive
            window.StatisticsManager.recordHealingDone(character.id, safeHealAmount, 'atlantean_kagome_passive');
        }
        
        if (window.StatisticsManager && typeof window.StatisticsManager.recordAbilityUsage === 'function') {
            // Track passive usage with metadata
            const healPercentage = safeMissingMana > 0 ? (safeHealAmount / safeMissingMana) * 100 : 0;
            window.StatisticsManager.recordAbilityUsage(character.id, 'atlantean_kagome_passive', {
                healAmount: safeHealAmount,
                missingMana: safeMissingMana,
                healPercentage: healPercentage,
                trigger: 'turn_start'
            });
        }
        
        console.log(`[Atlantean Kagome Passive] Tracked: ${safeHealAmount} healing from ${safeMissingMana} missing mana for ${character.name}`);
    }
}

// CSS animations for the VFX (will be added to a CSS file if needed)
const atlanteanPassiveCSS = `
@keyframes atlanteanAuraPulse {
    0%, 100% { 
        opacity: 0.3; 
        transform: scale(1); 
    }
    50% { 
        opacity: 0.6; 
        transform: scale(1.1); 
    }
}

@keyframes atlanteanDropletFall {
    0% { 
        opacity: 1; 
        transform: translateY(0px); 
    }
    100% { 
        opacity: 0; 
        transform: translateY(30px); 
    }
}

@keyframes manaConversionFloat {
    0% { 
        opacity: 1; 
        transform: translateY(0px) scale(1); 
    }
    50% { 
        opacity: 0.8; 
        transform: translateY(-20px) scale(1.2); 
    }
    100% { 
        opacity: 0; 
        transform: translateY(-40px) scale(0.8); 
    }
}

@keyframes atlanteanPassiveTextFade {
    0% { 
        opacity: 1; 
        transform: translateX(-50%) translateY(0px); 
    }
    70% { 
        opacity: 0.8; 
        transform: translateX(-50%) translateY(-10px); 
    }
    100% { 
        opacity: 0; 
        transform: translateX(-50%) translateY(-20px); 
    }
}
`;

// Create global instance
window.atlanteanKagomePassiveInstance = new AtlanteanKagomePassive();

// Test function for debugging
window.testAtlanteanPassive = function() {
    console.log('[Test] Looking for Atlantean Kagome...');
    let kagome = null;
    
    if (window.gameManager && window.gameManager.gameState) {
        kagome = window.gameManager.gameState.playerCharacters.find(c => c.id === 'atlantean_kagome');
        if (!kagome) {
            kagome = window.gameManager.gameState.aiCharacters.find(c => c.id === 'atlantean_kagome');
        }
    }
    
    if (kagome) {
        console.log('[Test] Found Atlantean Kagome:', kagome.name);
        console.log('[Test] Current stats:', {
            maxMana: kagome.stats.maxMana,
            currentMana: kagome.stats.currentMana,
            mana: kagome.stats.mana,
            healingPower: kagome.stats.healingPower
        });
        
        // Test the passive manually
        window.atlanteanKagomePassiveInstance.onTurnStart(kagome, 1);
    } else {
        console.log('[Test] Atlantean Kagome not found in current game');
    }
};

// Export for use in character creation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AtlanteanKagomePassive;
}

console.log('[Atlantean Kagome Passive] Loaded Atlantean Blessing passive with 15% mana-to-health conversion and statistics tracking'); 