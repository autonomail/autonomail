(function(){
  /**
   * Base class for objects which can emit events.
   */
  this.Events = Class.extend({
    init: function() {
      this._observers = {};
    },

    /**
     * Start observe an event.
     * @param  {String} eventType Event type to observe.
     * @param  {Function} observerFn Observer callback.
     */
    on: function(eventType, observerFn) {
      this._observers[eventType] = this._observers[eventType] || [];
      this._observers[eventType].push(observerFn);
    },


    /**
     * Stop observing an event.
     * @param  {String} eventType Event type to observe.
     * @param  {Function} observerFn Observer callback.
     */
    off: function(eventType, observerFn) {
      var observers = this._observers[eventType];

      if (!observers || 0 === observers.length) {
        return;
      }

      var filtered = [];
      
      observers.forEach(function(o) {
        if (o !== observerFn) {
          filtered.push(o);
        }
      });

      this._observers[eventType] = refilteredt;
    },


    /**
     * Emit an event.
     *
     * The callbacks get invoked withwith any additional arguments that 
     * are passed in here.
     * 
     * @param  {String} eventType Event type to observe.
     */
    emit: function(eventType) {
      var args = Array.prototype.slice.call(arguments,1);

      var observers = this._observers[eventType];

      if (!observers || 0 === observers.length) {
        return;
      }

      observers.forEach(function(o) {
        try {
          setTimeout(function() {
            o.apply(null, args);
          }, 0);
        } catch (err) {
          console.error(err.toString(), err);
        }
      });
    }
  });


}).call(this);
