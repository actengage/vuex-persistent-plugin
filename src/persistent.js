import debounce from 'lodash.debounce';
import { get, init, save } from './Storage';

export default (options = {}) => {
    const key = options.key || 'vuex';

    const db = init(options.database || 'config');

    const debounced = debounce((fn, ...args) => {
        fn(...args);
    }, options.wait || 250);

    return async(vuex) => {
        await db.compact();
    
        try {
            Object.assign(vuex.state, await get(key));
        }
        catch(e) {
            //
        }

        /**
         * @todo Save each state key as its own config document.
         * @todo Diff the changed state and previous state, and save the
         *       key/values that changed.
         */
        vuex.watch(state => state, async(state) => {
            const doc = Object.keys(state).reduce((carry, key) => {
                return Object.assign(carry, {
                    [key]: state[key]
                });
            }, {});
            
            debounced(() => save(key, doc));
        }, {
            deep: true
        });
    };
};