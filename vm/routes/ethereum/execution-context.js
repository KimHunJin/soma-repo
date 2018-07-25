var EthJSVM = require('ethereumjs-vm');
var StateManager = require('ethereumjs-vm/dist/stateManager');
var Web3 = require('web3');
var Web3VMProvider = require('../utils/Web3VmProvider');
var ethUtil = require('ethereumjs-util');

class StateManagerCommonStorageDump extends StateManager {
	constructor (arg) {
		super(arg);
		this.keyHashes = {};
	}

	putContractStorage (address, key, value, cb) {
		this.keyHashes[ethUtil.sha3(key).toString('hex')] = ethUtil.bufferToHex(key);
		super.putContractStorage(address, key, value, cb);
	}

	dumpStorage (address, cb) {
		var self = this;
		this._getStorageTrie(address, function (err, trie) {
			if (err) {
				return cb(err);
			}
			var storage = {};
			var stream = trie.createReadStream();
			stream.on('data', function (val) {
				var value = rlp.decode(val.value);
				storage['0x' + val.key.toString('hex')] = {
					key: self.keyHashes[val.key.toString('hex')],
					value: '0x' + value.toString('hex')
				}
			});
			stream.on('end', function () {
				cb(storage);
			});
		});
	}
}

// var mainNetGenesisHash = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3';

var stateManager = new StateManagerCommonStorageDump({});
var vm = new EthJSVM({
	enableHomestead: true,
	activatePrecompiles: true
});

vm.stateManager = stateManager
vm.blockchain = stateManager.blockchain
vm.trie = stateManager.trie
vm.stateManager.checkpoint()

var web3Vm = new Web3VMProvider();
web3Vm.setVM(vm);


function ExecutionContext(){
	var self = this;
	var excutionContext = null;

	self.blockGasLimitDefault = 4300000;
	self.blockGasLimit = self.blockGasLimitDefault;

	self.excutionContext = 'vm';

	self.getProvider = function() {
		return excutionContext;
	}

	self.vm = function() {
		return vm;
	}
}

module.exports = new ExecutionContext();