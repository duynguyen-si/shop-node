let fetchPaymentStatus;
let csrf;
let transactionWrapper;
let transactionStatusEl;

window.addEventListener('load', function () {
  transactionWrapper = document.querySelector(
    '.transaction__wrapper'
  );
  if (!transactionWrapper) return;
  transactionStatusEl = transactionWrapper.querySelector(
    '.transaction--status'
  );
  csrf =
    transactionWrapper.querySelector('[name=_csrf]').value;
  if (!csrf) return;

  // Your document is loaded.
  var fetchInterval = 3000; // 1 seconds.

  // Invoke the request every 1 seconds.
  fetchPaymentStatus = setInterval(
    fetchStatus,
    fetchInterval
  );
});

function fetchStatus() {
  fetch('/transactions', {
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data?.isSuccess) {
        transactionStatusEl.classList.add('success');
        clearInterval(fetchPaymentStatus);
        setTimeout(() => {
          window.location.href =
            window.location.origin + '/orders';
        }, 1500);
      }
    })
    .catch((err) => {
      console.log('error: ' + err);
    });
}
