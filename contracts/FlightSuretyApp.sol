pragma solidity >=0.4.22 <0.9.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract


    uint8 private constant CONSENSUS_THRESHOLD = 4;
    uint8 private constant VOTE_SUCCESS_THRESHOLD = 2;

    uint256 public constant MAX_INSURANCE_AMOUNT = 1 ether;
    uint256 public constant MIN_AIRLINE_FUNDING = 10 ether;


    address payable public  dataContractAddress;

    FlightSuretyData private flightData;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor(address payable dataContract) public{
        contractOwner = msg.sender;
        dataContractAddress = dataContract;
        flightData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(flightData.isOperational() == true, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }



    modifier requireRegisteredAirlineCaller() {
        require(
            flightData.isAirlineRegistered(msg.sender) == true,
            "Only an existing airline may register an airline or participate in consensus"
        );
        _;
    }

    modifier requireFundedAirlineCaller() {
        require(
            flightData.isAirlineFunded(msg.sender) == true,
            "Only a funded airline may register an airline or participate in consensus"
        );
        _;
    }

    modifier requireNominated(address airlineAddress) {
        require(
            flightData.isAirlineNominated(airlineAddress) == true,
            "Airline cannot be registered"
        );
        _;
    }

    modifier requireNotRegistered(address airlineAddress) {
        require(
            flightData.isAirlineRegistered(airlineAddress) != true,
            "Airline is already registered"
        );
        _;
    }

    modifier requireNotFunded(address airlineAddress) {
        require(
            flightData.isAirlineFunded(airlineAddress) != true,
            "Airline is already funded"
        );
        _;
    }

    modifier requireFlightRegistered(
        address airline,
        string memory flight,
        uint256 departureTime
    ) {
        require(
            isFlightRegistered(airline, flight, departureTime) == true,
            "Flight must be registered"
        );
        _;
    }

    modifier rejectOverpayment() {
        require(
            msg.value <= MAX_INSURANCE_AMOUNT,
            "A maximum of 1 ether may be sent to purchase insurance"
        );
        _;
    }

    modifier requireSufficientReserves(
        address airlineAddress,
        uint256 insuranceAmount
    ) {
        uint256 grossExposure =
            flightData
                .totalUnderwritten(airlineAddress)
                .add(insuranceAmount)
                .mul(3)
                .div(2);
        require(
            grossExposure <= flightData.amountAirlineFunds(airlineAddress),
            "Airline has insufficient reserves to underwrite flight insurance"
        );
        _;
    }

    modifier requireRegisteredOracle(address oracleAddress) {
        require(
            oracles[oracleAddress].isRegistered == true,
            "Oracle must be registered to submit responses"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       EVENTS                                             */
    /********************************************************************************************/

    event AirlineNominated(address indexed airlineAddress);

    event AirlineRegistered(address indexed airlineAddress);

    event AirlineFunded(
        address indexed airlineAddress,
        uint256 amount
    );

    event FlightRegistered(
        address indexed airlineAddress,
        string flight
    );

    event InsurancePurchased(address indexed passengerAddress, uint256 amount);

    event InsurancePayout(address indexed airlineAddress, string flight);

    event InsuranceWithdrawal(address indexed passengerAddress, uint256 amount);


    event OracleRegistered(address indexed oracleAddress, uint8[3] indexes);



    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() external view
 
                            returns(bool) 
    {
        return flightData.isOperational();  // Modify to call data contract's status
    }

    function setOperationalStatus(bool mode)
        external
        requireContractOwner
        returns (bool)
    {
        return flightData.setOperationalStatus(mode);
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function isAirlineNominated(address airlineAddress)
        external
        view
        requireIsOperational
        returns (bool)
    {
        return flightData.isAirlineNominated(airlineAddress);
    }
    function isAirlineRegistered(address airlineAddress)
        external
        view
        requireIsOperational
        returns (bool)
    {
        return flightData.isAirlineRegistered(airlineAddress);
    }

    function isAirlineFunded(address airlineAddress)
        external
        view
        requireIsOperational
        returns (bool)
    {
        return flightData.isAirlineFunded(airlineAddress);
    }
    
    function airlineMembership(address airlineAddress)
        external
        view
        requireIsOperational
        returns (uint)
    {
        return flightData.airlineMembership(airlineAddress);
    }

    function nominateAirline(address airlineAddress,string memory _companyName)
        external
        requireIsOperational
    {
        flightData.nominateAirline(airlineAddress,_companyName);
        emit AirlineNominated(airlineAddress);
    } 

   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline(address airlineAddress)
        external
        requireIsOperational
        requireFundedAirlineCaller
        requireNotFunded(airlineAddress)
        requireNotRegistered(airlineAddress)
        requireNominated(airlineAddress)
        returns (bool success)
    {
        uint256 votes = flightData.voteAirline(airlineAddress, msg.sender);
        if (flightData.registeredAirlineCount() >= CONSENSUS_THRESHOLD) {
            if (votes >= flightData.registeredAirlineCount().div(VOTE_SUCCESS_THRESHOLD)) {
                success = flightData.registerAirline(airlineAddress);
                emit AirlineRegistered(airlineAddress);
            } else {
                success = false; // not enough votes
            }
        } else {
            // no conensus required
            success = flightData.registerAirline(airlineAddress);
            emit AirlineRegistered(airlineAddress);
        }
        return success; // cannot have votes if just registered
    }

    function numberAirlineVotes(address airlineAddress)
        external
        view
        requireIsOperational
        returns (uint256 votes)
    {
        return flightData.numberAirlineVotes(airlineAddress);
    }



    function fundAirline()
        external
        payable
        requireIsOperational
        requireRegisteredAirlineCaller
    {
        require(
            msg.value >= MIN_AIRLINE_FUNDING,
            "Airline funding requires at least 10 Ether"
        );
        dataContractAddress.transfer(msg.value);
        flightData.fundAirline(msg.sender, msg.value);
        emit AirlineFunded(msg.sender, msg.value);
    }
    function amountAirlineFunds(address airlineAddress)
        external
        view
        requireIsOperational
        returns (uint256)
    {
        return flightData.amountAirlineFunds(airlineAddress);
    }
   function isFlightRegistered(
        address airline,
        string memory flight,
        uint256 departureTime
    ) public view requireIsOperational returns (bool) {
        bytes32 flightKey = getFlightKey(airline, flight, departureTime);
        return flightData.isFlightRegistered(flightKey);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight(
        string memory flight,
        uint256 departureTime 
    ) external requireIsOperational requireFundedAirlineCaller {
        flightData.registerFlight(
            msg.sender,
            flight,
            departureTime,
            STATUS_CODE_UNKNOWN
        );
        emit FlightRegistered(msg.sender, flight);
    }
    

    function officialFlightStatus(
        address airline,
        string memory flightName,
        uint256 departureTime
    ) external view requireIsOperational returns (uint8) {
        bytes32 flightKey = getFlightKey(airline, flightName, departureTime);
        return flightData.getFlightStatus(flightKey);
    }

    function buyFlightInsurance(
        address airline,
        string memory flight,
        uint256 departureTime
    )
        external
        payable
        requireIsOperational
        rejectOverpayment
        requireSufficientReserves(airline, msg.value)
    {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        flightData.buyInsurance(msg.sender, msg.value, key, airline);
        dataContractAddress.transfer(msg.value);
        emit InsurancePurchased(msg.sender, msg.value);
    }

    function isPassengerInsured(
        address passenger,
        address airline,
        string memory flight,
        uint256 departureTime
    ) external view requireIsOperational returns (bool) {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        return flightData.isPassengerInsured(passenger, key);
    }

    function isPaidOut(
        address airline,
        string memory flight,
        uint256 departureTime
    ) external view requireIsOperational returns (bool) {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        return flightData.isPaidOut(key);
    }

    function passengerBalance(address passengerAddress)
        external
        view
        requireIsOperational
        returns (uint256)
    {
        return flightData.currentPassengerBalance(passengerAddress);
    }

     //safewithdraw
    function withdrawBalance(uint256 withdrawalAmount)
        external
        requireIsOperational
    {
        flightData.payPassenger(msg.sender, withdrawalAmount);
        emit InsuranceWithdrawal(msg.sender, withdrawalAmount);
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
    {
         bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flightData.updateFlightStatus(statusCode, flightKey);
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightData.creditInsurees(flightKey, airline);
            emit InsurancePayout(airline, flight);
        }
    }



    // Generate a request for oracles to fetch flight information
     function fetchFlightStatus
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp                            
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);
        openOracleResponse(index, airline, flight, timestamp);
    }


      function getAirlineCount() public view returns (uint256) {
        return flightData.getAirlineCount();
    }



    function getAirlineInfoByIdx(uint256 idx) public view returns (address airlineAddress, string memory companyName,uint status,uint256 funds,
        uint256 underwrittenAmount) {
        return  flightData.getAirlineInfoByIdx(idx);
        

    }


    function getAirlineInfo(address _airlineAddress) public view returns (address airlineAddress,string memory companyName, uint status,uint256 funds,
        uint256 underwrittenAmount) {
        return flightData.getAirlineInfo(_airlineAddress);
        

    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);



    function isOracleRegistered(address oracleAddress)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return oracles[oracleAddress].isRegistered;
    }

    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);


        Oracle storage oracle = oracles[msg.sender];
        oracle.isRegistered = true;
        oracle.indexes = indexes;
        dataContractAddress.transfer(msg.value);
        emit OracleRegistered(msg.sender, indexes);
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

     modifier validateOracle(uint8 index) {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");
        _;
    }

    function openOracleResponse(
                            uint8 index,
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        ) internal 
    {
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        
        ResponseInfo storage response = oracleResponses[key];
        response.requester = msg.sender;
        response.isOpen = true;

        
        emit OracleRequest(index, airline, flight, timestamp);
    }
    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string memory flight,
                            uint256 departureTime,
                            uint8 statusCode
                        )
                        external
                        validateOracle(index)
    {
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, departureTime));
        require(oracleResponses[key].isOpen == true, "Key does not match oracle request");
        oracleResponses[key].responses[statusCode].push(msg.sender);
        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, departureTime, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {
            emit FlightStatusInfo(airline, flight, departureTime, statusCode);
            // Handle flight status as appropriate
            processFlightStatus(airline, flight, departureTime, statusCode);
        }
    }




    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   
