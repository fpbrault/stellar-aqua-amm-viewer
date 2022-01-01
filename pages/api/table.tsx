import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { pools, rewards, assets, account, amount } = JSON.parse(req.body);

  type Response = {
    poolId: string;
    pairId: string;
    displayId: string;
    displayName: string;
    totalShares: number;
    poolValue: number;
    dailyReward: number;
    rewardPerDollar: number;
    rewardPerDollarPerDay: number;
  };

  type RewardAsset = {
    market_key: {
      asset1_issuer: string | null;
      asset1_code: string;
      asset2_issuer: string | null;
      asset2_code: string;
    };
    daily_amm_reward: number;
  };

  //res.setHeader("Cache-Control", "s-maxage=60");

  if (req.method === "POST") {
    const response = await Promise.all(
      rewards.map(async (rewardAsset: RewardAsset) => {
        let asset1 = { id: "", display: "" };
        let asset2 = { id: "", display: "" };

        if (
          rewardAsset.market_key.asset1_issuer === null ||
          rewardAsset.market_key.asset1_issuer === ""
        ) {
          asset1.id = "native";
          asset1.display = "XLM";
        } else {
          asset1.id =
            rewardAsset?.market_key.asset1_code + ":" + rewardAsset.market_key.asset1_issuer;
          asset1.display =
            rewardAsset?.market_key.asset1_code + "-" + rewardAsset.market_key.asset1_issuer;
        }

        if (
          rewardAsset.market_key.asset2_issuer === null ||
          rewardAsset.market_key.asset2_issuer === ""
        ) {
          asset2.id = "native";
          asset1.display = "XLM";
        } else {
          asset2.id =
            rewardAsset?.market_key.asset2_code + ":" + rewardAsset.market_key.asset2_issuer;
          asset2.display =
            rewardAsset?.market_key.asset2_code + "-" + rewardAsset.market_key.asset2_issuer;
        }

        const displayName =
          rewardAsset?.market_key.asset1_code + "/" + rewardAsset?.market_key.asset2_code;

        const pairId = asset1.id + "," + asset2.id;
        const displayId = asset1.display + "/" + asset2.display;
        const pool = pools.find((pool: { id: string }) => pool.id === pairId);
        const poolId = pool?.data.id;
        const totalShares = pool?.data.total_shares;

        const dailyReward = rewardAsset.daily_amm_reward;

        const asset1_value = assets.find(
          (asset: { id: string }) =>
            asset.id === (asset1.display === "XLM" ? "XLM-native" : asset1.display)
        )?.price_USD;

        const asset2_value = assets.find(
          (asset: { id: string }) =>
            asset.id === (asset2.display === "XLM" ? "XLM-native" : asset2.display)
        )?.price_USD;

        let poolValue;
        let rewardPerDollar;

        if (asset1_value) {
          poolValue = pool?.data.reserves[0].amount * 2 * (asset1_value ?? 0);
          rewardPerDollar = asset1_value
            ? dailyReward / 24 / (pool?.data.reserves[0].amount * 2 * (asset1_value ?? 0))
            : 0;
        } else if (asset2_value) {
          poolValue = pool?.data.reserves[0].amount * 2 * (asset2_value ?? 0);
          rewardPerDollar = asset2_value
            ? dailyReward / 24 / (pool?.data.reserves[0].amount * 2 * (asset2_value ?? 0))
            : 0;
        } else {
          poolValue = 0;
          rewardPerDollar = 0;
        }
        const valuePerShare = poolValue / pool?.data.total_shares;

        let totalValueInvested = 0;
        let myShares = 0;
        let rewardPerHour = 0;
        let rewardPerHourUsd = 0;

        if (account) {
          const poolFromAccount = account.balances.find(
            (balance: { liquidity_pool_id: string }) => balance.liquidity_pool_id === poolId
          );

          if (poolFromAccount) {
            totalValueInvested = parseFloat((poolFromAccount?.balance * valuePerShare).toFixed(2));
            myShares = poolFromAccount?.balance;
            rewardPerHour = rewardPerDollar * totalValueInvested;
            rewardPerHourUsd = parseFloat((rewardPerDollar * totalValueInvested).toFixed(2));
          }
        } else if (amount && amount != "0.00") {
          totalValueInvested = amount;
          myShares = 0;
          rewardPerHour = rewardPerDollar * amount;
          rewardPerHourUsd = parseFloat((rewardPerDollar * amount).toFixed(2));
        }

        return {
          poolId: poolId,
          pairId: pairId,
          displayId: displayId,
          displayName: displayName,
          totalShares: totalShares,
          poolValue: poolValue,
          dailyReward: dailyReward,
          rewardPerDollar: parseFloat(rewardPerDollar.toFixed(5)),
          rewardPerDollarPerDay: parseFloat((rewardPerDollar * 24).toFixed(2)),
          rewardPerHour: rewardPerHour,
          rewardPerHourUSD: rewardPerHourUsd,
          rewardPerDayUSD: rewardPerHourUsd * 24,
          totalValueInvested: totalValueInvested,
          myShares: myShares
        };
      })
    );

    const sortedResponse = response.sort((a, b) => {
      const a2 = a as unknown as Response;
      const b2 = b as unknown as Response;
      return b2.rewardPerDollar - a2.rewardPerDollar;
    });

    res.status(200);
    res.json(sortedResponse.filter((r) => r.poolValue !== 0));
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
