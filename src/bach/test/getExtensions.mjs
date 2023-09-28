const {default: expect} = await import('expect');

const {getExtensions} = await import('../lib/helpers.js');

describe('getExtensions', function() {
  it('should return the argument if it is an object', function(done) {
    const obj = {};
    expect(getExtensions(obj)).toEqual(obj);
    done();
  });

  it('should return undefined if argument is not an object', function(done) {
    const fn = function () {
    };
    expect(getExtensions(fn)).toEqual(undefined);
    done();
  });
});
