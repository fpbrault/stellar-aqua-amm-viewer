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
    votePercentage: number;
    voteAccount: string;
  };

  async function fetchPrice(id: string) {

    const issuer = id.split("-")[1];
    const code = id.split("-")[0];
    const url = "https://horizon.stellar.org/paths/strict-send?destination_assets=USDC%3AGA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN&source_asset_type=" + (code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12") + "&source_asset_issuer=" + issuer + "&source_asset_code=" + code + "&source_amount=1"

    const response = await fetch(url, {
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
    return response?._embedded.records[0]?.destination_amount;
  }

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
        const poolId = pool?.data?.id;
        const totalShares = pool?.data?.total_shares;

        const dailyReward = rewardAsset.daily_amm_reward;

        let asset1_value = assets.find(
          (asset: { id: string }) =>
            asset.id === (asset1.display === "XLM" ? "XLM-native" : asset1.display)
        )?.price_USD;

        const asset2_value = assets.find(
          (asset: { id: string }) =>
            asset.id === (asset2.display === "XLM" ? "XLM-native" : asset2.display)
        )?.price_USD;

        if (asset1_value === undefined && asset2_value === undefined) {
          asset1_value = await fetchPrice(asset1.display)
        }

        let poolValue;
        let rewardPerDollar;

        if (pool?.data) {
          if (asset1_value) {
            let asset1_reserves = pool?.data.reserves.find((x: { asset: string; amount: Number }) => x.asset === asset1.id)
            poolValue = asset1_reserves.amount * 2 * (asset1_value ?? 0);
            rewardPerDollar = asset1_value
              ? dailyReward / 24 / (asset1_reserves.amount * 2 * (asset1_value ?? 0))
              : 0;
          } else if (asset2_value) {
            let asset2_reserves = pool?.data.reserves.find((x: { asset: string; amount: Number }) => x.asset === asset2.id)
            poolValue = asset2_reserves.amount * 2 * (asset2_value ?? 0);
            rewardPerDollar = asset2_value
              ? dailyReward / 24 / (asset2_reserves.amount * 2 * (asset2_value ?? 0))
              : 0;
          } else {
            poolValue = 0;
            rewardPerDollar = 0;
          }
        } else {
          poolValue = 0;
          rewardPerDollar = 0;
        }
        const valuePerShare = poolValue / pool?.data?.total_shares;

        let totalValueInvested = 0;
        let votePercentage = rewardAsset.votePercentage ?? 0;
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
          myShares: myShares,
          votePercentage: votePercentage.toFixed(2),
          voteAccount: rewardAsset.voteAccount
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
