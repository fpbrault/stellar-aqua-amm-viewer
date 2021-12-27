/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useGetData } from "../lib/useRequest";
import RewardsTable from "./Table";
import ReactPlaceholder from "react-placeholder";
import "react-placeholder/lib/reactPlaceholder.css";
import * as wallet from "../lib/wallet";
import Image from "next/image";
import { LIB_VERSION } from "../version";
import CurrencyInput from "react-currency-input-field";
import ReactTooltip from "react-tooltip";

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
  const { mutate } = useSWRConfig();
  const [publicKey, setPublicKey] = useState("");
  const [amount, setAmount] = useState("0.00");
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
      assets: assets && assets.assets,
      amount: amount && amount
    };
  }, [account, amount, assets, pools, rewards]);
  const { data: tableInfo } = useSWR(
    (pools && assets && rewards && publicKey.length !== 56) ||
      (pools && assets && rewards && account)
      ? ["/api/table", tableParams]
      : null,
    fetcher3,
    {
      revalidateOnFocus: false
    }
  );

  useEffect(() => {
    if (localStorage) {
      const getTheme = localStorage.getItem("theme");
      const getVersion = localStorage.getItem("version");
      const getPubKey = localStorage.getItem("publicKey");
      const getAmount = localStorage.getItem("amount");

      setTheme(getTheme ? JSON.parse(getTheme) : "stellar");
      setPublicKey(getPubKey ? JSON.parse(getPubKey) : "");
      setVersion(getVersion ? JSON.parse(getVersion) : "0.0.0");
      setAmount(getAmount ? JSON.parse(getAmount) : "0.00");
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
  function handleSetShowFutureRewards(value: boolean) {
    setShowFutureRewards(value);
    handleRefreshData();
  }

  function handleSetAmount(value: string) {
    setAmount(value);
    localStorage.setItem("amount", JSON.stringify(value));
    handleRefreshData();
  }

  function handleRefreshData() {
    mutate("/api/assets", false);
    mutate(
      publicKey.length === 56 ? "https://horizon.stellar.org/accounts/" + publicKey : null,
      false
    );
  }

  if (rewardsError || error) return <div>ERROR</div>;

  return (
    <div data-theme={theme} className="flex flex-col max-h-screen bg-base-100 text-base-content">
      <ReactTooltip
        effect="float"
        place="bottom"
        className="tooltip-primary"
        backgroundColor="black"
      />
      <input
        type="checkbox"
        defaultChecked={showLatestChanges}
        id="my-modal-2"
        className="modal-toggle"
      />

      <div className="modal">
        <div className="w-full max-w-5xl mx-4 my-auto rounded-lg modal-box">
          <div className="mb-4 text-3xl font-bold">
            {"Version " + LIB_VERSION + " - What's new:"}
          </div>
          <ul className="h-full px-4 overflow-auto list-disc max-h-64">
            <li>Improved UI on mobile and desktop</li>
            <li>Changed color on some columns to improve readability</li>
          </ul>
          <div className="modal-action">
            <button tabIndex={0} className="btn" onClick={() => handleSetVersion()}>
              Close
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-screen pt-0">
        <div className="flex flex-col justify-center w-full h-screen ">
          <div className="w-full h-full min-h-screen mx-auto shadow-2xl">
            <div className="sticky top-0 z-50">
              <div className="hidden lg:inline">
                <div className="mb-2 shadow-lg navbar bg-neutral ">
                  <div className="flex-1 hidden px-2 mx-2 lg:flex">
                    <span className="text-lg font-bold text-neutral-content">
                      AMM AQUA rewards viewer
                    </span>
                  </div>

                  <div className="flex-none">
                    <button
                      className={"mx-3 btn btn-primary" + (!tableInfo ? " loading" : "")}
                      disabled={!tableInfo}
                      onClick={() => {
                        handleRefreshData();
                      }}>
                      Refresh
                    </button>
                  </div>
                  <div className="flex-none">
                    <span className="pr-1 text-white label-text">Dark Mode</span>
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      className="mr-2 toggle"
                      onChange={(event) =>
                        handleSetTheme(event.currentTarget.checked ? "dark" : "stellar")
                      }
                    />
                  </div>

                  <div className="flex-none">
                    <input
                      type="text"
                      disabled={!tableInfo}
                      placeholder="Public Key"
                      value={publicKey}
                      className="mr-2 w-96 input input-bordered"
                      onChange={(event) => handleSetPublicKey(event.currentTarget.value)}
                    />

                    {!publicKey ? (
                      <div className="o" data-tip="Get Public Key using Albedo Wallet">
                        <button
                          className="btn btn-circle btn-primary"
                          disabled={!tableInfo}
                          onClick={() => wallet.albedoWallet().then((pubKey) => connected(pubKey))}>
                          <span className="">
                            <Image
                              alt="albedo-logo"
                              src="/images/albedo.svg"
                              width={24}
                              height={24}></Image>
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="">
                        <button
                          className="btn btn-circle btn-primary"
                          disabled={!tableInfo}
                          onClick={() => {
                            connected("");
                          }}>
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
                  </div>
                </div>
              </div>

              <div className="inline lg:hidden">
                <h1 className="py-4 text-xl font-bold text-center shadow-lg lg:mb-2 lg:shadow-none lg:top-auto bg-neutral lg:bg-transparent lg:text-neutral text-neutral-content lg:text-5xl">
                  AMM AQUA rewards viewer
                </h1>

                <div className="p-2 mx-auto lg:max-w-sm bg-base-300 lg:card">
                  <div className="w-full pt-1 mx-auto form-control">
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!tableInfo}
                        placeholder="Public Key"
                        value={publicKey}
                        className="w-full pr-16 input input-sm input-primary input-bordered"
                        onChange={(event) => handleSetPublicKey(event.currentTarget.value)}
                      />

                      {!publicKey ? (
                        <div
                          className="flex flex-col w-full max-w-xs py-2 mx-auto "
                          data-tip="Get Public Key using Albedo Wallet">
                          <button
                            className="absolute top-0 right-0 rounded-l-none btn btn-sm btn-primary"
                            disabled={!tableInfo}
                            onClick={() =>
                              wallet.albedoWallet().then((pubKey) => connected(pubKey))
                            }>
                            <span className="flex flex-col items-end">
                              <Image
                                alt="albedo-logo"
                                src="/images/albedo.svg"
                                width={24}
                                height={24}></Image>
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full max-w-xs py-2 mx-auto">
                          <button
                            className="absolute top-0 right-0 rounded-l-none btn btn-sm btn-primary"
                            disabled={!tableInfo}
                            onClick={() => {
                              connected("");
                            }}>
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
                    </div>

                    <button
                      className="mx-auto mb-1 btn btn-md btn-block btn-primary"
                      disabled={!tableInfo}
                      onClick={() => {
                        handleRefreshData();
                      }}>
                      Refresh
                    </button>
                  </div>

                  <div className="max-w-md mx-auto mt-1 collapse rounded-box collapse-arrow">
                    <input type="checkbox" />
                    <div className="text-lg font-medium collapse-title">Options</div>
                    <div className="collapse-content ">
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
                            disabled={!tableInfo}
                            checked={showFutureRewards}
                            className="toggle toggle-primary"
                            onChange={(event) =>
                              handleSetShowFutureRewards(event.currentTarget.checked ? true : false)
                            }
                          />
                        </label>
                        <div className="cursor-pointer label">
                          <span className="w-1/4 label-text">Manual Amount</span>
                          <CurrencyInput
                            id="value-input"
                            disabled={publicKey.length === 56}
                            name="value-input"
                            className={
                              "text-right input input-sm input-primary " +
                              (publicKey.length === 56 ? " input-disabled" : "")
                            }
                            placeholder="0.00"
                            step={10}
                            value={amount}
                            allowNegativeValue={false}
                            decimalsLimit={2}
                            onValueChange={(amount) => handleSetAmount(amount ?? "0.00")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-1">
              <div className="hidden lg:inline">
                <div className="flex flex-row justify-evenly rounded-xl bg-base-300 text-base-content form-control">
                  <label className="cursor-pointer label">
                    <span className="pr-1 label-text">Future Rewards</span>
                    <input
                      type="checkbox"
                      disabled={!tableInfo}
                      checked={showFutureRewards}
                      className="toggle"
                      onChange={(event) =>
                        handleSetShowFutureRewards(event.currentTarget.checked ? true : false)
                      }
                    />
                  </label>
                  <div className="cursor-pointer label">
                    <span className="w-1/4 label-text">Manual Amount</span>
                    <CurrencyInput
                      id="value-input"
                      disabled={publicKey.length === 56}
                      name="value-input"
                      className={
                        "text-right input input-sm input-primary " +
                        (publicKey.length === 56 ? " input-disabled" : "")
                      }
                      placeholder="0.00"
                      step={10}
                      value={amount}
                      allowNegativeValue={false}
                      decimalsLimit={2}
                      onValueChange={(amount) => handleSetAmount(amount ?? "0.00")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center bg-base-100 lg:pt-2 lg:pb-8">
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
                        "overflow-x-auto lg:p-2 pt-2 lg:rounded-lg shadow-sm bg-base-200 " +
                        (showFutureRewards ? " bg-orange-500 border-neutral" : null)
                      }>
                      {showFutureRewards && (
                        <div className="mb-2 text-xl text-center text-black text-bold">
                          WARNING: THESE REWARD VALUES ARE BASED ON CURRENT VOTES AND MAY CHANGE AT
                          ANY TIME.
                        </div>
                      )}
                      <div className="lg:rounded-lg lg:p-1 bg-base-200">
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
                    </div>
                  )}{" "}
                </>
              </ReactPlaceholder>
            </div>
            <div className="p-2 text-center break-words text-2xs bg-base-300 footer footer-center">
              <div>
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
        </div>
      </div>
    </div>
  );
};

export default Rewards;
