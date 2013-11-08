'use strict';

(function(app) {

  app.provider('GPG', function() {

    var workerScriptUrl = null;

    return {
      setWorkerScript: function(scriptUrl) {
        workerScriptUrl = scriptUrl;
      },

      $get: function($log, $q, RuntimeError) {

        return new (Class.extend({

          init: function() {
            var self = this;

            self.worker = new Worker(workerScriptUrl);
          }

        }));

      }
    };
  });


}(angular.module('App.crypto', ['App.common'])));
