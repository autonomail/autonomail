sjcl.misc.hmac512 = function(key) {
  sjcl.misc.hmac.call(this, key, sjcl.hash.sha512);
};
sjcl.misc.hmac512.prototype = new sjcl.misc.hmac('');
sjcl.misc.hmac512.prototype.constructor = sjcl.misc.hmac512;




