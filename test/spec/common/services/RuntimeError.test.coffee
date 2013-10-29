describe 'Class: RuntimeError', ->

  # load the controller's module
  beforeEach(module('App.common'))

  RuntimeError = null

  beforeEach(inject( (_RuntimeError_) ->
    RuntimeError = _RuntimeError_
  ));


  it 'extends the base Error class', ->
    expect(RuntimeError.prototype).to.be.instanceOf(Error)


  describe 'construction', ->

    it 'accepts an error msg string', ->
      err = new RuntimeError('blah')

      expect(err.rootCause).to.be.undefined
      expect(err.toString()).to.eql('Error: blah')


    it 'accepts an Error object', ->
      origErr = new Error('blah')
      err = new RuntimeError(origErr)

      expect(err.rootCause).to.eql origErr
      expect(err.messages).to.eql ['blah']
      expect(err.toString()).to.eql 'Error: blah'


    it 'accepts an error msg string followed by an Error object', ->
      origErr = new Error('bottom')
      err = new RuntimeError('top', origErr)

      expect(err.rootCause).to.eql origErr
      expect(err.messages).to.eql ['top', 'bottom']
      expect(err.toString()).to.eql 'Error: top; bottom'


    it 'accepts an error msg string followed by a RuntimeError object', ->
      origErr = new RuntimeError('middle', new Error('bottom'))
      err = new RuntimeError('top', origErr)

      expect(err.rootCause).to.eql origErr
      expect(err.messages).to.eql ['top', 'middle', 'bottom']
      expect(err.toString()).to.eql 'Error: top; middle; bottom'
