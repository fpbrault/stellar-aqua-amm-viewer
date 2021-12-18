import type { NextApiRequest, NextApiResponse } from "next";
import URI from "urijs";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { pools } = JSON.parse(req.body);

  res.setHeader("Cache-Control", "s-maxage=120");

  if (req.method === "POST") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poolData = await Promise.all(
      pools.map(async (pool: string) => {
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

    /*   const result = await JSON.parse(pools)
      .slice(0, 2)
      .forEach(async (pool) => {
        const response = await fetch(
          "https://horizon.stellar.org/liquidity_pools?reserves=" + pool,
          {
            method: "GET"
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
        return response;
      });

    res.status(200);
    res.json(result); */
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
