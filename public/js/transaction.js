let fetchPaymentStatus;
let csrf;

window.addEventListener('load', function () {
  const transactionWrapper = document.querySelector(
    '.transaction__wrapper'
  );
  if (!transactionWrapper) return;
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
        clearInterval(fetchPaymentStatus);
      }
    })
    .catch((err) => {
      console.log('error: ' + err);
    });
}
