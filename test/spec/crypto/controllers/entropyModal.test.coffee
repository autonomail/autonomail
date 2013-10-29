describe 'Controller: EntropyModalCtrl', ->
  # mocking
  mocker = null

  beforeEach ->
    mocker = sinon.sandbox.create()
    mocker.clock = mocker.useFakeTimers()

  afterEach ->
    mocker.clock.restore()
    mocker.restore()

  # load the controller's module
  beforeEach(module('App'))

  EntropyModalCtrl = null
  RuntimeError = null
  modalInstance = null
  openedDefer = null
  scope = null
  $rootScope = null
  $timeout = null
  $q = null

  # Initialize the controller and a mock scope
  beforeEach(inject( (_$q_, $controller, _$rootScope_, _RuntimeError_, _$timeout_) ->
    $rootScope = _$rootScope_
    $q = _$q_
    $timeout = _$timeout_
    RuntimeError = _RuntimeError_

    openedDefer = $q.defer()

    modalInstance = {
      opened: openedDefer.promise
      closed: mocker.spy()
    }

    EntropyModalCtrl = $controller 'EntropyModalCtrl',
      $scope: {}
      $modalInstance: modalInstance
      $timeout: $timeout
  ))


  it 'dismisses the modal if unable to open', (done) ->
    modalInstance.dismiss = (err) ->
      expect(err).to.be.instanceOf RuntimeError
      expect(err.messages).to.eql ['Unable to open RNG entropy modal', 'bla']
      done()

    openedDefer.reject(new Error('bla'))
    $rootScope.$apply()


  describe 'once the modal has opened', ->

    isReadySpy = null
    isReadyValue = null

    beforeEach ->
      isReadyValue = false
      isReadySpy = mocker.stub(sjcl.random, 'isReadyToGenerate', -> isReadyValue)
      openedDefer.resolve()
      $rootScope.$apply()

    it 'checks to see if RNG is ready once a second', ->
      isReadySpy.should.have.been.calledOnce
      $timeout.flush(1000)
      isReadySpy.should.have.been.calledTwice
      $timeout.flush(1000)
      isReadySpy.should.have.been.calledThrice

    describe 'once RNG is ready', ->
      beforeEach ->
        isReadyValue = true

      it 'closes the modal immediately if at least 3 seconds have elapsed', (done) ->
        modalInstance.close = done
        modalInstance.openedAt = moment().subtract('second', 3)
        $timeout.flush(1000)   # do the ready check
        $timeout.flush(0)   # 0 seconds - no wait


      it 'waits before closing the modal if 3 seconds have yet to elapse', (done) ->
        modalInstance.close = done
        modalInstance.openedAt = moment().subtract('second', 1)
        $timeout.flush(1000)   # do the ready check
        $timeout.flush(2000)   # 2 seconds


