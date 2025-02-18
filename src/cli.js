require('dotenv').config();
const Game = require('../src/index');
const { initLD } = require('../config/launchDarkly');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startGame() {
  try {
    // Initialize LaunchDarkly
    await initLD();
    
    console.log('Welcome to the Number Guessing Game!');
    const game = new Game();

    const askForGuess = () => {
      rl.question('Enter your guess (1-100) or "q" to quit: ', async (input) => {
        if (input.toLowerCase() === 'q') {
          console.log('Thanks for playing!');
          rl.close();
          process.exit(0);
        }

        const guess = parseInt(input);
        if (isNaN(guess)) {
          console.log('Please enter a valid number');
          askForGuess();
          return;
        }

        const result = await game.makeGuess(guess);
        console.log(result.message);

        if (result.attemptsLeft !== undefined) {
          console.log(`Attempts left: ${result.attemptsLeft}`);
        }

        if (result.success || result.message.includes('maximum attempts')) {
          const stats = await game.getGameStatus();
          console.log('\nGame Statistics:');
          console.log(stats);
          
          rl.question('Play again? (y/n): ', async (answer) => {
            if (answer.toLowerCase() === 'y') {
              await game.resetGame();
              console.log('\nNew game started!');
              askForGuess();
            } else {
              console.log('Thanks for playing!');
              rl.close();
              process.exit(0);
            }
          });
        } else {
          askForGuess();
        }
      });
    };

    askForGuess();

  } catch (error) {
    console.error('Failed to start game:', error);
    rl.close();
    process.exit(1);
  }
}

startGame(); 