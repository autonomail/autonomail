'use strict';

(function(app) {

  app.provider('WebWorker', function() {

    var importScripts = [];

    return {

      /**
       * Add the following script as one to import into all created Webworkers.
       * @param scriptUrl {string} URL to script.
       */
      addImportScript: function(scriptUrl) {
        importScripts[scriptUrl] = true;
      },


      $get: function($log, RuntimeError) {
        return new (Class.extend({
          /**
           * Run the given function in a worker thread.
           * @param fn {Function} function to run.
           * @return {Promise} will resolve to the function output.
           */
          run: function(fn, data) {
            $log.debug('Running 1 new web worker for data:', data);
            return this._createNewWorker(data).spawn(fn);
          },


          _createNewWorker: function(data) {
            var p = new Parallel(data, {
              maxWorkers: 1,
              evalPath: 'scripts/webworker.generated.js'   // stop Parallel.js panicking
            });

            for (var scriptUrl in importScripts) {
              p.require(scriptUrl);
            }

            return p;
          }

        }));
      }

    };
  });

}(angular.module('App.common', [])));
