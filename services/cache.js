const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const client = redis.createClient({ url: 'redis://localhost:6378' });
//client.get = util.promisify(client.get);

mongoose.connection.once('open', () => {
  console.log('Client Redis is ready!');
});

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  //this è riferito alla query
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) return exec.apply(this, arguments);
  await client.connect();
  if (!client) {
    console.error('The Redis client is not available');
    return;
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    }),
  );

  // See if we have a value for 'key' in redis
  let cacheValue;

  if (client) {
    console.log('key ' + key);
    cacheValue = await client.get(key);
  } else {
    console.error('The Redis client is not connected.');
  }

  // If we do, return that
  if (cacheValue) {
    // const doc = new this.model(JSON.parse(cacheValue));
    const doc = JSON.parse(cacheValue);
    await client.disconnect();
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);
  if (client && !cacheValue) {
    await client.set(key, JSON.stringify(result));
  } else {
    console.error('Cannot set value in Redis, the client is not connected.');
  }
  await client.disconnect();
  return result;
};

module.exports = {
  cleanHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
