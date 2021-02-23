import React, {useEffect, useState} from 'react';


import FlightSuretyApp from './build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import { Container } from "@chakra-ui/react"
import InfoTab from "./InfoTab"
import InsuranceTab from "./InsuranceTab";
import ManagementTab from "./ManagementTab";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

const axiosJS = require('axios');

const NETWORK = 'localhost'; // hardcoded for now
const config = Config[NETWORK];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);



const Contract = (props) => {

    const [owner, setOwner] = useState("");
    const [airlines, setAirlines] = useState([]);
    const [flights, setFlights] = useState([]);
    const [passengers, setPassengers] = useState([]);
    const [isOperational, setIsOperational] = useState(false);
    const [currentStatus, setCurrentStatus]= useState(-1);
    const [statusList, setStatusList]= useState([]);
    const axios = axiosJS.create({
        baseURL: '/api/',
        timeout: 1000
    });

    const getAirlines = async () => {
        try {
            let airlineCount = await flightSuretyApp.methods.getAirlineCount().call({from: owner});
            console.log({airlineCount});
            console.log(`******* ${airlineCount}`);
            let airlinesTemp = []
            // Add each registered and funded airline (created by server) to state
            for (let i = 0; i < airlineCount; i++) {
                let airline = await flightSuretyApp.methods.getAirlineInfoByIdx(i).call({from: owner});
                 airlinesTemp.push({
                    airlineAccount: airline.airlineAddress,
                    companyName: airline.companyName
                });

            }
            setAirlines(airlinesTemp);
        } catch (e) {
            console.error({e});
        }
    };


    const getFlights = async () => {
        try {
            const {data} = await axios.get('/flights');
            console.log(`FLIGHT NUMBER ******* ${data.length}`);
            console.log(data.length);
            setFlights(data);
            console.log({data});
        } catch (e) {
            console.error({e});
        }
    };



    const getFlightsStatus = async () => {
      try {
        
          const {data} = await axios.get('/flightStatus');
          console.log(data);
            
         setCurrentStatus(data.currentStatus);
          setStatusList(data.statusList);

      } catch (e) {
          console.error({e});
      }
  };
    // On startup, initialise
    useEffect(() => {








        const getPassengers = (accts) => {
            const passengerConcat = (accts, offset, counter) => (p) => p.concat(accts[offset + counter]);
            return () => {
                const offset = 10;
                let counter = 1;
                let passengersTemp = []
                while (counter < 5) {
                    passengersTemp.push(accts[offset + counter++]);
                    
                }
                setPassengers(passengersTemp);
            }
        };


        web3.eth.getAccounts( (error, accts) => {
            console.log('Got accounts!', {accts}, {error})
            if (error) {
                alert(error)
            } else {

                setOwner(accts[0]);

                  getAirlines().then(getFlights).then(getFlightsStatus).then(getPassengers(accts));

                flightSuretyApp.methods
                    .isOperational()
                    .call({from: owner}, (err, result) => {
                        if (err) {
                            console.error(err)
                        } else {
                            setIsOperational(result);
                            console.log('isOperational: ', {err, result});
                        }
                    });
            }
        });
    }, [owner]);

    const toggleContractAppStatus = (e)=> {
       console.log("*** toggleContactAppStatus ********")
        console.log(isOperational);
        flightSuretyApp.methods.setOperationalStatus(!isOperational)
        .send({from: owner}, (err, res  ) => {
            if (err) {
                console.error(err);
            }else {
                console.log('setOperationalStatus: ', {err, res});
                flightSuretyApp.methods
                .isOperational()
                .call({from: owner,block:"latest"}, (err, result) => {
                    if (err) {
                        console.error(err)
                    } else {
                        
                  
                        getAirlines().then((res) => {
                            if(airlines.length===0){
                                return [];
                            }else {
                              return  getFlights();
                            }
                         
                            
                        })
                        setIsOperational(result);
                        console.log('isOperational: ', {err, result});
                        
                 }});
                      
            }         
        });
    } 

    console.log({airlines})

    // const {flights} = props;

    return (
        < React.Fragment >

        < Container   maxW="xl" >
        < Tabs
    id = "uncontrolled-tab-example" isFitted size="lg" variant="enclosed">
  <TabList>
    <Tab>Info</Tab>
    <Tab>Insurance</Tab>
    <Tab>Management</Tab>
  </TabList>

  <TabPanels>
    <TabPanel>        < InfoTab
    isoperational = {isOperational}
    airlines = {airlines}
    flights = {flights}
    passengers = {passengers}
    />
    </TabPanel>

    <TabPanel> 
        < InsuranceTab
    flightsuretyapp = {flightSuretyApp}
    flights = {flights}
    owner={owner}
    passengers = {passengers}
    statusList={statusList}
    web3= {web3}

    />
      </TabPanel>

      <TabPanel>
     <ManagementTab
     flightsuretyapp = {flightSuretyApp}     
    isoperational = {isOperational}
    airlines = {airlines}
    flights = {flights}
    passengers = {passengers} 
    toggleContractStatus= {toggleContractAppStatus}
    currentStatus ={currentStatus}
    statusList={statusList}
    axios={axios}/>

    </TabPanel>
    </TabPanels>


   </ Tabs>
   </ Container>

   </ React.Fragment>
)
};

export default Contract;