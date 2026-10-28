self.addEventListener("push", (e) => {
  let data = { title: "PrimeVest", body: "You have a new notification." };
  try { data = e.data.json(); } catch {}
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/favicon.svg",
  });
});