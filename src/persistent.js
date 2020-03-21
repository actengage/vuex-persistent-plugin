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
        initialize() {
            promise(this.state).then(state => {
                save(key, deepExtend(vuex.state, state)).then(state => {
                    vuex.watch(this.watch, this.set, {
                        deep: true
                    });
        
                    vuex.replaceState(state);
                });
            });
        },
        watch(state) {
            return state;
        },
        set(value) {
            save(key, value);
        },
        state() {
            return get(key).then(null, e => {
                return null;
            });
        },
        resetStateToDefault() {
            //
        }
    });
    
    return vuex => {
        const driver = Object.assign(
            value(DEFAULT_DRIVER, vuex), value(options.driver, vuex)
        );

        driver.initialize();
    };
};
