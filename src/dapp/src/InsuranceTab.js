import React, {useState, useEffect} from "react";
import { Box ,Flex, Stack,owner, Alert, AlertIcon} from "@chakra-ui/react"


import Web3 from 'web3';


const InsuranceTab = (props) => {

    const {flightsuretyapp, passengers,owner, flights,statusList,web3} = props;
 
    const [passenger, setPassenger] = useState("");
    const [credit, setCredit] = useState("");
    const [balance, setBalance] = useState("");
    const [flight, setFlight] = useState("");
    const [flightBalance, setFlightBalance] = useState("");
    const [amount, setAmount] = useState("");
    const [alertMessage, setAlertrMessage] = useState("");
    const [type, setType] = useState("");
    const TYPE_ERROR="ERROR";
    const TYPE_SUCCESS="SUCCESS";
    const TYPE_INFO="INFO";




    const showAlert = () =>{
        if(type===TYPE_ERROR){
         return   <Alert id="errorMsg" status="error"  color="black">
            <AlertIcon />
           {alertMessage}
          </Alert>

        }
        else if (type===TYPE_SUCCESS) {
            return  <Alert id="successMsg" status="success" color="black" >
            <AlertIcon />
           {alertMessage}
          </Alert>
        }
        else if (type===TYPE_INFO) {
            return  <Alert id="infoMsg
            " status="info" color="black" >
            <AlertIcon />
           {alertMessage}
          </Alert>
        }
        return "";        

    }



    console.log("INSURANCE TAB");
    console.log({passenger}, {flight}, {amount})



    const buyInsurance = () => {
        setType("");
        const _flight = JSON.parse(flight);
        console.log({amount, _flight})
        const weiValue = Web3.utils.toWei(amount, 'ether');
        flightsuretyapp.methods
            .buyFlightInsurance(_flight.airline, _flight.callSign, _flight.timestamp)
            .send({from: passenger, value: weiValue, gas: "450000"}, (err, result) => {
                if (err) {
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR);
                    
                } else {

                    
                    setAlertrMessage('Payment accepted!');
                    setType(TYPE_SUCCESS);
                }
            });
    };




    const requestFlightStatus= () => {
         setType("");
        const _flight = JSON.parse(flight);
        console.log({amount, _flight, passenger})
        flightsuretyapp.methods
            .fetchFlightStatus(_flight.airline, _flight.callSign, _flight.timestamp)
            .send({from: owner}, (err, result) => {
                if (err) {
                    console.error(err)
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR)
                } else {

                    setAlertrMessage('Flight status requested!');
                    setType(TYPE_SUCCESS);

                }
            });

        web3.eth.getBalance(_flight.airline, 'latest', (err, res) => { 
                if (err) {
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR);
                } else {
                    setFlightBalance(Web3.utils.fromWei(res.toString(), 'ether')+ " ETH")
                }
            });
    };


    const withdrawCredits= () => {
        setType("");
        const _flight = JSON.parse(flight);
        console.log({amount, _flight, passenger})
        flightsuretyapp.methods
            .withdrawBalance(Web3.utils.toWei(credit.replace("ETH","").trim(),"ether"))
            .send({from: passenger}, (err, result) => {
                if (err) {
                    console.error(err)
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR)
                } else {

                    setAlertrMessage('Withdrawa balance requested!');
                    setType(TYPE_SUCCESS);

                }
            });

    }


    const updateCreditField = () => {

        if(passenger === ""){
            console.info("passenger not selected")
            return setCredit("0 ETH" );
        }
        flightsuretyapp.methods
            .passengerBalance(passenger)
            .call({from: passenger}, (err, result) => {
                if (err) {
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR);
                } else {
                    console.log({result})
                    const intResult = Web3.utils.fromWei(result.toString(), 'ether')+ " ETH";
                   // const intCredit = credit && parseInt(credit.replace("ETH","").trim());
                    if (credit !== intResult) {
                       // console.log({credit})
                       // Web3.utils.toEther(amount, 'wei');
                        setCredit(intResult);
                    }
                }
            });

            web3.eth.getBalance(passenger, 'latest', (err, res) => { 
                if (err) {
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR);
                } else {
                    setBalance(Web3.utils.fromWei(res.toString(), 'ether')+ " ETH")
                }
            });

            if(flight===""){
                return ;
            }
            const _flight = JSON.parse(flight);
            web3.eth.getBalance(_flight.airline, 'latest', (err, res) => { 
                if (err) {
                    console.error(err)
                    setAlertrMessage(""+err);
                    setType(TYPE_ERROR);
                } else {
                    setFlightBalance(Web3.utils.fromWei(res.toString(), 'ether')+ " ETH")
                }
            });
    }

    // flightsuretyapp.events.FlightStatusInfo({fromBlock: 'latest'},(error, event) =>{
    //   if(error) {console.log(error);}
    //   else {
    //   console.log('Caught an event: ');
    //   let eventResult = event['returnValues'];
    //   console.log(eventResult);}}

      
    //   );


    flightsuretyapp.events.InsuranceWithdrawal({})
    .on('data', async function(event){
        setType("");
        setAlertrMessage(`the amount "${event.returnValues.amount}" wei transfered to  "${event.returnValues.passengerAddress}" ` );
        setType(TYPE_INFO);
    })
    .on('error', console.error);
    flightsuretyapp.events.FlightStatusInfo({})
    .on('data', async function(event){
        setType("");
        console.log("*****Flight status Infos*****");
        console.log(event.returnValues);
        console.log("*********FlightStatusInfo+++++*");
        setAlertrMessage(`The status of the flight "${event.returnValues.flight}" is "${event.returnValues.status}" : ${statusList.filter((e)=> 
            e.status===parseInt(event.returnValues.status)).map(e => e.label)} ` );
        setType(TYPE_INFO);
       
    })
    .on('error', console.error);


    // Will retrieve credit for the selected passenger
    useEffect(() => {
        console.log('hi')
        updateCreditField();


    },[alertMessage,passenger,flight]);


    return <Box>
                <Stack>
        <Flex>
            <div className="panel">
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <label className="input-group-text">Passenger</label>
                    </div>
                    <select className="custom-select" onChange={(e) =>{ setType("");setPassenger(e.target.value)}}>
                        <option>Choose account...</option>
                        {
                            passengers && passengers.map((passenger, idx) =>
                                <option value={passenger}>{passenger}</option>
                            )
                        }
                    </select>
                </div>

                {<div className="passenger-credit">Passenger credit: {credit}</div>}
                {<div className="passenger-credit">Passenger Balance: {balance}</div>}
   

                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <label className="input-group-text">Flight</label>
                    </div>
                    <select className="custom-select" onChange={(e) =>{ setType(""); setFlight(e.target.value)}}>
                        <option>Choose flight...</option>
                        {
                            flights && flights.map((flight, idx) =>
                                <option  key={idx}
                                    value={JSON.stringify(flight)}>{flight.callSign} @ {new Date(flight.timestamp).toLocaleString()}</option>
                            )
                        }
                    </select>
                </div>
                {<div className="passenger-credit">Airline Balance: {flightBalance}</div>}
                <div className="input-group mb-3">
                    <div className="input-group-prepend">
                        <span className="input-group-text">Pay Ξ</span>
                    </div>
                    <input type="text" className="form-control"
                           aria-label="Amount (in Ether)"
                           value={amount} onChange={(e) => setAmount(e.target.value)}
                           placeholder="Amount (in Ether)"
                    />
                </div>

                <button type="button" className="btn btn-primary" onClick={buyInsurance}
                        disabled={!passenger || !flight || !amount || parseFloat(amount) <= 0}>Buy
                    Insurance!
                </button>

                <button type="button" className="btn btn-dark"
                        onClick={requestFlightStatus}
                        disabled={ !flight || !passenger}>Request Flight Status
                </button>
                <button type="button" className="btn btn-dark"
                        onClick={withdrawCredits}
                        disabled={ !flight || !passenger}>Withdraw Insurance
                </button>

            </div>
        </Flex>

{showAlert()}
  </Stack>


    </Box>
};


export default InsuranceTab;