import type { NextApiRequest, NextApiResponse } from "next";

async function fetchPage(url: string) {
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
  return response;
}

async function fetchBalances(poolAccount: string | string[]) {
  let morePages = true;
  let resultArray = [];
  let results = await fetchPage(
    "https://horizon.stellar.org/claimable_balances/?claimant=" +
      poolAccount +
      "&limit=200&order=desc"
  );
  resultArray = results._embedded.records;

  while (morePages) {
    if (results._embedded.records.length === 200) {
      results = await fetchPage(results._links.next.href);
      results._embedded.records.forEach((element: any) => {
        resultArray.push(element);
      });
    } else {
      morePages = false;
    }
  }
  return resultArray;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  res.setHeader("Cache-Control", "s-maxage=10");

  const { poolAccount } = req.query;

  if (req.method === "GET") {
    const voteBalances = await fetchBalances(poolAccount);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimableBalances = voteBalances.map((claimableBalance: any) => {
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
      amount: string;
      account: string;
      date: number;
      type: string;
    };
    const newArr = claimableBalances
      .map((item: { amount: number; account: string; created: number; expiration: number }) => {
        return {
          amount: item.amount,
          account: item.account,
          date: item.created,
          type: "startLock"
        };
      })
      .concat(
        claimableBalances.map(
          (item: { amount: number; account: string; created: number; expiration: number }) => {
            return {
              amount: "-" + item.amount,
              account: item.account,
              date: item.expiration,
              type: "endLock"
            };
          }
        )
      );
    const sortedByDate = newArr.sort(
      (a: ClaimableBalancesResponse, b: ClaimableBalancesResponse) => {
        const a2 = a;
        const b2 = b;
        return a2.date - b2.date;
      }
    );

    let voteTotal = 0;
    sortedByDate.forEach((claimableBalance: ClaimableBalancesResponse) => {
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
    sortedByDate.forEach((claimableBalance: ClaimableBalancesResponse) => {
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
