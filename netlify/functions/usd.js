export async function handler() {
  try {
    const res = await fetch(
      "https://www.boi.org.il/PublicApi/GetExchangeRates?asJson=true"
    );
    const data = await res.json();

    const usd = data.exchangeRates.find(r => r.key === "USD");
    if (!usd) throw new Error("USD rate not found");

    const dateObj = new Date(usd.lastUpdate);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify({
        rate: usd.currentExchangeRate.toFixed(3),
        date: dateObj.toLocaleDateString("he-IL"),
        time: dateObj.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit"
        })
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
