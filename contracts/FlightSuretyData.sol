//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.3;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

//FlightSuretyData.sol for data persistence
contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    // authorized app contract addresses to call this data contract
    mapping(address => bool) private authorizedCallers;

    // define airline
    struct Airline {
        bool isRegistered;
        uint256 funds;
    }

    uint256 registeredAirlinesCount = 1;
    uint256 fundedAirlinesCount = 1;
    mapping(address => Airline) private airlines;

    // define flight insurance
    struct FligthInsurance {
        uint256 amount;
        bool isCredited;
    }
    // from insurance key to get insurance info
    mapping(bytes32 => FligthInsurance) private flightInsurances;
    // from flight key to get passengers info
    mapping(bytes32 => address[]) private passengers;

    // claims from passengers
    mapping(bytes32 => uint256) public creditedClaims;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AuthorizedContract(address authorizedContract);
    event DeAuthorizedContract(address deAuthorizedContract);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address airlineAddress) {
        contractOwner = msg.sender;
        airlines[airlineAddress] = Airline(true, 0);
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
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireForNotRegisteredAirline(address airline) {
        require(!airlines[airline].isRegistered, "This airline is register");
        _;
    }

    modifier requireForAlreadyRegisteredAirline(address airline) {
        require(
            airlines[airline].isRegistered,
            "This airline is not registered"
        );
        _;
    }

    modifier requireForFunding(address airline) {
        require(
            airlines[airline].funds >= 10,
            "Airline is not sufficiently contributed to the funds"
        );
        _;
    }

    modifier requireForAuthorizedCallerToAccessData() {
        require(
            authorizedCallers[msg.sender],
            "This Caller is not authorized to access data"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function isAirlineRegistered(address airline) external view returns (bool) {
        return airlines[airline].isRegistered;
    }

    function authorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        authorizedCallers[contractAddress] == true;
        emit AuthorizedContract(contractAddress);
    }

    function deauthorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedCallers[contractAddress];
        emit DeAuthorizedContract(contractAddress);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline)
        external
        requireIsOperational
        requireForAuthorizedCallerToAccessData
        requireForNotRegisteredAirline(airline)
    {
        airlines[airline] = Airline(true, 0);
        registeredAirlinesCount += 1;
    }

    // get key when client buy insurance
    function getInsuranceKey(address passenger, bytes32 flight)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(passenger, flight));
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(
        bytes32 flight,
        address airline,
        address passenger,
        uint256 amount
    ) external requireIsOperational {
        //Airline can be registered, but does not participate in contract until it submits funding of 10 ether (make sure it is not 10 wei)
        bool funded = airlines[airline].funds >= 10;
        require(funded, "This airline need to fund at least 10 ethers");
        bytes32 insuranceKey = getInsuranceKey(passenger, flight);
        require(
            flightInsurances[insuranceKey].amount == 0,
            "This passenger already got insurance key"
        );
        flightInsurances[insuranceKey] = FligthInsurance(amount, false);
        fund(airline, amount);
        passengers[flight].push(passenger);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flight) external {
        for (uint256 i = 0; i < passengers[flight].length; i++) {
            address passenger = passengers[flight][i];
            bytes32 key = getInsuranceKey(passenger, flight);
            uint256 amount = flightInsurances[key].amount.mul(3).div(2);
            creditedClaims[key] = amount;
        }
    }

    function creditedAmount(address passenger, bytes32 flight)
        public
        view
        returns (uint256)
    {
        return creditedClaims[getInsuranceKey(passenger, flight)];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address passenger, bytes32 flight) external returns (uint256) {
        bytes32 key = getInsuranceKey(passenger, flight);
        uint256 amount = creditedClaims[key];
        require(amount > 0, "need to be greater than 0");

        delete creditedClaims[key];

        return amount;
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(address airline, uint256 amount)
        public
        payable
        requireIsOperational
        requireForAlreadyRegisteredAirline(airline)
    {
        airlines[airline].funds += amount;
    }

    function getFunds(address airline) external view returns (uint256 amount) {
        return airlines[airline].funds;
    }

    function isFunded(address airline) external view returns (bool) {
        uint256 funds = airlines[airline].funds;
        return funds >= 10;
    }

    function getNumberOfRegisterAirlines() external view returns (uint256) {
        return registeredAirlinesCount;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund(msg.sender, msg.value);
    }

    receive() external payable {}

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
