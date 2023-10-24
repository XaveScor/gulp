import { describe, test, expect } from 'vitest';

const { default: jobo } = await import('../index.js');

describe('compatibility', async () => {
  test('can redeclare task', async () => {
    jobo.task('test', async () => {});
    jobo.task('test', async () => {});
  });

  test('task can be declared with a callback', async () => {
    jobo.task('test', (done) => {
      done(null, 1);
    });

    await new Promise((resolve) => {
      jobo.series('test')((err, res) => {
        expect(res).toEqual([1]);
        resolve();
      });
    });
  });
});
