var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require("bignumber.js");

var Config = async function (accounts) {
  // These test addresses are useful when you need to add
  // multiple users in test scripts
  let testAddresses = [
    "0xEA3bc4a80D01788737610Fa8A8FE298C5f47e3a5",
    "0x08125eE6dE110d9c56dB6315b6Eb335dF2e65eC7",
    "0xC86e4CFD2B37C8d6d1E440fee650e4070c3C11A0",
    "0xD368EE7D7E9CF42823999548007ecD3Bff7308f3",
    "0xACdEa64fe242AE32CB9EdB4B946CEe6c6FD1828c",
    "0x66425a0481F318d363154c9DD6aa25E0e9D7f66f",
    "0x22042e4de4CE0607FF875791aA872E32148751D1",
    "0x0A4D052658E7F8fbfa7CA30fc789e6292A7C33b5",
    "0x7698dec393E0B4FFf8500E3D1AD106AcEa6a4ff4",
    "0xcA599c4f6201671911ba056f06CbFF529D13bb81",
    "0xf1E938b186D10A299D0d8569C9bc1c4CC908df29",
  ];

  let owner = accounts[0];
  let firstAirline = accounts[1];

  let flightSuretyData = await FlightSuretyData.new(firstAirline);
  let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);
  console.log("flightSuretyData.address: " + flightSuretyData.address);
  console.log("flightSuretyApp.address: " + flightSuretyApp.address);
  return {
    owner: owner,
    firstAirline: firstAirline,
    weiMultiple: new BigNumber(10).pow(18),
    testAddresses: testAddresses,
    flightSuretyData: flightSuretyData,
    flightSuretyApp: flightSuretyApp,
  };
};

module.exports = {
  Config: Config,
};
