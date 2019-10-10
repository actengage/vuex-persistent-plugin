import Vue from 'vue';
import Vuex from 'vuex';
import persistent from './persistent';

Vue.use(Vuex);

export default new Vuex.Store({

    state: {
        items: [],
        test: 123,
        first: null,
        last: null
    },

    plugins: [
        persistent()
    ],

    mutations: {

        items(state, value) {
            state.items = value;
        }

    }

});
