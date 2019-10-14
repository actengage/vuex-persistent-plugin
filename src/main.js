import Vue from 'vue';
import store from './store';
import App from './App.vue';

Vue.config.productionTip = false;

import Storage, { cache } from './Storage';

cache('test', 123, 1);

/*
new Vue({
    store,
    render: h => h(App)
}).$mount('#app');
*/