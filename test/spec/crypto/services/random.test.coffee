describe 'Service: Random', ->
  # mocking
  mocker = null

  beforeEach ->
    mocker = sinon.sandbox.create()

  afterEach ->
    mocker.restore()

  # tests
  beforeEach(module('App'))

  $rootScope = null
  RuntimeError = null
  Random = null
  $q = null

  beforeEach(inject( (_$rootScope_, _RuntimeError_, _Random_, _$q_) ->
    $rootScope = _$rootScope_
    RuntimeError = _RuntimeError_
    Random = _Random_
    $q = _$q_
  ))

  it 'should implement toString()', ->
    expect(Random.toString()).to.eql('Cryptographically secure randomness generator')


  it 'can start entropy collection', ->
    startCollectorsSpy = mocker.stub(sjcl.random, 'startCollectors')
    setDefaultParanoiaSpy = mocker.stub(sjcl.random, 'setDefaultParanoia')

    Random.startEntropyCollection()

    startCollectorsSpy.should.have.been.calledOnce
    setDefaultParanoiaSpy.should.have.been.calledWith(10)


  it 'can ask PRNG for random bytes', ->
    randomWordsSpy = mocker.stub(sjcl.random, 'randomWords').returns('test')

    bytes = Random._getRandomBytes()

    expect(bytes).to.eql('test')
    randomWordsSpy.should.have.been.calledWith(8)


  describe 'when calculating random bytes', ->

    $modal = null

    beforeEach(inject((_$modal_) ->
      $modal = _$modal_
    ))

    getRandomBytesPrivateSpy = null
    modalOpenSpy = null
    modalInstance = null
    isReadySpy = null
    isReadyValue = null

    beforeEach ->
      getRandomBytesPrivateSpy = mocker.stub(Random, '_getRandomBytes').returns('test')

      modalOpenSpy = mocker.stub($modal, 'open', -> modalInstance)

      isReadySpy = mocker.stub(sjcl.random, 'isReadyToGenerate', -> isReadyValue)


    it 'returns immediately if RNG is ready', (done) ->
      isReadyValue = true

      Random.getRandomBytes().then ((bytes) ->
        expect(bytes).to.eql('test')

        getRandomBytesPrivateSpy.should.have.been.calledOnce
        modalOpenSpy.should.not.have.been.called

        done()
      ), done

      $rootScope.$apply()


    describe 'when RNG is not yet ready', ->
      modalDefer = null

      beforeEach ->
        isReadyValue = false

        modalDefer = $q.defer()
        modalInstance =
          result: modalDefer.promise


      it 'launches the entropy modal', ->
        Random.getRandomBytes()

        modalOpenSpy.should.have.been.calledOnce
        modalOpenSpy.should.have.been.calledWithExactly
          templateUrl: 'views/modals/entropy.html'
          controller: 'EntropyModalCtrl'
          keyboard: false
          backdrop: 'static'


      it 'returns random bytes once the modal has closed', (done) ->
        Random.getRandomBytes().then ((bytes) ->
          expect(bytes).to.eql('test')

          getRandomBytesPrivateSpy.should.have.been.calledOnce

          done()
        ), done

        modalDefer.resolve()
        $rootScope.$apply()


      it 'returns error if the modal closed with an error', (done) ->
        Random.getRandomBytes().catch ((err) ->
          expect(err).to.be.instanceof(RuntimeError)
          expect(err.messages).to.eql ['RNG entropy modal failed', 'blah']
          done()
        )

        modalDefer.reject(new RuntimeError('blah'))
        $rootScope.$apply()



