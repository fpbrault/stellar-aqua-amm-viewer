/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { useGetData } from "../lib/useRequest";
import RewardsTable from "./Table";
import ReactPlaceholder from "react-placeholder";
import "react-placeholder/lib/reactPlaceholder.css";
import * as wallet from "../lib/wallet";
import Image from "next/image";
import { LIB_VERSION } from "../version";

const getPoolIds = async (
  assets: {
    market_key: {
      asset1_issuer: string | null;
      asset1_code: string;
      asset2_issuer: string | null;
      asset2_code: string;
    };
  }[]
) => {
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
  const [publicKey, setPublicKey] = useState("");
  const [version, setVersion] = useState("0.0.0");
  const [showLatestChanges, setShowLatestChanges] = useState(false);
  const [poolIds, setPoolIds] = useState();
  const [theme, setTheme] = useState("stellar");
  const [showFutureRewards, setShowFutureRewards] = useState(false);

  const connected = async (pubKey: string) => {
    handleSetPublicKey(pubKey);
  };

  const { data: rewards, error: rewardsError } = useGetData(
    showFutureRewards ? "/api/rewards?future=true" : "/api/rewards"
  );

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
      const getVersion = localStorage.getItem("version");
      const getPubKey = localStorage.getItem("publicKey");

      setTheme(getTheme ? JSON.parse(getTheme) : "stellar");
      setPublicKey(getPubKey ? JSON.parse(getPubKey) : "");
      setVersion(getVersion ? JSON.parse(getVersion) : "0.0.0");
    }
  }, []);

  useEffect(() => {
    if (version !== LIB_VERSION) {
      setShowLatestChanges(true);
    } else {
      setShowLatestChanges(false);
    }
  }, [version]);

  function handleSetTheme(theme: string) {
    setTheme(theme);
    localStorage.setItem("theme", JSON.stringify(theme));
  }
  function handleSetVersion() {
    setVersion(LIB_VERSION);
    localStorage.setItem("version", JSON.stringify(LIB_VERSION));
  }
  function handleSetPublicKey(pubKey: string) {
    setPublicKey(pubKey);
    localStorage.setItem("publicKey", JSON.stringify(pubKey));
    handleRefreshData();
  }

  function handleRefreshData() {
    mutate(
      publicKey.length === 56 ? "https://horizon.stellar.org/accounts/" + publicKey : null,
      false
    );
    mutate(poolIds ? ["/api/pools", { pools: poolIds }] : null, false);
  }

  if (rewardsError || error) return <div>ERROR</div>;

  return (
    <div data-theme={theme} className="flex flex-col text-base-content bg-base-content">
      <input
        type="checkbox"
        defaultChecked={showLatestChanges}
        id="my-modal-2"
        className="modal-toggle"
      />

      <div className="modal">
        <div className="modal-box">
          <div className="mb-4 text-3xl font-bold">
            {"Version " + LIB_VERSION + " - What's new:"}
          </div>
          <ul className="px-4 list-disc">
            <li>Added changelog modal window (only shown once per new version)</li>
            <li>Values invested can be retrieved using Public Key</li>
            <li>Added Albedo wallet support</li>
          </ul>
          <div className="modal-action">
            <button tabIndex={0} className="btn" onClick={() => handleSetVersion()}>
              Close
            </button>
          </div>
        </div>
      </div>
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
                  <label className="cursor-pointer label">
                    <span className="label-text">Future Rewards</span>
                    <input
                      type="checkbox"
                      checked={showFutureRewards}
                      className="toggle toggle-primary"
                      onChange={(event) =>
                        setShowFutureRewards(event.currentTarget.checked ? true : false)
                      }
                    />
                  </label>
                  <label className="cursor-pointer label">
                    <span className="w-1/4 label-text">Public Key</span>

                    <input
                      type="text"
                      value={publicKey}
                      className="w-3/4 input input-sm input-primary"
                      onChange={(event) => handleSetPublicKey(event.currentTarget.value)}
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
                  <button
                    className="max-w-xs py-2 mx-auto btn btn-md btn-primary btn-block btn-outline"
                    onClick={() => {
                      handleRefreshData();
                    }}>
                    Refresh
                  </button>
                </div>

                <div className="pt-4 text-center break-words text-2xs">
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
                    <div
                      className={
                        "p-2 border rounded-lg shadow-sm bg-base-200 " +
                        (showFutureRewards ? " bg-orange-500" : null)
                      }>
                      {showFutureRewards && (
                        <div className="mb-2 text-xl text-center text-black text-bold">
                          WARNING: THESE REWARD VALUES ARE BASED ON CURRENT VOTES AND MAY CHANGE AT
                          ANY TIME.
                        </div>
                      )}
                      <RewardsTable
                        data={tableInfo}
                        aquaPrice={
                          assets.assets.find(
                            (asset: { id: string }) =>
                              asset.id ===
                              "AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"
                          ).price_USD
                        }></RewardsTable>
                    </div>
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
