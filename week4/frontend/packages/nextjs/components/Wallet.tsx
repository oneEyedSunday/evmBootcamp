import OurInfo from "./OurInfo";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const WalletInfo = () => {
  const { address: connectedAddress } = useAccount();

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

        {connectedAddress && <OurInfo address={connectedAddress} />}
      </div>
    </div>
  );
};

export default WalletInfo;
