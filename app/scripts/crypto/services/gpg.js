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

  app.provider('GPG', function() {

    var workerScriptUrl = null;

    return {
      setWorkerScript: function(scriptUrl) {
        workerScriptUrl = scriptUrl;
      },


      $get: function(Log, $q, RuntimeError, GPGWorker, Random) {
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

            self._lock = _.bind(self._lock, self);
            self._unlock = _.bind(self._unlock, self);
          },


          /**
           * Fill the EGD pool with entropy.
           *
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
           * Get GPG worker.
           *
           * @param [options] {Object} additonal options which affect how we configure the worker.
           * @param [options.wantToRunGPG] {Boolean} if true then worker is going to be used to run a GPG command. Default is false.
           * @param [options.reset] {Boolean} if true then all cached workers will be flushed and recreated. Default is false.
           *
           * @return {Promise} resolves to GPGWorker instance.
           */
          _getWorker: function(options) {
            var self = this;

            options = options || {};

            var defer = $q.defer();

            /*
                The rule is that we cannot allow 2 GPG calls in a row on a given worker as that doesn't seem to work with the 
                gpg2 web worker lib as it currently stands. So we shall create a new worker iff we have already made a GPG call 
                with the current worker.
             */

            if (!self.worker || options.reset || (self.worker.runCalled() && options.wantToRunGPG)) {
              self._ensureEntropy()            
                .then(function createWorker() {
                  self.worker = new GPGWorker(workerScriptUrl, log);
                })
                .then(function setupFS() {
                  self.worker.mkdir('/home');
                  self.worker.mkdir('/home/emscripten');
                  self.worker.mkdir('/home/emscripten/.gnupg');
                  return self.worker.wait();
                })
                .then(function addSavedFileData() {
                  for (var f in self.virtualFs) {
                    self.worker.addData(self.virtualFs[f], f);
                  }
                  return self.worker.wait();
                })
                .then(function done() {
                  defer.resolve(self.worker);
                })
                .catch(defer.reject)
              ;
            } else {
              defer.resolve(self.worker);
            }

            return defer.promise;
          },




          /**
           * Request the internal queue lock.
           *
           * We want to serve incoming API requests one at a time. To do this we queue all incoming requests. Each request must 
           * first obtain a 'lock' using this method prior to starting its GPG operations. It must then call `_unlock` once done 
           * to allow the next request to proceed.
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
           * This method will take whatever arguments are passed to it and pass them to the resolved the promise - this 
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
           * Create file with given contents in the virtual FS.
           */
          _fsWriteFile: function() {
            var self = this;

            var args = Array.prototype.slice.call(arguments);

            return self._getWorker()
              .then(function writeData(worker) {
                return worker.addData.apply(worker, args);
              })
            ;
          },


          /**
           * Get contents of given files in the virtual FS.
           */
          _fsGetFiles: function() {
            var self = this;

            var args = Array.prototype.slice.call(arguments);

            return self._getWorker()
              .then(function getFiles(worker) {
                return worker.getFiles.apply(worker, args);
              })
            ;
          },


          /**
           * Run a GPG command.
           */
          _gpg: function() {
            var self = this;
            
            var args = Array.prototype.slice.call(arguments),
              worker = null;

            /*
              Because we clear out the FS when running 2 GPG commands in a row, we need to warn the caller if they're writing to 
              a file. See _getWorker() method.
             */
            var outputParamIndex = args.indexOf('--output');
            if (0 <= outputParamIndex) {
              var fileName = (outputParamIndex < args.length - 1) ? args[outputParamIndex+1] : 'the output file';

              log.warn('Ensure you save the contents of "' + fileName + '" prior to running the next GPG command');
            }

            return self._getWorker({ wantToRun: true })
              .then(function runCommand(newWorker) {
                worker = newWorker;
                return worker.run.apply(worker, args);
              })
              .then(function getFilesToSave() {
                return worker.getFiles(
                  '/home/emscripten/.gnupg/pubring.gpg',
                  '/home/emscripten/.gnupg/secring.gpg',
                  '/home/emscripten/.gnupg/trustdb.gpg',
                  '/home/emscripten/.gnupg/random_seed'
                )
              })
              .then(function saveFileData(fileData) {
                self.virtualFs = fileData;
              })
            ;
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

            var defer = $q.defer();

            log.debug('Generating ' + keyStrength + '-bit keypair for: '  + emailAddress);

            var startTime = null;

            self._lock()
              .then(function createInput() {
                if (2048 !== keyStrength && 4096 !== keyStrength) {
                  throw new RuntimeError('GPG key bit size must be either 2048 or 4096');
                }

                var keyInput = [              
                  'Key-Type: RSA',
                  'Key-Length: ' + keyStrength,
                  'Subkey-Type: RSA',
                  'Subkey-Length: ' + keyStrength,
                  'Name-Email: ' + emailAddress,
                  'Expire-Date: 0',
                  'Passphrase: ' + password,
                  '%commit'
                ];

                return self._fsWriteFile(keyInput.join("\n"), '/input.txt')
              })
              .then(function generateKey() {
                startTime = moment();
                return self._gpg('--batch', '--gen-key', '/input.txt');
              })
              .then(self._unlock)
              .then(function allDone(data) {
                log.debug('Time taken: ' + moment().diff(startTime, 'seconds') + ' seconds');
                return data;
              })
              .then(defer.resolve)
              .catch(function (err) {
                // TODO: create a GPGError class so that we can detect the error type outside!
                defer.reject(new RuntimeError('PGP keypair generation error', err));
              });
            ;

            return defer.promise;
          }, // generateKeyPair()



          /**
           * Backup all GPG data.
           *
           * @return {Promise} resolves to Object containg backup data
           */
          backup: function() {
            var self = this;

            var defer = $q.defer();

            defer.resolve({
              'pubring.gpg': self.virtualFs['/home/emscripten/.gnupg/pubring.gpg'],
              'secring.gpg': self.virtualFs['/home/emscripten/.gnupg/pubring.gpg'],
              'trustdb.gpg': self.virtualFs['/home/emscripten/.gnupg/trustdb.gpg']
            });

            return defer.promise;
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

            var defer = $q.defer();

            self._lock()
              .then(function setupData() {
                for (var f in data) {
                  self.virtualFs['/home/emscripten/.gnupg/' + f] = data[f];
                }
              })
              .then(function getFreshWorkerInstance() {
                return self._getWorker({ reset: true });
              })
              .then(function checkGPG() {
                return self._gpg('--list-keys');
              })
              .then(self._unlock)
              .then(defer.resolve)
              .catch(function(err) {
                // TODO: create a GPGError class so that we can detect the error type outside!
                defer.reject(new RuntimeError('GPG restore error', err));                
              })
            ;

            return defer.promise;
          }

        }));
      }
    };
  });



  app.factory('GPGWorker', function(Log, $q, RuntimeError) {

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
          return self.log.error(new RuntimeError('GPG worker thread returned bad data', ev.data));
        }

        // got reference id?
        var defer = null;
        if('id' in obj && (defer = self.promises[obj.id])) {
          // error occurred?
          if ('error' in obj) {
            defer.reject(new RuntimeError('GPG worker thread threw error for: ' + defer.desc));
          } else {
            // does this call have notifications
            if (defer.hasUpdates) {
              defer.notify(obj);
            } 
            // this call is done
            else {
              defer.resolve(obj);
            }
          }
        }

        if(obj.cmd) {
          if('stdout' === obj.cmd) {
            self.log.debug(obj.contents);
          } else if('stderr' === obj.cmd) {
            self.log.error(obj.contents);
          }
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
       * @return {Promise}
       */
      run: function() {
        var self = this;
        self._runCalled = true;

        var args = Array.prototype.slice.call(arguments);

        return self.wait()
          .then(function runCommand() {

            args.unshift('--lock-never');

            var defer = self._newTrackableDeferred({
              desc: '' + args.join(' ')
            });

            self.thread.postMessage(JSON.stringify({
              cmd:         'run',
              id:          defer.id,
              args:        args
            }));

            return defer.promise;
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
      wait: function() {
        return $q.all(this.promises);
      }

    });

  });





}(angular.module('App.crypto', ['App.common'])));
