'use strict'

var solc = require('solc');
var fs = require('fs');
var registry = require('../global/registry');

class Compile {

	fs.readFile('./contract/Casino.sol', 'utf8', function(err, data) {
		if(err) {throw err};
		solc.loadRemoteVersion('latest', function (err, solcSnapshot) {
			if (err) {
				console.log(err);
		// An error was encountered, display and quit
			}

			var p = new Promise(
				function(res, rej) {
					res(solcSnapshot.compile(data, 1));
				}
			);
			p.then(
				function(val) {
					//TODO ; abi 추출
					var bytecode = val.contracts[':Casino'].bytecode;
					console.log(bytecode);

					var abi = JSON.parse(val.contracts[':Casino'].interface);
					console.log(abi);
				}
			);
		});
	});	
}


module.exports = Compile;

