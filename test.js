/*
 * ============================================================
 * CONTRACT RENEWAL TEST CASES
 * ============================================================
 *
 * Each object represents what would normally be found on the
 * customer's profile page.
 *
 * The bookmarked renewal application reads these values and
 * generates the email.
 */


const TEST_CUSTOMERS = [

    /*
     * ==========================================================
     * CASE 1 — HYPERSPEED 100
     * ==========================================================
     *
     * Current contract:
     * June 30, 2024 → June 30, 2026
     *
     * Current price:
     * $59.95
     *
     * Renewal:
     * $69.95
     *
     * Regular:
     * $89.00
     */
  
    {
      initials: "AB",
  
      name: "Alex Brown",
  
      id: "Customer #10001",
  
      email: "alex.brown@example.com",
  
      company: "Example Company",
  
      speed: "Hyperspeed 100",
  
      contractNumber: "CN-10001-2024",
  
      startDate: "June 30, 2024",
  
      endDate: "June 30, 2026",
  
      currentPrice: 59.95
    },
  
  
    /*
     * ==========================================================
     * CASE 2 — HYPERSPEED 175
     * ==========================================================
     *
     * Current contract:
     * September 15, 2024 → September 15, 2026
     *
     * Current price:
     * $64.95
     *
     * Renewal:
     * $74.95
     *
     * Regular:
     * $99.00
     */
  
    {
      initials: "MC",
  
      name: "Michael Carter",
  
      id: "Customer #10002",
  
      email: "michael.carter@example.com",
  
      company: "Carter Consulting",
  
      speed: "Hyperspeed 175",
  
      contractNumber: "CN-10002-2024",
  
      startDate: "September 15, 2024",
  
      endDate: "September 15, 2026",
  
      currentPrice: 64.95
    },
  
  
    /*
     * ==========================================================
     * CASE 3 — HYPERSPEED 350
     * ==========================================================
     *
     * Current contract:
     * June 30, 2024 → June 30, 2026
     *
     * Current price:
     * $69.95
     *
     * Renewal:
     * $79.95
     *
     * Regular:
     * $119.95
     */
  
    {
      initials: "JS",
  
      name: "Jane Smith",
  
      id: "Customer #10482",
  
      email: "jane.smith@example.com",
  
      company: "Acme Corporation",
  
      speed: "Hyperspeed 350",
  
      contractNumber: "CN-10482-2024",
  
      startDate: "June 30, 2024",
  
      endDate: "June 30, 2026",
  
      currentPrice: 69.95
    },
  
  
    /*
     * ==========================================================
     * CASE 4 — HYPERSPEED 700
     * ==========================================================
     *
     * Current contract:
     * October 1, 2024 → October 1, 2026
     *
     * Current price:
     * $79.95
     *
     * Renewal:
     * $89.95
     *
     * Regular:
     * $139.95
     */
  
    {
      initials: "SR",
  
      name: "Sarah Roberts",
  
      id: "Customer #10004",
  
      email: "sarah.roberts@example.com",
  
      company: "Roberts Design",
  
      speed: "Hyperspeed 700",
  
      contractNumber: "CN-10004-2024",
  
      startDate: "October 1, 2024",
  
      endDate: "October 1, 2026",
  
      currentPrice: 79.95
    },
  
  
    /*
     * ==========================================================
     * CASE 5 — HYPERSPEED 1GIG
     * ==========================================================
     *
     * Current contract:
     * January 10, 2025 → January 10, 2027
     *
     * Current price:
     * $89.95
     *
     * Renewal:
     * $99.95
     *
     * Regular:
     * $159.95
     */
  
    {
      initials: "DW",
  
      name: "David Wilson",
  
      id: "Customer #10005",
  
      email: "david.wilson@example.com",
  
      company: "Wilson Industries",
  
      speed: "Hyperspeed 1Gig",
  
      contractNumber: "CN-10005-2025",
  
      startDate: "January 10, 2025",
  
      endDate: "January 10, 2027",
  
      currentPrice: 89.95
    }
  
  ];
  
  
  // ============================================================
  // CONSTANTS
  // ============================================================
  
  const RENEWAL_PRICE_INCREASE = 10;
  
  const RENEWAL_LENGTH_YEARS = 2;
  
  const EARLY_CANCELLATION_FEE = 124.95;
  
  
  // ============================================================
  // REGULAR RATE
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
  // CURRENCY
  // ============================================================
  
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
  // DATE HELPERS
  // ============================================================
  
  function parseDate(value) {
  
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
  // RENEWAL CALCULATION
  // ============================================================
  
  function calculateRenewal(customer) {
  
    const currentEnd =
      parseDate(
        customer.endDate
      );
  
  
    /*
     * New contract starts one day after
     * the current contract ends.
     */
  
    const renewalStart =
      addDays(
        currentEnd,
        1
      );
  
  
    /*
     * New contract ends two years after
     * the current contract end.
     */
  
    const renewalEnd =
      addYears(
        currentEnd,
        RENEWAL_LENGTH_YEARS
      );
  
  
    /*
     * Renewal price is current price + $10.
     */
  
    const renewalPrice =
      customer.currentPrice +
      RENEWAL_PRICE_INCREASE;
  
  
    /*
     * Regular price depends on speed.
     */
  
    const regularRate =
      getRegularRate(
        customer.speed
      );
  
  
    /*
     * Customer savings.
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
  
  function generateRenewalEmail(customer) {
  
    const renewal =
      calculateRenewal(
        customer
      );
  
  
    const firstName =
      customer.name.split(" ")[0];
  
  
    const subject =
      `Contract Renewal - ${customer.speed}`;
  
  
    const body =
  `Hi ${firstName},
  
  Your current internet contract agreement for ${customer.speed}, is scheduled to expire on ${formatDate(renewal.currentEnd)} and your current pricing ${currency(customer.currentPrice)} would go to the regular rate ${currency(renewal.regularRate)}.
  
  We would like to offer you a contract renewal at the same speed for ${currency(renewal.renewalPrice)} saving you ${currency(renewal.savings)}. The terms are as follows:
  
  Speed: ${customer.speed}
  Price: ${currency(renewal.renewalPrice)}
  Contract Start: ${formatDate(renewal.renewalStart)}
  Contract End: ${formatDate(renewal.renewalEnd)}
  Early cancellation fee: ${currency(EARLY_CANCELLATION_FEE)}
  
  Please don't hesitate to reach out if you have any questions in the meantime.
  
  Best regards,
  
  John Doe
  Customer Support`;
  
  
    return {
      subject,
      body
    };
  
  }
  
  
  // ============================================================
  // LOAD CUSTOMER PAGE
  // ============================================================
  
  function loadCustomer(index) {
  
    const customer =
      TEST_CUSTOMERS[index];
  
  
    document.getElementById(
      "customerInitials"
    ).textContent =
      customer.initials;
  
  
    document.getElementById(
      "customerName"
    ).textContent =
      customer.name;
  
  
    document.getElementById(
      "customerId"
    ).textContent =
      customer.id;
  
  
    document.getElementById(
      "customerEmail"
    ).textContent =
      customer.email;
  
  
    document.getElementById(
      "customerCompany"
    ).textContent =
      customer.company;
  
  
    document.getElementById(
      "currentSpeed"
    ).textContent =
      customer.speed;
  
  
    document.getElementById(
      "contractNumber"
    ).textContent =
      customer.contractNumber;
  
  
    document.getElementById(
      "startDate"
    ).textContent =
      customer.startDate;
  
  
    document.getElementById(
      "endDate"
    ).textContent =
      customer.endDate;
  
  
    document.getElementById(
      "currentPrice"
    ).textContent =
      currency(customer.currentPrice);
  
  
    /*
     * Update selected test case.
     */
  
    document
      .querySelectorAll(".case-button")
      .forEach(button => {
  
        button.classList.toggle(
          "active",
          Number(button.dataset.case) === index
        );
  
      });
  
  }
  
  
  // ============================================================
  // TEST CASE BUTTONS
  // ============================================================
  
  document
    .querySelectorAll(".case-button")
    .forEach(button => {
  
      button.addEventListener(
        "click",
        () => {
  
          const index =
            Number(
              button.dataset.case
            );
  
  
          loadCustomer(index);
  
        }
      );
  
    });
  
  
  // ============================================================
  // GENERATE EMAIL
  // ============================================================
  
  document
    .getElementById("generateEmail")
    .addEventListener(
      "click",
      () => {
  
        try {
  
          /*
           * Find which customer profile is currently
           * being displayed.
           */
  
          const activeButton =
            document.querySelector(
              ".case-button.active"
            );
  
  
          const index =
            Number(
              activeButton.dataset.case
            );
  
  
          const customer =
            TEST_CUSTOMERS[index];
  
  
          const email =
            generateRenewalEmail(
              customer
            );
  
  
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
  
        catch (error) {
  
          console.error(error);
  
          alert(
            "Unable to generate renewal email:\n\n" +
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
          document.getElementById(
            "emailSubject"
          ).textContent;
  
  
        const body =
          document.getElementById(
            "emailContent"
          ).textContent;
  
  
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
            "Unable to copy the email."
          );
  
        }
  
      }
    );
  
  
  // ============================================================
  // CLOSE MODAL
  // ============================================================
  
  function closeModal() {
  
    document
      .getElementById("emailModal")
      .classList.remove("open");
  
  }
  
  
  document
    .getElementById("closeModal")
    .addEventListener(
      "click",
      closeModal
    );
  
  
  document
    .getElementById("emailModal")
    .addEventListener(
      "click",
      event => {
  
        if (
          event.target.id === "emailModal"
        ) {
  
          closeModal();
  
        }
  
      }
    );
  
  
  document.addEventListener(
    "keydown",
    event => {
  
      if (event.key === "Escape") {
        closeModal();
      }
  
    }
  );
  
  
  // ============================================================
  // INITIAL CUSTOMER
  // ============================================================
  
  loadCustomer(0);