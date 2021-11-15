import { diff } from 'deep-object-diff';
import debounce from 'lodash.debounce';
import { init } from './Storage';

export default (options = {}) => {
    // Initialize the database.
    const db = init(options.database || 'vuex');

    // Create the debouncer so we can throttle the changes to the db.
    const debounced = debounce((fn, ...args) => {
        fn(...args);
    }, options.wait || 175);

    // Define the Vuex plugin with an async function so we can await promises.
    return async(vuex) => {
        // Compact the database to reduce the size and remove some unnecessary
        // revisions.
        await db.compact();
    
        // Loop through the vuex.state keys and get the values from the db.
        for(const key of Object.keys(vuex.state)) {
            vuex.state[key] = await db.config(key);
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
            for(const [key, value] of Object.entries(difference)) {
                await db.config(key, value);
            }                

            // Set the previous back to a plain object so we can compare again
            // the next time the debouncer callback is fired.
            prevState = JSON.parse(JSON.stringify(vuex.state));
        }), {
            // Use deep so we can track changes within nested objects/arrays.
            deep: true
        });
    };
};