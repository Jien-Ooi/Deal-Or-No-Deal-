// Deal or No Deal - JavaScript Game Logic

class DealOrNoDealGame {
    constructor() {
        this.values = [
            0.50, 1, 5, 10, 50, 100, 500, 750, 1000, 2000, 3000, 4000, 5000, 7500,
            10000, 15000, 20000, 25000, 40000, 50000, 75000, 100000
        ];
        this.cases = {};
        this.openedCases = new Set();
        this.playerCase = null;
        this.playerName = "Player";
        this.currentRound = 1;
        this.casesToOpenPerRound = [5, 4, 3, 3, 2, 2, 1];
        this.casesLeftToOpen = 0;
        this.isSelectingPlayerCase = true;
        
        // Randomly choose round 3 or 4 for mid-round banker call
        this.midRoundBankerCallRound = Math.random() < 0.5 ? 3 : 4;
        
        // Sound Effects System
        this.soundEnabled = true;
        this.initSounds();
    }

    initSounds() {
        // Create audio context for better sound control
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized successfully');
        } catch (e) {
            console.log('Web Audio API not supported:', e);
            this.soundEnabled = false;
            return;
        }
        
        // Sound effect frequencies and configurations
        this.sounds = {
            caseSelect: { freq: 800, duration: 0.1, type: 'sine' },
            caseOpen: { freq: 600, duration: 0.3, type: 'square' },
            highValue: { freq: 1200, duration: 0.5, type: 'sawtooth' },
            lowValue: { freq: 300, duration: 0.4, type: 'triangle' },
            bankerCall: { freq: 800, duration: 2.5, type: 'sine' }, // Realistic phone ring
            deal: { freq: 880, duration: 0.8, type: 'square' },
            noDeal: { freq: 440, duration: 0.6, type: 'triangle' },
            drumRoll: { freq: 200, duration: 2.0, type: 'noise' },
            victory: { freq: 1000, duration: 1.5, type: 'sine' },
            defeat: { freq: 150, duration: 1.0, type: 'sawtooth' }
        };
        
