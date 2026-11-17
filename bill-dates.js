/* My Bill Maker: bill date + payment receipt date patch
   Add this file with: <script src="./bill-dates.js"></script> before </body>.
*/
(() => {
  'use strict';
  const BILL_KEY = 'my-bill-maker-bills-v1';
  const DRAFT_KEY = 'my-bill-maker-draft-v1';
  const $ = id => document.getElementById(id);
  const fmt = value => {
    if (!value) return '';
    const p = String(value).split('-');
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : String(value);
  };

  // Add a payment date field directly beside the payment amount on the bill form.
  function installField() {
    const paid = $('paid');
    if (!paid || $('paymentDate')) return;
    const pair = paid.closest('.pair');
    if (!pair) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<label for="paymentDate">Payment Receipt Date (optional)</label><input id="paymentDate" type="date" aria-label="Payment Receipt Date">';
    const field = wrap.firstElementChild;
    const input = wrap.lastElementChild;
    pair.append(field, input);
    input.style.marginTop = '0';
    input.addEventListener('input', () => {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (draft && typeof draft === 'object') {
          draft.paymentDate = input.value;
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        }
      } catch (_) {}
    });
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      input.value = draft && draft.paymentDate ? draft.paymentDate : '';
    } catch (_) {}
  }

  // Preserve paymentDate when the app serializes the current bill/draft/saved bill.
  const originalStringify = JSON.stringify;
  JSON.stringify = function(value, replacer, space) {
    try {
      const isBill = value && !Array.isArray(value) &&
        typeof value === 'object' && Array.isArray(value.items) &&
        Object.prototype.hasOwnProperty.call(value, 'date') &&
        (Object.prototype.hasOwnProperty.call(value, 'paymentReceived') ||
         Object.prototype.hasOwnProperty.call(value, 'previousBalance'));
      if (isBill) {
        const copy = { ...value };
        const field = $('paymentDate');
        if (field) copy.paymentDate = field.value || copy.paymentDate || '';
        return originalStringify.call(JSON, copy, replacer, space);
      }
    } catch (_) {}
    return originalStringify.call(JSON, value, replacer, space);
  };

  // Keep the bill date visible on the receipt preview, including balance-only receipts.
  function addReceiptDates() {
    const receipt = $('receipt');
    const billDate = $('date');
    if (!receipt || !billDate) return;
    let dateLine = $('receiptBillDate');
    if (!dateLine) {
      dateLine = document.createElement('div');
      dateLine.id = 'receiptBillDate';
      dateLine.style.cssText = 'font-size:11px;margin-top:3px;color:#222;font-weight:600';
      const head = receipt.querySelector('.head');
      if (head) head.insertAdjacentElement('afterend', dateLine);
      else receipt.prepend(dateLine);
    }
    const billText = 'Bill Date: ' + fmt(billDate.value);
    if (dateLine.textContent !== billText) dateLine.textContent = billText;
    const paidDate = $('paymentDate');
    let paymentLine = $('receiptPaymentDate');
    if (!paymentLine) {
      paymentLine = document.createElement('div');
      paymentLine.id = 'receiptPaymentDate';
      paymentLine.style.cssText = 'font-size:11px;margin-top:5px;color:#222';
      receipt.append(paymentLine);
    }
    const paymentText = paidDate && paidDate.value
      ? 'Payment Receipt Date: ' + fmt(paidDate.value)
      : '';
    if (paymentLine.textContent !== paymentText) paymentLine.textContent = paymentText;
    paymentLine.hidden = !paymentLine.textContent;
  }

  // Balance-only receipts are valid: show a clear receipt heading even without item rows.
  function ensureBalanceOnlyLabel() {
    const receipt = $('receipt');
    const items = $('items');
    if (!receipt || !items) return;
    const hasNamedItems = [...items.querySelectorAll('.nm')].some(el => el.value.trim());
    const hasBalanceData = Number(($('prev') || {}).value || 0) > 0 ||
      Number(($('paid') || {}).value || 0) > 0;
    let label = $('receiptBalanceOnly');
    if (hasBalanceData && !hasNamedItems) {
      if (!label) {
        label = document.createElement('div');
        label.id = 'receiptBalanceOnly';
        label.style.cssText = 'font-size:12px;font-weight:700;margin:8px 0';
        const head = receipt.querySelector('.head');
        (head || receipt).insertAdjacentElement('afterend', label);
      }
      if (label.textContent !== 'PAYMENT RECEIPT') label.textContent = 'PAYMENT RECEIPT';
    } else if (label) {
      label.remove();
    }
  }

  // The app refreshes the receipt preview after form edits; observe it and keep date labels current.
  const observer = new MutationObserver(() => {
    addReceiptDates();
    ensureBalanceOnlyLabel();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('input', event => {
    if (['date', 'paid', 'prev', 'paymentDate'].includes(event.target && event.target.id)) {
      addReceiptDates();
      ensureBalanceOnlyLabel();
    }
  });

  // Add the bill date to the exported PNG as well (top-right, separate from the customer name).
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
    try {
      const date = $('date') && $('date').value;
      if (date && this.width >= 500) {
        const ctx = this.getContext('2d');
        ctx.save();
        ctx.font = '14px system-ui';
        ctx.fillStyle = '#222';
        ctx.textAlign = 'right';
        ctx.fillText('Bill Date: ' + fmt(date), this.width / 4 - 26, 108);
        const paymentDate = $('paymentDate') && $('paymentDate').value;
        if (paymentDate) {
          ctx.font = '12px system-ui';
          ctx.fillText('Payment Date: ' + fmt(paymentDate), this.width / 4 - 26, 126);
        }
        ctx.restore();
      }
    } catch (_) {}
    return originalToBlob.call(this, callback, type, quality);
  };

  // When opening a saved bill for editing, restore its payment date into the new field.
  document.addEventListener('click', event => {
    const button = event.target && event.target.closest('button');
    if (!button || button.textContent.trim() !== 'Edit') return;
    setTimeout(() => {
      try {
        const name = $('name') && $('name').value;
        const date = $('date') && $('date').value;
        const list = JSON.parse(localStorage.getItem(BILL_KEY) || '[]');
        const match = list.find(b => (b.name || '') === name && (b.date || '') === date);
        if ($('paymentDate')) $('paymentDate').value = match && match.paymentDate ? match.paymentDate : '';
        addReceiptDates();
      } catch (_) {}
    }, 0);
  }, true);

  // Re-run after the existing app has initialized its form.
  installField();
  addReceiptDates();
  ensureBalanceOnlyLabel();
  window.addEventListener('pageshow', () => {
    installField();
    addReceiptDates();
    ensureBalanceOnlyLabel();
  });
})();
