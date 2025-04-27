/**
 * Load and apply talents from the talent system without modifying core engine
 * This hooks into the TalentManager if available
 * @param {string} userId - The user ID to load talents for
 * @returns {Promise<boolean>} - Whether talents were loaded and applied
 */
Character.prototype.loadTalents = async function(userId = null) {
    try {
        // Check if talent manager is available
        if (!window.talentManager) {
            console.log('TalentManager not available, skipping talent loading');
            return false;
        }
        
        // Get user ID if not provided
        if (!userId) {
            userId = getCurrentUserId();
            if (!userId) {
                console.log('No user ID available for talent loading');
                return false;
            }
        }
        
        // Get selected talents for this character
        const selectedTalents = await window.talentManager.getSelectedTalents(this.id, userId);
        if (!selectedTalents || selectedTalents.length === 0) {
            console.log(`No talents selected for character ${this.id}`);
            return false;
        }
        
        // Load talent definitions
        const talentDefinitions = await window.talentManager.loadTalentDefinitions(this.id);
        if (!talentDefinitions || !talentDefinitions.talentTree) {
            console.log(`No talent tree found for character ${this.id}`);
            return false;
        }
        
        // Use applyTalentEffects method to apply talents
        this.applyTalentEffects(talentDefinitions, selectedTalents);
        console.log(`Applied ${selectedTalents.length} talents to ${this.name}`);
        
        return true;
    } catch (error) {
        console.error(`Error loading talents for ${this.id}:`, error);
        return false;
    }
}; 