'use strict';

(function(app) {

  app.provider('WebWorker', function() {

    return {

      $get: function(Log, $q) {
        return Class.extend({
          /**
           * Run the given function in a web worker.
           * @param {String} name Name of this worker (for logging).
           * @param {Function} fn Asynchronous function to execute within worker. Should accept node.js-style callback as final parameter.
           */
          init: function(name, fn) {
            this.log = Log.create('WebWorker[' + name + ']');

            this.log.debug('Created');

            var fnRegex = fn.toString()
              .match(/function[\s]*\(([^\(]+)\)[\s]*\{([\s\S]*)\}$/i);

            this.fnComponents = {
              sig: fnRegex[1],
              body: fnRegex[2]
            };

            this.worker = cw({
              // NOTE: everything in this function runs within the WebWorker 
              // scope, so don't treat it as a closure.
              run: function(payload, done) {
                // scripts imports
                importScripts('/scripts/webworker-imports.generated.js');
                // reconstruct the passed-in function
                var fnComponents = payload.pop();
                var fn = new Function(fnComponents.sig, fnComponents.body);
                // construct a proper callback
                payload.push(function(err, result) {
                  if (err) {
                    done(['Error', err.toString()]);
                  } else {
                    done([result]);
                  }
                });
                // invoke
                fn.apply(this, payload);
              }
            });
          },


          /**
           * Execute worker with given data.
           *
           * Arguments to pass to worker should be given as parameters.
           *
           * @return {Promise}
           */
          run: function() {
            var args = _.toArray(arguments);
            args.push(this.fnComponents);

            var defer = $q.defer();

            this.log.debug('Running');

            this.worker.run(args)
              .then(function(result) {
                if ('Error' !== result[0]) {
                  defer.resolve(result[0]);
                } else {
                  defer.reject(result[1]);
                }
              }, defer.reject);

            return defer.promise;
          },

        });
      }

    };
  });

}(angular.module('App.common', [])));
