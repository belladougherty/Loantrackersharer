/* ============================================================
   THIS IS THE ONLY FILE YOU EVER NEED TO EDIT.
 
   All three pages read from here, so changing a balance once
   updates the home page, the calculator, and the schedule.
 
     startingBalance - what you owed on day one (drives the progress bar)
     focusMonthly    - extra thrown at the highest-rate loan
     spreadMonthly   - divided evenly across federal loans still open
     spreadStarts    - the month those even payments begin
     giveLink        - a Ko-fi / Venmo / PayPal URL, or "" to hide that section
     fed             - true for Direct Loans, false for private (Sallie Mae)
 
   Loans are attacked highest-rate-first. Loans sharing a rate are
   taken in the order you list them, so keep unsubsidized above
   subsidized if you want those paid first.
   ============================================================ */
 
window.LOAN_DATA = {
 
  startingBalance: 25998.34,
 
  focusMonthly:  1000,
  spreadMonthly:  300,
  spreadStarts:  "2027-01",
 
  firstPaymentMonth: "2026-08",
 
  giveLink:  "",
  giveLabel: "Chip in",
  contributors: [],
 
  loans: [
    { name: "1-08",     balance: 1109.51, apr:  6.53, fed: true  },
    { name: "1-07",     balance: 2250.00, apr:  6.53, fed: true  },
    { name: "1-09",     balance: 2250.00, apr:  6.53, fed: true  },
    { name: "1-12",     balance: 1059.92, apr:  6.39, fed: true  },
    { name: "1-14",     balance:  733.76, apr:  6.39, fed: true  },
    { name: "1-11",     balance: 2750.00, apr:  6.39, fed: true  },
    { name: "1-13",     balance: 2750.00, apr:  6.39, fed: true  },
    { name: "1-04",     balance: 1159.41, apr:  5.50, fed: true  },
    { name: "1-06",     balance: 1139.52, apr:  5.50, fed: true  },
    { name: "1-03",     balance: 1750.00, apr:  5.50, fed: true  },
    { name: "1-05",     balance: 2750.00, apr:  5.50, fed: true  },
    { name: "1-01",     balance: 3148.11, apr:  4.99, fed: true  },
    { name: "1-02",     balance: 3148.11, apr:  4.99, fed: true  }
  ]
};
 
