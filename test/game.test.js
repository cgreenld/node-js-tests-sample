// First, set up the mock before any imports
const mockVariation = jest.fn().mockResolvedValue(false);
jest.mock('launchdarkly-node-server-sdk', () => ({
  init: () => ({
    variation: mockVariation,
    waitForInitialization: jest.fn().mockResolvedValue(true)
  })
}));

const Game = require('../src/index');

// Get reference to the mocked client after import
const ldClient = require('launchdarkly-node-server-sdk').init();

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
    mockVariation.mockClear();
  });

  test('should create a new game instance', () => {
    expect(game).toBeInstanceOf(Game);
  });

  describe('feature flag tests', () => {
    test('should use new game logic when flag is enabled', async () => {
      // Set the mock value before the test
      mockVariation.mockResolvedValueOnce(true);

      game.targetNumber = 50;
      const result = await game.makeGuess(45);
      
      // First verify the mock was called
      expect(mockVariation).toHaveBeenCalled();
      // Then check the specific call
      expect(mockVariation).toHaveBeenCalledWith('new-game-logic', expect.any(Object), false);
      // Finally check the result
      expect(result.message).toBe('Too low!');
    });
  });
});