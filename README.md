# Vuex Persistent Plugin

This is a plugin for Vuex that uses PouchDB to store data on the client. A helper
library is provided to make working with PouchDB a little easier with more 1-liners.

#### Installation

    npm install --save vuex-persistent-plugin

## Basic Usage

    import Vue from 'vue';
    import Vuex from 'vuex';
    import persistent from 'vuex-persistent-plugin/src/persistent';

    Vue.use(Vuex);

    const defaultState = {
        config: {}
    };

    export default new Vuex.Store({

        state: Object.assign({}, defaultState),

        plugins: [
            persistent({
                // options
            })
        ]

    });

## Config

Config's are key/value pairs. This a helper method to return the config data from the stored doc.

    import { config } from 'vuex-persistent-plugin/src/Storage';

    config('key', true);

    config('key').then(docs => {
        console.log(docs) // true
    });

## Cache

Cache's extend the config methods, but track when the values should be purged.
Config values are saved forever, cache values can expire.

    import { cache } from 'vuex-persistent-plugin/src/Storage';

    // Cache "key" for 10 seconds.
    cache('key', () => Promise.resolve(true), 10).then(data => {
        console.log(data) // true
    });

    purge('key').then(docs => {
        console.log(docs) // array of docs that were removed.
    });