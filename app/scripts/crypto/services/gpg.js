/**
 * GPG service
 *
 * This internally delegates calls to the GnuPG2 worker thread. 
 * 
 * Incorporates code from:
 *    https://github.com/manuels/unix-toolbox.js-base/blob/master/interface.js
 *    https://github.com/manuels/unix-toolbox.js-gnupg/blob/master/demo.js
 */
'use strict';

(function(app) {

  app.factory('GPGError', function(RuntimeError) {
    return RuntimeError.define('GPGError');
  });


  app.provider('GPG', function() {

    var workerScriptUrl = null;

    return {
      setWorkerScript: function(scriptUrl) {
        workerScriptUrl = scriptUrl;
      },


      $get: function(Log, $q, GPGError, GPGWorker, GPGUtils, Random) {
        var log = Log.create('GPG');
        
        return new (Class.extend({

          init: function() {
            var self = this;

            // the virtual fs to setup the worker with
            self.virtualFs = {
              // make sure better hash algo's are prioritized (see https://we.riseup.net/riseuplabs+paow/openpgp-best-practices)
              '/home/emscripten/.gnupg/gpg.conf':  [
                'keyid-format 0xlong',
                'personal-digest-preferences SHA512 SHA384 SHA256 SHA224',
                'verify-options show-uid-validity',
                'list-options show-uid-validity',
                'default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB ZIP Uncompressed',
                'sig-notation issuer-fpr@notations.openpgp.fifthhorseman.net=%g',
                'cert-digest-algo SHA512'
              ].join("\n"),
              // we need to create these files to ensure our getFiles() always succeed
              '/home/emscripten/.gnupg/pubring.gpg': '',
              '/home/emscripten/.gnupg/secring.gpg': '',
              '/home/emscripten/.gnupg/random_seed': ''
            };

            // pending requests (see `_lock` and `_unlock` methods)
            self.pendingRequests = [];

            self._createWorker = _.bind(self._createWorker, self);
            self._lock = _.bind(self._lock, self);
            self._unlock = _.bind(self._unlock, self);
          },


          /**
           * Fill the EGD pool with entropy.
           *
           * This will ensure that `/dev/egd-pool` in the virtual filesystem contains enough random data. 
           * This should be called prior to worker creation.
           *
           * @return {Promise}
           */
          _ensureEntropy: function() {
            var self = this;

            var defer = $q.defer();

            if (self.alreadySetup) {
              defer.resolve();
            } else {
              Random.getRandomBytes(4096)
                .then(function fillEGDPool(words) {
                  var utf8str = sjcl.codec.utf8String.fromBitsRaw(words);
                  log.debug('Adding ' + utf8str.length + ' bytes to EGD pool...');
                  self.virtualFs['/dev/egd-pool'] = utf8str;

                  self.alreadySetup = true;
                  return true;
                })
                .then(defer.resolve)
                .catch(defer.reject)
              ;
            }

            return defer.promise;
          },




          /**
           * Create a GPG worker.
           *
           * This will instantiate a new `GPGWorker` and load in the current virtual filesystem contents.
           *
           * @return {Promise} resolves to `GPGWorker` instance.
           */
          _createWorker: function() {
            var self = this;

            var worker = null;

            return self._ensureEntropy()            
              .then(function createWorker() {
                worker = new GPGWorker(workerScriptUrl, log);
              })
              .then(function setupFS() {
                worker.mkdir('/home');
                worker.mkdir('/home/emscripten');
                worker.mkdir('/home/emscripten/.gnupg');
                return worker.waitUntilReady();
              })
              .then(function loadVirtualFileSystem() {
                for (var f in self.virtualFs) {
                  worker.addData(self.virtualFs[f], f);
                }
                return worker.waitUntilReady();
              })
              .then(function done() {
                return worker;
              })
            ;
          },





          /**
           * Destroy a GPG worker.
           *
           * This will save the worker's virtual filesystem.
           *
           * @return {Promise}
           */
          _destroyWorker: function(worker) {
            var self = this;

            return worker.getFiles(
              '/home/emscripten/.gnupg/pubring.gpg',
              '/home/emscripten/.gnupg/secring.gpg',
              '/home/emscripten/.gnupg/trustdb.gpg',
              '/home/emscripten/.gnupg/random_seed'
            )
              .then(function saveFileData(fileData) {
                self.virtualFs = fileData;
              })
            ;
          },



          /**
           * Request the internal queue lock.
           *
           * This is used by 
           * 
           * @return {Promise}
           */
          _lock: function() {
            var self = this;

            var defer = $q.defer();

            self.pendingRequests.push(defer);

            // am I the only pending request?
            if (1 === self.pendingRequests.length) {
              defer.resolve();
            }

            return defer.promise;
          },


          /**
           * Release the internal queue lock.
           *
           * The lock will now be given to the next request in the internal request queue.
           *
           * This method will take whatever arguments are passed to it and pass them to the resolved promise - this 
           * is just for convenience sake, allowing us to chain this method call with other promises.
           *
           * @return {Promise} resolves to whatever arguments were passed to this function.
           */
          _unlock: function() {
            var self = this;

            var defer = $q.defer();

            // pop the front of the queue and resolve the next one in line
            self.pendingRequests.shift();
            if (0 < self.pendingRequests.length) {
              self.pendingRequests[0].resolve();
            }

            defer.resolve.apply(defer, arguments);

            return defer.promise;
          },




          /**
           * Execute a GPG command.
           *
           * This automatically loads the virtual filesystem prior to executing the command, and then saves it afterwards. It also 
           * make sure that only one GPG command execute at a time (even if multiple calls are made to this function in parallel).
           * 
           * @param  {Object} [inputFiles] List of files to setup in the virtual filesystem prior to making the call. 
           * These are specified as {path: Promise} where the `Promise` evaluates to the file contents.
           * 
           * @param  {Array} [gpgCommand] Parameters to pass to the GPG command-line. The parameters are parsed to check for the 
           * `--output` parameter. If found then the named output file is automatically fetched and returned in the results once 
           * the command has successfully executed.
           * 
           * @return {Promise} Resolves to an `Object` consisting of the `stdout` and output file (if any) specified in the input 
           * parameters.
           */
          _execute: function(inputFiles, gpgCommand) {
            var self = this;

            inputFiles = inputFiles || {};
            gpgCommand = gpgCommand || [];

            var defer = $q.defer();

            var outputFilePath;
            var worker = null;
            var results = {
              stdout: []
            };

            self._lock()
              .then(function checkForOutputFileParam() {
                var outputParamIndex = gpgCommand.indexOf('--output');
                if (0 <= outputParamIndex) {
                  outputFilePath = (outputParamIndex < args.length - 1) ? args[outputParamIndex+1] : 'the output file';
                }
              })
              .then(function getInputFiles() {
                return $q.all(inputFiles);
              })
              .then(function writeInputFiles(_resolvedInputFiles) {
                _.each(_resolvedInputFiles || {}, function(contents, path) {
                  self.virtualFs[path] = contents;
                })
              })
              .then(self._createWorker)
              .then(function executeCommand(newWorker) {
                worker = newWorker;

                if (0 < gpgCommand.length) {
                  return worker.run.apply(worker, gpgCommand)
                    .then(function saveStdout(stdout) {
                      if (stdout) {
                        results.stdout = stdout;                                              
                      }
                    });
                }
              })
              .then(function fetchOutputFile(){
                if (outputFilePath) {
                  return self._fsGetFiles(outputFilePath)
                    .then(function(contents) {
                      results[outputFilePath] = contents;
                    });
                }
              })
              .then(function killWorker() {
                return self._destroyWorker(worker);
              })
              .then(function returnResults(){
                self._unlock();                
                defer.resolve(results);
              })
              .catch(function(err) {
                self._unlock();                
                defer.reject(err);
              })
            ;

            return defer.promise;
          },




          /**
           * Generate a new key-pair
           * 
           * @param emailAddress {string} user id.
           * @param password {string} user password.
           * @param keyStrength {Integer} key strength in bit size (only 2048 or 4096 are accepted).
           *
           * References: 
           *  - https://alexcabal.com/creating-the-perfect-gpg-keypair/
           */
          generateKeyPair: function(emailAddress, password, keyStrength) {
            var self = this;

            log.debug('Generating ' + keyStrength + '-bit keypair for: '  + emailAddress);

            var startTime = moment();

            var inputFiles = {
              '/input.txt': $q.when(function() {
                if (2048 !== keyStrength && 4096 !== keyStrength) {
                  throw new GPGError('GPG key bit size must be either 2048 or 4096');
                }

                return [
                  'Key-Type: RSA',
                  'Key-Length: ' + keyStrength,
                  'Subkey-Type: RSA',
                  'Subkey-Length: ' + keyStrength,
                  'Name-Email: ' + emailAddress,
                  'Expire-Date: 0',
                  'Passphrase: ' + password,
                  '%commit'
                ].join("\n");
              })
            }

            return self._execute(inputFiles, ['--batch', '--gen-key', '/input.txt'])
              .then(function(results) {
                log.debug('Time taken: ' + moment().diff(startTime, 'seconds') + ' seconds');
                
                return results.stdout;                
              })
            ;
          }, // generateKeyPair()



          /**
           * Encrypt given data with user's public key.
           *
           * @param emailAddress {string} user id.
           * @param data {string} data to encrypt.
           */
          // encryptWithPublicKey: function(emailAddress, data) {
          //   var self = this;

          //   var defer = $q.defer();

          //   log.debug('Encrypting ' + data.length + ' characters with public key for: '  + emailAddress);

          //   var startTime = null;

          //   self._lock()
          //     .then(function createInput() {
          //       return self._fsWriteFile(data, '/input.txt')
          //     })
          //     .then(function encrypt() {
          //       startTime = moment();
          //       return self._gpg('-r', emailAddress, '--output', '/encrypted.txt', '--encrypt', '/input.txt');
          //     })
          //     .then(function getOutput() {
          //       return self._fsGetFiles('/encrypted.txt');
          //     })
          //     .then(function allDone(fileData) {
          //       log.debug('Time taken: ' + moment().diff(startTime, 'seconds') + ' seconds');
          //       return fileData['/encrypted.txt'];
          //     })
          //     .then(defer.resolve)
          //     .catch(function (err) {
          //       defer.reject(new GPGError('Data encryption error', err));
          //     })
          //     .finally(self._unlock)
          //   ;

          //   return defer.promise;
          // }, // generateKeyPair()




          /**
           * Get all keys in the user's keychain.
           *
           * @param emailAddress {string} user id.
           */
          getAllKeys: function(emailAddress) {
            var self = this;

            log.debug('Getting all keys stored in keychain of ' + emailAddress);

            return self._execute({}, ['--list-keys', '--with-colons', '--fixed-list-mode'])
              .then(function getOutput(results) {
                return GPGUtils.parseKeyList(results.stdout);
              })
            ;

          }, // getAllKeys()





          /**
           * Import a key into the user's keychain.
           *
           * @param {String} key The exported key in ASCII armour format.
           */
          importKey: function(key) {
            var self = this;

            log.debug('Importing key into keychain');

            var inputFiles = {
              '/home/emscripten/.gnupg/import.gpg': $q.when(key)
            };

            return self._execute(inputFiles, ['--import', '/home/emscripten/.gnupg/import.gpg']);
          }, // importKey()




          /**
           * Backup all GPG data.
           *
           * @return {Promise} resolves to Object containg backup data
           */
          backup: function() {
            var self = this;

            return $q.when({
              'pubring.gpg': self.virtualFs['/home/emscripten/.gnupg/pubring.gpg'],
              'secring.gpg': self.virtualFs['/home/emscripten/.gnupg/pubring.gpg'],
              'trustdb.gpg': self.virtualFs['/home/emscripten/.gnupg/trustdb.gpg']              
            });
          },




          /**
           * Restore all GPG data from a backup.
           *
           * @param data {Object} data previously obtained by calling backup().
           *
           * @return {Promise}
           */
          restore: function(data) {
            var self = this;

            for (var f in data) {
              self.virtualFs['/home/emscripten/.gnupg/' + f] = data[f];
            }

            return $q.when(true);
          }

        }));
      }
    };
  });



  /**
   * GPG worker object which calls through to the worker thread.
   */
  app.factory('GPGWorker', function(Log, $q, GPGError) {

    return Class.extend({

      init: function(workerScriptUrl, log) {
        var self = this;

        self.log = (log || Log).create('Worker');

        self.promiseCount = 0;
        self.promises = {};

        self.thread = new Worker(workerScriptUrl);
        self.thread.onmessage = function(ev) {
          self._handleWorkerMsg(ev);
        };    

        self._resetWorkerCommandResult();
      },


      _handleWorkerMsg: function(ev) {
        var self = this; 

        // TODO: handle case where not enough entropy is available - can we check before each command to see that we have 
        // enough entropy?

        var obj = {};
        try {
          obj = JSON.parse(ev.data);
        }
        catch(e) {
          self.workerCommand.stdout.exitOk = false;
          return self.log.error('GPG worker thread returned bad data', ev.data);
        }

        // got reference id?
        var defer = null;
        if('id' in obj && (defer = self.promises[obj.id])) {
          // error occurred?
          if ('error' in obj) {
            defer.reject(new GPGError('Errored: ' + defer.desc, self.workerCommand.stdout));
          } else {
            // does this call have notifications
            if (defer.hasUpdates) {
              defer.notify(obj);
            } 
            // this call is done
            else {              
              if (self.workerCommand.exitOk) {
                defer.resolve(self.workerCommand.stdout);
              } else {
                defer.reject(new GPGError('Failed: ' + defer.desc, self.workerCommand.stdout));
              }
            }
          }
        }

        if(obj.cmd) {
          self.workerCommand.stdout.push(obj.contents);
          self.log.debug(obj.contents);

          // check if exit status is non-0
          if (0 === obj.contents.indexOf('Exit Status')) {
            self.workerCommand.exitOk = ('Exit Status: 0' === obj.contents);
          }
        }
      },


      /**
       * Reset object holding results of current worker command.
       */
      _resetWorkerCommandResult: function() {
        this.workerCommand = {
          stdout: [],
          exitOk: true
        }
      },



      /**
       * Create a new Deferred object and add it to the worker's list of active Deferred objects.
       *
       * @param [options] {Object} additional options.
       * @param [options.hasUpdates] {Boolean} true if this Deferred will emit updates prior to being resolved. Default is false.
       *
       * @return {Deferred}
       */
      _newTrackableDeferred: function(options) {
        var self = this;

        options = options || {};

        var defer = $q.defer();
        defer.id = (++self.promiseCount);
        defer.desc = options.desc || '';
        defer.hasUpdates = options.hasUpdates ? true : false;
        self.promises[defer.id] = defer;

        // Remove this Deferred from the queue of pending promises;
        defer.dequeue = function() {
          delete self.promises[defer.id];
        };
        // Auto-remove once promise is resolved/rejected
        defer.promise.finally(function() {
          defer.dequeue();
        });

        return defer;
      },



      /**
       * Analyse given path.
       * @return {filename: ..., path: ...}
       */
      _analysePath: function(path_in, opt_filename) {
        var is_absolute = (path_in[0] === '/');
        var is_path_only = (path_in[path_in.length-1] === '/');

        var filename, path;
        if(is_path_only) {
          filename = opt_filename || '';
          path = path_in;
        }
        else {
          var elements = path_in.split('/');
          filename = elements[elements.length-1];
          path = path_in.substr(0, path_in.length-filename.length);
        }
        return {
          filename: filename,
          path:     path
        };
      },



      mkdir: function(pseudo_path) {
        var self = this;

        var defer = self._newTrackableDeferred({
          desc: 'mkdir: ' + pseudo_path
        });

        self.thread.postMessage(JSON.stringify({
          cmd:         'mkdir',
          id:          defer.id,
          pseudo_path: '/',
          pseudo_name: pseudo_path
        }));

        return defer.promise;
      },



      /**
       * Get contents of given files in the virtual filesystem.
       * @param ... each argument is a file name (it is assumed that there are no duplicates)
       * @return {Promise} resolves to {file name : file contents}
       */
      getFiles: function() {
        var self = this;

        var pseudo_files = Array.prototype.slice.call(arguments);

        var defer = self._newTrackableDeferred({
          desc: 'getFiles: ' + pseudo_files.join(', ')
        });
        var contents = {};

        for (var i in pseudo_files)
          (function(fname) {
            self.getFile(fname)
              .then(function(c) {
                contents[fname] = c;
                if(Object.keys(contents).length === pseudo_files.length)
                  defer.resolve(contents);
              })
              .catch(defer.reject)
            ;
          })(pseudo_files[i]);

        return defer.promise;
      },



      /**
       * Get contents of given file in the virtual filesystem.
       * @param pseudo_file {string} path to file.
       * @return {Promise} resolves to file contents
       */
      getFile: function(pseudo_file) {
        var self = this;

        var file = self._analysePath(pseudo_file),
          defer1 = self._newTrackableDeferred({
            desc: 'getFile: ' + pseudo_file,
            hasUpdates: true
          }),
          defer2 = $q.defer()
        ;

        // make the call
        self.thread.postMessage(JSON.stringify({
          cmd:         'getFile',
          id:          defer1.id,
          pseudo_path: file.path,
          pseudo_name: file.filename
        }));

        var chunks = [];
        // handle next chunk of the file returned
        defer1.promise.then(null, defer2.reject, function(msg) {
          var id = msg.chunk_id;
          chunks[id] = msg.contents;

          // TODO: rewrite this by inserting a completion callback within the getFile() worker code - so that we don't have to 
          // use chunks to check for completion
          var complete = true;
          for(var i = 0; i < msg.chunk_count; i++) {
            if('undefined' === typeof(chunks[i])) {
              complete = false;
              break;
            }
          }

          // got all chunks?
          if (complete) {
            defer1.dequeue(); // need to do this so that finally gets triggered!
            defer2.resolve(chunks.join(''), file.path, file.filename);
          }
        });

        return defer2.promise;
      },


      /**
       * Add data to file.
       * @param contents {string} data to append to file.
       * @param pseudo_path {string} path to file in virtual filesystem.
       * @return {Promise}
       */
      addData: function(contents, pseudo_path) {
        var self = this;
        
        self.log.debug('Add data to ' + pseudo_path);

        var dst = self._analysePath(pseudo_path),
          defer = self._newTrackableDeferred({
            desc: 'addData to ' + pseudo_path
          });

        self.thread.postMessage(JSON.stringify({
          cmd:         'addData',
          id:          defer.id,
          contents:    contents,
          pseudo_path: dst.path,
          pseudo_name: dst.filename
        }));

        return defer.promise;
      },



      /**
       * Run given GPG command.
       *
       * In order to accurately capture stdout for each GPG command only run one at a time.
       *  
       * @return {Promise} resolves to stdout (array of strings) result from executing command.
       */
      run: function() {
        var self = this;
        self._runCalled = true;

        var args = Array.prototype.slice.call(arguments);

        var defer = null;

        return self.waitUntilReady()
          .then(function runCommand() {
            args = ['--yes', '--verbose', '--lock-never'].concat(args);

            defer = self._newTrackableDeferred({
              desc: '' + args.join(' ')
            });
            self.log.debug('Execute command: ' + defer.desc);

            self._resetWorkerCommandResult();

            self.thread.postMessage(JSON.stringify({
              cmd:         'run',
              id:          defer.id,
              args:        args
            }));

            return defer.promise;
          })
            .then(function returnStdoutResult() {
              return self.workerCommand.stdout;
            })
        ;
      },


      /**
       * Get whether a run() call has been made through this worker.
       * @return {Boolean}
       */
      runCalled: function() {
        return this._runCalled;
      },



      /**
       * Wait for all outstanding calls to be resolved.
       * @return {Promise}
       */
      waitUntilReady: function() {
        return $q.all(this.promises);
      }

    });

  });


  app.factory('GPGUtils', function(GPGError) {

    // From 9.1 and 9.2 in http://www.ietf.org/rfc/rfc4880.txt
    var PGP_PK_ALGO_IDS = {
      1: 'RSA (Encrypt or Sign)',
      2: 'RSA (Encrypt-Only)',
      3: 'RSA (Sign-Only)',
      16: 'Elgamal (Encrypt-Only)',
      17: 'DSA (Digital Signature Algorithm)',
      18: 'Reserved for Elliptic Curve',
      19: 'Reserved for ECDSA',
      20: 'Reserved (formerly Elgamal Encrypt or Sign)',
      21: 'Reserved for Diffie-Hellman (X9.42, as defined for IETF-S/MIME)',
      100: 'Private/Experimental algorithm',
      101: 'Private/Experimental algorithm',
      102: 'Private/Experimental algorithm',
      103: 'Private/Experimental algorithm',
      104: 'Private/Experimental algorithm',
      105: 'Private/Experimental algorithm',
      106: 'Private/Experimental algorithm',
      107: 'Private/Experimental algorithm',
      108: 'Private/Experimental algorithm',
      109: 'Private/Experimental algorithm',
      1010: 'Private/Experimental algorithm'
    };


    var constructKeyInfo = function(tokens) {
      var key = {};
      key.trusted = ('u' === tokens[1]);
      key.bits = (0 < tokens[2].length) ? parseInt(tokens[2], 10) : '0';
      key.algorithm = (0 < tokens[3].length) ? PGP_PK_ALGO_IDS[parseInt(tokens[3],10)] : 'Unknown';
      key.hash = tokens[4];
      key.created = new Date(parseInt(tokens[5], 10) * 1000);
      key.expires = (0 < tokens[6].length) ? new Date(parseInt(tokens[6], 10) * 1000) : null;

      key.caps = {};
      var caps = tokens[tokens.length-2];
      for (var j=0; caps.length>j; ++j) {
        switch (caps[j]) {
          case 's':
            key.caps.sign = true;
          case 'c':
            key.caps.certify = true;
          case 'e':
            key.caps.encrypt = true;
        }
      }

      return key;
    };



    var constructKeyIdentity = function(tokens) {
      return {
        trusted: ('u' === tokens[1]),
        created: new Date(parseInt(tokens[5], 10)),
        expires: (0 < tokens[6].length) ? new Date(parseInt(tokens[6], 10)) : null,
        hash: tokens[7],
        text: (tokens[9] || '').trim()
      };      
    }


    return {
      /**
       * Parse the list of keys returned by GPG2.
       *
       * The list is assumed to be in machine-parseable format generated using the `--with-colons` options.
       * 
       * @param {Array} stdout List of strings representing the stdout holding the key list.
       * @return {Array} List of objects specifying each key.
       */
      parseKeyList: function(stdout) {
        var keys = [],
          currentKey = null;

        for (var i = 0; stdout.length > i; ++i) {
          var str = stdout[i];

          var tokens = str.split(':');

          switch (tokens[0]) {
            case 'pub':
              var currentKey = constructKeyInfo(tokens);
              keys.push(currentKey);

              currentKey.identities = [];
              currentKey.subKeys = [];
              break;
            case 'uid':
              var uid = constructKeyIdentity(tokens);

              if (currentKey) {
                currentKey.identities.push(uid);
              }
              break;
            case 'sub':
              var subKey = constructKeyInfo(tokens);

              if (currentKey) {
                currentKey.subKeys.push(subKey);
              }
              break; 
          }
        }

        return keys;
      }
    };

  });




}(angular.module('App.crypto', ['App.common'])));
