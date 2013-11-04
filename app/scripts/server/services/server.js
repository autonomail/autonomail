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

      $get: function($log, SimulatedServer) {
        var backend = null;

        switch (activeBackendType) {
          case BACKEND_TYPES.SIMULATION:
            backend = SimulatedServer;
            break;
          default:
            backend = null;
        };

        $log.info('Server back-end: ' + backend);

        return backend;
      }
    };

  });


}(angular.module('App.server', ['App.common'])));