// Fetches the current USD → COP exchange rate.
// Uses cache: "no-store" so we always get a live value on every layout render.
// Falls back to 4,400 if the API is unreachable.

export async function getUsdCopRate(): Promise<number> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store", // always fresh — avoid stale Next.js Data Cache
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data?.rates?.COP || typeof data.rates.COP !== "number") {
      throw new Error("COP rate missing in response");
    }

    const rate = data.rates.COP;

    // Sanity guard: real COP/USD is between 3,000 and 6,000
    if (rate < 3000 || rate > 6000) {
      console.warn(`getUsdCopRate: suspicious rate ${rate}, using fallback`);
      return 4400;
    }

    return rate;
  } catch (error) {
    console.error("getUsdCopRate error:", error);
    return 4400;
  }
}
