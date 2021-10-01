import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';

PouchDB.plugin(PouchFind);

export function db(name, options) {
    return new PouchDB(name, options);
}

export function execute(method, key, ...args) {
    if(Array.isArray(key)) {
        const promises = key.map(key => method(key).then(data => {
            return [key, data];
        }, () => {
            return [key, undefined];
        }));

        return Promise.all(promises).then(data => {
            return data.reduce((carry, [key, data]) => {
                return Object.assign({[key]: data }, carry);
            }, {});
        });
    }
    else {
        return method(key, ...args);
    }
}

export function promise(data) {
    if(data instanceof Promise) {
        return data;
    }

    if(typeof data === 'function') {
        return promise(data());
    }

    return Promise.resolve(data);
}

export function id(doc) {
    return doc && doc._id || doc;
}

export function isJson(data) {
    if(data instanceof Promise) {
        return false;
    }

    try {
        return typeof JSON.parse(JSON.stringify(data)) === 'object';
    }
    catch(e) {
        return false;
    }
}

export function find(...args) {
    return global.find(...args);
}

export function findKey(key, ...args) {
    return find({
        selector: {
            $or: [{
                _id: key
            }].concat([findCacheSelector(key)])
        }
    }, ...args);
}

export function findFirstKey(key, ...args) {
    return findKey(key, ...args).then(({ docs }) => docs.slice(0, 1).pop());
}

export function firstOrFail(key, ...args) {
    return new Promise((resolve, reject) => {
        findFirstKey(key).then(doc => {
            execute(global.get, doc ? doc._id : key, ...args).then(resolve, reject);
        });
    });
}

export function findConfig(key, ...args) {
    return get(key, ...args).then(({ data }) => data, () => undefined);
}

export function findCache(key, ...args) {
    return findConfig(key, ...args);
}

export function config(key, data, ...args) {
    if(typeof data === 'undefined') {
        return execute(findConfig, key, ...args);
    }
    
    return new Promise((resolve, reject) => {
        promise(data).then(data => {
            save(key, { data }).then(({ data }) => resolve(data), e => resolve());
        });
    });
}

export function get(key, ...args) {
    return execute(firstOrFail, key, ...args);
}

export function post(doc, ...args) {
    doc = JSON.parse(JSON.stringify(doc));
    
    return new Promise((resolve, reject) => {
        execute(global.post, doc, ...args).then(({ id }) => {
            get(id).then(resolve, reject);
        }, reject);
    });
}

export function put(doc, ...args) {
    const { _id } = doc;
    
    doc = JSON.parse(JSON.stringify(doc));

    return new Promise((resolve, reject) => {
        get(_id).then(({ _rev }) => {
            execute(global.put, Object.assign(doc, { _rev })).then(() => resolve(doc), reject);
        }, reject);
    });
}

export function remove(key, ...args) {
    if(typeof key === 'object') {
        return execute(global.remove, key, ...args);
    }

    return new Promise((resolve, reject) => {
        get(key).then(doc => {
            remove(doc).then(resolve, reject);
        }, () => resolve());
    });
}

export function save(doc, data, ...args) {
    if(Array.isArray(doc)) {
        return execute(save, doc, data, ...args);    
    }

    if(!isJson(doc) && !isJson(data) || typeof data === 'object' && !Object.keys(data).length) {
        return config(doc, data, ...args);
    }
    
    if(typeof doc === 'string') {
        doc = Object.assign({_id: doc}, data);
    }

    if(!doc._id) {
        return post(doc);
    }

    return new Promise((resolve, reject) => {
        retryUntilSucceeds(() => {
            return get(doc._id).then(({ _rev }) => {
                return put(Object.assign(doc, { _rev }));
            }, () => {
                return post(doc);
            });
        }).then(resolve, reject);
    });
}

export function findCacheSelector(key) {
    return {
        key,
        $cache: { $exists: true },
        $or: [{
            $expiredAt: { $eq: null },
        }, {
            $expiredAt: { $gt: new Date().getTime() },
        }]
    };
}

export async function purge(key, ...args) {
    if(Array.isArray(key)) {
        key.forEach(async(key) => await remove(key, ...args));
    }
    
    return remove(key, ...args);
}

export function retryUntilSucceeds(method, ...args) {
    return promise(method(...args)).catch(e => {
        if(e.status === 409) {
            return retryUntilSucceeds(method, ...args);
        }

        throw e;
    });
}

export function clearExpiredAt(key) {
    return new Promise((resolve, reject) => {
        find({
            selector: {
                _id: key,
                $or: [{
                    $expiredAt: { $exists: false }
                },{
                    $and: [{
                        $expiredAt: { $exists: true }
                    }, {
                        $expiredAt: { $type : 'number' }
                    }, {
                        $expiredAt: { $lte: new Date().getTime() }
                    }]
                }]
            }
        }).then(({ docs }) => {
            Promise.all(docs.map(doc => {
                return retryUntilSucceeds(remove, doc);
            })).then(resolve, reject);
        }, reject);
    });
}

export function cache(key, data, length = null) {
    if(typeof key === 'undefined') {
        throw Error('cache() requires passing at least one key.');
    }

    if(typeof data === 'undefined') {
        return execute(findCache, key);
    }

    if(data === null) {
        return execute(purge, key);
    }
    
    return new Promise((resolve, reject) => {
        const $expiredAt = typeof length === 'number' && new Date().getTime() + length * 1000 || null;

        clearExpiredAt(key).then(() => {
            get(key).then(({ data }) => resolve(data), () => {
                promise(data).then(data => {
                    save(key, {
                        data,
                        $expiredAt,
                        $cache: true,
                        $cachedAt: new Date().getTime()
                    }).then(({ data }) => resolve(data), reject);
                }, reject);
            });
        }, reject);
    });
}

const global = db(process.env.VUE_APP_DB_NAME || 'capsule');

export default global;