        // Test audio context
        this.testAudio();
    }

    testAudio() {
        // Quick test to ensure audio is working
        if (!this.audioContext) return;
        
        try {
            const testOsc = this.audioContext.createOscillator();
            const testGain = this.audioContext.createGain();
            testGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            testOsc.connect(testGain);
            testGain.connect(this.audioContext.destination);
            testOsc.start();
            testOsc.stop(this.audioContext.currentTime + 0.001);
        } catch (e) {
            console.log('Audio test failed:', e);
            this.soundEnabled = false;
        }
    }

    playSound(soundType, volume = 0.3) {
        if (!this.soundEnabled || !this.audioContext) return;

        try {
            const sound = this.sounds[soundType];
            if (!sound) return;

            // Handle drum roll differently (use white noise)
            if (soundType === 'drumRoll') {
                this.playDrumRoll(volume);
                return;
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set sound properties
            oscillator.type = sound.type;
            oscillator.frequency.setValueAtTime(sound.freq, this.audioContext.currentTime);
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
            
            // Special effects for certain sounds
            if (soundType === 'highValue') {
                // Add vibrato for high value reveals
                const lfo = this.audioContext.createOscillator();
                const lfoGain = this.audioContext.createGain();
                lfo.frequency.setValueAtTime(5, this.audioContext.currentTime);
                lfoGain.gain.setValueAtTime(50, this.audioContext.currentTime);
                lfo.connect(lfoGain);
                lfoGain.connect(oscillator.frequency);
                lfo.start();
                lfo.stop(this.audioContext.currentTime + sound.duration);
            }
            
            if (soundType === 'bankerCall') {
                // Realistic phone ring pattern - multiple rings
                const ringPattern = [
                    { freq: 800, time: 0.0 },    // Ring start
                    { freq: 1000, time: 0.1 },   // Ring peak
                    { freq: 800, time: 0.2 },    // Ring end
                    { freq: 0, time: 0.4 },      // Silence
                    { freq: 800, time: 0.6 },    // Ring start 2
                    { freq: 1000, time: 0.7 },   // Ring peak 2
                    { freq: 800, time: 0.8 },    // Ring end 2
                    { freq: 0, time: 1.0 },      // Silence
                    { freq: 800, time: 1.2 },    // Ring start 3
                    { freq: 1000, time: 1.3 },   // Ring peak 3
                    { freq: 800, time: 1.4 },    // Ring end 3
                    { freq: 0, time: 1.6 },      // Silence
                    { freq: 800, time: 1.8 },    // Ring start 4
                    { freq: 1000, time: 1.9 },   // Ring peak 4
                    { freq: 800, time: 2.0 }     // Ring end 4
                ];
                
                ringPattern.forEach(ring => {
                    if (ring.freq > 0) {
                        oscillator.frequency.setValueAtTime(ring.freq, this.audioContext.currentTime + ring.time);
                    } else {
                        // Create silence by setting very low gain
                        gain.gain.setValueAtTime(0, this.audioContext.currentTime + ring.time);
                        gain.gain.setValueAtTime(volume, this.audioContext.currentTime + ring.time + 0.15);
                    }
                });
            }
            
            if (soundType === 'victory') {
                // Victory fanfare
                oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C
                oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.3); // E
                oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.6); // G
                oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.9); // C
            }
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    playDrumRoll(volume = 0.3) {
        if (!this.audioContext) return;
        
        // Create a more realistic drum roll using white noise
        const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
        
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Volume envelope for drum roll
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + 1.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2.0);
        
        source.start();
        source.stop(this.audioContext.currentTime + 2.0);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    playDramaticSound(value) {
        // Play appropriate sound based on value - corrected logic
        // High values eliminated = bad for player (sad sound)
        // Low values eliminated = good for player (happy sound)
        if (value >= 75000) {
            this.playSound('lowValue', 0.5); // Sad sound for losing high value
            setTimeout(() => this.playSound('dramatic', 0.4), 300);
        } else if (value >= 25000) {
            this.playSound('lowValue', 0.4); // Sad sound for losing medium-high value
        } else if (value >= 5000) {
            this.playSound('caseOpen', 0.3); // Neutral sound for medium values
        } else {
            this.playSound('highValue', 0.3); // Happy sound for eliminating low values
            setTimeout(() => this.playSound('victory', 0.2), 200);
        }
    }

    initGame() {
        // Shuffle values and assign to cases
        const shuffledValues = [...this.values].sort(() => Math.random() - 0.5);
        this.cases = {};
        for (let i = 1; i <= 22; i++) {
            this.cases[i] = shuffledValues[i - 1];
        }
        
        this.openedCases.clear();
        this.playerCase = null;
        this.currentRound = 1;
        this.casesLeftToOpen = 0;
        this.isSelectingPlayerCase = true;
        
        // Hide banker section initially
        const bankerSection = document.getElementById('banker-section');
        bankerSection.classList.add('hidden');
        
        this.createCasesGrid();
        this.createValuesGrid();
        this.updateGameInfo();
    }

    createCasesGrid() {
        const casesGrid = document.getElementById('cases-grid');
        casesGrid.innerHTML = '';
        
        for (let i = 1; i <= 22; i++) {
            const caseButton = document.createElement('button');
            caseButton.className = 'case';
            caseButton.textContent = i;
            caseButton.dataset.caseNumber = i;
            caseButton.onclick = () => this.selectCase(i);
            casesGrid.appendChild(caseButton);
        }
    }

    createValuesGrid() {
        const valuesGrid = document.getElementById('values-grid');
        valuesGrid.innerHTML = '';
        
        this.values.forEach(value => {
            const valueItem = document.createElement('div');
            valueItem.className = 'value-item';
            valueItem.textContent = this.formatCurrency(value);
            valueItem.dataset.value = value;
            valuesGrid.appendChild(valueItem);
        });
    }

    selectCase(caseNumber) {
        if (this.isSelectingPlayerCase) {
            this.selectPlayerCase(caseNumber);
        } else {
            this.openCase(caseNumber);
        }
    }

    selectPlayerCase(caseNumber) {
        if (this.openedCases.has(caseNumber)) return;
        
        // Play selection sound
        this.playSound('caseSelect', 0.4);
        
        this.playerCase = caseNumber;
        this.isSelectingPlayerCase = false;
        this.casesLeftToOpen = this.casesToOpenPerRound[this.currentRound - 1];
        
        // Update UI
        const caseButton = document.querySelector(`[data-case-number="${caseNumber}"]`);
        caseButton.classList.add('player-case');
        caseButton.textContent = `${caseNumber} (YOURS)`;
        
        this.updateGameInfo();
        this.showMessage(`${this.playerName}, you chose case #${caseNumber}! Now open ${this.casesLeftToOpen} cases.`);
        
        // Play dramatic entrance sound
        setTimeout(() => this.playSound('bankerCall', 0.3), 500);
    }

    openCase(caseNumber) {
        if (this.openedCases.has(caseNumber) || caseNumber === this.playerCase || this.casesLeftToOpen <= 0) {
            return;
        }
        
        // Play case opening sound
        this.playSound('caseOpen', 0.3);
        
        this.openedCases.add(caseNumber);
        this.casesLeftToOpen--;
        
        const caseValue = this.cases[caseNumber];
        
        // Play dramatic sound based on value
        setTimeout(() => this.playDramaticSound(caseValue), 200);
        
        // Update UI with enhanced animations
        const caseButton = document.querySelector(`[data-case-number="${caseNumber}"]`);
        caseButton.classList.add('opened');
        caseButton.textContent = 'X';
        
        // Update values board with animation
        const valueItem = document.querySelector(`[data-value="${caseValue}"]`);
        if (valueItem) {
            valueItem.classList.add('eliminated');
        }
        
        // Add dramatic effects for high values
        if (caseValue >= 50000) {
            this.createConfetti();
            this.shakeScreen();
            valueItem?.classList.add('high-value-shock');
            // Extra dramatic sound for very high values
            setTimeout(() => this.playSound('highValue', 0.6), 500);
        }
        
        // Show message with typewriter effect
        const message = `Case #${caseNumber} contained: ${this.formatCurrency(caseValue)}`;
        this.showMessageWithTypewriter(message);
        
        this.updateGameInfo();
        
        // Check for mid-round banker call in randomly chosen round (3 or 4)
        if (this.currentRound === this.midRoundBankerCallRound && 
            this.casesLeftToOpen === Math.floor(this.casesToOpenPerRound[this.currentRound - 1] / 2)) {
            setTimeout(() => this.midRoundBankerCall(), 2000);
        }
        
        // Check if round is complete
        if (this.casesLeftToOpen === 0) {
            setTimeout(() => {
                // Double-check if game should end (21 cases opened out of 22 total)
                if (this.openedCases.size >= 21) {
                    this.showFinalScreen();
                } else {
                    this.endRound();
                }
            }, 1500);
        }
    }

    endRound() {
        if (this.openedCases.size >= 21) {
            // Game over - only player's case left
            this.showFinalScreen();
            return;
        }
        
        // Show banker offer
        const offer = this.calculateBankerOffer();
        this.showBankerOffer(offer);
    }

    calculateBankerOffer() {
        const remainingValues = [];
        const eliminatedValues = [];
        
        for (let caseNum = 1; caseNum <= 22; caseNum++) {
            if (!this.openedCases.has(caseNum) && caseNum !== this.playerCase) {
                remainingValues.push(this.cases[caseNum]);
            } else if (this.openedCases.has(caseNum)) {
                eliminatedValues.push(this.cases[caseNum]);
            }
        }
        
        if (remainingValues.length === 0) return 0;
        
        // FIXED: Include player's case in the average calculation
        // The banker doesn't know what's in ANY of the remaining cases, including the player's
        const playerCaseValue = this.cases[this.playerCase];
        const allUnknownValues = [...remainingValues, playerCaseValue];
        const average = allUnknownValues.reduce((sum, val) => sum + val, 0) / allUnknownValues.length;
        
        // Banker logic - More generous offers, especially later in the game
        let baseMultiplier = 0.20 + (this.currentRound * 0.10);
        
         //Special rules for different rounds - much more generous
        if (this.currentRound === 1) {
            baseMultiplier = 0.15;
        } else if (this.currentRound === 2) {
            baseMultiplier = 0.20;
        } else if (this.currentRound === 3) {
            baseMultiplier = 0.33;
        } else if (this.currentRound === 4) {
            baseMultiplier = 0.45;
        } else if (this.currentRound === 5) {
            baseMultiplier = 0.60;
        } else if (this.currentRound === 6) {
            baseMultiplier = 0.75;
        } else if (this.currentRound >= 7) {
            baseMultiplier = 0.88;
        }
        /*
        // Adjust based on eliminated values
        if (eliminatedValues.length > 0) {
            const totalValue = Object.values(this.cases).reduce((sum, val) => sum + val, 0);
            const eliminatedPercentage = eliminatedValues.reduce((sum, val) => sum + val, 0) / totalValue;
            const remainingPercentage = allUnknownValues.reduce((sum, val) => sum + val, 0) / totalValue;
            
            const expectedRemaining = allUnknownValues.length / 22;
            const valueRatio = expectedRemaining > 0 ? remainingPercentage / expectedRemaining : 1;
            
            let adjustment = 1.0;
            if (valueRatio < 0.6) adjustment = 0.75;  // Less penalty for bad eliminations
            else if (valueRatio < 0.8) adjustment = 0.90;
            else if (valueRatio > 1.4) adjustment = 1.35;  // Better bonus for good eliminations
            else if (valueRatio > 1.1) adjustment = 1.15;
            
            baseMultiplier *= adjustment;
        }
        
        // Apply more generous caps, especially for later rounds
        let cap = 0.50 + (this.currentRound * 0.08);
        
        // Special final round caps - very generous near the end
        if (remainingValues.length <= 2) {
            cap = 0.85;
        } else if (remainingValues.length <= 3) {
            cap = 0.78;
        } else if (remainingValues.length <= 5) {
            cap = 0.70;
        } else if (remainingValues.length <= 8) {
            cap = 0.62;
        }
        
        if (baseMultiplier > cap) baseMultiplier = cap;
        if (baseMultiplier < 0.25) baseMultiplier = 0.25;  // Higher minimum
*/
        return Math.round(average * baseMultiplier);
    }

    midRoundBankerCall() {
        // Play banker call sound
        this.playSound('bankerCall', 0.4);
        
        // Analyze player's performance so far
        const eliminatedValues = [];
        for (let caseNum = 1; caseNum <= 22; caseNum++) {
            if (this.openedCases.has(caseNum)) {
                eliminatedValues.push(this.cases[caseNum]);
            }
        }
        
        // Calculate performance metrics
        const totalEliminated = eliminatedValues.reduce((sum, val) => sum + val, 0);
        const avgEliminated = totalEliminated / eliminatedValues.length;
        const highValuesEliminated = eliminatedValues.filter(val => val >= 25000).length;
        const lowValuesEliminated = eliminatedValues.filter(val => val <= 1000).length;
        const topTierEliminated = eliminatedValues.filter(val => val >= 75000).length;
        const bottomTierEliminated = eliminatedValues.filter(val => val <= 100).length;
        const midTierEliminated = eliminatedValues.filter(val => val >= 5000 && val <= 20000).length;
        
        // Check for specific situations
        const has100K = !eliminatedValues.includes(100000);
        const has75K = !eliminatedValues.includes(75000);
        const has50K = !eliminatedValues.includes(50000);
        const hasPenny = !eliminatedValues.includes(0.50);
        const hasDollar = !eliminatedValues.includes(1);
        
        // Determine banker's assessment with multiple levels
        let bankerStatement = "";
        let messageType = "neutral";
        
        // Level 1: Extreme situations (highest priority)
        if (topTierEliminated >= 2) {
            // Player eliminated multiple top prizes
            const statements = [
                `📞 The banker says: "${this.playerName}, you just threw away the big money! I'm practically giving it away now!"`,
                `📞 The banker says: "Oh my! ${this.playerName}, you've eliminated the crown jewels! This is music to my ears!"`,
                `📞 The banker says: "${this.playerName}, those were the million-dollar eliminations! I might offer you pocket change now!"`,
                `📞 The banker says: "Brutal choices ${this.playerName}! You've just made my day - and ruined your potential winnings!"`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "terrible";
        } else if (bottomTierEliminated >= 3 && has100K && has75K) {
            // Player eliminated small amounts and kept top prizes
            const statements = [
                `📞 The banker says: "${this.playerName}, you're a strategic mastermind! Clearing the small stuff while keeping the gold!"`,
                `📞 The banker says: "This is getting expensive ${this.playerName}! You're playing like a seasoned pro!"`,
                `📞 The banker says: "${this.playerName}, you're making me sweat! Those big numbers are still lurking out there!"`,
                `📞 The banker says: "Textbook strategy ${this.playerName}! You're keeping all my worst nightmares in play!"`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "excellent";
        }
        // Level 2: Specific value analysis
        else if (!has100K && !has75K) {
            // Both top prizes gone
            const statements = [
                `📞 The banker says: "${this.playerName}, the top two are gone! That's a massive relief for me!"`,
                `📞 The banker says: "Well ${this.playerName}, no more six-figure nightmares! I can breathe easier now!"`,
                `📞 The banker says: "${this.playerName}, you've just saved me from bankruptcy! The big guns are eliminated!"`,
                `📞 The banker says: "Thank you ${this.playerName}! Without those monster amounts, I'm feeling generous!"`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "relieved";
        } else if (has100K && has75K && has50K && bottomTierEliminated >= 2) {
            // All top three intact, small amounts going
            const statements = [
                `📞 The banker says: "${this.playerName}, the holy trinity is still there! $100K, $75K, $50K - my three nightmares!"`,
                `📞 The banker says: "Dangerous game ${this.playerName}! You're keeping the big three while ditching the small change!"`,
                `📞 The banker says: "${this.playerName}, those three amounts could bankrupt me! You're playing with fire!"`,
                `📞 The banker says: "Smart moves ${this.playerName}, but those top three are giving me nightmares!"`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "worried";
        }
        // Level 3: Pattern-based analysis
        else if (midTierEliminated >= 2) {
            // Player eliminating middle values
            const statements = [
                `📞 The banker says: "${this.playerName}, you're clearing the middle ground! Interesting strategy..."`,
                `📞 The banker says: "Hmm ${this.playerName}, taking out the medium amounts? I'm not sure how to read this!"`,
                `📞 The banker says: "${this.playerName}, you're creating extremes - keeping the highs and lows! Risky move!"`,
                `📞 The banker says: "Curious choices ${this.playerName}! You're leaving me with the unpredictable ends!"`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "puzzled";
        }
        // Level 4: Traditional analysis (fallback)
        else if (highValuesEliminated >= 3) {
            // Player eliminated many high values - banker is happy
            const statements = [
                `📞 The banker says: "${this.playerName}, you're making my job easy! Those big numbers are disappearing fast!"`,
                `📞 The banker says: "Ouch! ${this.playerName}, you're eliminating the money! I'm feeling generous now..."`,
                `📞 The banker says: "Well ${this.playerName}, you've knocked out some serious cash. My offers are looking better by the minute!"`,
                `📞 The banker says: "${this.playerName}, those high values hurt to see go! You might want to consider my next offer carefully..."`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "bad";
        } else if (lowValuesEliminated >= 4) {
            // Player eliminated many low values - banker is worried
            const statements = [
                `📞 The banker says: "${this.playerName}, you're playing like a pro! Getting rid of all that small change..."`,
                `📞 The banker says: "Impressive work ${this.playerName}! You're keeping all the big money in play. This could get expensive for me!"`,
                `📞 The banker says: "${this.playerName}, you're making me nervous! All those small amounts gone... my offers will have to reflect that!"`,
                `📞 The banker says: "Smart moves so far ${this.playerName}! You're clearing out the low end beautifully. I might have to be more... conservative."`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "good";
        } else if (avgEliminated > 15000) {
            // Player eliminated moderate to high average - mixed bag
            const statements = [
                `📞 The banker says: "${this.playerName}, you're playing it interesting! Some good eliminations, some that hurt..."`,
                `📞 The banker says: "Mixed results so far ${this.playerName}. Could go either way from here!"`,
                `📞 The banker says: "${this.playerName}, you're keeping me guessing! Some solid plays mixed with some painful ones..."`,
                `📞 The banker says: "Intriguing game ${this.playerName}! You're balancing risk and reward nicely."`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "neutral";
        } else {
            // Player eliminated mostly low values - banker is cautious
            const statements = [
                `📞 The banker says: "${this.playerName}, you're building a strong position! Those small eliminations are working in your favor..."`,
                `📞 The banker says: "Careful strategy ${this.playerName}! You're keeping the pressure on with those low-value eliminations!"`,
                `📞 The banker says: "${this.playerName}, you're playing the long game! Those small amounts going out first is textbook strategy!"`,
                `📞 The banker says: "Strategic thinking ${this.playerName}! You're setting yourself up nicely for the bigger rounds..."`
            ];
            bankerStatement = statements[Math.floor(Math.random() * statements.length)];
            messageType = "good";
        }
        
        // Show the banker's message
        this.showMessage(bankerStatement);
        
        // Add extra sound effect based on message type
        setTimeout(() => {
            if (messageType === "excellent" || messageType === "worried") {
                this.playSound('highValue', 0.4);
                this.createSparkles(document.getElementById('game-messages'));
            } else if (messageType === "terrible" || messageType === "relieved") {
                this.playSound('lowValue', 0.4);
            } else if (messageType === "puzzled") {
                this.playSound('drumRoll', 0.2);
            } else if (messageType === "good") {
                this.playSound('highValue', 0.3);
            } else if (messageType === "bad") {
                this.playSound('lowValue', 0.3);
            } else {
                this.playSound('caseOpen', 0.3);
            }
        }, 1000);
        
        // Continue the game after a pause
        setTimeout(() => {
            this.showMessage(`Continue opening cases, ${this.playerName}. ${this.casesLeftToOpen} more to go this round.`);
        }, 4000);
    }

    showBankerOffer(offer) {
        // Play banker entrance sound
        this.playSound('bankerCall', 0.4);
        
        // Add dramatic entrance effect
        const bankerSection = document.getElementById('banker-section');
        bankerSection.classList.remove('hidden');
        
        // Create money rain effect for high offers
        if (offer >= 10000) {
            this.createMoneyRain();
            // Play money sound for high offers
            setTimeout(() => this.playSound('highValue', 0.4), 500);
        }
        
        // Animate the offer reveal
        const offerElement = document.getElementById('banker-amount');
        offerElement.textContent = '0';
        
        // Count up animation to the actual offer with sound
        this.animateCountUp(offerElement, offer);
        
        // Store offer for deal acceptance
        this.currentOffer = offer;
        
        // Add screen shake for dramatic effect
        setTimeout(() => this.shakeScreen(), 1000);
    }

    animateCountUp(element, targetValue) {
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        const startValue = 0;
        
        // Play drum roll sound during count up
        this.playSound('drumRoll', 0.2);
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (targetValue - startValue) * easeOut;
            
            element.textContent = this.formatCurrency(Math.round(currentValue), false);
            
            // Play tick sounds during count up
            if (Math.floor(progress * 20) !== Math.floor((progress - 0.05) * 20)) {
                this.playSound('caseSelect', 0.1);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final reveal sound
                this.playSound('bankerCall', 0.5);
            }
        };
        
        requestAnimationFrame(animate);
    }

    acceptDeal() {
        // Play deal acceptance sound
        this.playSound('victory', 0.8);
        
        const playerCaseValue = this.cases[this.playerCase];
        
        // Show the deal acceptance message
        this.showMessage(`🎉 ${this.playerName} accepts the deal for ${this.formatCurrency(this.currentOffer)}!`);
        
        // Create dramatic reveal of what was in their case
        setTimeout(() => {
            this.showMessage(`But what was in your case #${this.playerCase}?`);
            this.playSound('drumRoll', 0.5);
        }, 2000);
        
        // Reveal the player's case value after suspense
        setTimeout(() => {
            const caseElement = document.querySelector(`[data-case-number="${this.playerCase}"]`);
            if (caseElement) {
                caseElement.classList.add('opened');
                caseElement.innerHTML = `<div class="case-number">${this.playerCase}</div><div class="case-value">${this.formatCurrency(playerCaseValue)}</div>`;
            }
            
            // Determine if it was a good or bad deal
            let resultMessage = '';
            
            if (playerCaseValue > this.currentOffer) {
                const difference = playerCaseValue - this.currentOffer;
                resultMessage = `💔 Oh no! Your case had ${this.formatCurrency(playerCaseValue)}! You missed out on ${this.formatCurrency(difference)}!`;
                this.playSound('defeat', 0.6);
            } else if (playerCaseValue < this.currentOffer) {
                const difference = this.currentOffer - playerCaseValue;
                resultMessage = `🎉 Great deal! Your case only had ${this.formatCurrency(playerCaseValue)}! You made ${this.formatCurrency(difference)} extra!`;
                this.createConfetti();
                this.playSound('victory', 0.8);
            } else {
                resultMessage = `😮 Incredible! Your case had exactly ${this.formatCurrency(playerCaseValue)}! Perfect deal!`;
                this.createConfetti();
                this.playSound('victory', 0.8);
            }
            
            this.showMessage(resultMessage);
            
            // Show final result screen with deal comparison
            setTimeout(() => {
                this.showFinalResultScreen(this.currentOffer, playerCaseValue, true);
            }, 3000);
            
        }, 4000);
    }

    showFinalResultScreen(dealAmount = null, caseValue, isDeal = false) {
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('final-screen').classList.add('active');
        
        // Update final screen content based on scenario
        if (isDeal) {
            document.getElementById('final-title').textContent = '💼 DEAL RESULT 💼';
            document.getElementById('final-message').textContent = `${this.playerName}, you accepted the banker's offer!`;
        } else {
            document.getElementById('final-title').textContent = '🎊 FINAL RESULT 🎊';
            document.getElementById('final-message').textContent = `${this.playerName}, here's what was in your case!`;
        }
        
        // Hide the open case button since we're showing results
        document.getElementById('open-case-btn').style.display = 'none';
        
        // Show the appropriate result display
        if (isDeal) {
            // Show deal comparison
            document.getElementById('final-case-value').innerHTML = `
                <div class="deal-comparison">
                    <div class="deal-taken">
                        <h3>💰 Your Deal</h3>
                        <h2>${this.formatCurrency(dealAmount)}</h2>
                    </div>
                    <div class="vs">VS</div>
                    <div class="case-had">
                        <h3>📦 Your Case Had</h3>
                        <h2>${this.formatCurrency(caseValue)}</h2>
                    </div>
                </div>
            `;
        } else {
            // Show just the case value for no-deal scenario
            document.getElementById('final-case-value').innerHTML = `
                <div class="final-case-reveal">
                    <h3>📦 Your Case #${this.playerCase} Contained:</h3>
                    <h1 class="final-amount">${this.formatCurrency(caseValue)}</h1>
                </div>
            `;
        }
        document.getElementById('final-case-value').classList.remove('hidden');
        
        // Show result message
        let resultMessage = '';
        if (isDeal) {
            // Deal scenario messages
            if (caseValue > dealAmount) {
                const difference = caseValue - dealAmount;
                resultMessage = `You missed out on ${this.formatCurrency(difference)}, but ${this.formatCurrency(dealAmount)} is still great!`;
            } else if (caseValue < dealAmount) {
                const difference = dealAmount - caseValue;
                resultMessage = `Smart move! You gained ${this.formatCurrency(difference)} by taking the deal!`;
            } else {
                resultMessage = `Perfect! The deal was exactly what your case was worth!`;
            }
        } else {
            // No-deal scenario messages
            if (caseValue >= 75000) {
                resultMessage = `🎉 INCREDIBLE! You found one of the top prizes!`;
            } else if (caseValue >= 25000) {
                resultMessage = `🎊 Fantastic! A great result!`;
            } else if (caseValue >= 5000) {
                resultMessage = `👏 Well done! A solid win!`;
            } else {
                resultMessage = `🎭 Not this time, but you played brilliantly!`;
            }
        }
        
        document.getElementById('final-result-message').textContent = resultMessage;
        document.getElementById('final-result-message').classList.remove('hidden');
        
        // Show play again button immediately with the results
        document.getElementById('final-result').innerHTML = `
            <h3>🎭 Thanks for playing! 🎭</h3>
            <p>Hope you had fun!</p>
            <button onclick="playAgain()" class="play-again-btn">Play Again</button>
        `;
        document.getElementById('final-result').classList.remove('hidden');
    }

    rejectDeal() {
        // Play no deal sound
        this.playSound('noDeal', 0.6);
        
        this.showMessage(`🚫 NO DEAL! Let's continue...`);
        
        // Hide banker section for next round
        const bankerSection = document.getElementById('banker-section');
        bankerSection.classList.add('hidden');
        
        this.currentRound++;
        if (this.currentRound <= this.casesToOpenPerRound.length) {
            this.casesLeftToOpen = this.casesToOpenPerRound[this.currentRound - 1];
            setTimeout(() => {
                this.updateGameInfo();
                this.showMessage(`Round ${this.currentRound}: Open ${this.casesLeftToOpen} cases.`);
                // Play round start sound
                this.playSound('bankerCall', 0.3);
            }, 2000);
        } else {
            setTimeout(() => this.showFinalScreen(), 2000);
        }
    }

    showFinalScreen() {
        // Play dramatic final screen sound
        this.playSound('drumRoll', 0.4);
        
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('final-screen').classList.add('active');
        
        document.getElementById('final-case-number').textContent = this.playerCase;
        document.getElementById('final-message').textContent = `${this.playerName}, all other cases are opened. Time to open your case!`;
        
        // Make sure the button is visible and clickable
        const openCaseBtn = document.getElementById('open-case-btn');
        if (openCaseBtn) {
            openCaseBtn.style.display = 'block';
            openCaseBtn.disabled = false;
        }
        
        // Hide previous results
        const finalCaseValue = document.getElementById('final-case-value');
        const finalResultMessage = document.getElementById('final-result-message');
        const finalResult = document.getElementById('final-result');
        
        if (finalCaseValue) finalCaseValue.classList.add('hidden');
        if (finalResultMessage) finalResultMessage.classList.add('hidden');
        if (finalResult) finalResult.classList.add('hidden');
    }

    openFinalCase() {
        // Disable the button to prevent multiple clicks
        const openCaseBtn = document.getElementById('open-case-btn');
        if (openCaseBtn) {
            openCaseBtn.disabled = true;
            openCaseBtn.style.display = 'none';
        }
        
        // Play suspenseful opening sound
        this.playSound('drumRoll', 0.5);
        
        const playerCaseValue = this.cases[this.playerCase];
        
        // Play appropriate final sound based on value
        if (playerCaseValue >= 50000) {
            this.playSound('victory', 0.8);
            this.createConfetti();
            this.createMoneyRain();
        } else if (playerCaseValue >= 10000) {
            this.playSound('highValue', 0.6);
            this.createConfetti();
        } else {
            this.playSound('defeat', 0.4);
        }
        
        // Show final result screen for no-deal scenario
        setTimeout(() => {
            this.showFinalResultScreen(null, playerCaseValue, false);
        }, 2000);
    }

    showPlayAgain() {
        // Play game end sound
        this.playSound('bankerCall', 0.4);
        
        const finalContent = document.querySelector('.final-content');
        finalContent.innerHTML = `
            <h2>🎭 Thanks for playing! 🎭</h2>
            <p>Hope you had fun!</p>
            <button onclick="playAgain()" class="play-again-btn">Play Again</button>
        `;
        
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('final-screen').classList.add('active');
    }

    updateGameInfo() {
        document.getElementById('player-display').textContent = this.playerName;
        document.getElementById('round-display').textContent = this.currentRound;
        document.getElementById('cases-to-open').textContent = this.casesLeftToOpen;
    }

    showMessage(message) {
        const messagesDiv = document.getElementById('game-messages');
        messagesDiv.innerHTML = message.replace(/\n/g, '<br>');
        messagesDiv.classList.add('dramatic-zoom');
        setTimeout(() => messagesDiv.classList.remove('dramatic-zoom'), 1000);
    }

    showMessageWithTypewriter(message) {
        const messagesDiv = document.getElementById('game-messages');
        messagesDiv.innerHTML = '';
        messagesDiv.classList.add('typewriter');
        
        // Add sparkles around the message
        this.createSparkles(messagesDiv);
        
        setTimeout(() => {
            messagesDiv.innerHTML = message.replace(/\n/g, '<br>');
            messagesDiv.classList.remove('typewriter');
        }, 100);
    }

    createConfetti() {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.animationDelay = Math.random() * 3 + 's';
                confetti.style.backgroundColor = ['#ffd700', '#ff6b35', '#00ff88'][Math.floor(Math.random() * 3)];
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 50);
        }
    }

    createMoneyRain() {
        const moneySymbols = ['💰', '💵', '💴', '💶', '💷'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const money = document.createElement('div');
                money.className = 'money-rain';
                money.textContent = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
                money.style.left = Math.random() * 100 + 'vw';
                money.style.animationDelay = Math.random() * 2 + 's';
                document.body.appendChild(money);
                
                setTimeout(() => money.remove(), 3000);
            }, i * 100);
        }
    }

    createSparkles(element) {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.top = Math.random() * 100 + '%';
                sparkle.style.animationDelay = Math.random() * 1.5 + 's';
                element.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 1500);
            }, i * 150);
        }
    }

    shakeScreen() {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 600);
    }

    formatCurrency(value, includeDollarSign = true) {
        if (includeDollarSign) {
            if (value < 1) {
                // Handle values less than $1 (like $0.50)
                return `$${value.toFixed(2)}`;
            } else if (value >= 1000) {
                return `$${Math.round(value).toLocaleString()}`;
            } else {
                return `$${Math.round(value).toLocaleString()}`;
            }
        } else {
            // For banker offers, show full amount without K
            if (value < 1) {
                return `${value.toFixed(2)}`;
            } else {
                return `${Math.round(value).toLocaleString()}`;
            }
        }
    }
}

