'use strict';

describe('Service: Random', function () {

  /* test helpers */

  var mocker = null;

  beforeEach(function() {
    mocker = sinon.sandbox.create();
  });

  afterEach(function() {
    mocker.restore();
  });

  /* tests */

  beforeEach(module('App'));

  var $rootScope, BaseServiceClass, Random, $q;

  beforeEach(inject(function (_$rootScope_, _BaseServiceClass_, _Random_) {
    $rootScope = _$rootScope_;
    BaseServiceClass = _BaseServiceClass_;
    Random = _Random_;
  }));

//  it('should inherit from base service class', function () {
//    expect(Random).to.be.instanceOf(BaseServiceClass);
//  });

  it('should implement toString()', function () {
    expect(Random.toString()).to.eql('Cryptographically secure randomness generator');
  });


  it('can start entropy collection', function () {
    var startCollectorsSpy = mocker.stub(sjcl.random, 'startCollectors'),
      setDefaultParanoiaSpy = mocker.stub(sjcl.random, 'setDefaultParanoia');

    Random.startEntropyCollection();

    startCollectorsSpy.should.have.been.calledOnce;
    setDefaultParanoiaSpy.should.have.been.calledWith(10)
  });


  it('can ask PRNG for random bytes', function() {
    var randomWordsSpy = mocker.stub(sjcl.random, 'randomWords').returns('test');

    var bytes = Random._getRandomBytes();

    expect(bytes).to.eql('test');
    randomWordsSpy.should.have.been.calledWith(8);
  });


  describe('when calculating random bytes', function() {

    var $modal;

    beforeEach(inject(function(_$modal_) {
      $modal = _$modal_;
    }));

    var getRandomBytesPrivateSpy,
      modalOpenSpy,
      modalInstance,
      isReadySpy,
      isReadyValue;

    beforeEach(function() {
      getRandomBytesPrivateSpy = mocker.stub(Random, '_getRandomBytes').returns('test');

      modalOpenSpy = mocker.stub($modal, 'open').returns(modalInstance);

      isReadySpy = mocker.stub(sjcl.random, 'isReadyToGenerate', function() {
        return isReadyValue;
      });
    });


    it('returns immediately if RNG is ready', function(done) {
      isReadyValue = true;

      Random.getRandomBytes().then(function(bytes) {
        expect(bytes).to.eql('test');

        getRandomBytesPrivateSpy.should.have.been.calledOnce;
        modalOpenSpy.should.not.have.been.called;

        done();
      }, done);

      $rootScope.$apply();
    });

  });

});
