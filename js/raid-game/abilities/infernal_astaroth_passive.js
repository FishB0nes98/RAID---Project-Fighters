// infernal_astaroth_passive.js - Molten Aura passive ability

/**
 * Infernal Astaroth's Molten Aura Passive
 * When Astaroth is hit, the attacker takes 20% of Astaroth's Magical Damage as magical damage.
 */

class InfernalAstarothPassive {
    constructor() {
        this.name = "Molten Aura";
        this.description = "When Astaroth is hit, the attacker takes 20% of Astaroth's Magical Damage as magical damage.";
        this.icon = "Icons/passives/molten_aura.png";
        this.id = "infernal_astaroth_passive";
    }

    initialize(character) {
        console.log(`[Infernal Astaroth Passive] Initializing Molten Aura for ${character.name}`);
        
        // Store the original applyDamage method
        if (!character.originalApplyDamage) {
            character.originalApplyDamage = character.applyDamage.bind(character);
        }

        // Override the applyDamage method to add reflection
        character.applyDamage = (amount, type, caster = null, options = {}) => {
            // Call the original applyDamage method
            const result = character.originalApplyDamage(amount, type, caster, options);

            // If damage was actually dealt and there's a caster, reflect damage
            if (result.damage > 0 && caster && caster !== character && !caster.isDead()) {
                this.reflectDamage(character, caster, result.damage);
            }

            return result;
        };

        // Add visual indicator
        this.addMoltenAuraVFX(character);
    }

    reflectDamage(astaroth, attacker, originalDamage) {
        // Calculate reflection damage: 20% of Astaroth's Magical Damage
        const reflectionDamage = Math.floor(astaroth.stats.magicalDamage * 0.2);
        
        if (reflectionDamage <= 0) return;

        // Log the reflection
        const logFunction = window.gameManager ? window.gameManager.addLogEntry.bind(window.gameManager) : console.log;
        logFunction(`${astaroth.name}'s Molten Aura burns ${attacker.name} for ${reflectionDamage} magical damage!`, 'passive');

        // Apply the reflection damage
        const reflectionResult = attacker.applyDamage(reflectionDamage, 'magical', astaroth, { isReflection: true });
        
        // Create reflection VFX
        this.createReflectionVFX(attacker);

        // Update UI - use the existing global function
        if (window.gameManager && window.gameManager.uiManager && window.gameManager.uiManager.updateCharacterUI) {
            window.gameManager.uiManager.updateCharacterUI(attacker);
        }

        console.log(`[Molten Aura] ${attacker.name} took ${reflectionResult.damage} reflection damage`);
    }

    addMoltenAuraVFX(character) {
        const characterElementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterElementId}`);
        if (!characterElement) return;

        // Check if VFX already exists
        if (characterElement.querySelector('.molten-aura-passive-vfx')) return;

        const auraVFX = document.createElement('div');
        auraVFX.className = 'molten-aura-passive-vfx';
        auraVFX.style.cssText = `
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            border: 2px solid #ff6600;
            border-radius: 15px;
            box-shadow: 0 0 20px rgba(255, 102, 0, 0.6);
            animation: molten-aura-pulse 3s ease-in-out infinite;
            z-index: 8;
            pointer-events: none;
        `;

        // Add CSS animation if not exists
        if (!document.querySelector('#molten-aura-passive-style')) {
            const style = document.createElement('style');
            style.id = 'molten-aura-passive-style';
            style.textContent = `
                @keyframes molten-aura-pulse {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(255, 102, 0, 0.6);
                        border-color: #ff6600;
                    }
                    50% { 
                        box-shadow: 0 0 30px rgba(255, 51, 0, 0.8);
                        border-color: #ff3300;
                    }
                }
                @keyframes reflection-burst {
                    0% { 
                        transform: scale(0.5);
                        opacity: 1;
                        background: radial-gradient(circle, rgba(255,102,0,0.9) 0%, rgba(255,51,0,0.6) 50%, rgba(255,0,0,0) 100%);
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.8;
                    }
                    100% { 
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        characterElement.appendChild(auraVFX);
        characterElement.classList.add('molten-aura-active');
    }

    createReflectionVFX(target) {
        const targetElementId = target.instanceId || target.id;
        const targetElement = document.getElementById(`character-${targetElementId}`);
        if (!targetElement) return;

        const reflectionVFX = document.createElement('div');
        reflectionVFX.className = 'molten-aura-reflection-vfx';
        reflectionVFX.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            animation: reflection-burst 1s ease-out forwards;
            z-index: 15;
            pointer-events: none;
        `;

        targetElement.appendChild(reflectionVFX);
        setTimeout(() => reflectionVFX.remove(), 1000);
    }

    cleanup(character) {
        console.log(`[Infernal Astaroth Passive] Cleaning up Molten Aura for ${character.name}`);
        
        // Restore original applyDamage method
        if (character.originalApplyDamage) {
            character.applyDamage = character.originalApplyDamage;
            delete character.originalApplyDamage;
        }

        // Remove VFX
        const characterElementId = character.instanceId || character.id;
        const characterElement = document.getElementById(`character-${characterElementId}`);
        if (characterElement) {
            characterElement.classList.remove('molten-aura-active');
            const auraVFX = characterElement.querySelector('.molten-aura-passive-vfx');
            if (auraVFX) {
                auraVFX.remove();
            }
        }
    }
}

// Register the passive with CharacterFactory
if (typeof CharacterFactory !== 'undefined' && typeof CharacterFactory.registerPassiveClass === 'function') {
    CharacterFactory.registerPassiveClass('infernal_astaroth_passive', InfernalAstarothPassive);
    console.log('[Infernal Astaroth] Passive registered with CharacterFactory');
} else {
    console.warn('[Infernal Astaroth] CharacterFactory not found or registerPassiveClass method missing');
}

// Make the class globally available
window.InfernalAstarothPassive = InfernalAstarothPassive;

console.log('[Infernal Astaroth] Passive loaded successfully'); 