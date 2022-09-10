import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    let register_button = DOM.elid("register_button");
    let fund_button = DOM.elid("fund_button");
    register_button.addEventListener("click", () => {
      let register_flight_number = DOM.elid("register_flight_number").value;
      console.log("register_flight_number1" + register_flight_number);
      let register_error = DOM.elid("register_error");
      contract.registerAirline(register_flight_number, (error, result) => {
        if (result) {
          register_error.innerText = "Successful register";
          console.log("result", result);
          //   register_error.innerHtml += result.message;
        } else {
          register_error.innerText = "Please input valid flight address";
        }
        // register_error.innerHtml += error.message;
      });
    });
    fund_button.addEventListener("click", () => {
      let fund_flight_number = DOM.elid("fund_flight_number").value;
      let fund_amount = DOM.elid("fund_amount").value;
      let fund_error = DOM.elid("fund_error");
      contract.fundAirline((error, result) => {
        if (result) {
          fund_error.innerText = "Successful funding";
          console.log("result", result);
          //   register_error.innerHtml += result.message;
        } else {
          fund_error.innerText = "Please input valid input";
        }
      });
    });
    // User-submitted transaction
    // DOM.elid("submit-oracle").addEventListener("click", () => {
    //   let flight = DOM.elid("flight-number").value;
    //   // Write transaction
    //   contract.fetchFlightStatus(flight, (error, result) => {
    //     display("Oracles", "Trigger oracles", [
    //       {
    //         label: "Fetch Flight Status",
    //         error: error,
    //         value: result.flight + " " + result.timestamp,
    //       },
    //     ]);
    //   });
    // });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
