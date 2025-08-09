class Game {
    /**
     * Manages the overall game state, data, and UI rendering.
     */
    constructor() {
        this.player = null;
        this.locations = null;
        this.characters = null;
        this.currentLocation = null;
        this.locationsByCoords = {};
        this.activeInteraction = null;
        this.activeDialogueNode = null;

        this.ui = {
            characterName: document.getElementById('character-name'),
            characterIcon: document.getElementById('character-icon'),
            planetName: document.getElementById('planet-name'),
            systemName: document.getElementById('system-name'),
            mapGrid: document.getElementById('map-grid'),
            time: document.getElementById('time'),
            date: document.getElementById('date'),
            mainText: document.getElementById('main-text'),
            statShields: document.getElementById('stat-shields'),
            statHp: document.getElementById('stat-hp'),
            statEnergy: document.getElementById('stat-energy'),
            statPhysique: document.getElementById('stat-physique'),
            statReflexes: document.getElementById('stat-reflexes'),
            statAim: document.getElementById('stat-aim'),
            statIntelligence: document.getElementById('stat-intelligence'),
            statWillpower: document.getElementById('stat-willpower'),
            level: document.getElementById('level'),
            xp: document.getElementById('xp'),
            credits: document.getElementById('credits'),
            statusEffectsList: document.getElementById('status-effects-list'),
            bottomControls: document.getElementById('bottom-controls'),
        };
    }

    /**
     * Initializes the game by loading data, setting up event listeners, and rendering the initial state.
     */
    async init() {
        await this.loadGameData();
        this.currentLocation = this.locations.find(loc => loc.id === this.player.currentLocation);
        this.addEventListeners();
        this.render();
    }

    /**
     * Fetches all necessary game data from JSON files.
     */
    async loadGameData() {
        try {
            const [playerRes, locationsRes, charactersRes] = await Promise.all([
                fetch('data/player.json'),
                fetch('data/locations.json'),
                fetch('data/characters.json')
            ]);
            this.player = await playerRes.json();
            this.locations = await locationsRes.json();
            this.characters = await charactersRes.json();
            this.locations.forEach(loc => { this.locationsByCoords[`${loc.x},${loc.y}`] = loc; });
        } catch (error) {
            console.error("Failed to load game data:", error);
            this.ui.mainText.textContent = "Error: Could not load game data.";
        }
    }

    /**
     * Sets up global event listeners, like keyboard input.
     */
    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.activeInteraction) return; // Disable movement during interaction
            switch (e.key.toLowerCase()) {
                case 'w': this.move('north'); break;
                case 'a': this.move('west'); break;
                case 's': this.move('south'); break;
                case 'd': this.move('east'); break;
            }
        });
    }

    /**
     * Moves the player to a new location if a connection exists.
     * @param {string} direction - The direction to move (e.g., 'north').
     */
    move(direction) {
        if (this.activeInteraction) return;
        const newLocationId = this.currentLocation.connections?.[direction];
        if (newLocationId) {
            this.currentLocation = this.locations.find(loc => loc.id === newLocationId);
            this.player.currentLocation = newLocationId;
            this.render();
        }
    }

    /**
     * Begins an interaction with an NPC.
     * @param {string} characterId - The ID of the character to interact with.
     */
    startInteraction(characterId) {
        this.activeInteraction = this.characters.find(char => char.id === characterId);
        this.activeDialogueNode = 'start';
        this.render();
    }

    /**
     * Handles the player's choice during a dialogue interaction.
     * @param {object} choice - The choice object selected by the player.
     */
    handleDialogueChoice(choice) {
        if (!choice || choice.next === 'end') {
            this.activeInteraction = null;
            this.activeDialogueNode = null;
        } else {
            this.activeDialogueNode = choice.next;
        }
        this.render();
    }

    /**
     * Renders the entire game UI based on the current state.
     */
    render() {
        if (!this.currentLocation) return;
        this.renderPlayerStats();
        this.renderLocation();
        this.renderMap();
        this.renderControls();
    }

    /**
     * Updates the player stats display in the right sidebar.
     */
    renderPlayerStats() {
        const stats = this.player.stats;
        this.ui.statShields.textContent = stats.shields;
        this.ui.statHp.textContent = stats.hp;
        this.ui.statEnergy.textContent = stats.energy;
        this.ui.statPhysique.textContent = stats.physique;
        this.ui.statReflexes.textContent = stats.reflexes;
        this.ui.statAim.textContent = stats.aim;
        this.ui.statIntelligence.textContent = stats.intelligence;
        this.ui.statWillpower.textContent = stats.willpower;
        this.ui.level.textContent = this.player.level;
        this.ui.xp.textContent = `${this.player.xp} / ${this.player.level * 1000}`;
        this.ui.credits.textContent = this.player.credits;
        this.ui.statusEffectsList.innerHTML = '';
        this.player.statusEffects.forEach(effect => {
            const li = document.createElement('li');
            li.textContent = effect;
            this.ui.statusEffectsList.appendChild(li);
        });
    }

    /**
     * Updates the main text and character/location info based on the current state.
     */
    renderLocation() {
        if (this.activeInteraction) {
            const dialogue = this.activeInteraction.dialogue[this.activeDialogueNode];
            this.ui.mainText.textContent = dialogue.text;
            this.ui.characterName.textContent = this.activeInteraction.name;
            this.ui.characterIcon.src = this.activeInteraction.icon;
            this.ui.characterIcon.style.display = 'block';
        } else {
            this.ui.mainText.textContent = this.currentLocation.description;
            this.ui.characterName.textContent = this.currentLocation.name;
            // Hide the icon if there's no specific one for the location
            this.ui.characterIcon.style.display = 'none';
        }
    }

    /**
     * Renders the 5x5 location map centered on the player.
     */
    renderMap() {
        this.ui.mapGrid.innerHTML = '';
        const playerX = this.currentLocation.x;
        const playerY = this.currentLocation.y;
        for (let y = -2; y <= 2; y++) {
            for (let x = -2; x <= 2; x++) {
                const cell = document.createElement('div');
                cell.classList.add('map-cell');
                const targetX = playerX + x;
                const targetY = playerY + y;
                const location = this.locationsByCoords[`${targetX},${targetY}`];
                if (location) {
                    cell.textContent = location.mapIcon;
                    cell.style.display = 'flex';
                    cell.style.justifyContent = 'center';
                    cell.style.alignItems = 'center';
                    cell.style.fontSize = '24px';
                }
                if (x === 0 && y === 0) {
                    cell.classList.add('player');
                    cell.style.backgroundColor = '#00f';
                }
                this.ui.mapGrid.appendChild(cell);
            }
        }
    }

    /**
     * Renders the control buttons based on the current context (movement or dialogue).
     */
    renderControls() {
        this.ui.bottomControls.innerHTML = '';
        const buttonElements = Array(15).fill(null);

        if (this.activeInteraction) {
            const dialogue = this.activeInteraction.dialogue[this.activeDialogueNode];
            if (dialogue.choices) {
                dialogue.choices.forEach((choice, index) => {
                    if (index < 15) {
                        const button = document.createElement('button');
                        button.classList.add('control-button');
                        button.textContent = choice.text;
                        button.onclick = () => this.handleDialogueChoice(choice);
                        buttonElements[index] = button;
                    }
                });
            }
        } else {
            const directionMap = { north: { index: 1, key: 'W' }, west: { index: 5, key: 'A' }, south: { index: 6, key: 'S' }, east: { index: 7, key: 'D' } };
            for (const dir in this.currentLocation.connections) {
                const mapping = directionMap[dir.toLowerCase()];
                if (mapping) {
                    const button = document.createElement('button');
                    button.classList.add('control-button');
                    button.textContent = `${dir.charAt(0).toUpperCase() + dir.slice(1)} (${mapping.key})`;
                    button.onclick = () => this.move(dir);
                    buttonElements[mapping.index] = button;
                }
            }

            if (this.currentLocation.characters) {
                this.currentLocation.characters.forEach((charId, index) => {
                    const character = this.characters.find(c => c.id === charId);
                    if (character) {
                        const button = document.createElement('button');
                        button.classList.add('control-button');
                        button.textContent = `Talk to ${character.name}`;
                        button.onclick = () => this.startInteraction(charId);
                        const buttonPosition = 10 + index;
                        if(buttonPosition < 15 && !buttonElements[buttonPosition]) {
                           buttonElements[buttonPosition] = button;
                        }
                    }
                });
            }
        }

        for (let i = 0; i < 15; i++) {
            if (buttonElements[i]) {
                this.ui.bottomControls.appendChild(buttonElements[i]);
            } else {
                const dummy = document.createElement('div');
                dummy.classList.add('control-button-dummy');
                this.ui.bottomControls.appendChild(dummy);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
