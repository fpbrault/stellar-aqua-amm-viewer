import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.setHeader("Cache-Control", "s-maxage=60");

  const { pool } = req.query;

  if (req.method === "GET") {
    const result = await fetch("https://horizon.stellar.org/liquidity_pools?reserves=" + pool, {
      method: "GET"
    })
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
    res.json(result);
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
