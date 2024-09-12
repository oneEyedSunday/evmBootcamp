import { toHex, hexToString } from "viem";
import { viem } from "hardhat";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";
dotenv.config();

const PROPOSALS = ['Proposals 1', 'Proposals 2', 'Proposals 3'];

const MINT_VALUE = 100n;

async function deployContract(contractName: string, contractDeployArgs: any[]) {
  const publicClient = await viem.getPublicClient();
  const [deployer, otherAccount] = await viem.getWalletClients({
    chain: sepolia,
    account: `0x${process.env.PRIVATE_KEY}` as `0x${string}`,
  });
  const contract = await viem.deployContract(contractName, contractDeployArgs);
  return { publicClient, deployer, otherAccounts: [otherAccount], contract };
}

async function main() {
  const publicClient = await viem.getPublicClient();
  const { contract: tokenContract, otherAccounts, deployer } = await deployContract("MyToken", []);

  console.log(`Deployed contract MyToken to ${tokenContract.address} by ${deployer.account.address}`);

  const lastBlock = await publicClient.getBlock();
  // console.log('last block: ', { lastBlock });
  console.log('last Block number: ', lastBlock.number);

  const { contract: ballotContract } = await deployContract("TokenisedBallot", [
    PROPOSALS.map((prop) => toHex(prop, { size: 32 })),
    tokenContract.address,
    lastBlock.number,
  ]);

  console.log(`Deployed contract to ${ballotContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
