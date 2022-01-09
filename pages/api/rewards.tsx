import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { future } = req.query;

  if (req.method === "GET") {
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
      .filter((vote: { votes_value: number }) => vote.votes_value >= rewardThreshold)
      .map((vote: { market_key: string }) => vote.market_key);
    const rewardAssets = votes.results.filter(
      (vote: { votes_value: number }) => vote.votes_value >= rewardThreshold
    );

    const totalEligibleVotes = rewardAssets
      .map((rewardAsset: { votes_value: string }) => parseFloat(rewardAsset.votes_value))
      .reduce((a: number, b: number) => a + b, 0);

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

    if (future) {
      res.setHeader("Cache-Control", "s-maxage=60");

      const processedFutureRewards = futureRewards.results.map(
        (asset: {
          account_id: string;
          asset1_code: string;
          asset1_issuer: string;
          asset2_code: string;
          asset2_issuer: string;
        }) => {
          const reward = rewardAssets.find(
            (key: { market_key: string }) => key.market_key === asset.account_id
          );

          return {
            market_key: {
              asset1_code: asset.asset1_code,
              asset1_issuer: asset.asset1_issuer,
              asset2_code: asset.asset2_code,
              asset2_issuer: asset.asset2_issuer
            },
            daily_sdex_reward: parseFloat(
              ((reward.votes_value / totalEligibleVotes) * 2000000).toFixed(0)
            ),
            daily_amm_reward: parseFloat(
              ((reward.votes_value / totalEligibleVotes) * 5000000).toFixed(0)
            ),
            daily_total_reward: parseFloat(
              ((reward.votes_value / totalEligibleVotes) * 7000000).toFixed(0)
            ),
            last_updated: reward.timestamp,
            votePercentage: (reward.votes_value / stats.votes_value_sum) * 100
          };
        }
      );
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
      const newArr = rewards.results.map(function (asset: {
        market_key: {
          asset1_code: string;
          asset1_issuer: string;
          asset2_code: string;
          asset2_issuer: string;
        };
      }) {
        const res = futureRewards.results.find(
          (futureReward: {
            asset1_code: string;
            asset1_issuer: string;
            asset2_code: string;
            asset2_issuer: string;
          }) =>
            futureReward.asset1_code +
              futureReward.asset1_issuer +
              futureReward.asset2_code +
              futureReward.asset2_issuer ==
            asset.market_key.asset1_code +
              asset.market_key.asset1_issuer +
              asset.market_key.asset2_code +
              asset.market_key.asset2_issuer
        );
        const reward = rewardAssets.find(
          (key: { market_key: string }) => key.market_key === res?.account_id
        );
        return {
          ...asset,
          votePercentage: res ? (reward.votes_value / stats.votes_value_sum) * 100 : 0
        };
      });

      res.json(newArr);
    }
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
