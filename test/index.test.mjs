import { describe, test, beforeEach, expect } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags } from '../src/deprecation.mjs';

const { default: gulp } = await import('../index.js');

describe('gulp', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });
  describe('hasOwnProperty', () => {
    test('src', () => {
      expect(gulp.hasOwnProperty('src')).toEqual(true);
    });

    test('dest', () => {
      expect(gulp.hasOwnProperty('dest')).toEqual(true);
    });

    test('symlink', () => {
      expect(gulp.hasOwnProperty('symlink')).toEqual(true);
    });

    test('watch', () => {
      expect(gulp.hasOwnProperty('watch')).toEqual(true);
    });

    test('task', () => {
      expect(gulp.hasOwnProperty('task')).toEqual(true);
    });

    test('series', () => {
      expect(gulp.hasOwnProperty('series')).toEqual(true);
    });

    test('parallel', () => {
      expect(gulp.hasOwnProperty('parallel')).toEqual(true);
    });

    test('tree', () => {
      expect(gulp.hasOwnProperty('tree')).toEqual(true);
    });

    test('lastRun', () => {
      expect(gulp.hasOwnProperty('lastRun')).toEqual(true);
    });

    test('registry', () => {
      expect(gulp.hasOwnProperty('registry')).toEqual(true);
    });
  });
});
