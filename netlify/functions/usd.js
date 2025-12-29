export async function handler() {
  const res = await fetch("https://www.boi.org.il/PublicApi/GetExchangeRates?asJson=true");
  const data = await res.json();

  const usd = data.exchangeRates.find(r => r.key === "USD");

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rate: usd.currentRate.toFixed(3),
      date: usd.lastUpdateDate,
      time: "15:00 (בקירוב)"
    })
  };
}
