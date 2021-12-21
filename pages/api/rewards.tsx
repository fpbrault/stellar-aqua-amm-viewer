import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.setHeader("Cache-Control", "s-maxage=300");

  if (req.method === "GET") {
    const resultsPage1 = await fetch(
      "https://reward-api.aqua.network/api/rewards/?page=1&page_size=100&ordering=-daily_total_reward",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    )
      .then((response) => {
        if (response.status >= 400 && response.status < 600) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .catch((error) => {
        console.error(error);
      });

    res.status(200);

    res.json(resultsPage1.results);
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
