'use strict';

(function(app) {

  app.provider('Storage', function() {

    var BACKEND_TYPES = {
      LOCAL_STORAGE: 1
    };

    var activeBackendType = null;

    return {
      BACKEND_TYPES: BACKEND_TYPES,

      setBackend: function(backendType) {
        activeBackendType = backendType;
      },

      $get: function($log, LocalStorage) {
        var backend = null;

        switch (activeBackendType) {
          case BACKEND_TYPES.LOCAL_STORAGE:
            backend = LocalStorage;
            break;
          default:
            backend = null;
        }

        $log.info('Client storage back-end: ' + backend);

        return backend;
      }
    };

  });


}(angular.module('App.data', [])));
