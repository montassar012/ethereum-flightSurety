import React, {useState, useEffect} from "react";
import { Box ,Flex,Badge,Text,Switch,FormControl,FormLabel} from "@chakra-ui/react"


import Web3 from 'web3';


const ManagementTab = (props) => {

  
    const {flightsuretyapp,isoperational, airlines, flights, passengers,toggleContractStatus} = props;
    const [isActivated, setActivated]= useState(true);
    const [passenger, setPassenger] = useState("");
    const [credit, setCredit] = useState("");
    const [flight, setFlight] = useState("");
    const [amount, setAmount] = useState("");
    console.log("INSURANCE TAB");
    console.log({passenger}, {flight}, {amount})


      

    // const buyInsurance = () => {
    //     const _flight = JSON.parse(flight);
    //     console.log({amount, _flight})
    //     const weiValue = Web3.utils.toWei(amount, 'ether');
    //     flightsuretyapp.methods
    //         .buyFlightInsurance(_flight.airline, _flight.callSign, _flight.timestamp)
    //         .send({from: passenger, value: weiValue, gas: "450000"}, (err, result) => {
    //             if (err) {
    //                 console.error(err)
    //             } else {
    //                 alert('Payment accepted!');
    //             }
    //         });
    // };


    // const requestFlightStatus= () => {
    //     const _flight = JSON.parse(flight);
    //     console.log({amount, _flight, passenger})
    //     flightsuretyapp.methods
    //         .fetchFlightStatus(_flight.airline, _flight.callSign, _flight.timestamp)
    //         .send({from: passenger}, (err, result) => {
    //             if (err) {
    //                 console.error(err)
    //             } else {
    //                 alert('Flight status requested!')
    //             }
    //         });
    // };


   


    // const updateCreditField = () => {
    //     if(passenger == ""){
    //         console.info("passenger not selected")
    //         return setCredit(0);
    //     }
    //     flightsuretyapp.methods
    //         .passengerBalance(passenger)
    //         .call({from: passenger}, (err, result) => {
    //             if (err) {
    //                 console.error(err)
    //             } else {
    //                 console.log({result})
    //                 const intResult = parseInt(result);
    //                 const intCredit = credit && parseInt(credit);
    //                 if (intCredit !== intResult) {
    //                     console.log({credit})
    //                     setCredit(intResult);
    //                 }
    //             }
    //         });
    // }

    // // flightsuretyapp.events.FlightStatusInfo({fromBlock: 'latest'},(error, event) =>{
    // //   if(error) {console.log(error);}
    // //   else {
    // //   console.log('Caught an event: ');
    // //   let eventResult = event['returnValues'];
    // //   console.log(eventResult);}}

      
    // //   );

    // flightsuretyapp.events.FlightStatusInfo({})
    // .on('data', async function(event){
    //     console.log("**********");
    //     console.log(event.returnValues);
    //     console.log("*********+++++*");
       
    // })
    // .on('error', console.error);


    // Will retrieve credit for the selected passenger
    useEffect(() => {
        console.log('Management TAB')
       // updateCreditField();

    });

    return <Box>
<FormControl display="flex" alignItems="center">
  <FormLabel htmlFor="activate-contract" mb="0">
    Activate Flight Surety Contract?
  </FormLabel>
  <Switch id="activate-contract" size="md" colorScheme="teal"  isChecked= {isoperational ? "checked" : "" } onChange={toggleContractStatus}  />
</FormControl>
 </Box>
};


export default ManagementTab;