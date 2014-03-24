Autonomail is the email client for use with the [autonomail.com](https://autonomail.com) secure mail serivce. It is an offline web app currently runnable as a [Chrome packaged app]().

## Features **(under HEAVY development)**

 * Email encryption ([OpenPGP](http://www.openpgp.org/))
   * User-friendly PGP key management interface
   * Automatic mail encryption and signing where possible
   * Rock-solid encryption support: [GPG2](http://www.gnupg.org/documentation/manuals/gnupg-devel/Invoking-GPG.html) and [SJCL](http://crypto.stanford.edu/sjcl/)
 * Folders
 * 

## How to use

You need [Node.js](http://nodejs.org) 0.10.26 or above to build the app.

1. git clone https://github.com/autonomail/autonomail.git && cd autonomail
2. npm install -g bower grunt-cli
3. npm install
4. grunt build

At this point `dist` contains the built app. To test it locally run `grunt server:dist`.

## Roadmap

* Add support for IMAP to allow people to access any IMAP mail service


## LICENSE

Copyright (c) 2014 [Ramesh Nair](http://www.hiddentao.com)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
