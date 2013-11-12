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





      $get: function($log, $q, RuntimeError, Random) {
        return new (Class.extend({

          init: function() {
            var self = this;

          },



          /**
           * Handle message received from worker thread.
           */
          _handleWorkerMsg: function(worker, ev) {
            var self = this; 
 
            // TODO: handle case where not enough entropy is available - can we check before each command to see that we have 
            // enough entropy?

            var obj = {};
            try {
              obj = JSON.parse(ev.data);
            }
            catch(e) {
              return $log.error(new RuntimeError('GPG worker returned bad data', ev.data));
            }

            // got reference id?
            var defer = null;
            if('id' in obj && (defer = worker.promises[obj.id])) {
              // error occurred?
              if ('error' in obj) {
                defer.reject(obj.error);
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
                $log.debug(obj.contents);
              } else if('stderr' === obj.cmd) {
                $log.error(obj.contents);
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
          _newTrackableDeferred: function(worker, options) {
            var self = this;

            options = options || {};

            var defer = $q.defer();
            defer.id = (++worker.promiseCount);
            defer.hasUpdates = options.hasUpdates ? true : false;
            worker.promises[defer.id] = defer;


            defer.dequeue = function() {
              delete worker.promises[defer.id];
            };
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



          _mkdir: function(worker, pseudo_path) {
            var self = this;

            var defer = self._newTrackableDeferred(worker);

            worker.postMessage(JSON.stringify({
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
          _getFiles: function(worker, file1) {
            var self = this;

            var defer = self._newTrackableDeferred(worker);
            var contents = {};

            var pseudo_files = Array.prototype.slice.call(arguments);
            for (var i in pseudo_files)
              (function(fname) {
                self._getFile(worker, fname)
                  .then(function(c) {
                    contents[fname] = c;
                    if(Object.keys(contents).length === pseudo_files.length)
                      defer.resolve(contents);
                  }
                  .catch(defer.reject)
                );
              })(pseudo_files[i]);

            return defer.promise;
          },



          /**
           * Get contents of given file in the virtual filesystem.
           * @param pseudo_file {string} path to file.
           * @return {Promise} resolves to file contents
           */
          _getFile: function(pseudo_file) {
            var self = this;

            var file = self._analysePath(pseudo_file),
              defer1 = self._newTrackableDeferred({
                hasUpdates: true
              }),
              defer2 = $q.defer()
            ;

            // make the call
            self.worker.postMessage(JSON.stringify({
              cmd:         'getFile',
              id:          defer1.id,
              pseudo_path: file.path,
              pseudo_name: file.filename
            }));

            var chunks = [];
            // handle next chunk of the file returned
            defer1.promise.then(null, null, function(msg) {
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
          _addData: function(contents, pseudo_path) {
            var self = this;
            
            var dst = self._analysePath(pseudo_path),
              defer = self._newTrackableDeferred();

            self.worker.postMessage(JSON.stringify({
              cmd:         'addData',
              id:          defer.id,
              contents:    contents,
              pseudo_path: dst.path,
              pseudo_name: dst.filename
            }));

            return defer.promise;
          },


          /**
           * Run given command
           * @return {Promise}
           */
          _run: function() {
            var self = this;

            var defer = self._newTrackableDeferred(),
              args = Array.prototype.slice.call(arguments, 0);

            args.unshift('--lock-never');

            self.worker.postMessage(JSON.stringify({
              cmd:         'run',
              id:          defer.id,
              args:        args
            }));

            return defer.promise;
          },



          /**
           * Wait for outstanding calls/Promises to be resolved.
           * @return {Promise}
           */
          _whenAllDone: function() {
            return $q.all(this.promises);
          },


          /**
           * Reset the encryption library and virtual filesystem.
           *
           * This should be called before every action.
           *
           * @return {Promise}
           */
          _resetGPG: function() {
            var self = this;

            var defer = $q.defer();

            self.worker = new Worker(workerScriptUrl);
            self.worker.promiseCount = 0;
            self.worker.promises = {};
            self.worker.onmessage = function(ev) {
              self._handleWorkerMsg(ev);
            };


            if (self.alreadySetup) {
              defer.resolve();
            } else {
              Random.getRandomBytes(4096)
                .then(function fillEGDPool(words) {
                  var utf8str = sjcl.codec.utf8String.fromBitsRaw(words);
                  $log.debug('GPG: Adding ' + (words.length * 4) + ' bytes to EGD pool...');
                  return self._addData(utf8str, '/dev/egd-pool');
                })
                .then(function createFolders() {
                  self._mkdir('/home');
                  self._mkdir('/home/emscripten');
                  self._mkdir('/home/emscripten/.gnupg');
                  return self._whenAllDone();
                })
                .then(function allDone() {
                  $log.debug('GPG: filesystems setup');
                  self.alreadySetup = true;
                  defer.resolve();
                })
                .catch(defer.reject)
              ;
            }

            return defer.promise;
          },


          /**
           * Generate a new key-pair
           * 
           * @param emailAddress {string} user id.
           *
           * References: 
           *  - https://alexcabal.com/creating-the-perfect-gpg-keypair/
           */
          generateKeyPair: function(emailAddress) {
            var self = this;

            var defer = $q.defer();

            self.setup()
              .then(function setupKeygenParameters(){
                $log.debug('GPG: generating keypair for: '  + emailAddress);

                var keyInput = [              
                  'Key-Type: RSA',
                  'Key-Length: 1024',
                  'Subkey-Type: RSA',
                  'Subkey-Length: 1024',
                  'Name-Email: ' + emailAddress,
                  'Expire-Date: 0',
                  'Passphrase: password',
                  '%commit'
                ];

                return self._addData(keyInput.join("\n"), '/input.txt');
              })
              .then(function generateKey() {
                return self._run('--batch', '--gen-key', '/input.txt');
              })
              .then(function exportPrivateKey() {
                return self._run('--list-keys');                
              })
              .then(function exportPrivateKey() {
                return self._run('--export-secret-keys', '--armor', '--output', '/private.asc', emailAddress);                
              })
              .then(function exportPublicKey() {
                return self._run('--export', '--armor', '--output', '/public.asc', emailAddress);                
              })
              .then(function getKeyData() {
                return self._getFiles('/private.asc', '/public.asc');
              })
              .then(function allDone(ascFiles) {
                $log.debug('GPG: key files', ascFiles);
                return {
                  public: ascFiles['public.asc'],
                  private: ascFiles['private.asc']
                }
              })
              .then(defer.resolve)
              .catch(function (err) {
                // TODO: create a GPGError class so that we can detect the error type outside!
                defer.reject(new RuntimeError('PGP keypair generation error', err));
              });
            ;

            return defer.promise;
          },


        }));
      }
    };
  });


  /**
   * Represents a worker thread.
   */
  var WorkerThread = function(GPGService) {
    var self = this;

    self.service = GPGService;

    self.promiseCount = 0;
    self.promises = {};

    self.thread = new Worker(workerScriptUrl);
    self.thread.onmessage = function(ev) {
      self._handleWorkerMsg(ev);
    };    
  }

  WorkerThread.prototype.onmessage = function(ev) {

  };




}(angular.module('App.crypto', ['App.common'])));
