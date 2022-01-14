import type { NextApiRequest, NextApiResponse } from "next";
import * as StellarSdk from "stellar-sdk";

let server = new StellarSdk.Server("https://horizon.stellar.org");

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.setHeader("Cache-Control", "s-maxage=10");

  const { poolAccount } = req.query;

  if (req.method === "GET") {
    let results: StellarSdk.ServerApi.ClaimableBalanceRecord[][] = [];
    await server
      .claimableBalances()
      .claimant(typeof poolAccount === "string" ? poolAccount : poolAccount[0])
      .asset(
        new StellarSdk.Asset("AQUA", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA")
      )
      .limit(200)
      .order("desc") // so always get the latest one
      .call()
      .then(function (page) {
        results.push(page.records);
        return page.next();
      })
      .then(function (page) {
        results.push(page.records);
      })
      .catch(function (err: string) {
        console.error(`Claimable balance retrieval failed: ${err}`);
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimableBalances = results[0].map((claimableBalance: any) => {
      const claimant = claimableBalance.claimants.find(
        (claimant: { destination: string | string[] }) => claimant.destination !== poolAccount
      );
      return {
        amount: claimableBalance.amount,
        account: claimant?.destination,
        created: new Date(claimableBalance.last_modified_time).getTime(),
        expiration: new Date(
          claimant?.predicate?.not?.abs_before ? claimant.predicate.not.abs_before : 0
        ).getTime()
      };
    });
    type ClaimableBalancesResponse = {
      amount: number;
      account: string;
      date: number;
      type: string;
    };
    const newArr = claimableBalances
      .map((item) => {
        return {
          amount: item.amount,
          account: item.account,
          date: item.created,
          type: "startLock"
        };
      })
      .concat(
        claimableBalances.map((item) => {
          return {
            amount: "-" + item.amount,
            account: item.account,
            date: item.expiration,
            type: "endLock"
          };
        })
      );
    const sortedByDate = newArr.sort((a, b) => {
      const a2 = a as unknown as ClaimableBalancesResponse;
      const b2 = b as unknown as ClaimableBalancesResponse;
      return a2.date - b2.date;
    });

    let voteTotal = 0;
    sortedByDate.forEach((claimableBalance) => {
      if (claimableBalance.type === "startLock") {
        voteTotal = voteTotal + parseInt(claimableBalance.amount);
      }
    });

    let unlockedNow = 0;
    let unlockedInOneDayOrLess = 0;
    let unlockedInTwoDaysOrLess = 0;
    let unlockedInThreeDaysOrLess = 0;
    let unlockedInOneWeekOrLess = 0;
    let unlockedInTwoWeeksOrLess = 0;
    let unlockedInOneMonthOrLess = 0;

    const currTime = new Date().getTime();
    sortedByDate.forEach((claimableBalance) => {
      if (claimableBalance.type === "endLock") {
        if (claimableBalance.date - currTime < 0) {
          unlockedNow = unlockedNow + -parseInt(claimableBalance.amount);
        }
        if (claimableBalance.date - currTime < 86400000) {
          unlockedInOneDayOrLess = unlockedInOneDayOrLess + -parseInt(claimableBalance.amount);
        }
        if (claimableBalance.date - currTime < 86400000 * 2) {
          unlockedInTwoDaysOrLess = unlockedInTwoDaysOrLess + -parseInt(claimableBalance.amount);
        }
        if (claimableBalance.date - currTime < 86400000 * 3) {
          unlockedInThreeDaysOrLess =
            unlockedInThreeDaysOrLess + -parseInt(claimableBalance.amount);
        }
        if (claimableBalance.date - currTime < 86400000 * 7) {
          unlockedInOneWeekOrLess = unlockedInOneWeekOrLess + -parseInt(claimableBalance.amount);
        }
        if (claimableBalance.date - currTime < 86400000 * 14) {
          unlockedInTwoWeeksOrLess = unlockedInTwoWeeksOrLess + -parseInt(claimableBalance.amount);
        }
        if (claimableBalance.date - currTime < 86400000 * 30) {
          unlockedInOneMonthOrLess = unlockedInOneMonthOrLess + -parseInt(claimableBalance.amount);
        }
      }
    });

    const voteExpiration = [
      {
        name: "Now",
        data: { amount: unlockedNow, percent: (unlockedNow / voteTotal) * 100 }
      },
      {
        name: "1d or less",
        data: {
          amount: unlockedInOneDayOrLess,
          percent: (unlockedInOneDayOrLess / voteTotal) * 100
        }
      },
      {
        name: "2d or less",
        data: {
          amount: unlockedInTwoDaysOrLess,
          percent: (unlockedInTwoDaysOrLess / voteTotal) * 100
        }
      },
      {
        name: "3d or less",
        data: {
          amount: unlockedInThreeDaysOrLess,
          percent: (unlockedInThreeDaysOrLess / voteTotal) * 100
        }
      },
      {
        name: "1w or less",
        data: {
          amount: unlockedInOneWeekOrLess,
          percent: (unlockedInOneWeekOrLess / voteTotal) * 100
        }
      },
      {
        name: "2w or less",
        data: {
          amount: unlockedInTwoWeeksOrLess,
          percent: (unlockedInTwoWeeksOrLess / voteTotal) * 100
        }
      },
      {
        name: "1M or less",
        data: {
          amount: unlockedInOneMonthOrLess,
          percent: (unlockedInOneMonthOrLess / voteTotal) * 100
        }
      }
    ];
    /* 
    let voteData: { lockedVotes: number; date: number; type: string }[] = [];
    let voteSum = 0;
    sortedByDate.forEach((claimableBalance) => {
      voteSum = voteSum + parseInt(claimableBalance.amount);
      voteData.push({
        lockedVotes: voteSum,
        date: claimableBalance.date,
        type: claimableBalance.type
      });
    }); */

    res.status(200);
    res.json(voteExpiration);
  } else {
    throw new Error(`The HTTP ${req.method} method is not supported at this route.`);
  }
}
