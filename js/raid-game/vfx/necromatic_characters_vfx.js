// Necromatic Characters VFX Manager
window.NecromaticVFX = {
    
    // Maul ability VFX for Necromatic Corrupted Bear
    showMaulVFX: function(caster, target) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'maul-vfx-container';

        const clawMarks = document.createElement('div');
        clawMarks.className = 'maul-claw-marks';
        vfxContainer.appendChild(clawMarks);

        targetElement.appendChild(vfxContainer);

        // Clean up after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.remove();
            }
        }, 1200);
    },

    // Tree Whisper VFX for Talking Necromatic Tree
    showTreeWhisperVFX: function(caster, target) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'tree-whisper-vfx';

        const particles = document.createElement('div');
        particles.className = 'tree-whisper-particles';
        vfxContainer.appendChild(particles);

        targetElement.appendChild(vfxContainer);

        // Clean up after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.remove();
            }
        }, 2000);
    },

    // Tree Root Attack VFX for Talking Necromatic Tree
    showTreeRootVFX: function(caster, target) {
        const targetElement = document.getElementById(`character-${target.instanceId || target.id}`);
        if (!targetElement) return;

        const vfxContainer = document.createElement('div');
        vfxContainer.className = 'tree-root-vfx';

        const root = document.createElement('div');
        root.className = 'tree-root';
        vfxContainer.appendChild(root);

        targetElement.appendChild(vfxContainer);

        // Clean up after animation
        setTimeout(() => {
            if (vfxContainer.parentNode) {
                vfxContainer.remove();
            }
        }, 1500);
    },

    // Necromatic Corruption Aura for all necromatic characters
    showNecromaticAura: function(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        // Check if aura already exists
        if (characterElement.querySelector('.necromatic-bear-aura')) return;

        const aura = document.createElement('div');
        aura.className = 'necromatic-bear-aura';
        characterElement.appendChild(aura);
    },

    // Remove necromatic aura
    removeNecromaticAura: function(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        const aura = characterElement.querySelector('.necromatic-bear-aura');
        if (aura) {
            aura.remove();
        }
    },

    // Necromatic corruption effect
    showNecromaticCorruption: function(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        // Check if corruption already exists
        if (characterElement.querySelector('.necromatic-corruption')) return;

        const corruption = document.createElement('div');
        corruption.className = 'necromatic-corruption';
        characterElement.appendChild(corruption);
    },

    // Remove necromatic corruption
    removeNecromaticCorruption: function(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        const corruption = characterElement.querySelector('.necromatic-corruption');
        if (corruption) {
            corruption.remove();
        }
    },

    // Necromatic stun VFX
    showNecromaticStunVFX: function(character) {
        const characterElement = document.getElementById(`character-${character.instanceId || character.id}`);
        if (!characterElement) return;

        const stunVFX = document.createElement('div');
        stunVFX.className = 'necromatic-stun-vfx';
        characterElement.appendChild(stunVFX);

        // Clean up after animation
        setTimeout(() => {
            if (stunVFX.parentNode) {
                stunVFX.remove();
            }
        }, 1000);
    },

    // Initialize necromatic effects for a character
    initializeNecromaticCharacter: function(character) {
        if (character.id === 'necromatic_corrupted_bear') {
            this.showNecromaticAura(character);
        } else if (character.id === 'talking_necromatic_tree') {
            this.showNecromaticCorruption(character);
        }
    },

    // Clean up necromatic effects for a character
    cleanupNecromaticCharacter: function(character) {
        this.removeNecromaticAura(character);
        this.removeNecromaticCorruption(character);
    }
};

// Register VFX functions with AbilityFactory for easy access
if (typeof window.AbilityFactory !== 'undefined') {
    window.AbilityFactory.registerAbilityEffect('maul', function(caster, target) {
        // Deal the actual damage first
        const damage = 1000; // Fixed damage from JSON
        const result = target.applyDamage(damage, 'physical', caster, { abilityId: 'maul' });
        
        // Apply stun debuff with 50% chance
        if (Math.random() < 0.5) {
            if (window.Effect) {
                const stunDebuff = new window.Effect(
                    'stun',
                    'Stun',
                    'icons/debuffs/stun.png',
                    2,
                    null,
                    true
                ).setDescription('Cannot act.');
                
                stunDebuff.apply = function(character) {
                    character.stunned = true;
                };
                
                stunDebuff.remove = function(character) {
                    character.stunned = false;
                };
                
                target.addDebuff(stunDebuff);
                
                if (window.gameManager && window.gameManager.addLogEntry) {
                    window.gameManager.addLogEntry(`${target.name} is stunned by the maul!`, 'debuff-applied');
                }
            }
        }
        
        // Trigger maul VFX
        if (window.NecromaticVFX) {
            window.NecromaticVFX.showMaulVFX(caster, target);
        }
        
        // Log the damage
        if (window.gameManager && window.gameManager.addLogEntry) {
            window.gameManager.addLogEntry(`${caster.name} mauls ${target.name} for ${result.damage} damage!`, 'damage-dealt');
        }
        
        return result;
    });

    window.AbilityFactory.registerAbilityEffect('tree_whisper', function(caster, target) {
        // Trigger tree whisper VFX
        if (window.NecromaticVFX) {
            window.NecromaticVFX.showTreeWhisperVFX(caster, target);
        }
    });

    window.AbilityFactory.registerAbilityEffect('tree_root_attack', function(caster, target) {
        // Trigger tree root attack VFX
        if (window.NecromaticVFX) {
            window.NecromaticVFX.showTreeRootVFX(caster, target);
        }
    });
} 