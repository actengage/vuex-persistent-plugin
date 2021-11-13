/*
import Vue from 'vue';
import store from './store';
import App from './App.vue';

Vue.config.productionTip = false;

new Vue({
    store,
    render: h => h(App)
}).$mount('#app');
*/

import { db, cache, config, createIndex, init, purge, removeConfig } from './Storage';
import { date, extract, map, results } from './utils';

init('config');

(async() => {
    console.log(await db.config(['config1', 'config2', 'config3']));
})();
