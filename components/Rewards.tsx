import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useGetData } from "../lib/useRequest";
import PoolRow from "./PoolRow";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AssetReward = {
  data: {
    amount: number;
    daily_amm_reward: number;
    daily_sdex_reward: number;
    daily_total_reward: number;
    last_updated: Date;
    market_key: {
      asset1_code: string;
      asset1_issuer: string;
      asset2_code: string;
      asset2_issuer: string;
    };
  };
  rewardPerDollar: number;
};

const Rewards: React.FC = () => {
  const { data: rewards, error: rewardsError } = useGetData("/api/rewards");
  const [showDetails, setShowDetails] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [firstLoad, setFirstload] = useState(true);
  const [theme, setTheme] = useState("stellar");
  const [tableData, setTableData] = useState([] as AssetReward[]);
  const { data: assets, error } = useGetData("/api/assets");
  const { data: account } = useSWR(
    publicKey.length === 56 ? "https://horizon.stellar.org/accounts/" + publicKey : null,
    fetcher
  );

  useEffect(() => {
    if (localStorage) {
      const getTheme = localStorage.getItem("theme");
      const getDetails = localStorage.getItem("showDetails");

      setTheme(getTheme ? JSON.parse(getTheme) : "stellar");
      setShowDetails(getDetails ? JSON.parse(getDetails) : false);
    }
  }, []);

  const refreshData = useCallback(() => {
    handleRefreshData();
  }, [handleRefreshData]);

  useEffect(() => {
    if (rewards && assets && tableData.length === 0 && firstLoad === true) {
      refreshData();
      setFirstload(false);
    }
  }, [assets, firstLoad, refreshData, rewards, tableData]);

  function handleSetTheme(theme: string) {
    setTheme(theme);
    localStorage.setItem("theme", JSON.stringify(theme));
  }
  function handleShowDetails(showDetails: boolean) {
    setShowDetails(showDetails);
    localStorage.setItem("showDetails", JSON.stringify(showDetails));
  }

  if (rewardsError || error) return <div>ERROR</div>;

  async function generateData(data: {
    market_key: {
      asset1_issuer: string | null;
      asset1_code: string;
      asset2_issuer: string | null;
      asset2_code: string;
    };
    daily_amm_reward: number;
  }) {
    let asset1;
    let asset2;
    if (data.market_key.asset1_issuer === null || data.market_key.asset1_issuer === "") {
      asset1 = "native";
    } else {
      asset1 = data?.market_key.asset1_code + "%3A" + data.market_key.asset1_issuer;
    }

    if (data.market_key.asset2_issuer === null || data.market_key.asset2_issuer === "") {
      asset2 = "native";
    } else {
      asset2 = data.market_key.asset2_code + "%3A" + data.market_key.asset2_issuer;
    }

    const asset = assets.assets.find(
      (x: { id: string }) =>
        x.id ===
        (data.market_key.asset1_issuer === ""
          ? "XLM-native"
          : data.market_key.asset1_code + "-" + data.market_key.asset1_issuer)
    );

    const pool = await fetch(
      "https://horizon.stellar.org/liquidity_pools?reserves=" + asset1 + "%2C" + asset2,
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

    const rewardPerDollar =
      data.daily_amm_reward /
      24 /
      (pool?._embedded.records[0].reserves[0].amount * 2 * (asset?.price_USD ?? 0));

    let amount = await account?.balances?.find(
      (b: { liquidity_pool_id: string }) => b.liquidity_pool_id == pool._embedded.records[0].id
    );

    return {
      data: { ...data, amount: amount },
      rewardPerDollar: rewardPerDollar
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function handleRefreshData() {
    setTableData([]);
    const data = await Promise.all(
      rewards.map(
        async (assetReward: {
          market_key: {
            asset1_issuer: string | null;
            asset1_code: string;
            asset2_issuer: string | null;
            asset2_code: string;
          };
          daily_amm_reward: number;
        }) => {
          return generateData(assetReward);
        }
      )
    );
    const sortedData = data.sort((a, b) => {
      const a2 = a as unknown as AssetReward;
      const b2 = b as unknown as AssetReward;
      return b2.rewardPerDollar - a2.rewardPerDollar;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedTableData = sortedData.map((x: any) => x.data);
    setTableData(sortedTableData && sortedTableData.length > 0 ? sortedTableData : []);
  }

  return (
    <div data-theme={theme} className="flex flex-col text-base-content bg-base-content">
      <div className="min-h-screen pt-0 ">
        <div className="flex flex-col justify-center w-full ">
          <div className="w-full min-h-screen mx-auto shadow-2xl bg-base-100">
            <h1 className="pt-8 mb-5 text-3xl font-bold text-center sm:text-5xl">
              AMM AQUA rewards viewer
            </h1>
            <div className="max-w-sm p-2 mx-auto bg-base-300 card bordered">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="w-1/4 label-text">Public Key</span>
                  <input
                    type="text"
                    value={publicKey}
                    className="w-3/4 input input-sm input-primary"
                    onChange={(event) => setPublicKey(event.currentTarget.value)}
                  />
                </label>
                <label className="cursor-pointer label">
                  <span className="label-text">Show Details</span>
                  <input
                    type="checkbox"
                    checked={showDetails}
                    className="toggle toggle-primary"
                    onChange={(event) => handleShowDetails(event.currentTarget.checked)}
                  />
                </label>
                <label className="cursor-pointer label">
                  <span className="label-text">Dark Mode</span>
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    className="toggle toggle-primary"
                    onChange={(event) =>
                      handleSetTheme(event.currentTarget.checked ? "dark" : "stellar")
                    }
                  />
                </label>
              </div>
              <button
                className="py-2 btn btn-md btn-primary"
                onClick={() => {
                  handleRefreshData();
                }}>
                Refresh
              </button>

              <div className="text-center text-2xs">
                <div>
                  {"If you like this tool, please consider sending a tip: "}
                  GDVLJKTGQGI5NXD5D2VBQZVQ5YVX7MJ7UHKPW6INEAHI4PKYDUT77KCS
                </div>
                <a
                  className="link link-primary"
                  href="https://github.com/fpbrault/stellar-aqua-amm-viewer">
                  Source code
                </a>
              </div>
            </div>

            <div className="flex justify-center pt-4 mx-2">
              <table className="table w-full max-w-6xl mx-auto table-zebra table-compact">
                <thead>
                  <tr className="text-primary">
                    <th>Pool</th>
                    <th>Daily AMM Reward</th>
                    {showDetails && (
                      <>
                        <th>total_shares</th>
                        <th>My Shares</th>
                      </>
                    )}
                    <th>% of shares owned</th>
                    <th>Reward per Hour</th>
                    <th>Total Value Invested</th>
                    {showDetails && <th>Total Value of pool</th>}
                    <th>Reward per $:</th>
                    <th>Total Reward Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards &&
                    assets &&
                    tableData &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tableData.map((assetReward: any) => {
                      if (
                        assets.assets.find(
                          (x: { id: string }) =>
                            x.id ===
                            (assetReward.market_key.asset1_issuer === ""
                              ? "XLM-native"
                              : assetReward.market_key.asset1_code +
                                "-" +
                                assetReward.market_key.asset1_issuer)
                        )
                      ) {
                        return (
                          <PoolRow
                            key={
                              assetReward.market_key.asset1_code +
                              "-" +
                              assetReward.market_key.asset1_issuer +
                              "/" +
                              assetReward.market_key.asset2_code +
                              "-" +
                              assetReward.market_key.asset2_issuer
                            }
                            assetValue={
                              assets.assets.find(
                                (x: { id: string }) =>
                                  x.id ===
                                  (assetReward.market_key.asset1_issuer === ""
                                    ? "XLM-native"
                                    : assetReward.market_key.asset1_code +
                                      "-" +
                                      assetReward.market_key.asset1_issuer)
                              ).price_USD
                            }
                            aquaValue={
                              assets.assets.find(
                                (x: { id: string }) =>
                                  x.id ===
                                  "AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"
                              ).price_USD
                            }
                            reward={assetReward}
                            details={showDetails}
                            balance={assetReward.amount && assetReward.amount.balance}></PoolRow>
                        );
                      }
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
