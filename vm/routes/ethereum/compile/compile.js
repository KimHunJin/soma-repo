'use strict'

var solc = require('solc');
var fs = require('fs');
var compilerInput = require('./compiler-input');
var registry = require('../global/registry');

function Compile {
	var self = this;

	this.lastCompilationResult = {
		data: null,
		source: null
	}

	fs.readFile('./contract/Casino.sol', 'utf8', function(err, data) {
		if(err) {throw err};
		// compiler version get from online
		solc.loadRemoteVersion('latest', function (err, solcSnapshot) {
			if (err) {
				console.log(err);
			}

			var p = new Promise(
				function(res, rej) {
					res(solcSnapshot.compile(data, 1));
				}
			);
			p.then(
				function(val) {
					var bytecode = val.contracts[':Casino'].bytecode; // bytecode
					console.log(bytecode);

					var abi = JSON.parse(val.contracts[':Casino'].interface); // abi
					console.log(abi);
				}
			);
		});
	});	
}


module.exports = Compile;

