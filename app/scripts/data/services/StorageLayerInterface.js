/**
 * Storage layer base interface.
 *
 * This specifies the API for use by the Store to actually store and load data.
 */

(function(app) {

  app.factory('StorageLayerInterface', function($q, RuntimeError) {

    return Class.extend({
      /**
       * Get data for given key.
       * @param key {string} id.
       * @return {Promise} resolves to value.
       */
      get: function(key) {
        throw new Error('Not yet implemented');
      },

      /**
       * Set data for given key.
       * @param key {string} id.
       * @param value {*} data value.
       * @return {Promise} resolve to the set value.
       */
      set: function(key, value) {
        throw new Error('Not yet implemented');
      },


      toString: function() {
        throw new RuntimeError('Not yet implemented');
      }
    });

  });

}(angular.module('App.data', ['App.common'])));

