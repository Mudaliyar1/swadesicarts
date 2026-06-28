const { doubleCsrf } = require('csrf-csrf');
const result = doubleCsrf({ getSecret: () => 'secret' });
console.log(Object.keys(result));
