(function(app) {
  'use strict';

  /**
   * Clients should not create this directly, but should instead use the 'Mail' service.
   */
  app.factory('Mailbox', function($timeout, Log, Server, MailView, Message, GPG, AuthCredentials) {

    var Mailbox = Events.extend({

      /**
       * Constructor.
       * @param userId {string} the user whose mailbox we wish to access.
       */
      init: function(userId) {
        var self = this;

        self.userId = userId;
        self.log = Log.create('Mail(' + userId + ')');

        self.folder = 'inbox'; // initial folder is always inbox

        self._cache = {
          messages: {}
        };

        self._queue = {
          outbound: []
        };
        self._startQueueTimers();
      },


      /**
       * Start queue processing timers.
       */
      _startQueueTimers: function() {
        var self = this;

        $timeout(function() {
          if (0 < self._queue.outbound.length) {
            var msg = self._queue.outbound.shift();

            self.log.debug('Processing outbound msg: ' + msg.id);

            msg._send(self);
          }

          if (!self._shutdown) {
            self._startQueueTimers();
          }
        }, 100);
      },



      /**
       * Add given message to outbound message queue.
       *
       * This is the preferred way for adding outbound messages to be processed 
       * by the mailbox.
       * 
       * @param  {OutboundMessage} outboundMsg The outbound message.
       */
      enqueueOutbound: function(outboundMsg) {
        this._queue.outbound.push(outboundMsg);
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
       * Get messages in current folder.
       *
       * @param from {string} retrieve messages from this index onwards (0 = newest message, 1 = second newest, etc).
       * @param [count] {Integer} no. of messages to retrieve. Default is 10.
       * @param [options] {Object} additional options.
       * @param [options.expectedFirstId] {Number} expected id of first message in results.
       * @param [options.expectedLastId] {Number} expected id of last message in results.
       *
       * @return {Promise} resolves to [ Message, Message, ... ] or { noChange: true }
       */
      getMessages: function(from, count, options) {
        var self = this;
        
        count = count || 10;
        return Server.getMsg(self.userId, self.folder, from, count, options)
          .then(function buildMessageObjects(result) {
            if (result.noChange) {
              return result;
            } else {
              return _.map(result.messages, function(msg) {
                // re-use cached messages
                if (!self._cache.messages[msg.id]) {
                  self._cache.messages[msg.id] = new Message(self, msg);
                }
                return self._cache.messages[msg.id];
              });
            }
          });
      },



      /**
       * Send a message.
       * 
       * @param {Object} msg Message and options.
       * @param {Array} msg.to Recipient email addresses.
       * @param {Array} msg.cc CC recipient email addresses.
       * @param {Array} msg.bcc BCC recipient email addresses.
       * @param {String} msg.subject  Message subject.
       * @param {String} msg.body Message body.
       * @param {String} [msg.sig] PGP signature to attach.
       * 
       * @return {Promise}
       * @package
       */
      _sendMessage: function(msg) {
        var self = this;

        self.log.info('Sending message', msg);

        msg.from = this.userId;

        msg.flags = {
          outbound: true,
          read: true
        };

        return Server.send(self.userId, msg);
      },



      /**
       * Get total no. of messages in current folder.
       *
       * @return {Promise} resolves to integer.
       */
      getCount: function() {
        return Server.getMsgCount(this.userId, this.folder);
      },


      /**
       * Close this mailbox.
       *
       * This will internally de-register all event handlers, etc.
       *
       * @return {Promise}
       */
      close: function() {
        self._shutdown = true;
        this.emit('shutdown');

        return $q.when();
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


    /**
     * Mailbox current folder.
     */
    Mailbox.prop('folder', { 
      internal: '_folder',
      set: function(val) {
        this._folder = val;
        
        this.emit('setFolder', val);
      }
    });


    return Mailbox;
  });


}(angular.module('App.mailbox', ['App.common', 'App.data', 'App.crypto'])));
