import React, { useState } from "react";
import { useGetData } from "../lib/useRequest";
import CurrencyInput from "react-currency-input-field";

type poolProps = {
  assetValue: number;
  reward: {
    market_key: {
      asset1_issuer: string | null;
      asset1_code: string;
      asset2_issuer: string | null;
      asset2_code: string;
    };
    daily_amm_reward: number;
  };
  details: boolean;
  balance?: number;
  aquaValue: number;
};

const PoolRow: React.FC<poolProps> = (props) => {
  let asset1;
  let asset2;

  if (
    props.reward.market_key.asset1_issuer === null ||
    props.reward.market_key.asset1_issuer === ""
  ) {
    asset1 = "native";
  } else {
    asset1 = props.reward.market_key.asset1_code + "%3A" + props.reward.market_key.asset1_issuer;
  }

  if (
    props.reward.market_key.asset2_issuer === null ||
    props.reward.market_key.asset2_issuer === ""
  ) {
    asset2 = "native";
  } else {
    asset2 = props.reward.market_key.asset2_code + "%3A" + props.reward.market_key.asset2_issuer;
  }

  const { data: pool, error } = useGetData(
    "https://horizon.stellar.org/liquidity_pools?reserves=" + asset1 + "%2C" + asset2
  );

  const poolValue = pool
    ? pool._embedded.records[0].reserves[0].amount * 2 * (props.assetValue ? props.assetValue : 0)
    : 0;

  const valuePerShare =
    (pool?._embedded.records[0].reserves[0].amount * 2 * props.assetValue) /
    pool?._embedded.records[0].total_shares;

  const [value, setValue] = useState(
    props.balance ? (props.balance * valuePerShare).toFixed(2) : "0"
  );

  if (!(pool && props.reward && props.assetValue)) return <div>Loading...</div>;

  const ownedSharesPercentage = (parseFloat(value) / poolValue) * 100;
  const ownedShares = ownedSharesPercentage * pool?._embedded.records[0].total_shares;
  const rewardPerDollar =
    props.reward.daily_amm_reward /
    24 /
    (pool._embedded.records[0].reserves[0].amount * 2 * (props.assetValue ?? 0));

  if (error) return <div>ERROR</div>;

  return (
    <tr className="text-sm hover">
      {pool && (
        <>
          <th>
            <div className="badge badge-primary">
              {props.reward.market_key.asset1_code + "/" + props.reward.market_key.asset2_code}
            </div>
          </th>
          <th className="text-right">{props.reward.daily_amm_reward}</th>
          {props.details && (
            <>
              <th className="text-right">
                {parseFloat(pool._embedded.records[0].total_shares).toFixed(0)}
              </th>
              <th className="text-right">{ownedShares.toFixed(0)}</th>
            </>
          )}

          <th className="text-right">
            {ownedSharesPercentage ? ownedSharesPercentage.toFixed(2) : 0}%
          </th>
          <th className="text-center">
            {ownedSharesPercentage ? (
              <span className="text-right badge badge-primary badge-outline">
                {((props.reward.daily_amm_reward * ownedSharesPercentage) / 100 / 24).toFixed(2) +
                  " AQUA"}
              </span>
            ) : null}
          </th>
          <th>
            <CurrencyInput
              id="value-input"
              name="value-input"
              prefix="$"
              className="text-center input-xs input-bordered input"
              placeholder="Please enter a number"
              defaultValue={value}
              decimalsLimit={2}
              onValueChange={(value) => setValue(value ?? "0")}
            />
          </th>
          {props.details && (
            <th className="text-right">
              ${(pool._embedded.records[0].reserves[0].amount * 2 * props.assetValue).toFixed(2)}
            </th>
          )}
          <th className="text-center">
            <span className="badge badge-primary badge-outline">
              {rewardPerDollar.toFixed(4) + " AQUA"}
            </span>
          </th>
          <th className="text-right">
            {rewardPerDollar * parseFloat(value) * props.aquaValue > 0 &&
              "$" + (rewardPerDollar * parseFloat(value) * props.aquaValue).toFixed(2)}
          </th>
        </>
      )}
    </tr>
  );
};

export default PoolRow;
