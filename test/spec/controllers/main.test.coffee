describe 'Controller: MainCtrl', ->

  # load the controller's module
  beforeEach(module('App'))

  MainCtrl = null
  scope = null

  # Initialize the controller and a mock scope
  beforeEach(inject( ($controller, $rootScope) ->
    scope = $rootScope.$new()
    MainCtrl = $controller 'MainCtrl',
      $scope: scope
  ))

  it 'should attach a list of awesomeThings to the scope', ->
    expect(scope.awesomeThings.length).to.eql(3)
