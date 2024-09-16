"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import * as lotteryJson from "~~/components/assets/Lottery.json";
import BettingInfo from "~~/components/lottery/BettingInfo";
import LotteryInfo from "~~/components/lottery/LotteryInfo";
import { Address } from "~~/components/scaffold-eth";

const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS || "";

function WalletBalance(params: { address: `0x${string}` }) {
  const { data, isError, isLoading } = useBalance({
    address: params.address,
  });

  if (isLoading) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;

  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Wallet balance</h2>
        Balance: {data?.formatted} {data?.symbol}
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  const { address: connectedAddress, isDisconnected } = useAccount();
  const { data: isBetsOpen } = useReadContract({
    address: lotteryAddress,
    abi: lotteryJson.abi,
    functionName: "betsOpen",
  });

  if (isDisconnected)
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div>
              <p>Wallet disconnected. Connect wallet to continue</p>
            </div>
          </div>
        </div>
      </div>
    );

  if (connectedAddress)
    return (
      <>
        <div className="flex items-center flex-col flex-grow pt-10">
          <div className="px-5">
            <h1 className="text-center">
              <span className="block text-2xl mb-2">Welcome to</span>
              <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
            </h1>
            <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
              <p className="my-2 font-medium">Connected Address:</p>
              <Address address={connectedAddress} />
            </div>
            <p className="text-center text-lg">
              Get started by editing{" "}
              <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
                packages/nextjs/app/page.tsx
              </code>
            </p>
            <p className="text-center text-lg">
              Edit your smart contract{" "}
              <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
                YourContract.sol
              </code>{" "}
              in{" "}
              <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
                packages/hardhat/contracts
              </code>
            </p>
          </div>

          <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
            <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
              <WalletBalance address={connectedAddress as `0x${string}`} />
              <LotteryInfo address={connectedAddress as `0x${string}`} />
              {isBetsOpen ? <BettingInfo address={connectedAddress as `0x${string}`} /> : <></>}

              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
                <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
                <p>
                  Explore your local transactions with the{" "}
                  <Link href="/blockexplorer" passHref className="link">
                    Block Explorer
                  </Link>{" "}
                  tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
};

export default Home;
