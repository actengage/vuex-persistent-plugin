import { diff, detailedDiff } from 'deep-object-diff';
import debounce from 'lodash.debounce';
import { init } from './Storage';

export default (options = {}) => {
    // Get the database name from the options or process.env
    const name = options.database || process.env.VUE_APP_DATABASE_NAME;

    if(!name) {
        throw new Error('The database name must be defined.');
    }

    // Initialize the database.
    const db = init(name);

    // Create the debouncer so we can throttle the changes to the db.
    const debounced = debounce((fn, ...args) => {
        fn(...args);
    }, options.wait || 175);

    // Define the Vuex plugin with an async function so we can await promises.
    return async(vuex) => {
        // Compact the database to reduce the size and remove some unnecessary
        // revisions.
        // await db.compact();
    
        // Loop through the vuex.state keys and get the saved values.
        for(const key of Object.keys(vuex.state)) {
            const value = await db.config(key);

            if(value !== undefined) {
                vuex.state[key] = JSON.parse(JSON.stringify(value));
            }
        }

        // Define the previous state by converting it to a plain object.
        // This allows us to deef diff the objects later and only save the
        // changes that we need, instead of saving the entire state every time.
        let prevState = JSON.parse(JSON.stringify(vuex.state));
    
        // Create the watcher using the debouncer callback.
        vuex.watch(state => state, async(state) => debounced(async() => {
            // Calculate the differences between the prev/current states
            const difference = diff(prevState, state);

            // Loop through the differences and save the key/value in the db.
            for(let key of Object.keys(difference)) {
                // Set the config key/value pair.
                await db.config(key, state[key]);
            }                

            // Set the previous back to a plain object so we can compare again
            // the next time the debouncer callback is fired.
            // prevState = JSON.parse(JSON.stringify(vuex.state));
        }), {
            // Use deep so we can track changes within nested objects/arrays.
            deep: true
        });

        if(typeof options.initialized === 'function') {
            options.initialized(vuex);
        }
    };
};