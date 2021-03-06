'use strict';

(function(app) {

  app.factory('LocalStorage', function($q, Log, RuntimeError, StorageLayerInterface) {
    
    var log = Log.create('LocalStorage');

    return new (StorageLayerInterface.extend({

      get: function(key) {
        var defer = $q.defer();

        var value = null;
        try {
          value = JSON.parse(window.localStorage.getItem(key));
          log.debug('localStorage[' + key + '] -> ', value);
          defer.resolve(value);
        } catch (err) {
          defer.reject(new RuntimeError('Could not get localStorage key: ' + key, err));
        }

        return defer.promise;
      },


      set: function(key, value) {
        var defer = $q.defer();

        try {
          log.debug('localStorage[' + key + '] <- ', value);
          window.localStorage.setItem(key, JSON.stringify(value));
          defer.resolve(value);
        } catch (err) {
          defer.reject(new RuntimeError('Could not set localStorage key: ' + key, err));
        }

        return defer.promise;
      },

      toString: function() {
        return 'browser localStorage';
      }
    }));

  });


}(angular.module('App.data', ['App.common'])));
