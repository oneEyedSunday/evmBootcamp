import { useEffect, useState } from "react";

type TOurInfo = {
  address: `0x${string}` | string;
};

const OurInfo = (params: TOurInfo) => {
  const [contractInfo, setContractInfo] = useState({ address: "0x", name: "" });
  const [userTokenInfo, setUserTokenInfo] = useState<{ balance?: number; votePower?: number }>({});
  const [mintingTokens, setMintingTokens] = useState(false);

  function logApiResponse(data: any | { result: any }) {
    console.log("response from API: ", data);

    return data;
  }

  function fetchTokenAddress() {
    console.log("fetching Token address");

    return fetch("http://localhost:3001/api/contract-address")
      .then(res => res.json())
      .then(logApiResponse)
      .then(jsonResponse => jsonResponse?.result);
  }

  function fetchTokenName() {
    console.log("fetching token name");

    return fetch("http://localhost:3001/api/token-name")
      .then(res => res.json())
      .then(logApiResponse)
      .then(jsonResponse => jsonResponse?.result)
      .then(tokenName => {
        setContractInfo(curr => {
          return {
            ...curr,
            name: tokenName,
          };
        });
      });
  }

  function fetchTokenBalance(address: TOurInfo["address"]) {
    console.log("fetching token balance for address: ", address);

    return fetch(`http://localhost:3001/api/token-balance/${address}`)
      .then(res => res.json())
      .then(logApiResponse)
      .then(jsonResponse => jsonResponse?.result)
      .then(balance => {
        setUserTokenInfo(curr => {
          return {
            ...curr,
            balance,
          };
        });
      });
  }

  useEffect(() => {
    if (params.address) {
      fetchTokenName();
      fetchTokenBalance(params.address);
    }
  }, [params.address]);

  function requestMintTokens() {
    if (mintingTokens) return;
    console.log('minting tokens for address" ', params.address);

    return fetch("http://localhost:3001/api/mint-tokens", {
      method: "POST",
      body: JSON.stringify({ amount: 10, address: params.address }),
    })
      .then(res => res.json())
      .then(logApiResponse)
      .then(() => {
        setMintingTokens(false);
      });
  }

  return (
    <div className="card w-96 bg-primary text-primary-content mt-4">
      <div className="card-body">
        <h2 className="card-title">Token & Ballot Information</h2>
        {contractInfo?.name ? <p>The token name is `{contractInfo?.name}`</p> : <p>Fetching name…</p>}
        {userTokenInfo?.balance ? <p>Balance is {userTokenInfo.balance}</p> : <p>Fetching balance…</p>}

        <h2 className="card-title mt-2">
          <p>Mint tokens</p>
          <button className="btn btn-active" onClick={requestMintTokens} disabled={!params.address || mintingTokens}>
            Mint some of our tokens
          </button>
        </h2>
      </div>
    </div>
  );
};

export default OurInfo;
