'use strict';

describe('Service: PRNG', function () {

  // load the controller's module
  beforeEach(module('App'));

  var BaseServiceClass, prng;

  beforeEach(inject(function (_BaseServiceClass_, _prng_) {
    BaseServiceClass = _BaseServiceClass_;
    prng = _prng_;
  }));

  it('should inherit from base service class', function () {
    expect(prng).to.be.instanceOf(BaseServiceClass);
  });

  it('should implement toString()', function () {
    expect(prng.toString).to.eql('PRNG service');
  });
});
