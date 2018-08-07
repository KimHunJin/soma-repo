'use strict'

var solc = require('solc');
var fs = require('fs');

fs.readFile('./contract/Casino.sol', 'utf8', function(err, data) {
	if(err) {throw err};
	solc.loadRemoteVersion('latest', function (err, solcSnapshot) {
		if (err) {
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
//				console.log(val.contracts[0]);
			});
	});
});



module.exports = fs;