// Global game instance
let game;

// Game control functions
function startGame() {
    const playerName = document.getElementById('player-name').value.trim();
    
    game = new DealOrNoDealGame();
    game.playerName = playerName || "Player";
    
    // Enable audio context on user interaction
    if (game.audioContext && game.audioContext.state === 'suspended') {
        game.audioContext.resume();
    }
    
    // Play game start sound
    game.playSound('caseSelect', 0.5);
    
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    game.initGame();
    game.showMessage(`${game.playerName}, choose your case to keep!`);
}

function acceptDeal() {
    if (game) {
        game.acceptDeal();
    }
}

function rejectDeal() {
    if (game) {
        game.rejectDeal();
    }
}

function openFinalCase() {
    if (game) {
        game.openFinalCase();
    }
}

function playAgain() {
    // Play restart sound
    if (game) {
        game.playSound('caseSelect', 0.4);
    }
    
    // Reset all screens
    document.getElementById('final-screen').classList.remove('active');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('welcome-screen').classList.add('active');
    
    // Reset final screen content
    const finalResult = document.getElementById('final-result');
    if (finalResult) {
        finalResult.classList.add('hidden');
    }
    
    const openCaseBtn = document.getElementById('open-case-btn');
    if (openCaseBtn) {
        openCaseBtn.style.display = 'block';
    }
    
    // Clear player name
    document.getElementById('player-name').value = '';
    
    // Reset game instance
    game = null;
}

function handleEnterKey(event) {
    // Check if Enter key was pressed (key code 13)
    if (event.key === 'Enter' || event.keyCode === 13) {
        startGame();
    }
}
