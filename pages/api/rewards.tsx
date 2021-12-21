import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { future } = req.query;

  if (req.method === "GET") {
    if (future) {
      res.setHeader("Cache-Control", "s-maxage=60");
      const stats = await fetch("https://voting-tracker.aqua.network/api/voting-snapshot/stats/", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
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

      const rewardThreshold = stats.votes_value_sum * 0.01;

      const votes = await fetch(
        "https://voting-tracker.aqua.network/api/voting-snapshot/top-volume/?limit=50&page=1",
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

      const rewardAssetsList = votes.results
        .filter((vote) => vote.votes_value >= rewardThreshold)
        .map((vote) => vote.market_key);
      const rewardAssets = votes.results.filter((vote) => vote.votes_value >= rewardThreshold);

      const futureRewards = await fetch(
        "https://marketkeys-tracker.aqua.network/api/market-keys/?account_id=" +
          rewardAssetsList.join("&account_id="),
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

      const processedFutureRewards = futureRewards.results.map((asset) => {
        const reward = rewardAssets.find((key) => key.market_key === asset.account_id);
        return {
          market_key: {
            asset1_code: asset.asset1_code,
            asset1_issuer: asset.asset1_issuer,
            asset2_code: asset.asset2_code,
            asset2_issuer: asset.asset2_issuer
          },
          daily_sdex_reward: parseFloat(
            ((reward.votes_value / stats.votes_value_sum) * 2000000).toFixed(0)
          ),
          daily_amm_reward: parseFloat(
            ((reward.votes_value / stats.votes_value_sum) * 5000000).toFixed(0)
          ),
          daily_total_reward: parseFloat(
            ((reward.votes_value / stats.votes_value_sum) * 7000000).toFixed(0)
          ),
          last_updated: reward.timestamp
        };
      });
      res.status(200);
      res.json(processedFutureRewards);
    } else {
      res.setHeader("Cache-Control", "s-maxage=300");
      const rewards = await fetch(
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

      res.json(rewards.results);
    }
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
