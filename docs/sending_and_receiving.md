# Sending email

## Signing

All email which gets sent is PGP-signed with your key, thus allowing recipients to validate that it was you who sent
the email. We follow the PGP/MIME standard in that the signature is attached to your email as a small file which the
 recipient's email client can ready and use to verify the authenticity and integrity of the email.

## Encryption

If you have the recipient's public PGP key imported into your keychain then any email you send to them will be fully
encrypted and thus private.

If you do not have the recipient's public PGP key (e.g. if they don't use PGP) then your outgoing email to them
will not be encrypted as otherwise they wouldn't be able to read it.

However, regardless of the situation above, once your message has been sent we ALWAYS encrypt it with your public PGP
key prior to storing it in your Sent mail folder. Thus even we can't read your message once it is stored.


# Receiving email

When receiving email, if it is not already encrypted (e.g. because the sender does not use PGP encryption) then the
message will be encrypted with your public PGP key as soon as it arrives at the Autonomail server. This ensures that
the message (stored on our server) can only be decrypted and thus read by you.


# End-to-end encryption

As noted above, we encrypt both your
incoming and outgoing emails as soon as they arrive at our servers. However, your message is still travelling unencrypted for
part of its journey through the internet.

For maximum privacy and security, end-to-end encryption is the only real solution - this means that an email is
 encrypted before it leaves the sender's device and stays encrypted and private until it reaches the recipient's device.
In order for this to happen the people who you communicate with also need to be using PGP encryption with their email client.
You could just invite them to use Autonomail :)


