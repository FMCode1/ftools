/*
 * ============================================================
 * ZCC CONTRACT RENEWAL BOOKMARKLET
 * ============================================================
 *
 * PURPOSE:
 * ------------------------------------------------------------
 * Run this script while an employee is viewing a customer's
 * profile in ZCC.
 *
 * The script reads information from THE CURRENT PAGE.
 *
 * It does NOT need its own customer HTML page.
 *
 *
 * WORKFLOW:
 * ------------------------------------------------------------
 *
 * ZCC CUSTOMER PAGE
 *        ↓
 * Employee clicks browser bookmark
 *        ↓
 * This script runs against the current page
 *        ↓
 * Reads customer information from ZCC
 *        ↓
 * Calculates renewal
 *        ↓
 * Displays email popup
 *        ↓
 * Employee copies email
 *
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * The only section you should normally need to change is:
 *
 *        CONFIGURATION
 *
 * after inspecting the ZCC page.
 */


(function () {

    "use strict";


    // ========================================================
    // CONFIGURATION
    // ========================================================
    //
    // Replace the values below after inspecting ZCC.
    //
    // Example:
    //
    // If ZCC has:
    //
    // <span id="customerName">Jane Smith</span>
    //
    // use:
    //
    // customerName: "#customerName"
    //
    //
    // If ZCC does NOT use IDs, you can use CSS selectors.
    //
    // Example:
    //
    // customerName: ".customer-name"
    //
    // or:
    //
    // customerName: "[data-testid='customer-name']"
    //
    // ========================================================


    const CONFIG = {

        /*
         * CUSTOMER NAME
         *
         * Example:
         * "#customerName"
         */
        customerName: "REPLACE_WITH_ZCC_NAME_SELECTOR",


        /*
         * CURRENT INTERNET SPEED
         *
         * Example:
         * "#serviceSpeed"
         */
        currentSpeed: "REPLACE_WITH_ZCC_SPEED_SELECTOR",


        /*
         * CURRENT MONTHLY PRICE
         *
         * Example:
         * "#monthlyPrice"
         */
        currentPrice: "REPLACE_WITH_ZCC_PRICE_SELECTOR",


        /*
         * CURRENT CONTRACT START DATE
         *
         * Example:
         * "#contractStart"
         */
        contractStart: "REPLACE_WITH_ZCC_START_DATE_SELECTOR",


        /*
         * CURRENT CONTRACT END DATE
         *
         * Example:
         * "#contractEnd"
         */
        contractEnd: "REPLACE_WITH_ZCC_END_DATE_SELECTOR",


        /*
         * OPTIONAL:
         * CUSTOMER EMAIL
         *
         * Not currently used in the copied email.
         *
         * You can fill this in later if you want the app
         * to display the customer's email somewhere.
         */
        customerEmail: "REPLACE_WITH_ZCC_EMAIL_SELECTOR",


        /*
         * OPTIONAL:
         * CUSTOMER ID
         *
         * Not required for generating the email.
         */
        customerId: "REPLACE_WITH_ZCC_CUSTOMER_ID_SELECTOR",


        /*
         * AGENT NAME
         *
         * This is NOT read from ZCC.
         *
         * Put the employee's name here.
         *
         * Example:
         *
         * agentName: "John Doe"
         */
        agentName: "John Doe",


        /*
         * COMPANY / SIGNATURE
         */
        agentTitle: "Customer Support",


        /*
         * EARLY CANCELLATION FEE
         */
        earlyCancellationFee: 124.95,


        /*
         * RENEWAL PRICE INCREASE
         *
         * Current price + $10
         */
        renewalPriceIncrease: 10,


        /*
         * RENEWAL CONTRACT LENGTH
         */
        renewalLengthYears: 2

    };


    // ========================================================
    // REGULAR RATE TABLE
    // ========================================================
    //
    // Change these values if the company's actual regular
    // rates are different.
    //
    // ========================================================


    const REGULAR_RATES = {

        "Hyperspeed 100": 89.00,

        "Hyperspeed 175": 99.00,

        "Hyperspeed 350": 119.95,

        "Hyperspeed 700": 139.95,

        "Hyperspeed 1Gig": 159.95

    };


    // ========================================================
    // UTILITY: GET PAGE ELEMENT
    // ========================================================


    function getElement(selector, fieldName) {

        if (
            !selector ||
            selector.startsWith("REPLACE_WITH")
        ) {

            throw new Error(
                `The ZCC selector for "${fieldName}" has not been configured yet.`
            );

        }


        const element =
            document.querySelector(selector);


        if (!element) {

            throw new Error(
                `Could not find "${fieldName}" using selector:\n\n${selector}\n\n` +
                `Make sure you inspected the correct ZCC element.`
            );

        }


        return element;

    }


    // ========================================================
    // UTILITY: GET TEXT FROM PAGE
    // ========================================================


    function getText(selector, fieldName) {

        const element =
            getElement(
                selector,
                fieldName
            );


        /*
         * textContent is normally what we want.
         *
         * If the value is stored in an input field instead,
         * use its value.
         */

        if (
            "value" in element &&
            element.value
        ) {

            return element.value.trim();

        }


        return element.textContent.trim();

    }


    // ========================================================
    // UTILITY: PARSE MONEY
    // ========================================================


    function parseMoney(value) {

        if (
            value === null ||
            value === undefined
        ) {

            throw new Error(
                "Price value is empty."
            );

        }


        /*
         * Handles:
         *
         * $69.95
         * $1,069.95
         * 69.95
         * USD 69.95
         *
         */

        const cleaned =
            String(value)
                .replace(/[^0-9.-]/g, "");


        const number =
            parseFloat(cleaned);


        if (Number.isNaN(number)) {

            throw new Error(
                `Could not understand the price "${value}".`
            );

        }


        return number;

    }


    // ========================================================
    // UTILITY: FORMAT MONEY
    // ========================================================


    function formatMoney(value) {

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD"
            }
        ).format(value);

    }


    // ========================================================
    // UTILITY: PARSE DATE
    // ========================================================
    //
    // IMPORTANT:
    //
    // This handles normal date strings such as:
    //
    // June 30, 2026
    // 06/30/2026
    // 2026-06-30
    //
    // If ZCC displays dates in an unusual format, this is
    // the function to modify.
    //
    // ========================================================


    function parseDate(value) {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            throw new Error(
                `Could not understand the date "${value}".`
            );

        }


        return date;

    }


    // ========================================================
    // UTILITY: ADD DAYS
    // ========================================================


    function addDays(date, days) {

        const result =
            new Date(date);


        result.setDate(
            result.getDate() + days
        );


        return result;

    }


    // ========================================================
    // UTILITY: ADD YEARS
    // ========================================================


    function addYears(date, years) {

        const result =
            new Date(date);


        result.setFullYear(
            result.getFullYear() + years
        );


        return result;

    }


    // ========================================================
    // UTILITY: FORMAT DATE
    // ========================================================


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


    // ========================================================
    // READ CURRENT ZCC PAGE
    // ========================================================
    //
    // THIS IS THE IMPORTANT PART.
    //
    // There is no customer database here.
    //
    // The script simply asks:
    //
    // "What does the current page say?"
    //
    // ========================================================


    function readCurrentCustomer() {

        const customer = {

            name:
                getText(
                    CONFIG.customerName,
                    "Customer Name"
                ),


            speed:
                getText(
                    CONFIG.currentSpeed,
                    "Current Speed"
                ),


            currentPrice:
                parseMoney(
                    getText(
                        CONFIG.currentPrice,
                        "Current Price"
                    )
                ),


            contractStart:
                getText(
                    CONFIG.contractStart,
                    "Contract Start"
                ),


            contractEnd:
                getText(
                    CONFIG.contractEnd,
                    "Contract End"
                )

        };


        /*
         * Optional fields.
         *
         * Don't fail if you haven't configured these yet.
         */

        if (
            CONFIG.customerEmail &&
            !CONFIG.customerEmail.startsWith("REPLACE_WITH")
        ) {

            const element =
                document.querySelector(
                    CONFIG.customerEmail
                );


            if (element) {

                customer.email =
                    (
                        "value" in element
                        ? element.value
                        : element.textContent
                    ).trim();

            }

        }


        if (
            CONFIG.customerId &&
            !CONFIG.customerId.startsWith("REPLACE_WITH")
        ) {

            const element =
                document.querySelector(
                    CONFIG.customerId
                );


            if (element) {

                customer.id =
                    (
                        "value" in element
                        ? element.value
                        : element.textContent
                    ).trim();

            }

        }


        return customer;

    }


    // ========================================================
    // FIND REGULAR RATE
    // ========================================================


    function getRegularRate(speed) {

        /*
         * Exact match first.
         */

        if (
            REGULAR_RATES[speed] !== undefined
        ) {

            return REGULAR_RATES[speed];

        }


        /*
         * Sometimes ZCC might contain extra text such as:
         *
         * "Hyperspeed 350 Mbps"
         *
         * This attempts to find the configured speed inside
         * the text.
         */

        const matchingSpeed =
            Object.keys(
                REGULAR_RATES
            ).find(
                configuredSpeed =>
                    speed
                        .toLowerCase()
                        .includes(
                            configuredSpeed.toLowerCase()
                        )
            );


        if (matchingSpeed) {

            return REGULAR_RATES[
                matchingSpeed
            ];

        }


        throw new Error(
            `No regular rate has been configured for "${speed}".`
        );

    }


    // ========================================================
    // CALCULATE RENEWAL
    // ========================================================


    function calculateRenewal(customer) {

        const currentEnd =
            parseDate(
                customer.contractEnd
            );


        /*
         * Renewal starts ONE DAY after the current
         * contract ends.
         *
         * June 30, 2026
         *       ↓
         * July 1, 2026
         */

        const renewalStart =
            addDays(
                currentEnd,
                1
            );


        /*
         * Renewal ends TWO YEARS after the current
         * contract end.
         *
         * June 30, 2026
         *       ↓
         * June 30, 2028
         */

        const renewalEnd =
            addYears(
                currentEnd,
                CONFIG.renewalLengthYears
            );


        /*
         * Renewal price:
         *
         * CURRENT PRICE + $10
         */

        const renewalPrice =
            customer.currentPrice +
            CONFIG.renewalPriceIncrease;


        /*
         * Regular rate:
         *
         * Based on current speed.
         */

        const regularRate =
            getRegularRate(
                customer.speed
            );


        /*
         * Savings:
         *
         * REGULAR RATE - RENEWAL RATE
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


    // ========================================================
    // GENERATE EMAIL
    // ========================================================


    function generateEmail(
        customer,
        renewal
    ) {

        /*
         * First name only.
         *
         * "Jane Smith"
         * becomes:
         * "Jane"
         */

        const firstName =
            customer.name
                .trim()
                .split(/\s+/)[0];


        /*
         * SUBJECT
         */

        const subject =
            `Contract Renewal - ${customer.speed}`;


        /*
         * EMAIL BODY
         */

        const body =
`Hi ${firstName},

Your current internet contract agreement for ${customer.speed}, is scheduled to expire on ${formatDate(renewal.currentEnd)} and your current pricing ${formatMoney(customer.currentPrice)} would go to the regular rate ${formatMoney(renewal.regularRate)}.

We would like to offer you a contract renewal at the same speed for ${formatMoney(renewal.renewalPrice)} saving you ${formatMoney(renewal.savings)}. The terms are as follows:

Speed: ${customer.speed}
Price: ${formatMoney(renewal.renewalPrice)}
Contract Start: ${formatDate(renewal.renewalStart)}
Contract End: ${formatDate(renewal.renewalEnd)}
Early cancellation fee: ${formatMoney(CONFIG.earlyCancellationFee)}

Please don't hesitate to reach out if you have any questions in the meantime.

Best regards,

${CONFIG.agentName}
${CONFIG.agentTitle}`;


        return {

            subject,

            body

        };

    }


    // ========================================================
    // REMOVE OLD POPUP
    // ========================================================


    function removeExistingPopup() {

        const existing =
            document.getElementById(
                "contract-renewal-tool"
            );


        if (existing) {

            existing.remove();

        }

    }


    // ========================================================
    // CREATE POPUP
    // ========================================================


    function createPopup(
        customer,
        email
    ) {

        removeExistingPopup();


        /*
         * Main overlay.
         */

        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "contract-renewal-tool";


        overlay.innerHTML = `

            <div
                id="crt-overlay"
                style="
                    position:fixed;
                    inset:0;
                    background:rgba(15,23,42,.48);
                    z-index:2147483647;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:20px;
                    font-family:Arial,Helvetica,sans-serif;
                "
            >

                <div
                    style="
                        width:min(700px,100%);
                        max-height:90vh;
                        overflow:auto;
                        background:#fff;
                        border-radius:10px;
                        box-shadow:0 20px 60px rgba(0,0,0,.30);
                        color:#172033;
                    "
                >

                    <!-- HEADER -->

                    <div
                        style="
                            padding:18px 20px;
                            border-bottom:1px solid #e4e8ed;
                            display:flex;
                            align-items:center;
                        "
                    >

                        <div
                            style="
                                font-size:16px;
                                font-weight:600;
                            "
                        >
                            Contract Renewal Email
                        </div>


                        <button
                            id="crt-close"
                            style="
                                margin-left:auto;
                                border:0;
                                background:none;
                                color:#737e8e;
                                font-size:24px;
                                cursor:pointer;
                            "
                        >
                            ×
                        </button>

                    </div>


                    <!-- BODY -->

                    <div
                        style="
                            padding:20px;
                        "
                    >

                        <!-- CUSTOMER -->

                        <div
                            style="
                                margin-bottom:18px;
                                padding:12px;
                                background:#f8fafc;
                                border:1px solid #e1e6ed;
                                border-radius:6px;
                                font-size:13px;
                            "
                        >

                            <strong>
                                ${escapeHtml(customer.name)}
                            </strong>

                            <br>

                            ${escapeHtml(customer.speed)}

                            ·

                            ${formatMoney(customer.currentPrice)}

                        </div>


                        <!-- SUBJECT -->

                        <div
                            style="
                                margin-bottom:18px;
                            "
                        >

                            <div
                                style="
                                    font-size:12px;
                                    color:#737e8e;
                                    font-weight:600;
                                    margin-bottom:7px;
                                "
                            >
                                Subject
                            </div>


                            <div
                                id="crt-subject"
                                style="
                                    border:1px solid #dfe4ea;
                                    border-radius:6px;
                                    background:#f8f9fb;
                                    padding:12px;
                                    font-size:14px;
                                "
                            >
                                ${escapeHtml(email.subject)}
                            </div>

                        </div>


                        <!-- EMAIL CONTENT -->

                        <div>

                            <div
                                style="
                                    font-size:12px;
                                    color:#737e8e;
                                    font-weight:600;
                                    margin-bottom:7px;
                                "
                            >
                                Email Content
                            </div>


                            <textarea
                                id="crt-email"
                                style="
                                    width:100%;
                                    min-height:370px;
                                    resize:vertical;
                                    border:1px solid #dfe4ea;
                                    border-radius:6px;
                                    background:#f8f9fb;
                                    padding:12px;
                                    font-family:Arial,Helvetica,sans-serif;
                                    font-size:14px;
                                    line-height:1.65;
                                    color:#172033;
                                "
                            >${escapeHtml(email.body)}</textarea>

                        </div>

                    </div>


                    <!-- FOOTER -->

                    <div
                        style="
                            padding:14px 20px;
                            border-top:1px solid #e4e8ed;
                            display:flex;
                            justify-content:flex-end;
                            gap:10px;
                        "
                    >

                        <button
                            id="crt-cancel"
                            style="
                                padding:10px 18px;
                                border:1px solid #d7dde6;
                                border-radius:6px;
                                background:#fff;
                                color:#4e5b6d;
                                font-weight:600;
                                cursor:pointer;
                            "
                        >
                            Close
                        </button>


                        <button
                            id="crt-copy"
                            style="
                                padding:10px 18px;
                                border:0;
                                border-radius:6px;
                                background:#2867ce;
                                color:white;
                                font-weight:600;
                                cursor:pointer;
                            "
                        >
                            Copy Email
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        // ====================================================
        // CLOSE
        // ====================================================

        function close() {

            overlay.remove();

        }


        document
            .getElementById("crt-close")
            .addEventListener(
                "click",
                close
            );


        document
            .getElementById("crt-cancel")
            .addEventListener(
                "click",
                close
            );


        document
            .getElementById("crt-overlay")
            .addEventListener(
                "click",
                event => {

                    if (
                        event.target.id ===
                        "crt-overlay"
                    ) {

                        close();

                    }

                }
            );


        // ====================================================
        // COPY
        // ====================================================

        document
            .getElementById("crt-copy")
            .addEventListener(
                "click",
                async () => {

                    const subject =
                        document
                            .getElementById(
                                "crt-subject"
                            )
                            .textContent
                            .trim();


                    const body =
                        document
                            .getElementById(
                                "crt-email"
                            )
                            .value;


                    /*
                     * Copy exactly what the employee needs:
                     *
                     * Subject
                     * blank line
                     * email body
                     *
                     * No "To:"
                     * No customer email
                     * No extra ZCC information.
                     */

                    const copyText =
`Subject: ${subject}

${body}`;


                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                copyText
                            );


                        const button =
                            document
                                .getElementById(
                                    "crt-copy"
                                );


                        button.textContent =
                            "Copied!";


                        button.style
                            .background =
                            "#16865a";


                        setTimeout(
                            () => {

                                if (
                                    document
                                        .body
                                        .contains(
                                            button
                                        )
                                ) {

                                    button.textContent =
                                        "Copy Email";

                                    button.style
                                        .background =
                                        "#2867ce";

                                }

                            },
                            2000
                        );

                    }

                    catch (error) {

                        /*
                         * Clipboard can be blocked by browser
                         * permissions. Fall back to selecting
                         * the email text.
                         */

                        const textarea =
                            document
                                .getElementById(
                                    "crt-email"
                                );


                        textarea.focus();

                        textarea.select();


                        alert(
                            "Automatic copying was blocked by the browser. " +
                            "The email content has been selected. " +
                            "Press Ctrl+C to copy it."
                        );

                    }

                }
            );

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================
    //
    // Prevents customer data from accidentally being interpreted
    // as HTML when inserted into our popup.
    //
    // ========================================================


    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ========================================================
    // RUN
    // ========================================================


    try {

        /*
         * 1. Read the CURRENT ZCC page.
         */

        const customer =
            readCurrentCustomer();


        /*
         * 2. Calculate the renewal.
         */

        const renewal =
            calculateRenewal(
                customer
            );


        /*
         * 3. Generate email.
         */

        const email =
            generateEmail(
                customer,
                renewal
            );


        /*
         * 4. Display popup ON THE CURRENT ZCC PAGE.
         */

        createPopup(
            customer,
            email
        );

    }


    catch (error) {

        console.error(
            "Contract Renewal Tool:",
            error
        );


        alert(
            "Contract Renewal Tool\n\n" +
            error.message
        );

    }


})();
