import { useEffect, useState } from "react";
import * as lotteryJson from "../assets/Lottery.json";
import * as tokenJson from "../assets/LotteryToken.json";
import { ethers } from "ethers";
import { useBlockNumber, useReadContract, useWriteContract } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS || "";
const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS || "";

export default function LotteryInfo(params: { address: `0x${string}` }) {
  const { data: ownerAddress } = useReadContract({
    address: lotteryAddress,
    abi: lotteryJson.abi,
    functionName: "owner",
  });

  return (
    <div className="card w-full bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Lottery Info</h2>
        <TokenName />
        <TokenBalance address={params.address} />
        <Lottery address={params.address} ownerAddress={ownerAddress as string} />
      </div>
    </div>
  );
}

function TokenName() {
  const { data, isError, isPending } = useReadContract({
    address: tokenAddress,
    abi: tokenJson.abi,
    functionName: "symbol",
  });

  const name = typeof data === "string" ? data : 0;

  if (isPending) return <div>Fetching name…</div>;
  if (isError) return <div>Error fetching name</div>;
  return <div>Token: {name}</div>;
}

function TokenBalance(params: { address: `${string}` }) {
  const { data, isError, isPending } = useReadContract({
    address: tokenAddress,
    abi: tokenJson.abi,
    functionName: "balanceOf",
    args: [params.address],
  });

  const balance = typeof data === "bigint" ? data : 0;

  if (isPending) return <div>Fetching balance…</div>;
  if (isError) return <div>Error fetching balance</div>;

  return <div>Balance: {ethers.formatEther(balance)}</div>;
}

function Lottery(params: { address: `0x${string}`; ownerAddress: string }) {
  const provider = new ethers.AlchemyProvider("sepolia", scaffoldConfig.alchemyApiKey);
  const [closingDate, setClosingDate] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [duration, setDuration] = useState(0);
  const [blockTimestamp, setBlockTimestamp] = useState(0);
  const { data: isBetsOpen } = useReadContract({
    address: lotteryAddress,
    abi: lotteryJson.abi,
    functionName: "betsOpen",
  });

  const { data: closingBlockTime } = useReadContract({
    address: lotteryAddress,
    abi: lotteryJson.abi,
    functionName: "betsClosingTime",
  });

  const { isPending: opening, writeContract: openBets } = useWriteContract();

  const { isPending: closing, writeContract: closeLottery } = useWriteContract();

  const { data: blockNumber } = useBlockNumber();

  useEffect(() => {
    const end = new Date(Number(closingBlockTime));
    setClosingDate(end.toLocaleDateString());
    setClosingTime(end.toLocaleTimeString());
  }, [closingBlockTime]);

  useEffect(() => {
    const getBlockTimestamp = async () => {
      const timestamp = (await provider.getBlock(blockNumber as bigint))?.timestamp;
      if (timestamp) setBlockTimestamp(timestamp);
    };

    getBlockTimestamp();
  }, [blockNumber]);

  return (
    <>
      <div>{`Lottery Contract: ${lotteryAddress}`}</div>
      <>Lottery State: {isBetsOpen ? "Open" : "Closed"}</>
      {isBetsOpen ? (
        <>
          Lottery should close at {closingDate} : {closingTime}
        </>
      ) : (
        <></>
      )}
      {!isBetsOpen && params.address === params.ownerAddress ? (
        <button
          className="btn btn-active btn-neutral"
          disabled={opening}
          onClick={() => {
            const modal = document.getElementById("open_bet_modal");
            if (modal) (modal as HTMLDialogElement).showModal();
          }}
        >
          Open Bet
        </button>
      ) : (
        <></>
      )}
      {isBetsOpen &&
      Math.floor(Date.now() / 1000) > Number(closingBlockTime) &&
      params.address === params.ownerAddress ? (
        <button
          className="btn btn-active btn-warning"
          onClick={() =>
            closeLottery({
              address: lotteryAddress,
              abi: lotteryJson.abi,
              functionName: "closeLottery",
            })
          }
          disabled={closing}
        >
          Close Bet
        </button>
      ) : (
        <></>
      )}

      <dialog id={`open_bet_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Bet Duration (s)</h3>
          <input
            type="number"
            placeholder="i.e. 1200"
            className="input input-bordered w-full max-w-xs"
            value={duration}
            onChange={e => {
              setDuration(parseInt(e.target.value));
            }}
          />
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="btn"
                onClick={() =>
                  openBets({
                    address: lotteryAddress,
                    abi: lotteryJson.abi,
                    functionName: "openBets",
                    args: [Number(blockTimestamp) + Number(duration)],
                  })
                }
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
    </>
  );
}
