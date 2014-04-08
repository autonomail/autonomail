'use strict';

(function(app) {

  /**
   * Service to present temporary pop-up alerts to the user.
   */
  app.factory('Alerts', function(Log) {
    var log = Log.create('Alerts');

    return new (Class.extend({

      /** 
       * Show an information alert.
       * @param  {String} msg The alert msg.
       */
      info: function(msg) {
        log.info(msg);
        alert(msg);
      },


      /** 
       * Show an error alert.
       * @param  {String} msg The alert msg.
       */
      error: function(msg) {
        log.error(msg);
        alert('error: ' + msg);
      }

    }));
  });


}(angular.module('App.common', [])));
