'use strict'

var solc = require('solc');
var fs = require('fs');

fs.readFile('./contract/Casino.sol', 'utf8', function(err, data) {
	if(err) {throw err};
	// console.log(data);

	// getting the development snapshot
	solc.loadRemoteVersion('latest', function (err, solcSnapshot) {
		if (err) {
		// An error was encountered, display and quit
		}
		var output = solcSnapshot.compile(data, 1);
		console.log(output.contracts);
		// console.log(output.bytecode);
		// console.log(output.interface);
		// console.log(output.opcodes);
	});
});



module.exports = fs;

