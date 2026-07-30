/* ============================================================
   Payoff engine. Shared by every page. No need to edit this.
   ============================================================ */

(function (root) {
  'use strict';

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var CENT = 0.004;   // anything under this is treated as paid off

  function anchor(cfg) {
    var p = (cfg.firstPaymentMonth || '2026-08').split('-');
    return { y: +p[0], m: +p[1] - 1 };
  }

  /* i = 1 means the first payment month */
  function monthLabel(cfg, i) {
    var a = anchor(cfg), t = a.m + i - 1;
    return MONTHS[((t % 12) + 12) % 12] + ' ' + (a.y + Math.floor(t / 12));
  }

  function shortLabel(cfg, i) {
    var a = anchor(cfg), t = a.m + i - 1;
    return MONTHS[((t % 12) + 12) % 12] + " '" + String(a.y + Math.floor(t / 12)).slice(2);
  }

  /* "2027-01" -> the payment-month number it falls on */
  function monthIndex(cfg, ym) {
    var a = anchor(cfg), p = ym.split('-');
    return (+p[0] - a.y) * 12 + (+p[1] - 1 - a.m) + 1;
  }

  /* Highest rate first. Stable, so equal rates keep their listed order. */
  function order(loans) {
    return loans.filter(function (l) { return l.balance > 0; })
                .slice()
                .sort(function (a, b) { return b.apr - a.apr; });
  }

  function money(n) {
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function money2(n) {
    return '$' + Number(n).toLocaleString('en-US',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /*
    simulate(cfg, focusAmt, spreadAmt)

    Each month, in this order:
      1. every open loan accrues one month of interest
      2. if the even split has started, each open FEDERAL loan gets an equal
         slice of spreadAmt; any slice bigger than the remaining balance spills
         forward instead of being wasted
      3. whatever is left, plus focusAmt, goes at the highest-rate open loan,
         cascading down as each one clears

    Before the split starts, focusAmt + spreadAmt all goes to step 3.
  */
  function simulate(cfg, focusAmt, spreadAmt) {
    var loans = order(cfg.loans);
    var n = loans.length;
    var bal = loans.map(function (l) { return l.balance; });
    var rate = loans.map(function (l) { return l.apr / 100 / 12; });

    var began = new Array(n).fill(0);   // first dollar of any kind
    var hot   = new Array(n).fill(0);   // first dollar of the focused payment
    var done  = new Array(n).fill(0);
    var paid  = new Array(n).fill(0);
    var accr  = new Array(n).fill(0);

    var splitAt = cfg.spreadStarts ? monthIndex(cfg, cfg.spreadStarts) : 1;
    var interest = 0, outflow = 0, perMonth = [], i, j, k;

    for (var m = 1; m <= 900; m++) {
      var cells = [];
      for (i = 0; i < n; i++) cells.push({ pay: 0, interest: 0, endBal: 0, focused: false, cleared: false });

      /* 1. interest */
      for (i = 0; i < n; i++) {
        if (bal[i] > 0) {
          var acc = bal[i] * rate[i];
          bal[i] += acc; interest += acc; accr[i] += acc;
          cells[i].interest = acc;
        }
      }

      /* 2. the even split */
      var pot;
      if (m < splitAt) {
        pot = focusAmt + spreadAmt;
      } else {
        pot = focusAmt;
        var open = [];
        for (i = 0; i < n; i++) if (loans[i].fed && bal[i] > 0) open.push(i);
        if (!open.length) {
          pot += spreadAmt;
        } else {
          var each = spreadAmt / open.length;
          for (k = 0; k < open.length; k++) {
            i = open[k];
            if (!began[i]) began[i] = m;
            var part = Math.min(each, bal[i]);
            bal[i] -= part; paid[i] += part; outflow += part;
            cells[i].pay += part;
            pot += each - part;
            if (bal[i] <= CENT) {
              bal[i] = 0;
              if (!done[i]) { done[i] = m; cells[i].cleared = true; }
            }
          }
        }
      }

      /* 3. the focused payment, cascading */
      for (j = 0; j < n && pot > CENT; j++) {
        if (bal[j] <= 0) continue;
        if (!began[j]) began[j] = m;
        if (!hot[j]) hot[j] = m;
        var pay = Math.min(pot, bal[j]);
        bal[j] -= pay; pot -= pay; paid[j] += pay; outflow += pay;
        cells[j].pay += pay;
        cells[j].focused = true;
        if (bal[j] <= CENT) { bal[j] = 0; done[j] = m; cells[j].cleared = true; }
      }

      var total = 0;
      for (i = 0; i < n; i++) { cells[i].endBal = bal[i]; total += cells[i].pay; }
      perMonth.push({
        index: m,
        label: monthLabel(cfg, m),
        short: shortLabel(cfg, m),
        total: total,
        cells: cells
      });

      var clear = true;
      for (i = 0; i < n; i++) if (bal[i] > 0) { clear = false; break; }
      if (clear) break;
    }

    var rows = loans.map(function (l, idx) {
      return {
        name: l.name, apr: l.apr, fed: !!l.fed, balance: l.balance,
        began: began[idx], hot: hot[idx], done: done[idx],
        paid: paid[idx], interest: accr[idx]
      };
    });

    var last = perMonth.length;
    return {
      ok: last < 900,
      months: last,
      interest: interest,
      outflow: outflow,
      loans: loans,
      rows: rows,
      perMonth: perMonth,
      splitAt: splitAt,
      owed: loans.reduce(function (s, l) { return s + l.balance; }, 0)
    };
  }

  /* Shared chrome: nav bar + progress header, so the pages stay in sync */
  function nav(current) {
    var items = [
      { id: 'home',       href: 'index.html',      text: 'Home' },
      { id: 'calculator', href: 'calculator.html', text: 'What if' },
      { id: 'schedule',   href: 'schedule.html',   text: 'Month by month' }
    ];
    return '<nav class="nav">' + items.map(function (it) {
      return it.id === current
        ? '<span class="nav-a is-here" aria-current="page">' + it.text + '</span>'
        : '<a class="nav-a" href="' + it.href + '">' + it.text + '</a>';
    }).join('') + '</nav>';
  }

  function giveSection(cfg) {
    if (!cfg.giveLink) return '';
    var thanks = '';
    if (cfg.contributors && cfg.contributors.length) {
      thanks = '<div class="thanks"><div class="thanks-k">Thank you</div><ul class="thanks-list">' +
        cfg.contributors.map(function (c) {
          var t = typeof c === 'string' ? c : c.name + (c.amount ? ' \u00b7 ' + money(c.amount) : '');
          return '<li>' + t + '</li>';
        }).join('') + '</ul></div>';
    }
    return '<section class="give"><h2>Want to help?</h2>' +
      '<p>Anything you put in goes straight at the highest&#8209;interest loan on the list, ' +
      'which is where it does the most damage.</p>' +
      '<a class="btn" href="' + cfg.giveLink + '" rel="noopener">' +
      (cfg.giveLabel || 'Chip in') + '</a>' + thanks + '</section>';
  }

  root.Payoff = {
    simulate: simulate,
    order: order,
    monthLabel: monthLabel,
    shortLabel: shortLabel,
    monthIndex: monthIndex,
    money: money,
    money2: money2,
    nav: nav,
    giveSection: giveSection
  };

})(typeof window !== 'undefined' ? window : global);
