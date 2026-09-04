/*
 * ============================================================
 * CONTRACT RENEWAL ASSISTANT
 * ============================================================
 *
 * RULES:
 *
 * 1. Renewal price = current price + $10
 *
 * 2. Regular price depends on current speed.
 *
 * 3. Renewal contract starts the day after current contract
 *    ends.
 *
 * 4. Renewal contract ends 2 years after current contract
 *    end date.
 *
 * 5. Savings = regular price - renewal price.
 *
 * 6. The renewal price is included in the Terms of Agreement.
 */


// ============================================================
// SETTINGS
// ============================================================

const RENEWAL_PRICE_INCREASE = 10;

const RENEWAL_LENGTH_YEARS = 2;

const EARLY_CANCELLATION_FEE = 124.95;


// ============================================================
// REGULAR PRICING
// ============================================================

function getRegularRate(speed) {

  switch (speed) {

    case "Hyperspeed 100":
      return 89.00;

    case "Hyperspeed 175":
      return 99.00;

    case "Hyperspeed 350":
      return 119.95;

    case "Hyperspeed 700":
      return 139.95;

    case "Hyperspeed 1Gig":
      return 159.95;

    default:
      throw new Error(
        `No regular rate configured for ${speed}`
      );
  }
}


// ============================================================
// GET DATA FROM CURRENT CUSTOMER PAGE
// ============================================================

function getCustomerData() {

  return {

    name: getElementText("customerName"),

    email: getElementText("customerEmail"),

    company: getElementText("customerCompany"),

    currentSpeed: getElementText("currentSpeed"),

    startDate: getElementText("startDate"),

    endDate: getElementText("endDate"),

    currentPrice: parseCurrency(
      getElementText("currentPrice")
    )

  };
}


function getElementText(id) {

  const element =
    document.getElementById(id);

  if (!element) {

    throw new Error(
      `Could not find page field: ${id}`
    );

  }

  return element.textContent.trim();
}


// ============================================================
// CURRENCY
// ============================================================

function parseCurrency(value) {

  const number =
    parseFloat(
      value
        .replace("$", "")
        .replace(",", "")
        .trim()
    );

  if (Number.isNaN(number)) {

    throw new Error(
      `Invalid price: ${value}`
    );

  }

  return number;
}


function currency(value) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(value);

}


// ============================================================
// DATE FUNCTIONS
// ============================================================

function parsePageDate(value) {

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {

    throw new Error(
      `Invalid date: ${value}`
    );

  }

  return date;
}


function addDays(date, days) {

  const result =
    new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}


function addYears(date, years) {

  const result =
    new Date(date);

  result.setFullYear(
    result.getFullYear() + years
  );

  return result;
}


function formatDate(date) {

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );

}


// ============================================================
// CALCULATE RENEWAL
// ============================================================

function calculateRenewal(customer) {

  const currentEnd =
    parsePageDate(
      customer.endDate
    );


  /*
   * Current contract:
   *
   * June 30, 2024
   *       ↓
   * June 30, 2026
   *
   * Renewal:
   *
   * July 1, 2026
   *       ↓
   * June 30, 2028
   */

  const renewalStart =
    addDays(
      currentEnd,
      1
    );


  const renewalEnd =
    addYears(
      currentEnd,
      RENEWAL_LENGTH_YEARS
    );


  /*
   * Renewal price is always $10 more
   * than the customer's current price.
   */

  const renewalPrice =
    customer.currentPrice +
    RENEWAL_PRICE_INCREASE;


  /*
   * Regular rate comes from the speed.
   */

  const regularRate =
    getRegularRate(
      customer.currentSpeed
    );


  /*
   * Savings is the difference between
   * regular pricing and the renewal offer.
   */

  const savings =
    regularRate -
    renewalPrice;


  return {

    currentEnd,

    renewalStart,

    renewalEnd,

    renewalPrice,

    regularRate,

    savings

  };

}


