'use strict'
var executionContext = require('./execution-context');
var dApp = require('./dApp');
//var Compiler = require('./compile/compile');
var registry = require('./global/registry');
var txFormat = require('./txFormat');
var txHelper = require('./txHelper');
var fs = require('fs');
var Compiler = require('./compile/compile');
var Web3 = require('web3');

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

	selectAccount() {

		var web3 = new Web3();
		// todo ; select index (account index)
		// todo ; input value (ether)

		var self = this;
		var dapp = registry.get('udapp').api;

		var currentAccount;
		dapp.getAccounts((err, accounts) => {
			if (err) { console.log('cannot find accounts'); }
			if (accounts && accounts[0]) {
				currentAccount = accounts[0];
			} else {
				console.log('unknown');
			}
		});

		registry.put({api: currentAccount, name:'currentAccount'});

		dapp.getBalance(currentAccount, function(err, res) {
			console.log(executionContext.web3().fromWei(res, 'ether'));
		});
	}

 // 컴파일
	runCompiler() {
		var self = this;
		var target = "casino";
		var sources = {};

		var compiler = new Compiler();
		registry.put({api: compiler, name: 'compiler'});

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



	test() {
		var self = this;
		var compiler = registry.get('compiler').api;
//		console.log(compiler.lastCompilationResult);
		var abi = compiler.getContract("Casino").object;

		var dapp = registry.get('udapp').api;

		var currentAccount = registry.get('currentAccount').api;

		console.log(dapp.getABI(abi));

		self._components = {};
		self._components.transactionContextAPI = {
			getAddress: (cb) => {
				cb(null, currentAccount);
			},
			getValue: (cb) => {
				cb(null, executionContext.web3().toWei('5', 'wei'));
			},
			getGasLimit: (cb) => {
				cb(null, 3000000);
			}
		}		

		dapp.resetAPI(self._components.transactionContextAPI);

		createInstance.apply(self);
//		console.log(compiler.lastCompilationResult.data.contracts);
//		console.log(compiler.lastCompilationResult.data.contracts.);
//		console.log(compiler.lastCompilationResult);
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

	var compiler = registry.get('compiler').api;
	var dapp = registry.get('udapp').api;

	// contract 구조
	//	{
	//		object : contracts[file][contractName]
	//		file   : file
	//	}
	var contract = {
		name: "Casino",
		contract: compiler.getContract("Casino")
	};

	console.log(contract);

	var args = [10,10];

	console.log(args);

	// 여기서 compiler로부터 abi만 추출 받는다.
	var constructor = txHelper.getConstructorInterface(contract.contract.object.abi);
	console.log(constructor);


	console.log('build data start');
	console.log('');
	txFormat.buildData(contract.name, contract.contract.object, compiler.getContracts(), true, constructor, args, (error, data) => {
		console.log('build data');
		console.log(data);
		dapp.createContract(data, (error, txResult) => {
			console.log(data);
			if(txResult.result.status && txResult.result.status == '0x0') {
				console.log('transaction execution fail');
			}
			console.log(data);
			var address = txResult.result.createdAddress;
		});
	}, (msg) => {
		console.log(msg);
	}, (data, runTxCallback) => {
		dapp.runTx(data, runTxCallback);
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