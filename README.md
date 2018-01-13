# ember-source-channel-url

Retrieve a URL that can be used to reference a tarball representing the latest
`ember-source` build for that channel.

## Usage

```js
const getURLFor = require('ember-source-channel-url');

getURLFor('canary').then((url) => {
  // use the URL here 
});
```
