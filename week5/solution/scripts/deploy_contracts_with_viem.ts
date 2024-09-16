import { viem } from "hardhat";
import { toHex, hexToString } from "viem";
import { sepolia } from "viem/chains";
import dotenv from "dotenv";
dotenv.config({ path: '../.env' });


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
    const tokenName = "LolzToken";
    const tokenSymbol = "LoL";
    // deploy lotterToken
    // const { contract: lotteryTokenContract, deployer } = await deployContract("LotteryToken", [tokenName, tokenSymbol]);

    // console.log(`Deployed lotteryToken contract to ${lotteryTokenContract.address} by ${deployer.account.address}`);

    const { contract: lotteryContract, deployer: lotteryDeployer } = await deployContract("Lottery", [
        "0x272807a00e4e31ba6b78e3b42ec58457b6f34193",
        10000n, 5n, 1n,
    ]);

    console.log(`Deployed lottery contract to ${lotteryContract.address} by ${lotteryDeployer.account.address}`);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});