import { viem } from "hardhat";

const MINT_VALUE = 100n;

async function main() {
    const publicClient = await viem.getPublicClient();
    const lastBlock = await publicClient.getBlock();
    console.log('last block: ', { lastBlock });

    const [deployer, acc1, acc2] = await viem.getWalletClients();
    const contract = await viem.deployContract("MyToken");
    console.log(`MyToken contract deployed at ${contract.address}\n`);

    // mint some tokens
    const mintTx = await contract.write.mint([acc1.account.address, MINT_VALUE]);
    await publicClient.waitForTransactionReceipt({ hash: mintTx });
    console.log(
        `Minted ${MINT_VALUE.toString()} decimal units to account ${acc1.account.address
        }\n`
    );
    const balanceBN = await contract.read.balanceOf([acc1.account.address]);
    console.log(
        `Account ${acc1.account.address
        } has ${balanceBN.toString()} decimal units of MyToken\n`
    );

    // check vote power
    const votes = await contract.read.getVotes([acc1.account.address]);
    console.log(
        `Account ${acc1.account.address
        } has ${votes.toString()} units of voting power before self delegating\n`
    );

    // self delegate vote power
    const delegateTx = await contract.write.delegate([acc1.account.address], {
        account: acc1.account
    });
    await publicClient.waitForTransactionReceipt({ hash: delegateTx });
    const votesAfter = await contract.read.getVotes([acc1.account.address]);
    console.log(
        `Account ${acc1.account.address
        } has ${votesAfter.toString()} units of voting power after self delegating\n`
    );

    // experimenting with token transfers
    const transferTx = await contract.write.transfer(
        [acc2.account.address, MINT_VALUE / 2n],
        {
            account: acc1.account,
        }
    );
    await publicClient.waitForTransactionReceipt({ hash: transferTx });
    const votes1AfterTransfer = await contract.read.getVotes([
        acc1.account.address,
    ]);
    console.log(
        `Account ${acc1.account.address
        } has ${votes1AfterTransfer.toString()} units of voting power after transferring\n`
    );
    const votes2AfterTransfer = await contract.read.getVotes([
        acc2.account.address,
    ]);
    console.log(
        `Account ${acc2.account.address
        } has ${votes2AfterTransfer.toString()} units of voting power after receiving a transfer\n`
    );

    // checking past votes
    const lastBlockNumber = await publicClient.getBlockNumber();
    for (let index = lastBlockNumber - 1n; index > 0n; index--) {
      const pastVotes = await contract.read.getPastVotes([
        acc1.account.address,
        index,
      ]);
      console.log(
        `Account ${
          acc1.account.address
        } had ${pastVotes.toString()} units of voting power at block ${index}\n`
      );
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
