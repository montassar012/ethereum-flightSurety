import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import faker from 'faker';
import { SingleEntryPlugin } from 'webpack';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

// Flights will keep a track of all scheduled
// flights for the WebApp for convenience
let flights = [];
const AIRLINES_COUNT = 10;
const TEN_ETHER = Web3.utils.toWei("10");
const CONSENSUS_THRESHOLD = 4;
const VOTE_SUCCESS_THRESHOLD = 2;
let accIdx = 2;




/////////////
// Airlines
/////////////
const registerAirlines = async () => {
  console.log('\nRegistering Airlines..\n');
  try {
      const accounts = await web3.eth.getAccounts();
      let totalRegistered = await flightSuretyApp.methods.getAirlineCount().call({from: accounts[0], gas: "450000"});  // get Total Registered number
      console.log(`++++++Total registered ++++++ ${totalRegistered} +++++++++++++`);
      let attempts = 0;
      // Contract will be created with an initial first airline
      let firstAirline = await flightSuretyApp
      .methods
      .getAirlineInfoByIdx(0)
      .call({from: accounts[0], gas: "450000"});
      if(totalRegistered < 1 ||firstAirline.status <3){

      console.log({firstAirline})
      totalRegistered++;
      await flightSuretyApp
          .methods
          .fundAirline()
          .send({from: firstAirline.airlineAddress, value: TEN_ETHER});
      console.log({firstAirline})
      totalRegistered++;
      }
      firstAirline=await flightSuretyApp
      .methods
      .getAirlineInfoByIdx(0)
      .call({from: accounts[0], gas: "450000"});
      totalRegistered= await flightSuretyApp.methods.getAirlineCount().call({from: accounts[0], gas: "450000"});
      accIdx=totalRegistered+1;
      while (accIdx <= accounts.length &&
      totalRegistered < AIRLINES_COUNT) {
          attempts++;
          const acc = accounts[accIdx];
          
          const companyName = faker.random.alpha({count: 4,upcase: true})+ " Airlines";
          console.log(`infos Airline =>${accIdx}: ${companyName} ${acc}`);
          

          try {
             await flightSuretyApp
              .methods
             .nominateAirline(acc, faker.random.alpha({count: 4,upcase: true})+ " Airlines")
              .send({from: firstAirline.airlineAddress, gas: "450000"});
              // Register a new airline...
              console.log(`ADRSSSS2 => totaRegistered ${totalRegistered} ----${acc}------:*******${firstAirline.airlineAddress} +++  ++++ ${firstAirline.status}*****`);
              await flightSuretyApp
                  .methods
                  .registerAirline(acc)
                  .send({from: firstAirline.airlineAddress, gas: "450000"});
              let voters =1;
              while(totalRegistered>= CONSENSUS_THRESHOLD ){
                let airlineInfos = await flightSuretyApp.methods.getAirlineInfo(acc).call({from: accounts[0]} );
                console.log(`airlineInfos => totaRegistered ${totalRegistered} ---:*******${airlineInfos.status} +++  ++++ ${accIdx}** +++${voters}***`);
                if(airlineInfos.status>1){
                  break;
                }
                let voter = await flightSuretyApp.methods.getAirlineInfoByIdx(totalRegistered-voters).call({from: accounts[0]} );
                await flightSuretyApp
                .methods
                .registerAirline(acc)
                .send({from: voter.airlineAddress, gas: "450000"});
                voters++
              }
              await flightSuretyApp
                  .methods
                  .fundAirline()
                  .send({from: acc, value: TEN_ETHER});
              accIdx++;
              totalRegistered++;
          } catch (e) {
              console.log(e);
              throw e;
           //   process.abort();
              
          }
      }
      try {
          let total = await flightSuretyApp
              .methods
              .getAirlineCount()
              .call({from: accounts[0], gas: "450000"});
          console.log('\nAll Airlines registered!', {total});

      } catch (e) {
          console.log(e);
          throw e;
         // process.abort();
      }
  } catch (e) {
      console.error('** ouch', e);
      throw e;
  }
};


/////////////
// Flights
/////////////
const registerFlights = async () => {

  console.log('\nRegistering Flights..\n');
  try {
      const accounts = await web3.eth.getAccounts();

      let airlineCount = await flightSuretyApp.methods.getAirlineCount().call({from: accounts[0]});
      // Add each registered and funded airline (created by server) to state
      for (let i = 0; i < airlineCount; i++) {
          let airline = await flightSuretyApp.methods.getAirlineInfoByIdx(i).call({from: accounts[0]});
          for (let k = 0; k < 2; k++) {
              const callSign = `${airline.companyName.substring(0,2).toUpperCase()}${i}0${k}`;
              const timestamp = Date.now() + Math.floor(Math.random() * 10000000);
              const flight = {airline: airline.airlineAddress,callSign, timestamp};
              console.log({flight});
              // setFlights(flights => flights.concat({flight}));
              await flightSuretyApp.methods.registerFlight(callSign, timestamp).send({
                  from: airline.airlineAddress,
                  gas: "450000"
              });
              flights.push({...flight, airline: airline.airlineAddress});
          }
      }
      console.log({flights})
  } catch (e) {
      console.log(e);
      throw e;
     // process.abort();
  }
};




///   ORACLES //////
flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
});




let oracles = [];
var ORACLES_COUNT = 40, FIRST_ORACLE_ADDRESS = 60, LAST_ORACLE_ADDRESS = 100;

