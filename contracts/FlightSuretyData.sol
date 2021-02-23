pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    mapping(address => bool) private authorizedCaller;

    

    struct Insurance {
        bytes32 flightKey;
        address passenger;
        uint256 payment;
    }






                         
    mapping(address => Airline) private airlines;               // Mapping for storing airlines
    mapping(uint256 => address) private registredAirlines;    
    mapping(uint => Insurance) private insurances;              // Mapping for storing insurances
   // Insurance[] private insurances;                              // List of passenger insurance
    mapping(address => uint256) private passengerCredit;        // For a given passenger has the total credit due
    
    uint256 private airlineCount;
    mapping(bytes32 => Flight) private flights;                 // keys (see getFlightKey) of flights for airline

    mapping(address => uint256) private payouts;                // Mapping for storing insurance refund payouts
    mapping(address => uint256) private funds;                  // Mapping for storing funds

    uint256 public constant MAX_INSURANCE_POLICY = 1 ether;     //maximum value of purchasing flight insurance
    uint256 public constant AIRLINE_MIN_FUNDS = 10 ether;       //minimum value of participating in contract



    // Mappings


    mapping(bytes32 => FlightInsurance) private flightInsurance;
    mapping(address => uint256) private passengerBalance;

    // Structs
    struct Airline {
        string companyName;
        AirlineStatus status;
        address[] votes;
        uint256 funds;
        uint256 underwrittenAmount;
    }


    
    
    struct FlightInsurance {
        mapping(address => uint256) purchasedAmount;
        address[] passengers;
        bool isPaidOut;
    }
    
    struct Flight {
        bool isRegistered;
        address airline;
        string flight;
        uint256 departureTime;
        uint8 statusCode;
    }
    
    // State Variables
    uint256 public registeredAirlineCount = 0;

    // Enums
    enum AirlineStatus {Nonmember, Nominated, Registered, Funded}
    
    AirlineStatus constant defaultStatus = AirlineStatus.Nonmember;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


   
    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
    (
    )public 
    {

        contractOwner = msg.sender;
        authorizedCaller[contractOwner] = true; // add contractOwner as an authorized caller
        //         airlines[msg.sender] = Airline(
        //     "GENESIS",
        //     AirlineStatus.Funded, 
        //     new address[](0), // no votes
        //     0, // default no funding
        //     0 // no insurance underwritten 
        // );
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
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner || tx.origin==contractOwner, "Caller is not contract data owner");
        _;
    }



    modifier requireCallerAuthorized() {
        require(
            authorizedCaller[msg.sender] == true,
            "Caller is not authorized"
        );
        _;
    }
    
    modifier requireSufficientBalance(address account, uint256 amount) {
        require(amount<=passengerBalance[account], "Withdrawal exceeds account balance");
        _;
    }



    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Rate limiting pattern rateLimit(30 minutes)
    */
    uint256 private enabled = block.timestamp;
    modifier rateLimit(uint time){
        require(block.timestamp >= enabled, "Rate limiting in effect");
        uint256 a = enabled;
        uint256 b = time;
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        enabled = c;

        _;
    }

    /**
    * @dev Re-entrancy Guard
    */
    uint256 private counter = 1;

    modifier entrancyGuard(){
        counter = counter+1;
        uint256 guard = counter;
        _;
        require(guard == counter,"That is not allowed");
    }


    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            external 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperationalStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
                            returns (bool)
    {
        operational = mode;
        return operational;
    }




    /**
    * @dev To authorize contract (this function can be requested from front-end)
    */
    function authorizeCaller(address caller) external
        requireIsOperational
        requireContractOwner {
        require(authorizedCaller[caller] == false, "Address already authorized");
        authorizedCaller[caller] = true;
    }

    /**
    * @dev To deauthorize contract
    */       
    function deauthorizeCaller(address caller) external
        requireIsOperational
        requireContractOwner{
        require(authorizedCaller[caller] == true, "Address was not authorized");
        authorizedCaller[caller] = false  ;
    }


    /**
    * @dev To get the number of airlines registered
    */
    function getAirlineCount() external view 
    requireIsOperational
    returns (uint256) {
        return registeredAirlineCount;
    }



    function getAirlineInfoByIdx(uint256 idx) external view 
    requireIsOperational
    returns (address airlineAddress,string memory companyName,uint status,uint256 airlineFunds,
        uint256 underwrittenAmount) {

        require (idx < registeredAirlineCount ,"airline not Found") ; 
        address _airlineAddress = registredAirlines[idx];
        return getAirlineInfo(_airlineAddress);       

    }


    function getAirlineInfo(address _airlineAddress) public view 
    requireIsOperational
    returns (address airlineAddress, string memory companyName, uint status,uint256 airlineFunds,
        uint256 underwrittenAmount) {
        require (uint(airlines[_airlineAddress].status) > 0 ,"airline not Found") ; 
        Airline storage airline = airlines[_airlineAddress];
        return (_airlineAddress,airline.companyName,uint(airline.status),airline.funds,airline.underwrittenAmount);
        

    }



    function getCredit(address passenger)
    public
    view
    returns (uint256)
    {
        return passengerCredit[passenger];
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


    function numberAirlineVotes(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        return airlines[airlineAddress].votes.length;
    }

    function amountAirlineFunds(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        return airlines[airlineAddress].funds;
    }
    function isAirlineNominated(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].status == AirlineStatus.Nominated || airlines[airlineAddress].status == AirlineStatus.Registered || airlines[airlineAddress].status == AirlineStatus.Funded;
    }


    function isAirlineRegistered(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].status == AirlineStatus.Registered || airlines[airlineAddress].status == AirlineStatus.Funded;
    }

    function isAirlineFunded(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {
        return airlines[airlineAddress].status == AirlineStatus.Funded;
    }

    function airlineMembership(address airlineAddress)
    external
        view
        requireIsOperational
        returns (uint)
    {
        return uint(airlines[airlineAddress].status);
    }

    function nominateAirline(address airlineAddress, string memory _companyName)
        external
        requireIsOperational
        requireCallerAuthorized
    {
        airlines[airlineAddress] = Airline(
            _companyName,
            AirlineStatus.Nominated, 
            new address[](0), // no votes
            0, // default no funding
            0 // no insurance underwritten 
        );
    }    
   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airlineAddress)
                            external
                        
        requireIsOperational
        requireCallerAuthorized
        returns (bool)
    {

        Airline storage airline = airlines[airlineAddress]; 
        if(airline.status == AirlineStatus.Nominated){
        airline.status = AirlineStatus.Registered;
        registredAirlines[registeredAirlineCount] = airlineAddress;
        registeredAirlineCount++;
        }
        return airline.status == AirlineStatus.Registered;
    }

    function voteAirline(address airlineAddress, address voterAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        airlines[airlineAddress].votes.push(voterAddress);
        return airlines[airlineAddress].votes.length;
    }

    function fundAirline(address airlineAddress, uint256 fundingAmount)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        airlines[airlineAddress].funds = airlines[airlineAddress].funds.add(fundingAmount);
        airlines[airlineAddress].status = AirlineStatus.Funded;
        return airlines[airlineAddress].funds;
    }

    function registerFlight(
        address airline,
        string memory flight,
        uint256 departureTime,
        uint8 statusCode
    ) external requireIsOperational requireCallerAuthorized returns(bool) {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        flights[key] = Flight({
           isRegistered: true,
           airline: airline,
           flight: flight,
           departureTime: departureTime,
           statusCode: statusCode
        });
        return flights[key].isRegistered;
    }

    function updateFlightStatus(
        uint8 statusCode,
        bytes32 flightKey
    ) external requireIsOperational requireCallerAuthorized {
        flights[flightKey].statusCode = statusCode;
    }

    function isFlightRegistered(
        bytes32 flightKey
    ) external view requireIsOperational requireCallerAuthorized returns (bool) {
        return flights[flightKey].isRegistered;
    }

    function getFlightStatus(
        bytes32 flightKey
    ) external view requireIsOperational requireCallerAuthorized returns (uint8) {
        return flights[flightKey].statusCode;
    }

    function totalUnderwritten(address airlineAddress) external view requireIsOperational requireCallerAuthorized 
        returns(uint256)
    {
        return airlines[airlineAddress].underwrittenAmount;
    }


    function buyInsurance(address passengerAddress, uint256 insuranceAmount, bytes32 flightKey, address airlineAddress) external
        requireIsOperational
        requireCallerAuthorized
    {
        airlines[airlineAddress].underwrittenAmount.add(insuranceAmount);
        flightInsurance[flightKey].purchasedAmount[passengerAddress] = insuranceAmount;
        flightInsurance[flightKey].passengers.push(passengerAddress);
    }
    
    function isPassengerInsured(address passengerAddress, bytes32 flightKey) 
        external view 
        requireIsOperational
        requireCallerAuthorized
        returns(bool)
    {
        return flightInsurance[flightKey].purchasedAmount[passengerAddress] > 0;
    }
    
    function isPaidOut(bytes32 flightKey) external view
        requireIsOperational
        requireCallerAuthorized
        returns(bool)
    {
        return flightInsurance[flightKey].isPaidOut;
    }
    
    function currentPassengerBalance(address passengerAddress) external view
        requireIsOperational
        requireCallerAuthorized
        returns(uint256)
    {
        return passengerBalance[passengerAddress];
    }

    function creditInsurees(bytes32 flightKey, address airlineAddress) external 
        requireIsOperational
        requireCallerAuthorized
    {
        require(!flightInsurance[flightKey].isPaidOut,"Flight insurance already paid out");
        for(uint i = 0; i < flightInsurance[flightKey].passengers.length; i++) {
            address passengerAddress = flightInsurance[flightKey].passengers[i];
            uint256 purchasedAmount = flightInsurance[flightKey].purchasedAmount[passengerAddress];
            uint256 payoutAmount = purchasedAmount.mul(3).div(2);
            passengerBalance[passengerAddress] = passengerBalance[passengerAddress].add(payoutAmount);
            airlines[airlineAddress].funds.sub(payoutAmount);
        }
        flightInsurance[flightKey].isPaidOut = true;
    }

    function payPassenger(address payable insured, uint256 amount) external         
        requireIsOperational
        requireCallerAuthorized
        requireSufficientBalance(insured, amount) // this is business logic, but makes sense to hard code in the data contract
    {
         passengerBalance[insured] = passengerBalance[insured].sub(amount);
         insured.transfer(amount);
    }


    function getFlightKey(
        address airline,
        string memory flight,
        uint256 departureTime
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, departureTime));
    }
                                 
    fallback()  external payable requireCallerAuthorized {
        // funds the contract
    }
    
    receive() external payable {
        // custom function code
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    // function buy
    //                         (                             
    //                         )
    //                         external
    //                         payable
    // {

    // }

    /**
     *  @dev Credits payouts to insurees
    */
    // function creditInsurees
    //                             (
    //                             )
    //                             external
    //                             pure
    // {
    // }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    // function pay
    //                         (
    //                         )
    //                         external
    //                         pure
    // {
    // }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    // function fund
    //                         (   
    //                         )
    //                         public
    //                         payable
    // {
    // }

    // function getFlightKey
    //                     (
    //                         address airline,
    //                         string memory flight,
    //                         uint256 timestamp
    //                     )
    //                     pure
    //                     internal
    //                     returns(bytes32) 
    // {
    //     return keccak256(abi.encodePacked(airline, flight, timestamp));
    // }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    // fallback() 
    //                         external 
    //                         payable 
    // {
    //     fund();
    // }


}

