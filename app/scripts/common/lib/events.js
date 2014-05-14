(function(){
  /**
   * Base class for objects which can emit events.
   *
   * Events can be recorded for replay to future observers.
   */
  this.Events = Class.extend({
    init: function() {
      this._observers = {};
      this._recordedEvents = [];
    },

    /**
     * Start observing one or more events.
     * @param  {String} eventType Event type to observe.
     * @param {String} [...] Additional event types to observe.
     * @param  {Function} observerFn Observer callback.
     */
    on: function(eventType, observerFn) {
      var self = this;

      var eventTypes;

      if (2 < arguments.length) {
        eventTypes = Array.prototype.slice.call(arguments, 0, 
            arguments.length - 1);
        observerFn = arguments[arguments.length - 1];
      } else {
        eventTypes = [eventType];
      }

      eventTypes.forEach(function(et) {
        self._observers[et] = self._observers[et] || [];
        self._observers[et].push(observerFn);
      });

      // replay recorded events
      this._recordedEvents.forEach(function(evt) {
        for (var j=0; eventTypes.length>j; ++j) {
          if (eventTypes[j] === evt.type) {
            setImmediate(function() {
              observerFn.call(null, evt.type, evt.arg);
            });
          }
        }
      });        
    },


    /**
     * Stop observing one or more events.
     * @param  {String} eventType Event type to observe.
     * @param {String} [...] Additional event types to observe.
     * @param  {Function} observerFn Observer callback.
     */
    off: function(eventType, observerFn) {
      var self = this;

      var eventTypes;

      if (2 < arguments.length) {
        eventTypes = Array.prototype.slice.call(arguments, 0, 
            arguments.length - 1);
        observerFn = arguments[arguments.length - 1];
      } else {
        eventTypes = [eventType];
      }

      eventTypes.forEach(function(et) {
        var observers = self._observers[et];

        if (!observers || 0 === observers.length) {
          return;
        }

        var filtered = [];
        
        observers.forEach(function(o) {
          if (o !== observerFn) {
            filtered.push(o);
          }
        });

        self._observers[et] = refilteredt;
      });
    },


    /**
     * Emit an event.
     *
     * The callbacks get invoked withwith any additional arguments that 
     * are passed in here.
     * 
     * @param  {String} eventType Event type to observe.
     * @param  {*} arg Additional argument to pass onto observers.
     * @param {Object} [options] Additional options.
     * @param {Boolean} [options.record] Whether to record this event for replay to future observers.
     */
    emit: function(eventType, arg, options) {
      options = options || {};

      if (options.record) {
        this._recordedEvents.push({
          type: eventType,
          arg: arg
        });
      }

      var observers = this._observers[eventType];

      if (!observers || 0 === observers.length) {
        return;
      }

      observers.forEach(function(o) {
        setImmediate(function() {
          o.call(null, eventType, arg);
        });
      });
    },


  });





}).call(this);
