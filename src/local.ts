import { init } from './index'
var cluster = require('express-cluster');
cluster(function(worker:any) {
    init(worker.id)
}, {count: 1})

