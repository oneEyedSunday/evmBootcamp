import { useState } from "react";
import * as lotteryJson from "../assets/Lottery.json";
import * as tokenJson from "../assets/LotteryToken.json";
import { ethers } from "ethers";
import { useReadContract, useWriteContract } from "wagmi";

const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS || "";
const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS || "";

export default function BettingInfo(params: { address: `0x${string}` }) {
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: tokenJson.abi,
    functionName: "symbol",
  });

  const { data: prize } = useReadContract({
    address: lotteryAddress,
    abi: lotteryJson.abi,
    functionName: "prize",
    args: [params.address],
  });

  return (
    <div className="card w-full bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Betting Info</h2>
        <Lottery prize={prize as bigint} />
        <PlaceBet symbol={symbol as string} address={params.address} prize={prize as bigint} />
      </div>
    </div>
  );
}

function PlaceBet(params: { symbol: string; address: `0x${string}`; prize: bigint }) {
  const [betNumber, setBetNumber] = useState(0);
  const { data: betPrice } = useReadContract({
    address: lotteryAddress,
    abi: lotteryJson.abi,
    functionName: "betPrice",
  });

  const { isPending: betting, writeContract: placeBet } = useWriteContract();

  const { writeContract: redeemPrize } = useWriteContract();

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: tokenJson.abi,
    functionName: "allowance",
    args: [params.address, lotteryAddress],
  });

  const { writeContract: approve } = useWriteContract();

  return (
    <div className="grid grid-cols-2">
      <div>
        <button
          className="btn btn-active btn-neutral"
          disabled={betting}
          onClick={() => {
            const modal = document.getElementById("place_bet_modal");
            if (modal) (modal as HTMLDialogElement).showModal();
          }}
        >
          Place Bet
        </button>
        <dialog id={`place_bet_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {betPrice !== null
                ? `${ethers.formatEther(betPrice as bigint)} ${params.symbol} per bet`
                : "Bet price unknown"}
            </h3>
            <input
              type="number"
              placeholder="i.e. 1200"
              className="input input-bordered w-full max-w-xs"
              value={betNumber}
              onChange={e => {
                setBetNumber(Number.parseInt(e.target.value));
              }}
            />
            <div className="modal-action">
              <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button
                  className="btn"
                  onClick={() => {
                    if (Number(ethers.formatEther(allowance as bigint)) >= betNumber) {
                      placeBet({
                        address: lotteryAddress,
                        abi: lotteryJson.abi,
                        functionName: "betMany",
                        args: [betNumber.toString() === "" ? 0n : betNumber.toString()],
                      });
                    } else {
                      approve({
                        address: tokenAddress,
                        abi: tokenJson.abi,
                        functionName: "approve",
                        args: [
                          lotteryAddress,
                          betNumber.toString() === "" ? 0n : ethers.parseUnits(betNumber.toString()),
                        ],
                      });
                    }
                  }}
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>

      <div className="grid justify-items-end">
        <button
          className="btn btn-active btn-accent"
          disabled={!(params.prize > 0)}
          onClick={() =>
            redeemPrize({
              address: lotteryAddress,
              abi: lotteryJson.abi,
              functionName: "prizeWithdraw",
              args: [params.prize],
            })
          }
        >
          Redeem Prize
        </button>
      </div>
    </div>
  );
}

function Lottery(params: { prize: bigint }) {
  return <>{params.prize > 0 ? <p>Congratulations! You have won the prize!</p> : <></>}</>;
}
