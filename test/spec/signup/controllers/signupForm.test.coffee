describe 'Controller: SignupFormCtrl', ->
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

  $q = null
  $rootScope = null
  Server = null
  controller = null
  $scope = null

  # Initialize the controller and a mock scope
  beforeEach(inject( (_$q_, $controller, _Server_, _$rootScope_) ->
    $q = _$q_
    $rootScope = _$rootScope_
    Server = _Server_
    $scope = $rootScope.$new()
    controller = $controller 'SignupFormCtrl',
      $scope: $scope
  ))

  it 'sets up the user model', ->
    expect($scope.user).to.eql
      name: '',
      password: '',
      confirm: '',
      agree: false


  it 'can return whether the form can be submitted', ->
    $scope.signupForm =
      $dirty: false
      $valid: false
    expect($scope.canSubmit()).to.be.false

    $scope.signupForm.$dirty = true
    expect($scope.canSubmit()).to.be.false

    $scope.signupForm.$valid = true
    expect($scope.canSubmit()).to.be.true

    $scope.signupForm.$dirty = false
    expect($scope.canSubmit()).to.be.false


  it 'validate the password confirmation entry', ->
    $scope.user.password = 'test';
    expect($scope.validatePasswordConfirmation('test2')).to.be.false
    expect($scope.validatePasswordConfirmation('test')).to.be.true
    $scope.user.password = 'test2';
    expect($scope.validatePasswordConfirmation('test')).to.be.false


  describe 'when validating username availability', ->
    checkDefer = null

    beforeEach ->
      mocker.stub Server, 'checkUsernameAvailable', ->
        checkDefer = $q.defer()
        return checkDefer.promise

    it 'rejects if the username is unavailable', (done) ->
      $scope.validateNameAvailable('test').catch ->
        done()
      checkDefer.reject()
      $rootScope.$apply()

    it 'resolves if the username is available', (done) ->
      $scope.validateNameAvailable('test').then ->
        done()
      checkDefer.resolve()
      $rootScope.$apply()


