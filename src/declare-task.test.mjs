import { describe, test, expect, vi } from 'vitest';

const { default: jobo } = await import('../index.js');

describe('declareTask', async () => {
  test("can't redeclare task", async () => {
    const taskName = 'redeclared-task';
    jobo.declareTask({
      name: taskName,
      fn: async () => {},
    });

    expect(() =>
      jobo.declareTask({
        name: taskName,
        fn: async () => {},
      }),
    ).toThrow();
  });

  test("task can't be declared with a callback", async () => {
    expect(() =>
      jobo.declareTask({
        name: 'callback-test',
        fn: (done) => {},
      }),
    ).toThrow();
  });

  test('task should run only once', async () => {
    const fn = vi.fn();

    const onceTask = jobo.declareTask({
      name: 'once-test',
      fn: async () => fn(),
    });

    await new Promise((resolve) => {
      jobo.series(onceTask, onceTask, onceTask)(resolve);
    });

    expect(fn).toBeCalledTimes(1);
  });
});
