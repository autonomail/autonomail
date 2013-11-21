'use strict';

(function(app) {

  app.provider('Server', function() {

    var BACKEND_TYPES = {
      SIMULATION: 1
    };

    var activeBackendType = null;

    return {
      BACKEND_TYPES: BACKEND_TYPES,

      setBackend: function(backendType) {
        activeBackendType = backendType;
      },

      $get: function(Log, SimulatedServer) {
        var log = Log.create('Server');

        var backend = null;

        switch (activeBackendType) {
          case BACKEND_TYPES.SIMULATION:
            backend = SimulatedServer;
            break;
          default:
            backend = null;
        }

        log.info('Server back-end: ' + backend);

        return backend;
      }
    };

  });


}(angular.module('App.server', [])));