// ============================================================
// GENERATE EMAIL
// ============================================================

function generateRenewalEmail(
  customer,
  renewal
) {

  const firstName =
    customer.name
      .split(" ")[0];


  const subject =
    `Contract Renewal - ${customer.currentSpeed}`;


  const body =
`Hi ${firstName},

Your current internet contract agreement for ${customer.currentSpeed}, is scheduled to expire on ${formatDate(renewal.currentEnd)} and your current pricing ${currency(customer.currentPrice)} would go to the regular rate ${currency(renewal.regularRate)}.

We would like to offer you a contract renewal at the same speed for ${currency(renewal.renewalPrice)} saving you ${currency(renewal.savings)}. The terms are as follows:

Speed: ${customer.currentSpeed}
Price: ${currency(renewal.renewalPrice)}
Contract Start: ${formatDate(renewal.renewalStart)}
Contract End: ${formatDate(renewal.renewalEnd)}
Early cancellation fee: ${currency(EARLY_CANCELLATION_FEE)}

If you agree to the terms and conditions above, kindly reply this email with 'I accept'

Please don't hesitate to reach out if you have any questions in the meantime.

Best regards,

John Doe
Telesales Representative
3062807999`;


  return {
    subject,
    body
  };

}


// ============================================================
// OPEN MODAL
// ============================================================

function openEmailModal(email) {

  document.getElementById(
    "emailSubject"
  ).textContent =
    email.subject;


  document.getElementById(
    "emailContent"
  ).textContent =
    email.body;


  document
    .getElementById("emailModal")
    .classList.add("open");

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeEmailModal() {

  document
    .getElementById("emailModal")
    .classList.remove("open");


  const copyButton =
    document.getElementById(
      "copyEmail"
    );


  copyButton.textContent =
    "Copy Email";


  copyButton.classList.remove(
    "copied"
  );

}


// ============================================================
// GENERATE BUTTON
// ============================================================

document
  .getElementById("generateEmail")
  .addEventListener(
    "click",
    () => {

      try {

        /*
         * Read the current customer page.
         */

        const customer =
          getCustomerData();


        /*
         * Calculate the renewal terms.
         */

        const renewal =
          calculateRenewal(
            customer
          );


        /*
         * Generate the final email.
         */

        const email =
          generateRenewalEmail(
            customer,
            renewal
          );


        /*
         * Show the email in the popup.
         */

        openEmailModal(
          email
        );

      }

      catch (error) {

        console.error(error);

        alert(
          "Unable to generate the renewal email:\n\n" +
          error.message
        );

      }

    }
  );


// ============================================================
// COPY EMAIL
// ============================================================

document
  .getElementById("copyEmail")
  .addEventListener(
    "click",
    async () => {

      const subject =
        document
          .getElementById(
            "emailSubject"
          )
          .textContent;


      const body =
        document
          .getElementById(
            "emailContent"
          )
          .textContent;


      /*
       * Copy ONLY:
       *
       * Subject
       * Email body
       *
       * No To:
       * No customer information
       * No extra labels
       */

      const copyText =
`Subject: ${subject}

${body}`;


      try {

        await navigator.clipboard.writeText(
          copyText
        );


        const button =
          document.getElementById(
            "copyEmail"
          );


        button.textContent =
          "Copied!";


        button.classList.add(
          "copied"
        );


        setTimeout(
          () => {

            button.textContent =
              "Copy Email";

            button.classList.remove(
              "copied"
            );

          },
          2000
        );

      }

      catch (error) {

        console.error(error);

        alert(
          "Unable to copy the email automatically."
        );

      }

    }
  );


// ============================================================
// CLOSE MODAL EVENTS
// ============================================================

document
  .getElementById("closeModal")
  .addEventListener(
    "click",
    closeEmailModal
  );


document
  .getElementById("emailModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target.id === "emailModal"
      ) {

        closeEmailModal();

      }

    }
  );


document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {
      closeEmailModal();
    }

  }
);
