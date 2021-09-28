import deepExtend from 'deep-extend';
import { get, save } from './Storage';

function value(val, ...args) {
    return typeof val === 'function' ? val(...args) : val;
}

function promise(val, ...args) {
    val = value(val, ...args);

    if(val instanceof Promise) {
        return val;
    }

    return Promise.resolve(val);
}

// TODO: Create a file for an encryption when app first launches...
export default (options = {}) => {
    const key = options.key || 'config';

    const DEFAULT_DRIVER = vuex => ({
        async initialize() {
            const state = await promise(this.state);

            await save(key, deepExtend(vuex.state, state));
            
            vuex.watch(this.watch, this.set, {
                deep: true
            });

            vuex.replaceState(state);
            
            return vuex.state;
        },
        watch(state) {
            return state;
        },
        async set(value) {
            await save(key, value);
        },
        async state() {
            return await get(key);
        },
        resetStateToDefault() {
            //
        }
    });
    
    return vuex => {
        const driver = Object.assign(
            value(DEFAULT_DRIVER, vuex),
            value(options.driver, vuex)
        );

        driver.initialize().then(options.initialized);
    };
};
