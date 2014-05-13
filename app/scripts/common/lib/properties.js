/*
  From http://www.hiddentao.com/archives/2013/07/08/generate-overridable-getters-and-setters-in-javascript/
 */
Function.prototype.prop = function(name, options) {
  var definePropOptions, getterName, internalName, setterName;
  options = options || {};
  internalName = options.internal || "__" + name;
  options.get = ("undefined" === typeof options.get ? true : options.get);
  options.set = ("undefined" === typeof options.set ? false : options.set);
  if (options.defaultValue) {
    this.prototype[internalName] = options.defaultValue;
  }
  definePropOptions = {};
  getterName = "__get" + internalName;
  setterName = "__set" + internalName;
  if (true === options.get) {
    this.prototype[getterName] = function() {
      return this[internalName];
    };
  } else if (options.get) {
    this.prototype[getterName] = options.get;
  } else {
    this.prototype[getterName] = function() {
      throw new Error("Cannot get: " + name);
    };
  }
  definePropOptions.get = function() {
    return this[getterName].call(this);
  };
  if (true === options.set) {
    this.prototype[setterName] = function(val) {
      return this[internalName] = val;
    };
  } else if (options.set) {
    this.prototype[setterName] = options.set;
  } else {
    this.prototype[setterName] = function() {
      throw new Error("Cannot set: " + name);
    };
  }
  definePropOptions.set = function(val) {
    return this[setterName].call(this, val);
  };
  return Object.defineProperty(this.prototype, name, definePropOptions);
};
