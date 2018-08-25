'use strict'

module.exports = {

  /**
    * return the contract obj of the given @arg name. Uses last compilation result.
    * return null if not found
    * @param {String} name    - contract name
    * @returns contract obj and associated file: { contract, file } or null
    */
  getContract: (contractName, contracts) => {
    for (var file in contracts) {
      if (contracts[file][contractName]) {
        return { object: contracts[file][contractName], file: file }
      }
    }
    return null
  },

  /**
    * call the given @arg cb (function) for all the contracts. Uses last compilation result
    * stop visiting when cb return true
    * @param {Function} cb    - callback
    */
  visitContracts: (contracts, cb) => {
    console.log('visit contract');
    console.log(contracts);
    for (var file in contracts) {
//      console.log(file);
      console.log(contracts[file]);
      for (var name in contracts[file]) {
        console.log(name);
        if (cb({ name: name, object: contracts[file][name], file: file })) return
      }
    }
  }

}
