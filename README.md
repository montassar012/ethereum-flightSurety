# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Versions 

- Truffle v5.1.61 
- Solidity - 0.6.12 
- Node v15.5.1
- Web3.js v1.2.9
- Ganache v1.2.3

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using React, Chakra-U ) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`npm --prefix ./src/dapp install ./src/dapp`

`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`
`truffle test ./test/oracleLate.js`
`truffle test ./test/oraclesOnTime.js`


To use the server and dapp :

1. `./start-ganache.sh`
2. `truffle migrate --reset`
3. `npm run server`
4. `rm -rf ./src/dapp/src/build && cp -r ./build ./src/dapp/src/ && npm --prefix ./src/dapp/ start dapp` 
    OR
   `./start-dapp.sh`


To view dapp:

`http://localhost:8000`











## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)