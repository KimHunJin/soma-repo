'use strict'
var executionContext = require('./execution-context');
var dApp = require('./dApp');
//var Compiler = require('./compile/compile');
var registry = require('./global/registry');
var txFormat = require('./txFormat');
var txHelper = require('./txHelper');
var fs = require('fs');
var Compiler = require('./compile/compile');

class App {
	constructor() {
		var self = this;
		registry.put({api: self, name: 'app'});
	}

	init () {
		var self = this;
		run.apply(self);
	}

// 개인 정보
	getAccount() {
		var self = this;
		accounts.apply(self);
	}

	createAccount() {
		var self = this;
		addAccount.apply(self);
	}

	runCompiler() {
		var self = this;
		var target = "casino";
		var sources = {};

		var compiler = new Compiler();

		var test = new Promise(function(resolve, reject) {
			resolve(getContent());
		}).then(content => {

			sources = { content };
			var t = { 
				casino : sources
			};
//			console.log(t);
//			sources[target] = result ;
			compiler.compile(t, target);
		});
	}
}

function getContent() {
	var content = new Promise(function(resolve, reject) {
		fs.readFile('./contract/Casino.sol', 'utf8', function(err, data){
			if(err) {
				console.log(err);
			}
			resolve(data);
		});
	});
	return content;
}

function createInstance() {

	var dapp = registry.get('udapp').api;

	// contract 구조
	//	{
	//		object : contracts[file][contractName]
	//		file   : file
	//	}
	var contract = '';

	// 여기서 compiler로부터 abi만 추출 받는다.
	var constructor = txHelper.getConstructorInterface(contract.contract.object.abi);
	txFormat.buildData(selectedContract.name, contract.contract.object, self.compiler.getContracts(), true, constructor, args, (error, data) => {
		dapp.createContract(data, (error, txResult) => {
			if(txResult.result.status && txResult.result.status == '0x0') {
				console.log('transaction execution fail');
			}
			console.log(data);
		});
	});
}

function addAccount() {
	var dapp = registry.get('udapp').api;
	dapp.newAccount('', (error, address) => {
		if (!error) {
			console.log("add account " + address);
		} else {
			console.log('Cannot create an account: ' + error)
		}
	});
}


function accounts() {
	var dapp = registry.get('udapp').api;

	dapp.getAccounts((err, accounts) => {
		if (err) { console.log('cannot find accounts'); }
		if (accounts && accounts[0]) {
			for (var a in accounts) { 
				console.log(accounts[a]);
			}
		} else {
			console.log('unknown');
		}
	});
}

function run() {
	var self = this;

	var udapp = new dApp({
		removable: false,
		removable_instances: true
	});

	registry.put({api: udapp, name: 'udapp'});
}

module.exports = App;