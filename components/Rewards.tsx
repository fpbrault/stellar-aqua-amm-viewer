/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { useGetData } from "../lib/useRequest";
import RewardsTable from "./Table";
import ReactPlaceholder from "react-placeholder";
import "react-placeholder/lib/reactPlaceholder.css";

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

const getPoolIds = async (assets: {
  map: (
    arg0: (asset: {
      market_key: {
        asset1_issuer: string | null;
        asset1_code: string;
        asset2_issuer: string | null;
        asset2_code: string;
      };
    }) => Promise<string>
  ) => readonly [
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown
  ];
}) => {
  const results = await Promise.all(
    assets.map(
      async (asset: {
        market_key: {
          asset1_issuer: string | null;
          asset1_code: string;
          asset2_issuer: string | null;
          asset2_code: string;
        };
      }) => {
        let asset1;
        let asset2;
        if (asset.market_key.asset1_issuer === null || asset.market_key.asset1_issuer === "") {
          asset1 = "native";
        } else {
          asset1 = asset?.market_key.asset1_code + "%3A" + asset.market_key.asset1_issuer;
        }

        if (asset.market_key.asset2_issuer === null || asset.market_key.asset2_issuer === "") {
          asset2 = "native";
        } else {
          asset2 = asset.market_key.asset2_code + "%3A" + asset.market_key.asset2_issuer;
        }
        return asset1 + "%2C" + asset2;
      }
    )
  );
  return results;
};

const fetcher2 = async (url: string, body: any) => {
  const res = await fetch(url + "?pools=" + JSON.stringify(body.pools));
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};

const fetcher3 = async (url: string, body: any) => {
  const res = await fetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json();
};
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Rewards: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [firstLoad, setFirstload] = useState(true);
  const [poolIds, setPoolIds] = useState();
  const [theme, setTheme] = useState("stellar");
  const connected = async (pubKey: string) => {
    setPublicKey(pubKey);
    handleRefreshData();
  };

  const { data: rewards, error: rewardsError } = useGetData("/api/rewards");

  const { data: account } = useSWR(
    publicKey.length === 56 ? "https://horizon.stellar.org/accounts/" + publicKey : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: assets, error } = useGetData("/api/assets");

  useMemo(async () => {
    const poolIds = rewards && (await getPoolIds(rewards));
    setPoolIds(poolIds);
    return { assets: poolIds && poolIds };
  }, [rewards]);

  const { data: pools } = useSWR(poolIds ? ["/api/pools", { pools: poolIds }] : null, fetcher2, {
    revalidateOnFocus: false
  });

  const tableParams = useMemo(() => {
    return {
      pools: pools && pools,
      account: account && account,
      rewards: rewards && rewards,
      assets: assets && assets.assets
    };
  }, [account, assets, pools, rewards]);

  const { data: tableInfo } = useSWR(pools ? ["/api/table", tableParams] : null, fetcher3, {
    revalidateOnFocus: false
  });

  useEffect(() => {
    if (localStorage) {
      const getTheme = localStorage.getItem("theme");
      const getDetails = localStorage.getItem("showDetails");

      setTheme(getTheme ? JSON.parse(getTheme) : "stellar");
      setShowDetails(getDetails ? JSON.parse(getDetails) : false);
    }
  }, []);

  function handleSetTheme(theme: string) {
    setTheme(theme);
    localStorage.setItem("theme", JSON.stringify(theme));
  }
  function handleShowDetails(showDetails: boolean) {
    setShowDetails(showDetails);
    localStorage.setItem("showDetails", JSON.stringify(showDetails));
  }

  function handleRefreshData() {
    mutate(poolIds ? ["/api/pools", { pools: poolIds }] : null, false);
  }

  if (rewardsError || error) return <div>ERROR</div>;

  return (
    <div data-theme={theme} className="flex flex-col text-base-content bg-base-content">
      <div className="min-h-screen pt-0 ">
        <div className="flex flex-col justify-center w-full ">
          <div className="w-full min-h-screen mx-auto shadow-2xl bg-base-100">
            <h1 className="pt-8 mb-5 text-3xl font-bold text-center sm:text-5xl">
              AMM AQUA rewards viewer
            </h1>
            <div className="mx-2">
              <div className="max-w-md p-2 mx-auto bg-base-300 card bordered">
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

                  {!publicKey ? (
                    <div className="flex flex-col w-full max-w-xs py-2 mx-auto">
                      <button
                        className="btn btn-primary btn-block"
                        onClick={() => wallet.albedoWallet().then((pubKey) => connected(pubKey))}>
                        <span className="flex flex-col items-end">
                          <Image
                            alt="albedo-logo"
                            src="/images/albedo.svg"
                            width={24}
                            height={24}></Image>
                        </span>
                        Connect with Albedo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col w-full max-w-xs py-2 mx-auto">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          connected("");
                        }}>
                        Log Out
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/*  <label className="cursor-pointer label">
                    <span className="label-text">Show Details</span>
                    <input
                      type="checkbox"
                      checked={showDetails}
                      className="toggle toggle-primary"
                      onChange={(event) => handleShowDetails(event.currentTarget.checked)}
                    />
                  </label> */}
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

                <div className="text-center break-words text-2xs">
                  <div className="">
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
            </div>

            <div className="flex justify-center pt-4 pb-8 mx-2">
              <ReactPlaceholder
                showLoadingAnimation
                className="max-w-6xl"
                rows={30}
                type="text"
                ready={tableInfo && assets}>
                <>
                  {tableInfo && assets && (
                    <RewardsTable
                      data={tableInfo}
                      aquaPrice={
                        assets.assets.find(
                          (asset: { id: string }) =>
                            asset.id ===
                            "AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"
                        ).price_USD
                      }></RewardsTable>
                  )}{" "}
                </>
              </ReactPlaceholder>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
