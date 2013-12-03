'use strict';

(function(app) {

  app.factory('SimulatedServer', function(Log, $q, RuntimeError, ServerInterface) {

    var log = Log.create('SimulatedServer');

    /**
     * See the ServerInterface class specification for documentation regarding the functions here.
     */
    return new (ServerInterface.extend({
      init: function() {
        this._load();
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
            messagles: []
          },
          'sent': {
            name: 'Sent',
            messagles: []
          },
          'drafts': {
            name: 'Drafts',
            messagles: []
          },
          'trash': {
            name: 'Trash',
            messagles: []
          }
        };
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

          for (var i=0; ret.length < count && i<mail.length; ++i) {
            if (mail[i].ts && mail[i].ts < from) {
              ret.push(mail[i]);
            }
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
