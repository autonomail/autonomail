# Key security

## Key derivation

We pass the user's passwords through PBKDF2+SHA512 to derive a 512-bit key. We do as many
iterations of PBKDF2 as needed for the total generation time to take 2 seconds. On a Macbook Air 2012
this comes to around ~45,000 iterations.

This derived 512-bit key is split into two 256-bit keys:

* The first 256-bits - the master key - is used as encryption key for any user data which needs to stay private and secure (see below).
* The second 256-bits - the authentication key - is used as the password to authenticate the user against the Autonomail server

## Encrypted data storage

We store the user's PGP keys in window.localStorage, encrypted using the _master key_ and AES-256. This encrypted bundle is also
backed up to the server for redundancy purposes and also to ease transition between different devices.

The encrypted bundle has the following format:

```
emailAddress [text]:
  salt [hex]
  iterations [int]
  secureKeyStorage: [encrypted data]
```

The `salt` and `iterations` items are parameters which get passed to the [key derivation algorithm](#keyDerivation) to
generate the key required to decrypt the `secureKeyStorage` blob.

The `secureKeyStorage` blog contains the following, once decrypted:

* All PGP data, including user's certificate trust database.







