module.exports = {
    publicPath: './',
    configureWebpack: {
        externals: ['pouchdb', 'pouchdb-find'],
        output: {
            libraryExport: 'default'
        }
    }
};
