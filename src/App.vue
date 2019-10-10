<template>
    <div id="app">
        <label>First Name</label>
        <input v-model="$store.state.first"><br>
        <label>Last Name</label>
        <input v-model="$store.state.last" />
    </div>
</template>

<style lang="scss">
@import '~bootstrap/scss/bootstrap';
</style>