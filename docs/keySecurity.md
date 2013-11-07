# Key security

## Key derivation

We pass the user's passwords through PBKDF2+SHA512 to derive a 512-bit key. We do as many
iterations of PBKDF2 as needed for the total generation time to take 2 seconds. On a Macbook Air 2012
this comes to around ~45,000 iterations.

This derived 512-bit key is split into two 256-bit keys:

* The first 256-bits is used as the password to the secure key storage area (see below)
* The second 256-bits is used as the password to authenticate the user against the Autonomail server


## Key storage

We use window.localStorage to store the encryption keys and apsswords. The user is prompted to back up a
base64-encoded encrypted copy of this data to file whenever this data changes.

The main data object is saved against the user's email address:

```
emailAddress [text]:
  salt [hex]
  iterations [int]
  secureKeyStorage: [encrypted data]
```

The `salt` and `iterations` items are parameters which get passed to the key derivation algorithm to generate the
 key required to decrypt the `secureKeyStorage` blob.

The `secureKeyStorage` blog contains the following, once decrypted:

* `pgpPublicKey` [hex] - PGP public key
* `pgpPrivateKey` [hex] - PGP private key







