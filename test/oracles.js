
var Test = require('../config/testConfig.js');
const { expect } = require("chai");

const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  balance,
  ether,
  send,
} = require("@openzeppelin/test-helpers");

contract('Oracles', async (accounts) => {

  let config;
  let app;
  let actors;
  let actorNames;
  let oracles;
  let oracleRegistrationFee;
  
  let airlineFundingAmount;
  let insuranceAmount;

  let flightName;
  let departureTime;
  let flightAirline;
  let passengerAddress;

  let reportedFlightStatus;


  const TEST_ORACLES_COUNT = 20;
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

    config = await Test.Config(accounts);
    app = config.flightSuretyApp;
    actors = config.actors;
    actorNames = config.actorNames;
    oracles = config.oracles;
    oracleRegistrationFee = ether("1");
    MIN_ORACLE_RESPONSES = 3;

    airlineFundingAmount = ether("10");
    insuranceAmount = ether("1");
    flightName = "NH278";
    departureTime = "1609623567158";
    flightAirline = actors.airline1;
    passengerAddress = actors.passenger1;
    reportedFlightStatus = STATUS_CODE_ON_TIME;


    console.log("-----------------------");
    console.log("Passenger address: " + passengerAddress);
    console.log("Flight Airline: " + flightAirline);
    console.log("Flight Name:    " + flightName);
    console.log("Departure Time: " + departureTime);

  });


  it('can register oracles', async () => {
    
    // ARRANGE
    //let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    // for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
    //   await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
    //   let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
    //   console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    // }
    oracles.forEach(async (oracleAccount) => {
      let tx = await app.registerOracle({
        from: oracleAccount,
        value: oracleRegistrationFee,
      });
      let result = await app.getMyIndexes.call({ from: oracleAccount });
      expectEvent(tx, "OracleRegistered", {
        oracleAddress: oracleAccount,
        indexes: result,
      });

      expect(await app.isOracleRegistered.call(oracleAccount)).to.be.true;
    });



  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(flightAirline, flightName, timestamp, {from: passengerAddress});
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<oracles.length; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: oracles[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });

        }
        catch(e) {
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }


  });


 
});
