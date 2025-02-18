// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const { generateRandomNumber, getDate } = require('./helpers/index');
const { ldClient } = require('../config/launchDarkly');

class Game {
    constructor() {
        this.targetNumber = Math.floor(Math.random() * 100) + 1;
        this.won = false;
        this.attempts = 0;
        this.id = Math.random().toString(36).substring(7); // Simple game ID generation
    }
    start() {
        this.players = {
            you: 'Player 1',
            opponent: 'Player 2'
        };
    }
    getId() {
        return this.id;
    }
    stop() {
        this.players = {};
    }
    async makeGuess(number, userId = 'anonymous-user') {
        this.attempts++;
        
        // Create LaunchDarkly user context
        const user = {
          key: userId,
          custom: {
            gameId: this.id,
            attemptCount: this.attempts,
            numberGuessed: number
          }
        };
    
        try {
          // Check different feature flags
          const [newGameLogicEnabled, maxAttemptsEnabled] = await Promise.all([
            ldClient.variation('new-game-logic', user, false),
            ldClient.variation('max-attempts-limit', user, false)
          ]);
    
          // Check max attempts if enabled
          if (maxAttemptsEnabled && this.attempts >= 5) {
            throw new Error('Maximum attempts reached');
          }
    
          if (newGameLogicEnabled) {
            // New game logic with hints
            if (number === this.targetNumber) {
              this.won = true;
              return { 
                success: true, 
                message: 'Congratulations! You won!' 
              };
            }
            
            return {
              success: false,
              message: number > this.targetNumber ? 'Too high!' : 'Too low!',
              attemptsLeft: maxAttemptsEnabled ? 5 - this.attempts : null
            };
          } else {
            // Original simple game logic
            const success = number === this.targetNumber;
            if (success) {
              this.won = true;
            }
            return { 
              success,
              message: success ? 'Correct!' : 'Incorrect guess'
            };
          }
    
        } catch (error) {
          // Log the error but don't expose internal details to user
          console.error('Game error:', error);
          
          // Return a user-friendly error
          return {
            success: false,
            message: error.message === 'Maximum attempts reached' 
              ? 'Game over - maximum attempts reached'
              : 'An error occurred during the game'
          };
        }
    }

    // Helper method to get game status
    async getGameStatus(userId = 'anonymous-user') {
      const user = {
        key: userId,
        custom: {
          gameId: this.id,
          attemptCount: this.attempts
        }
      };

      try {
        // Check if detailed stats are enabled
        const showDetailedStats = await ldClient.variation('show-detailed-stats', user, false);

        if (showDetailedStats) {
          return {
            gameId: this.id,
            attempts: this.attempts,
            won: this.won,
            targetRevealed: this.won ? this.targetNumber : null,
            gameComplete: this.won
          };
        }

        // Basic stats only
        return {
          attempts: this.attempts,
          won: this.won
        };
      } catch (error) {
        console.error('Error getting game status:', error);
        // Return basic stats if feature flag check fails
        return {
          attempts: this.attempts,
          won: this.won
        };
      }
    }

    // Reset game method
    async resetGame(userId = 'anonymous-user') {
      const user = {
        key: userId,
        custom: {
          gameId: this.id
        }
      };

      try {
        // Check if game reset is enabled
        const allowReset = await ldClient.variation('allow-game-reset', user, true);

        if (!allowReset) {
          throw new Error('Game reset is not allowed');
        }

        this.targetNumber = Math.floor(Math.random() * 100) + 1;
        this.won = false;
        this.attempts = 0;

        return {
          success: true,
          message: 'Game has been reset'
        };
      } catch (error) {
        console.error('Error resetting game:', error);
        return {
          success: false,
          message: error.message
        };
      }
    }
}

module.exports = Game;