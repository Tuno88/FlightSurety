var Test = require("../config/testConfig.js");
//var BigNumber = require('bignumber.js');

contract("Oracles", async (accounts) => {
  const TEST_ORACLES_COUNT = 20;
  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  var config;
  before("setup contract", async () => {
    console.log("--start-----------setup contract--------------------");
    config = await Test.Config(accounts);
    console.log("--end-----------setup contract--------------------");
  });

  it("can register oracles", async () => {
    // ARRANGE
    console.log(
      "---start------can register oracles-------------------------------------"
    );
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
      try {
        await config.flightSuretyApp.registerOracle({
          from: accounts[a],
          value: fee,
        });
        console.log(
          "registerOracle-----------------------------------" + a + "-----"
        );
        let result = await config.flightSuretyApp.getMyIndexes.call({
          from: accounts[a],
        });
        console.log(
          `Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`
        );
      } catch (e) {
        console.log("oracle registered errors: ", e);
        console.log("=============================================");
      }
    }
    console.log(
      "end ------------can register oracles------------------------------------------"
    );
  }).timeout(2000000);

  it("can request flight status", async () => {
    console.log(
      "---start------can request flight status-------------------------------------"
    );
    // ARRANGE
    let flight = "ND1309"; // Course number
    let timestamp = parseInt(Date.now());

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(
      config.firstAirline,
      flight,
      timestamp
    );
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({
        from: accounts[a],
      });
      console.log("oracleIndexes==========>" + a + ": ", oracleIndexes);

      for (let idx = 0; idx < 3; idx++) {
        console.log("oracleIndexes[idx]: " + oracleIndexes[idx]);
        console.log("config.firstAirline: " + config.firstAirline);
        console.log("flight: " + flight);
        console.log("timestamp: " + timestamp);
        console.log("STATUS_CODE_ON_TIME: " + STATUS_CODE_ON_TIME);
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(
            oracleIndexes[idx],
            config.firstAirline,
            flight,
            timestamp,
            STATUS_CODE_ON_TIME,
            { from: accounts[a] }
          );
        } catch (e) {
          // Enable this when debugging
          console.log(
            "\nError",
            idx,
            oracleIndexes[idx].toNumber(),
            flight,
            timestamp
          );
          console.log(e);
        }
      }
    }
    console.log(
      "---end-------can request flight status--------------------------------------------"
    );
  }).timeout(2000000);
});
