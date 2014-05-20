'use strict';

(function(app) {

  app.factory('SimulatedServer', function(Log, $q, $timeout, RuntimeError, 
      ServerInterface, GPG, AuthCredentials) {

    var log = Log.create('SimulatedServer');

    /**
     * See the ServerInterface class specification for documentation regarding the functions here.
     */
    return new (ServerInterface.extend({
      init: function() {
        var self = this;

        self._load();
      },


      /**
       * Generate a message id.
       * @return {String}
       */
      _generateId: function() {
        return _.str.id();
      },



      /**
       * Generate a dummy email address.
       * @return {String}
       */
      _generateDummyEmailAddress: function() {
        var components = _.str.gen(2, 10);

        return components[0] + '@' + components[1] + '.com';
      },



      /**
       * Generate a dummy name and email address.
       * @return {String}
       */
      _generateDummyNameEmailAddress: function() {
        return {
          name: _.str.gen(1, 998).pop(),
          email: this._generateDummyEmailAddress(),
          toString: function() {
            return this.name + ' <' + this.email + '>';
          }
        };
      },



      /**
       * Start timer to generate incoming messages and add them to user's folder.
       * @private
       */
      _startMsgGenerator: function(userId, folder) {
        var self = this;

        // if already doing a timer for this user + folder then nothing to do
        if (_.get(self, '_msgGenerationTimer.' + userId + '.' + folder)) {
          return;
        }
        _.set(self, '_msgGenerationTimer.' + userId + '.' + folder, true);

        // start the timer
        var ___gen = function() {
          log.info('Generating messages in [' + folder + '] for ' + userId);

          self._setupUserMailFolders(userId);

          var numMessages = self.db.mail[userId][folder].messages.length;

          if (10 < numMessages) {
            return;
          }

          self._createInboundMessages(userId, folder)
            .then(function generatedOk() {
              if (self._stopAllTimers) return;

              $timeout(function() {
                ___gen();
              }, 200000);
            })
            .catch(function(err) {
              log.error('Error generating messages in [' 
                  + folder + '] for ' + userId, err);
            });          
        }
        ___gen();
      },



      /**
       * Create inbound messages.
       *
       * This will create 4 messages:
       *   - one which is encrypted
       *   - one which is known signed (user has public key)
       *   - one which is unknown signed (user does not have public key)
       *   - one which is not signed
       *   
       * @param {String} userId user to generate for.
       *
       * @return {Promise} resolves to Array
       *
       * @private
       */
      _createInboundMessages: function(userId, folder) {
        var self = this;

        log.debug('Generating dummy messages for ' + userId);

        var ret = [];

        var _createMsg = function(subjectPrefix) {
          var m = {
            id: self._generateId(),
            date: moment().toISOString(),
            to: [userId],
            cc: [self._generateDummyEmailAddress()],
            bcc: [self._generateDummyNameEmailAddress().toString()],
            subject: subjectPrefix/* + _.str.gen(5, 998).join("\r\n")*/,
            body: _.str.gen(400/*0*/, 998).join("\r\n"),
            flags: {
              read: false,
              outbound: false
            }
          };
          return m;
        }

        var _finalizeMsg = function(msg) {
         self.db.mail[userId][folder].messages.push(msg);
         return $q.when();
        }

        var from = null;
        var passphrase = AuthCredentials.get(userId).passphrase;

        return self._createDummyGPGIdentity()
          .then(function gotIdentity(_identity) {
            from = _identity;

            function _createEncrypted() {
              var msg = _createMsg('ENCRYPTED');

              msg.from = from.toString();

              return GPG.encrypt(from.email, 'test', msg.body, userId)
                .then(function(res) {
                  msg.body = res;

                  return _finalizeMsg(msg);
                });
            }

            function _createKnownSigned() {
              var msg = _createMsg('K-SIGNED');

              msg.from = from.toString();

              return GPG.sign(from.email, 'test', msg.body)
                .then(function(sig) {
                  msg.sig = sig;

                  return _finalizeMsg(msg);
                });
            }


            function _createUnknownSigned() {
              var msg = _createMsg('U-SIGNED');
              msg.from = self._generateDummyNameEmailAddress().toString();
              msg.sig = 'dummy';

              return _finalizeMsg(msg);
            }

            function _createPlain() {
              var msg = _createMsg('PLAIN');
              msg.from = self._generateDummyNameEmailAddress().toString();

              return _finalizeMsg(msg);
            }

            return $q.all([
              _createEncrypted(),
              _createKnownSigned(),
              _createUnknownSigned(),
              _createPlain()
            ]);
          });
      },



      /**
       * Setup dummy GPG identities so that we can create dummy email messages.
       *
       * @param {Integer} total No. of identities to create.
       * 
       * @return {Promise}
       */
      _createDummyGPGIdentity: function(total) {
        var self = this;

        var identity = self._generateDummyNameEmailAddress();

        log.info('Setting up GPG identity: ' + identity.email);

        return GPG.generateKeyPair(identity.email, 'test', 1024)
          .then(function keySetup() {
            return identity;
          });
      },



      /**
       * Load db data from local storage.
       * @private
       */
      _load: function() {
        log.info('Loading data from localStorage');

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
            messages: []
          },
          'outbox': {
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
        log.info('Check username availability: ' + userId);

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
        log.info('Register user', user);

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
        log.info('Login user', user);

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
        log.info('Get secure data: ' + userId);

        var self = this;

        var defer = $q.defer();

        defer.resolve(self.db.secureData[userId] || null);

        return defer.promise;
      },



      setSecureData: function(userId, data) {
        log.info('Set secure data: ' + userId, data);

        var self = this;

        var defer = $q.defer();

        self.db.secureData[userId] = data;
        self._save();
        defer.resolve();

        return defer.promise;
      },


      getMessageCount: function(userId, folder) {
        var self = this;

        log.info('Get count of mail in [' + folder + '] for ' + userId);

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



      getMessages: function(userId, folder, from, count, options) {
        var self = this;

        if (!folder) return $q.when([]);

        log.info('Get messages in [' + folder + '] for ' + userId);

        // first time we request messages in inbox kick off the timer
        if ('inbox' === folder) {
          self._startMsgGenerator(userId, folder);
        }

        options = _.extend({
          expectedFirstId: null,
          expectedLastId: null
        }, options);

        var defer = $q.defer();

        self._setupUserMailFolders(userId);

        if (self.db.mail[userId][folder]) {
          var mail = self.db.mail[userId][folder].messages,
            ret = [];

          for (var i=from; ret.length < count && i<mail.length; ++i) {
            var msg = _.extend({}, mail[i], {
              body: new ReadableStringStream(mail[i].body)
            });

            ret.push(msg);
          }

          if (0 < ret.length) {
            if (ret[0].id === options.expectedFirstId && ret[ret.length-1].id === options.expectedLastId) {
              defer.resolve({
                noChange: true
              });
              ret = null;
            }
          }

          if (ret) {
            defer.resolve({
              messages: ret
            });
          }

        } else {
          defer.resolve([]);
        }

        return defer.promise;
      },



      getMessage: function(userId, msgId) {
        var self = this;

        log.info('Get message [' + msgId + '] for ' + userId);

        var defer = $q.defer();

        self._setupUserMailFolders(userId);

        var found = (function() {
          _.each(self.db.mail[userId], function(folder) {
            _.each(folder.messages, function(m) {
              if (m.id === msgId) {
                return m;
              }
            })
          });
        })();

        if (found) {
          defer.resolve(found);
        } else {
          defer.reject('Message not found: ' + msgId);
        }

        return defer.promise;
      },



      getFolders: function(userId) {
        var self = this;

        log.info('Get folders for ' + userId);

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


      send: function(userId, msg) {
        var self = this;

        log.info('Send msg to ' + msg.to);

        var defer = $q.defer();

        self._setupUserMailFolders(userId);

        self.db.mail[userId]['sent'].messages.push({
          id: self._generateId(),
          date: moment().toISOString(),
          from: msg.from,
          to: msg.to,
          subject: msg.subject,
          body: msg.body,
          sig: msg.sig
        });

        defer.resolve();

        return defer.promise;
      },


      toString: function() {
        return 'Simulated server';
      }
    }));

  });


}(angular.module('App.server', ['App.common'])));
