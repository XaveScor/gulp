import { describe, test, expect } from 'vitest';

const { default: jobo } = await import('../index.js');

describe('declareTask', async () => {
  test("can't redeclare task", async () => {
    jobo.declareTask({
      name: 'test',
      fn: async () => {},
    });

    expect(() =>
      jobo.declareTask({
        name: 'test',
        fn: async () => {},
      }),
    ).toThrow();
  });

  test("task can't be declared with a callback", async () => {
    expect(() =>
      jobo.declareTask({
        name: 'test',
        fn: (done) => {},
      }),
    ).toThrow();
  });
});
