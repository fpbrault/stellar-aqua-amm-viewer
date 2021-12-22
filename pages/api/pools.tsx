import type { NextApiRequest, NextApiResponse } from "next";
import URI from "urijs";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const pools = req.query.pools as string;

  res.setHeader("Cache-Control", "s-maxage=60");

  if (req.method === "GET") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poolData = await Promise.all(
      JSON.parse(pools).map(async (pool: string) => {
        return {
          id: URI.decode(pool),
          data: await fetch("https://horizon.stellar.org/liquidity_pools?reserves=" + pool, {
            method: "GET"
          })
            .then((response) => {
              if (response.status >= 400 && response.status < 600) {
                throw new Error(response.statusText);
              }
              return response.json();
            })
            .then((response) => {
              return response._embedded.records[0];
            })
            .catch((error) => {
              console.error(error);
            })
        };
      })
    );
    res.status(200);
    res.send(poolData);
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
