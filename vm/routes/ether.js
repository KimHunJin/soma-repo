var express = require('express');
var router = express.Router();
var executionContext = require('./ethereum/execution-context');
var dApp = require('./ethereum/dApp');
var compile = require('./ethereum/compile');

router.get('/', function(req, res) {
	var context = executionContext;
	console.log('---------------vm---------------');
	console.log(context.vm());

  var udapp = new dApp({
    removable: false,
    removable_instances: true
  });
  console.log('---------------dapp--------------');
  console.log(udapp);

  console.log('----------------solc----------------');
  console.log(compile);
});

module.exports = router;