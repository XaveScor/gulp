import { describe, test, expect } from 'vitest';

const { default: jobo } = await import('../index.js');

describe('jobo', function () {
  describe('new features', () => {
    test('declareTask', () => {
      expect(jobo.hasOwnProperty('declareTask')).toEqual(true);
    });

    test('disableBehavior', () => {
      expect(jobo.hasOwnProperty('disableBehavior')).toEqual(true);
    });

    test('disableDeprecationWarnings', () => {
      expect(jobo.hasOwnProperty('disableDeprecationWarnings')).toEqual(true);
    });

    test('deprecationFlagsEnum', () => {
      expect(jobo.hasOwnProperty('deprecationFlagsEnum')).toEqual(true);
    });
  });

  describe('old features', () => {
    test('src', () => {
      expect(jobo.hasOwnProperty('src')).toEqual(true);
    });

    test('dest', () => {
      expect(jobo.hasOwnProperty('dest')).toEqual(true);
    });

    test('symlink', () => {
      expect(jobo.hasOwnProperty('symlink')).toEqual(true);
    });

    test('watch', () => {
      expect(jobo.hasOwnProperty('watch')).toEqual(true);
    });

    test('task', () => {
      expect(jobo.hasOwnProperty('task')).toEqual(true);
    });

    test('series', () => {
      expect(jobo.hasOwnProperty('series')).toEqual(true);
    });

    test('parallel', () => {
      expect(jobo.hasOwnProperty('parallel')).toEqual(true);
    });

    test('tree', () => {
      expect(jobo.hasOwnProperty('tree')).toEqual(true);
    });

    test('lastRun', () => {
      expect(jobo.hasOwnProperty('lastRun')).toEqual(true);
    });

    test('registry', () => {
      expect(jobo.hasOwnProperty('registry')).toEqual(true);
    });

    test('gulp', () => {
      expect(jobo.hasOwnProperty('Gulp')).toEqual(true);
    });
  });

  describe('new features should not exist in prototype.gulp', () => {
    test('declareTask', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('declareTask')).toEqual(false);
    });

    test('disableBehavior', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('disableBehavior')).toEqual(false);
    });

    test('disableDeprecationWarnings', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('disableDeprecationWarnings')).toEqual(false);
    });

    test('deprecationFlagsEnum', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('deprecationFlagsEnum')).toEqual(false);
    });
  });

  describe('old features should exist in prototype.gulp', () => {
    test('src', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('src')).toEqual(true);
    });

    test('dest', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('dest')).toEqual(true);
    });

    test('symlink', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('symlink')).toEqual(true);
    });

    test('watch', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('watch')).toEqual(true);
    });

    test('task', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('task')).toEqual(true);
    });

    test('series', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('series')).toEqual(true);
    });

    test('parallel', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('parallel')).toEqual(true);
    });

    test('tree', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('tree')).toEqual(true);
    });

    test('lastRun', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('lastRun')).toEqual(true);
    });

    test('registry', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('registry')).toEqual(true);
    });

    test('gulp', () => {
      const gulp = new jobo.Gulp();
      expect(gulp.hasOwnProperty('Gulp')).toEqual(true);
    });
  });
});
