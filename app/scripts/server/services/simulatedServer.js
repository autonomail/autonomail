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
            var emailAddress = userId + '@autonomail.com';
            self._setupUserMailFolders(emailAddress);
            var messages = self._createInboxMessages(parseInt(Math.random() * 3));
            log.debug('Generated ' + messages.length + ' new inbox messages for: ' + emailAddress);
            self.db.mail[emailAddress].inbox.messages = self.db.mail[emailAddress].inbox.messages.concat(messages);
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
       * @param emailAddress {string} user id.
       * @private
       */
      _setupUserMailFolders : function(emailAddress) {
        var self = this;

        if (self.db.mail[emailAddress]) return;

        self.db.mail[emailAddress] = {
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


      _getUserIdFromEmailAddress: function(emailAddress) {
        return emailAddress.substr(0, emailAddress.indexOf('@'));
      },



      checkUsernameAvailable: function(username) {
        log.debug('Check username availability: ' + username);

        var self = this;

        var defer = $q.defer();

        if (self.db.users[username]) {
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

        if (self.db.users[user.name]) {
          defer.reject('User already exists');
        } else {
          self.db.users[user.name] = user;
          self._save();
          defer.resolve();
        }

        return defer.promise;
      },


      login: function(user) {
        log.debug('Login user', user);

        var self = this;

        var defer = $q.defer();

        if (self.db.users[user.name]) {
          var stored = self.db.users[user.name];

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



      getSecureData: function(emailAddress) {
        log.debug('Get secure data: ' + emailAddress);

        var self = this;

        var defer = $q.defer();

        defer.resolve(self.db.secureData[emailAddress] || null);

        return defer.promise;
      },



      setSecureData: function(emailAddress, data) {
        log.debug('Set secure data: ' + emailAddress, data);

        var self = this;

        var defer = $q.defer();

        self.db.secureData[emailAddress] = data;
        self._save();
        defer.resolve();

        return defer.promise;
      },


      getMsgCount: function(emailAddress, folder) {
        var self = this;

        log.debug('Get count of mail in [' + folder + '] for ' + emailAddress);

        var defer = $q.defer();

        if (self.db.mail[emailAddress]) {
          if (self.db.mail[emailAddress][folder]) {
            defer.resolve(self.db.mail[emailAddress][folder].messages.length);
          } else {
            defer.resolve(0);
          }
        } else {
          defer.resolve(0);
        }

        return defer.promise;
      },



      getMsg: function(emailAddress, folder, from, count) {
        var self = this;

        log.debug('Get mail in [' + folder + '] for ' + emailAddress);

        var defer = $q.defer();

        self._setupUserMailFolders(emailAddress);

        if (self.db.mail[emailAddress][folder]) {
          var mail = self.db.mail[emailAddress][folder].messages,
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



      getFolders: function(emailAddress) {
        var self = this;

        log.debug('Get folders for ' + emailAddress);

        var defer = $q.defer();

        self._setupUserMailFolders(emailAddress);

        var ret = [];

        for (var folder in self.db.mail[emailAddress]) {
          if (self.db.mail[emailAddress].hasOwnProperty(folder)) {
            ret.push({
              id: folder,
              name: self.db.mail[emailAddress][folder].name
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
