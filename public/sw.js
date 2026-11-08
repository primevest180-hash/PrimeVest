self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New update from PrimeVest!',
    icon: 'https://cdn-icons-png.flaticon.com/512/2665/2665558.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/2665/2665558.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 }
  };
  event.waitUntil(self.registration.showNotification('PrimeVest', options));
});