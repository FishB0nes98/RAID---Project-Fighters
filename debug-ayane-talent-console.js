// Debug script for testing Ayane talent application
// Run this in the browser console while in the raid game

window.debugAyaneTalent = function() {
    console.log("=== DEBUGGING AYANE TALENT APPLICATION ===");
    
    // Check if we're in the raid game context
    if (!window.gameManager || !window.gameManager.playerCharacters) {
        console.error("Not in raid game context or no player characters found");
        return;
    }
    
    // Find Ayane character
    const ayane = window.gameManager.playerCharacters.find(c => c.id === 'schoolgirl_ayane');
    if (!ayane) {
        console.error("Ayane character not found in player characters");
        return;
    }
    
    console.log(`Found Ayane character: ${ayane.name}`);
    
    // Check applied talents
    if (ayane.appliedTalents) {
        console.log(`Applied talents: ${JSON.stringify(ayane.appliedTalents)}`);
        
        // Check if our new talent is applied
        const hasEndlessAssault = ayane.appliedTalents.includes('schoolgirl_ayane_t23');
        const hasRelentlessDaggers = ayane.appliedTalents.includes('schoolgirl_ayane_t22');
        
        console.log(`Has Endless Assault (t23): ${hasEndlessAssault}`);
        console.log(`Has Relentless Daggers (t22): ${hasRelentlessDaggers}`);
        
        if (!hasEndlessAssault && !hasRelentlessDaggers) {
            console.warn("Neither Endless Assault nor Relentless Daggers talent is applied");
        }
    } else {
        console.warn("No appliedTalents property found on Ayane character");
    }
    
    // Check Q ability
    const qAbility = ayane.abilities.find(a => a.id === 'schoolgirl_ayane_q');
    if (qAbility) {
        console.log(`Q Ability found: ${qAbility.name}`);
        console.log(`  Cooldown: ${qAbility.cooldown}`);
        console.log(`  ChanceToNotEndTurn: ${qAbility.chanceToNotEndTurn || 'undefined'}`);
        console.log(`  Current cooldown: ${qAbility.currentCooldown || 0}`);
        
        // Check if properties are correctly set
        if (qAbility.cooldown === 0) {
            console.log("✓ Cooldown is correctly set to 0");
        } else {
            console.warn(`✗ Cooldown is ${qAbility.cooldown}, expected 0`);
        }
        
        if (qAbility.chanceToNotEndTurn === 0.2) {
            console.log("✓ ChanceToNotEndTurn is correctly set to 0.2 (20%)");
        } else {
            console.warn(`✗ ChanceToNotEndTurn is ${qAbility.chanceToNotEndTurn}, expected 0.2`);
        }
        
        // Check talent modifiers
        if (qAbility.talentModifiers) {
            console.log("Talent modifiers found:");
            console.log(JSON.stringify(qAbility.talentModifiers, null, 2));
        } else {
            console.log("No talent modifiers found on Q ability");
        }
        
    } else {
        console.error("Q ability not found");
    }
    
    // Check ability modifications storage
    if (window.debugAbility) {
        console.log("\n=== USING BUILT-IN DEBUG ABILITY ===");
        window.debugAbility(ayane, 'schoolgirl_ayane_q');
    }
    
    console.log("=== END AYANE TALENT DEBUG ===");
};

// Debug function to manually apply talent
window.debugApplyAyaneTalent = async function() {
    console.log("=== MANUALLY APPLYING AYANE TALENT ===");
    
    if (!window.gameManager || !window.gameManager.playerCharacters) {
        console.error("Not in raid game context");
        return;
    }
    
    const ayane = window.gameManager.playerCharacters.find(c => c.id === 'schoolgirl_ayane');
    if (!ayane) {
        console.error("Ayane not found");
        return;
    }
    
    console.log("Applying Endless Assault talent manually...");
    
    if (window.talentManager) {
        try {
            await window.talentManager.applyTalentsToCharacter(ayane, ['schoolgirl_ayane_t23']);
            console.log("Talent applied successfully");
            
            // Check result
            const qAbility = ayane.abilities.find(a => a.id === 'schoolgirl_ayane_q');
            if (qAbility) {
                console.log(`After manual application:`);
                console.log(`  Cooldown: ${qAbility.cooldown}`);
                console.log(`  ChanceToNotEndTurn: ${qAbility.chanceToNotEndTurn}`);
            }
        } catch (error) {
            console.error("Error applying talent:", error);
        }
    } else {
        console.error("TalentManager not available");
    }
};

// Debug function to check talent definitions
window.debugAyaneTalentDefinitions = async function() {
    console.log("=== CHECKING TALENT DEFINITIONS ===");
    
    if (!window.talentManager) {
        console.error("TalentManager not available");
        return;
    }
    
    try {
        const definitions = await window.talentManager.loadTalentDefinitions('schoolgirl_ayane');
        
        if (definitions && definitions.schoolgirl_ayane_t23) {
            const talent = definitions.schoolgirl_ayane_t23;
            console.log(`Talent found: ${talent.name}`);
            console.log(`Description: ${talent.description}`);
            console.log(`Effects:`);
            talent.effects.forEach((effect, index) => {
                console.log(`  Effect ${index + 1}:`);
                console.log(`    Type: ${effect.type}`);
                console.log(`    Ability ID: ${effect.abilityId}`);
                console.log(`    Property: ${effect.property}`);
                console.log(`    Operation: ${effect.operation || 'set'}`);
                console.log(`    Value: ${effect.value}`);
            });
        } else {
            console.error("Talent t23 not found in definitions");
        }
        
        // Check parent connections
        if (definitions && definitions.schoolgirl_ayane_t8) {
            const parent = definitions.schoolgirl_ayane_t8;
            console.log(`Parent talent (t8): ${parent.name}`);
            console.log(`Children: ${JSON.stringify(parent.children)}`);
        }
        
    } catch (error) {
        console.error("Error loading talent definitions:", error);
    }
};

console.log("Ayane talent debug functions loaded:");
console.log("- debugAyaneTalent() - Check current state");
console.log("- debugApplyAyaneTalent() - Manually apply talent");
console.log("- debugAyaneTalentDefinitions() - Check talent definitions");
