/**
 * underscore mixins.
 */

(function(underscore) {

  /**
   * Get a deeply nested object property.
   *
   * @param obj the object
   * @param path the path
   * @param fallbackValue value to return if not found.
   *
   * @return {*} defaultValue if not found
   */
  underscore.get = function(obj, path, fallbackValue) {
    var self = this;  // underscore

    if (self.isUndefined(obj) || null === obj) return fallbackValue;

    var fields = path.split('.'),
        result = obj;

    for (var i=0; i<fields.length; ++i) {
      if (!self.isObject(result) && !self.isArray(result)) return fallbackValue;

      result = result[fields[i]];
    }

    return (self.isUndefined(result) ? fallbackValue : result);
  };



  /**
   * Set a deeply nested object property.
   *
   * This will create intermediate keys as necessary to ensure that the whole 
   * property path is valid at the end.
   *
   * @param obj the object
   * @param path the path
   * @param value value to set.
   * @param {Boolean} [onlySetIfUndefined] If true then the property will only 
   * be set if it is currently undefined. Default is false, i.e. any existing 
   * value for the property will be overridden.
   *
   * @return {*} the updated object.
   */
  underscore.set = function(obj, path, value, onlySetIfUndefined) {
    var self = this;  // underscore

    if (self.isUndefined(obj) || null === obj ||
        self.isUndefined(path) || null === path || '' == path) return obj;

    var remainingFields = path.split('.'),
        lastFieldIndex = remainingFields.length - 1,
        currentObj = obj;

    for (var i=0; i<lastFieldIndex; ++i) {
      var currentField = remainingFields[i];

      if (self.isUndefined(currentObj[currentField])) {
        currentObj[currentField] = {};
      }

      currentObj = currentObj[currentField];
    }

    var finalFieldName = remainingFields[lastFieldIndex];

    if (!onlySetIfUndefined || self.isUndefined(currentObj[finalFieldName])) {
      currentObj[finalFieldName] = value;
    }

    return obj;
  };

}(_));

