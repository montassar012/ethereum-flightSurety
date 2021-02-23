import React from "react";
// import Tab from "react-bootstrap/Tab";
import { Box ,Badge , Flex,Text,Accordion,AccordionItem ,AccordionPanel,AccordionButton} from "@chakra-ui/react"



// import Tabs from "react-bootstrap/Tabs";


const InfoTab = (props) => {

    console.log({props})
    const {isoperational, airlines, flights, passengers} = props;

    return (
    <Box>
            <Box>
                <Flex>
                <Text>
                    Service
                </Text>
     
                    <Badge ml="1" variant="solid" colorScheme={isoperational ? "green" : "red"}>
                        {isoperational ? "✔️ Operational" : "Unavailable"}
                    </Badge>
   
                </Flex>
            </Box>

            <Box>
                <Flex>
                    <Accordion allowToggle>
                    <AccordionItem>
                            <AccordionButton >
                            <Box flex="1" textAlign="left"> 
                                 <h4>Airlines</h4>
                                <Badge  ml="1" colorScheme="gray">
                                    {airlines && airlines.length}
                                </Badge>
                            </Box>
                            </AccordionButton>
                   
                            <AccordionPanel pb={4}  >
                            <Box>
                                    {
                                        airlines.map((airline, idx) =>
                                            <div key={airline.airlineAccount}>
                                                {airline.companyName}
                                                ({airline.airlineAccount
                                            && airline.airlineAccount.substring(0, 8)}...)
                                            </div>)
                                    }
                            </Box>
                            </AccordionPanel>
                            </AccordionItem>
                    </Accordion>

                    <Accordion allowToggle>
                    <AccordionItem>
                            <AccordionButton >
                            <Box flex="1" textAlign="left"> 
                                 <h4>Flights</h4>
                                <Badge  ml="1" colorScheme="gray">
                                {flights && flights.length}
                                </Badge>
                            </Box>
                            </AccordionButton>
                   
                            <AccordionPanel pb={4}  >
                            <Box>
                                    {
                                        flights && flights.map((flight, idx) =>
                                        <div key={idx}>
                                            {flight.callSign} @ {new Date(flight.timestamp).toLocaleString()}
                                        </div>)
                                    }
                            </Box>
                            </AccordionPanel>
                            </AccordionItem>
                    </Accordion>
                    <Accordion allowToggle>
                    <AccordionItem>
                            <AccordionButton >
                            <Box flex="1" textAlign="left"> 
                                 <h4>Passengers</h4>
                                <Badge  ml="1" colorScheme="gray">
                                {passengers && passengers.length}
                                </Badge>
                            </Box>
                            </AccordionButton>
                   
                            <AccordionPanel pb={4}  >
                            <Box>
                                    {
                                         passengers && passengers.map((passenger, idx) => <div
                                         key={idx}>{passenger.substring(0, 15)}...</div>)
                                    }
                            </Box>
                            </AccordionPanel>
                            </AccordionItem>
                    </Accordion>
 
         

            </Flex>
            </Box>
    </Box>
       )

};

export default InfoTab;