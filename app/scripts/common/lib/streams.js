(function() {

  var Readable = this.Stream.Readable;

  /**
   * A stream which reads from an input string.
   *
   * @param {String} str The source string.
   */
  var ReadableStringStream = this.ReadableStringStream = function(str) {
    Readable.call(this, {
      highWaterMark: 16 * 1024,  // 16kb
      encoding: 'utf-8'
    });

    this._src = str;
    this._srcIndex = 0;
  };
  inherits(ReadableStringStream, Readable);


  /**
   * Implement the _read() method.
   */
  ReadableStringStream.prototype._read = function(size) {
    var self = this;

    setImmediate(function() {
      if (self._src.length <= self._srcIndex) {
        self.push(null);
      } else {
        self.push(self._src.substr(self._srcIndex, size));
        self._srcIndex += size;
      }
    });
  };

})(this);