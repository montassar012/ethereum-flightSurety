import React, {useState, useEffect} from "react";
import { Box ,Flex,Stack,Select,Switch,FormControl,FormLabel} from "@chakra-ui/react"




const ManagementTab = (props) => {

  
    const {isoperational, toggleContractStatus,currentStatus,statusList,axios} = props;
    const [passenger, setPassenger] = useState("");
    const [credit, setCredit] = useState("");
    const [flight, setFlight] = useState("");
    const [amount, setAmount] = useState("");
    // const [currentStatus, setCurrentStatus]= useState(-1);
    // const [statusList, setStatusList]= useState([]);

    console.log({passenger}, {flight}, {amount})


  //   const getFlightsStatus = async () => {
  //     try {
        
  //         const {data} = await axios.get('/flightStatus');
  //         console.log(data);
            
  //       //  setCurrentStatus(data.currentStatus);
  //         setStatusList(data.statusList);

  //     } catch (e) {
  //         console.error({e});
  //     }
  // };

 // getFlightsStatus();

    // Will retrieve credit for the selected passenger
    useEffect(() => {
        console.log('Management TAB')


    });


    const changeFlightStatus= (event)=> {
     axios.post('/flightStatus',{status :parseInt(event.target.value)})
     .then((res) => {

     })
     .catch(err => console.error(err))
    }

    return <Box>
<FormControl display="box"  spacing={7} alignItems="center">
<Stack spacing={7}>
  <Flex>
  <FormLabel htmlFor="activate-contract" mb="0">
    Activate Flight Surety Contract?
  </FormLabel>
  <Switch id="activate-contract" size="md" colorScheme="teal"  isChecked= {isoperational ? "checked" : "" } onChange={toggleContractStatus}  />
  </Flex>
  <Flex>
<FormLabel>
The Flight Status returned by Oracles ?
</FormLabel>
<Select onChange={changeFlightStatus}>

  {
statusList.map((e, idx) =>
<option value={e.status} selected={e.status === currentStatus? "selected":""} >{e.label}</option> )
  }
</Select>
</Flex>
</Stack>
</FormControl>
 </Box>
};


export default ManagementTab;