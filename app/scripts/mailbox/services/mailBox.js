(function(app) {
  'use strict';

  /**
   * Clients should not create this directly, but should instead use the 'Mail' service.
   */
  app.factory('Mailbox', function(Log, Server, MailView, MailMessage) {

    return Class.extend({

      /**
       * Constructor.
       * @param userId {string} the user whose mailbox we wish to access.
       */
      init: function(userId) {
        var self = this;

        self.userId = userId;
        self.log = Log.create('Mail(' + userId + ')');

        self.currentFolder = 'inbox'; // initial folder is always inbox
      },



      /**
       * Get folders.
       *
       * @return {Promise} resolves to Array of folders.
       */
      getFolders: function() {
        return Server.getFolders(this.userId);
      },



      /**
       * Set currently active folder.
       *
       * @param folderId {string} folder id.
       */
      setFolder: function(folderId) {
        this.currentFolder = folderId;
      },




      /**
       * Get messages in current folder.
       *
       * @param from {string} retrieve messages from this index onwards (0 = newest message, 1 = second newest, etc).
       * @param [count] {Integer} no. of messages to retrieve. Default is 10.
       *
       * @return {Promise} resolves to Array of Message instances.
       */
      getMessages: function(from, count) {
        count = count || 10;
        return Server.getMsg(this.userId, this.currentFolder, from, count)
          .then(function buildMessageObjects(messages) {
            return _.map(messages, function(msg) {
              return new MailMessage(msg);
            });
          });
      },


      /**
       * Get total no. of messages in current folder.
       *
       * @return {Promise} resolves to integer.
       */
      getCount: function() {
        return Server.getMsgCount(this.userId, 'inbox');
      },


      /**
       * Close this mailbox.
       *
       * This will internally de-register all event handlers, etc.
       *
       * @return {Promise}
       */
      close: function() {
        var defer = $q.defer();
        defer.resolve();
        return defer.promise;
      },


      /**
       * Create a view of the contents of this mailbox.
       *
       * Only *one* view is active at any given time, meaning that any previously created view is automatically stopped.
       *
       * @param options {Object} configuration options.
       * @param options.perPage {Number} no. of messages to show per page.
       * @param options.page {Number} the page to show.
       * @param options.onMessages {Function} handler to call when the messages in view change, signature: (Array messages)
       *
       * @return {MailView}
       */
      createView: function(options) {
        var self = this;

        // destroy existing view
        if (self._mailView) {
          self._mailView.destroy();
        }

        return (self._mailView = new MailView(this, options));
      }
    });

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
