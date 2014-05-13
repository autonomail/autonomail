'use strict';

(function(app) {

  /**
   * Service to present temporary pop-up alerts to the user.
   */
  app.factory('Alert', function(Log) {
    var log = Log.create('Alert');

    return new (Class.extend({

      /** 
       * Show an information alert.
       * @param  {String} msg The alert msg.
       * @param  {Array} [...args] Additional args to pass to logger.
       */
      info: function(msg) {
        log.info(msg, Array.prototype.slice(arguments, 1));

        
        alert(msg);
      },


      /** 
       * Show an error alert.
       * @param {String} msg The alert msg.
       * @param  {Array} [...args] Additional args to pass to logger.
       */
      error: function(msg) {
        log.error(msg, Array.prototype.slice(arguments, 1));

        alert('error: ' + msg);
      }

    }));
  });

}(angular.module('App.common', [])));