web3.eth.getAccounts().then(accounts => {
  // Make sure there enough accounts to support your oracles
  if(accounts.length < ORACLES_COUNT) 
  {
    console.log('\nServer Error - Not enough accounts to support oracles...\n'+
                'You need at least ' + ORACLES_COUNT + ' to power up the oracles server.');
    return; //abort server
  }
  // Register 20 oracles
  console.log('Ganache returned '+accounts.length+' accounts.');
  console.log('Server will use only '+ORACLES_COUNT+' of these accounts for oracles.');
  console.log('Starting from accounts['+FIRST_ORACLE_ADDRESS+'] for the first oracle.');
  console.log('Ending at accounts['+LAST_ORACLE_ADDRESS+'] for the last oracle.');

  // Initialize oracles addresses and indexes with smart contract
  flightSuretyApp.methods.REGISTRATION_FEE().call({
    "from": accounts[0],
    "gas": 5000000,
    "gasPrice": 100000000000
  }).then(fee => { 
    console.log('Smart Contract requires ('+fee+') wei to fund oracle registration.');
    for(var a = FIRST_ORACLE_ADDRESS;a<LAST_ORACLE_ADDRESS;a++)
    {
      let account = accounts[a];
      oracles.push(account); //To keep the server updated with oracles addresses 
                                  //Because sometimes the oracle is already registered in the contract from before, 
                                  //so it reverts when the server tries to register it again.
      console.log('About to register oracle: '+account);
      flightSuretyApp.methods.registerOracle().send({
            "from": account,
            "value": fee,
            "gas": 5000000,
            "gasPrice": 100000000000
      }).then(result => {
          //oracle created;
          console.log('Registered: '+account);
      }).catch(err => {
          // oracle errored
          console.log('Could not create oracle at address: '+account+'\n\tbecause: '+err);
      })
    } //end for loop

    // Display oracles addresses and indexes previously retrieved from smart contract
   oracles.forEach(oracle => {
      flightSuretyApp.methods
          .getMyIndexes().call({
            "from": oracle,
            "gas": 5000000,
            "gasPrice": 100000000000
          }).then(result => {
            console.log('Assigned Indices: '+result[0]+', '+result[1]+', '+result[2]+'\tfor oracle: '+oracle);

          }).catch(error => {
            console.log('Could not retrieve oracle indices because of: '+error);
          })

    }); //end forEach oracle*/

    console.log('Oracles server all set-up...\nOracles registered and assigned addresses...');
    console.log('Listening to a request event...');

  //Listen for oracleRequest event
  flightSuretyApp.events.OracleRequest({fromBlock: 'latest'}, 
    function(error, event) {
      if(error) console.log(error);
      console.log('Caught an event: ');
      let eventResult = event['returnValues'];
      console.log(eventResult);
      let index = eventResult['index'];
      let airline = eventResult['airline'];
      let flight = eventResult['flight'];
      let timestamp = eventResult['timestamp']; //In real-life scenarios, 
                                          //timestamp is needed to determine flight status near timestamp
                                          //But it will be ignored here since this is just a simulation.
      console.log('Only the oracles with index '+index+' should respond to the request.');

      //Query the oracles with matching index for the flight status
      oracles.forEach(oracle => {
        flightSuretyApp.methods
            .getMyIndexes().call({
              "from": oracle,
              "gas": 5000000,
              "gasPrice": 100000000000
            }).then(result => {
              console.log("***************************");
              console.log(result);
              //console.log('Indices: '+result[0]+', '+result[1]+', '+result[2]+'\tfor oracle: '+oracle);
              if(result[0]==index || result[1]==index || result[2]==index) //matching oracle -> respond with random status
              {
                let flightStatus = 20; // for testing only          
                // let flightStatus = 10 * (1+Math.floor(Math.random() * 5)); 
                //                                                  /* Flight status codes
                //                                                     STATUS_CODE_UNKNOWN = 0; //Oracles should know! - zero out.
                //                                                     STATUS_CODE_ON_TIME = 10;
                //                                                     STATUS_CODE_LATE_AIRLINE = 20;
                //                                                     STATUS_CODE_LATE_WEATHER = 30;
                //                                                     STATUS_CODE_LATE_TECHNICAL = 40;
                //                                                     STATUS_CODE_LATE_OTHER = 50;*/
                console.log('HIT- Responding with random flight statuss: '+flightStatus+' from oracle: '+oracle);                                                    
                //Reply back to smart contract with the determined status code
                console.log(`info => ${index} $$ ${airline} , ${flight}`);
                try{
                flightSuretyApp.methods
                .submitOracleResponse(index, airline,flight, timestamp, flightStatus).send({
                  "from": oracle,
                  "gas": 5000000,
                  "gasPrice": 100000000000
                }).then(result => {
                  console.log('Oracle ['+oracle+'] response submitted successfully.') 
                }).catch(error=>{
                  console.log('Could not submit oracle response because: '+error)
                });
              }catch(error){
                console.log(`error=> ${error}`);
                console.log(error);
              }
                //end submitOracleResponse*/
              }//forEach oracle
  
            }).catch(error => {
              console.log('Could not retrieve oracle indices because 2: '+error);
            })
  
      }); //end forEach oracle
    });
  //*/

  }).catch(err=>{console.log('Could not retrieve registration fee. '+err)});//end REGISTRATION_FEE 
});//end getAccounts





registerAirlines()
.then(registerFlights);

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

app.get('/api/flights', (req, res) => {
  res.json(flights);
})

export default app;


