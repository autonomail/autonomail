'use strict';

describe('Service: base class', function () {

  // load the controller's module
  beforeEach(module('App'));

  var baseService;

  beforeEach(inject(function (_BaseServiceClass_, $q) {
    baseService = new _BaseServiceClass_();
  }));

  it('should throw error for toString()', function () {
    expect(baseService.toString).to.throw('not yet implemented');
  });

});
