# Vuex Persistent Plugin

This is a plugin for Vuex that uses PouchDB to store data on the client.

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
