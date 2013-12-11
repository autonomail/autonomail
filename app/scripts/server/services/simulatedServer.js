'use strict';

(function(app) {

  app.factory('SimulatedServer', function(Log, $q, $timeout, RuntimeError, ServerInterface) {

    var log = Log.create('SimulatedServer');

    /**
     * See the ServerInterface class specification for documentation regarding the functions here.
     */
    return new (ServerInterface.extend({
      init: function() {
        this._load();
        this._startInboxMsgGenerator();
      },


      /**
       * Start timer to generate incoming messages and add them to user's inboxes.
       * @private
       */
      _startInboxMsgGenerator: function() {
        var self = this;

        self.stopTimers = false;

        $timeout(function() {
          for (var userId in self.db.users) {
            self._setupUserMailFolders(userId);
            var messages = self._createInboxMessages(parseInt(Math.random() * 3));
            log.debug('Generated ' + messages.length + ' new inbox messages for: ' + userId);
            self.db.mail[userId].inbox.messages = messages.concat(self.db.mail[userId].inbox.messages);
          }

          if (!self.stopTimers) {
            self._startInboxMsgGenerator();
          }
        }, 30000);
      },


      /**
       * Create inbox messages.
       *
       * @param num {Number} no. of messages to create. Default is 1.
       *
       * @return {Array}
       *
       * @private
       */
      _createInboxMessages: function(num) {
        num = num || 1;

        var ret = [];

        for (var i=0; i<num; ++i) {
          ret.push(
            {
              id: (Math.random() * 1000000).toString(),
              date: moment().toISOString(),
              from: _.str.gen(1, 998).pop() + ' <' + _.str.gen(1, 998).pop() + '@test.com>',
              to: 'john@test.com',
              /*
               From http://www.faqs.org/rfcs/rfc2822.html (section 2.1.1)
               - absolute max 998 characters (excluding CRLF) per line
               - preferred max of 78 characters (excluding CRLF) per line
               */
              subject: _.str.gen(5, 998).join("\r\n"),
              body: _.str.gen(40, 998).join("\r\n")
            }
          );
        }

        return ret;
      },


      /**
       * Load db data from local storage.
       * @private
       */
      _load: function() {
        this.db = JSON.parse(window.localStorage.getItem('simulatedServerDb') || '{}');
        if (!this.db) {
          this.db = {};
        }
        this.db.users = this.db.users || {};
        this.db.secureData = this.db.secureData || {};
        this.db.mail = this.db.mail || {};
      },


      /**
       * Save the db data to localStorage.
       * @private
       */
      _save: function() {
        window.localStorage.setItem('simulatedServerDb', JSON.stringify(this.db));
      },


      /**
       * Setup default mail folders for given user.
       * @param userId {string} user id.
       * @private
       */
      _setupUserMailFolders : function(userId) {
        var self = this;

        if (self.db.mail[userId]) return;

        self.db.mail[userId] = {
          'inbox': {
            name: 'Inbox',
            messages: self._createInboxMessages(2)
          },
          'sent': {
            name: 'Sent',
            messages: []
          },
          'drafts': {
            name: 'Drafts',
            messages: []
          },
          'trash': {
            name: 'Trash',
            messages: []
          }
        };
      },



      checkUsernameAvailable: function(username, domain) {
        var userId = username + '@' + domain;
        log.debug('Check username availability: ' + userId);

        var self = this;

        var defer = $q.defer();

        if (self.db.users[userId]) {
          defer.reject(new RuntimeError('User already exists'));
        } else {
          defer.resolve();
        }

        return defer.promise;
      },


      register: function(user) {
        log.debug('Register user', user);

        var self = this;

        var defer = $q.defer();

        var userId = user.name + '@' + user.domain;
        if (self.db.users[userId]) {
          defer.reject('User already exists');
        } else {
          self.db.users[userId] = user;
          self._save();
          defer.resolve();
        }

        return defer.promise;
      },


      login: function(user) {
        log.debug('Login user', user);

        var self = this;

        var defer = $q.defer();

        var userId = user.name + '@' + user.domain;
        if (self.db.users[userId]) {
          var stored = self.db.users[userId];

          if (stored.password === user.password) {
            defer.resolve();
          } else {
            defer.reject(new RuntimeError('Incorrect password'));
          }
        } else {
          defer.reject(new RuntimeError('Username not found'));
        }

        return defer.promise;
      },



      getSecureData: function(userId) {
        log.debug('Get secure data: ' + userId);

        var self = this;

        var defer = $q.defer();

        defer.resolve(self.db.secureData[userId] || null);

        return defer.promise;
      },



      setSecureData: function(userId, data) {
        log.debug('Set secure data: ' + userId, data);

        var self = this;

        var defer = $q.defer();

        self.db.secureData[userId] = data;
        self._save();
        defer.resolve();

        return defer.promise;
      },


      getMsgCount: function(userId, folder) {
        var self = this;

        log.debug('Get count of mail in [' + folder + '] for ' + userId);

        var defer = $q.defer();

        if (self.db.mail[userId]) {
          if (self.db.mail[userId][folder]) {
            defer.resolve(self.db.mail[userId][folder].messages.length);
          } else {
            defer.resolve(0);
          }
        } else {
          defer.resolve(0);
        }

        return defer.promise;
      },



      getMsg: function(userId, folder, from, count) {
        var self = this;

        log.debug('Get mail in [' + folder + '] for ' + userId);

        var defer = $q.defer();

        self._setupUserMailFolders(userId);

        if (self.db.mail[userId][folder]) {
          var mail = self.db.mail[userId][folder].messages,
            ret = [];

          for (var i=from; ret.length < count && i<mail.length; ++i) {
            ret.push(mail[i]);
          }

          defer.resolve(ret);
        } else {
          defer.resolve([]);
        }

        return defer.promise;
      },



      getFolders: function(userId) {
        var self = this;

        log.debug('Get folders for ' + userId);

        var defer = $q.defer();

        self._setupUserMailFolders(userId);

        var ret = [];

        for (var folder in self.db.mail[userId]) {
          if (self.db.mail[userId].hasOwnProperty(folder)) {
            ret.push({
              id: folder,
              name: self.db.mail[userId][folder].name
            });
          }
        }

        defer.resolve(ret);

        return defer.promise;
      },



      toString: function() {
        return 'Simulated server';
      }
    }));

  });


}(angular.module('App.server', ['App.common'])));
