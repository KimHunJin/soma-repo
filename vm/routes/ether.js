var App = require('./ethereum/app');
var express = require('express');
var router = express.Router();
var compile = require('./ethereum/compile/compile');

var app = new App({});
app.init();

router.get('/', function(req, res) {
	app.getAccount();
});

router.get('/addAccount', function(req, res) {
	app.createAccount();
});

router.get('/compiler', function(req, res) {
	app.runCompiler();
});

module.exports = router;