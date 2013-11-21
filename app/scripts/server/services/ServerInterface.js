/**
 * Server base interface.
 *
 * This specifies the API for use by client code to communicate with the server. All concrete child classes must
 * fully implement this interface.
 */

(function(app) {

  app.factory('ServerInterface', function($q, RuntimeError) {

    return Class.extend({
      /**
       * Check if given username is available.
       * @param username {string} the username to check.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      checkUsernameAvailable: function(username) {
        var defer = $q.defer();
        defer.reject(new RuntimeError('Not yet implemented'));
        return defer.promise;
      },

      /**
       * Register new user.
       * @param user {object} user details.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      register: function(user) {
        var defer = $q.defer();
        defer.reject(new RuntimeError('Not yet implemented'));
        return defer.promise;
      },


      /**
       * Login given user.
       * @param user {object} user details.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      login: function(user) {
        var defer = $q.defer();
        defer.reject(new RuntimeError('Not yet implemented'));
        return defer.promise;
      },


      /**
       * Get secure data from server.
       * @param userId {String} user id.
       * @return {Promise} resolves to Object; rejected otherwise.
       */
      getSecureData: function(userId) {
        var defer = $q.defer();
        defer.reject(new RuntimeError('Not yet implemented'));
        return defer.promise;
      },



      /**
       * Send secure data to server.
       * @param userId {String} user id.
       * @param data {Object} secure data.
       * @return {Promise} resolves if ok; rejected otherwise.
       */
      setSecureData: function(userId, data) {
        var defer = $q.defer();
        defer.reject(new RuntimeError('Not yet implemented'));
        return defer.promise;
      },



      toString: function() {
        throw new RuntimeError('Not yet implemented');
      }
    });

  });

}(angular.module('App.server', ['App.common'])));

