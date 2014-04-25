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
       * @param domain {string} the domain to check against.
       * @return {Promise} resolved if ok; rejected otherwise.
       */
      checkUsernameAvailable: function(username, domain) {
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
       * @param emailAddress {String} user id.
       * @return {Promise} resolves to Object; rejected otherwise.
       */
      getSecureData: function(emailAddress) {
        return this._notYetImplemented();
      },



      /**
       * Send secure data to server.
       * @param emailAddress {String} user id.
       * @param data {Object} secure data.
       * @return {Promise} resolves if ok; rejected otherwise.
       */
      setSecureData: function(emailAddress, data) {
        return this._notYetImplemented();
      },


      /**
       * Get no. of messages in given folder.
       * @param emailAddress {String} user id.
       * @param [folder] {string} Folder to check.
       * @return {Promise} resolves to integer.
       */
      getMsgCount: function(emailAddress, folder) {
        return this._notYetImplemented();
      },



      /**
       * Get messages in given folder.
       *
       * If `options.expectedFirstId` and `options.expectedLastId` are provided then the server will first check to
       * see if the results match with expectations. If so then it means then nothing has changed since the last fetch
       * and `{ noChange: true }` will be returned, thus saving on bandwidth. If there is a mismatch then it means
       * that there have been changes and `{ messages: array }` will be returned.
       *
       * @param emailAddress {String} user id.
       * @param [folder] {string} Folder to check.
       * @param from {string} retrieve messages from this index onwards (0 = newest message, 1 = second newest, etc).
       * @param [count] {Number} no. of messages to retrieve.
       * @param [options] {Object} additional options.
       * @param [options.expectedFirstId] {Number} expected id of first message in results.
       * @param [options.expectedLastId] {Number} expected id of last message in results.
       * @return {Promise} resolves to { messages: array } or { noChange: true }
       */
      getMsg: function(emailAddress, folder, from, count, options) {
        return this._notYetImplemented();
      },



      /**
       * Get folders.
       * @param emailAddress {String} user id.
       * @return {Promise} resolves to Array of {folder id: folder name}.
       */
      getFolders: function(emailAddress) {
        return this._notYetImplemented();
      },


      /**
       * Send a message.
       * 
       * @param {Object} msg Message and options.
       * @param {String} msg.from Sender.
       * @param {Array} msg.to Recipients.
       * @param {String} msg.body Message body.
       * @param {String} msg.subject  Message subject.
       * @param {Array} msg.cc  CC recipients.
       * @param {Array} msg.bcc  BCC recipients.
       * @param {String} msg.sig PGP signature.
       * 
       * @return {Promise}
       */
      send: function(msg) {
        return this._notYetImplemented();
      },



      toString: function() {
        throw new RuntimeError('Not yet implemented');
      }
    });

  });

}(angular.module('App.server', ['App.common'])));

