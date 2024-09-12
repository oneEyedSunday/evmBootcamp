"use client";

import type { NextPage } from "next";
import WalletInfo from "~~/components/Wallet";

const Ballot: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <WalletInfo />
      </div>
    </div>
  );
};

export default Ballot;
