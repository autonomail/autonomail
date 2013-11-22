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
       * Return a rejected promise indicating a 'not yet implemented' error.
       * @return {Promise.promise|*}
       * @protected
       */
      _notYetImplemented: function() {
        return $q.reject(new RuntimeError('Not yet implemented'));
      },


      /**
       * Check if given username is available.
       * @param username {string} the username to check.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      checkUsernameAvailable: function(username) {
        return this._notYetImplemented();
      },

      /**
       * Register new user.
       * @param user {object} user details.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      register: function(user) {
        return this._notYetImplemented();
      },


      /**
       * Login given user.
       * @param user {object} user details.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      login: function(user) {
        return this._notYetImplemented();
      },


      /**
       * Get secure data from server.
       * @param userId {String} user id.
       * @return {Promise} resolves to Object; rejected otherwise.
       */
      getSecureData: function(userId) {
        return this._notYetImplemented();
      },



      /**
       * Send secure data to server.
       * @param userId {String} user id.
       * @param data {Object} secure data.
       * @return {Promise} resolves if ok; rejected otherwise.
       */
      setSecureData: function(userId, data) {
        return this._notYetImplemented();
      },


      /**
       * Get no. of messages in given folder.
       * @param userId {String} user id.
       * @param [folder] {string} Folder to check.
       * @return {Promise} resolves to integer.
       */
      getMsgCount: function(userId, folder) {
        return this._notYetImplemented();
      },



      /**
       * Get no. of messages in given folder.
       * @param userId {String} user id.
       * @param [folder] {string} Folder to check.
       * @param from {string} retrieve messages older than this timestamp.
       * @param [count] {Integer} no. of messages to retrieve. Default is 10.
       * @return {Promise} resolves to Array of messages.
       */
      getMsg: function(userId, folder, from, count) {
        return this._notYetImplemented();
      },




      toString: function() {
        throw new RuntimeError('Not yet implemented');
      }
    });

  });

}(angular.module('App.server', ['App.common'])));

