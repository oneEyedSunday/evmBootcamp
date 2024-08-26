import { viem } from "hardhat";
import { toHex, hexToString } from "viem";
import { assert } from "console";

const MINT_VALUE = 10000n;

const PROPOSALS = ['strawberry', 'cinnamon', 'apple pie', 'vanilla', 'cherry'];

async function main() {
    const publicClient = await viem.getPublicClient();

    // Get different accounts for different roles
    const [deployToken, deployBallot, acc1, acc2] = await viem.getWalletClients();

    // deploy contract
    const tokenContract = await viem.deployContract("MyToken", [], { account: deployToken.account });
    console.log(`Deployed custom contract token at ${tokenContract.address} by deployer: ${deployToken.account.address}`);
    
    // mint tokens
    const mint1Tx = await tokenContract.write.mint([acc1.account.address, MINT_VALUE], { account: deployToken.account });
    const mint1TxReceipt = await publicClient.waitForTransactionReceipt({ hash: mint1Tx });

    if (mint1TxReceipt.status !== 'success') {
        throw new Error('Failed to mint');
    }

    console.log(`Minted ${MINT_VALUE.toString()} tokens to account ${acc1.account.address}`);

    // self delegate
    const delegate1Tx = await tokenContract.write.delegate([acc1.account.address], { account: acc1.account });
    await publicClient.waitForTransactionReceipt({ hash: delegate1Tx });
    if (mint1TxReceipt.status !== 'success') {
        throw new Error('Failed to self delegate');
    }
    console.log(`Account1 ${acc1.account.address} self delegated their voting power`);


    // mint for account 2
    const mint2Tx = await tokenContract.write.mint([acc2.account.address, MINT_VALUE / 2n], { account: deployToken.account });
    const mint2TxReceipt = await publicClient.waitForTransactionReceipt({ hash: mint2Tx });

    if (mint2TxReceipt.status !== 'success') {
        throw new Error('Failed to mint');
    }

    // self delegate
    const delegate2Tx = await tokenContract.write.delegate([acc2.account.address], { account: acc2.account });
    await publicClient.waitForTransactionReceipt({ hash: delegate2Tx });
    
    // get block number, so we can register votes
    const [targetBlockNumber, targetBlock] = await Promise.all([publicClient.getBlockNumber(), publicClient.getBlock()]);
    console.log("targetBlock and target Block number ", targetBlockNumber, targetBlock);

    // deploy tokenizedBallot contract
    const tokenisedBallotContract = await viem.deployContract("TokenisedBallot", [
        PROPOSALS.map(proposal => toHex(proposal, { size: 32 })),
        tokenContract.address,
        targetBlockNumber
    ], { account: deployBallot.account });

    console.log(`TokenisedBallot contract deployed at ${tokenContract.address} by deployer: ${deployBallot.account.address} with proposals: ${PROPOSALS.join(', ')}`)

    // Attempt to vote
    const acc1VotePower = await tokenisedBallotContract.read.getVoterPower([acc1.account.address]);
    console.log('vote power of account 1: ', acc1VotePower);

    const acc1VoteTx = await tokenisedBallotContract.write.vote([1n, 100n], { account: acc1.account });
    const acc1VoteTxReceipt = await publicClient.waitForTransactionReceipt({ hash: acc1VoteTx });

    if (acc1VoteTxReceipt.status !== 'success') {
        throw new Error('Failed to vote for proposal');
    }

    console.log(`Vote from account 1 ${acc1.account.address} voted with ${100n} on proposal ${1n} i.e [${PROPOSALS[1]}]`);

    // another user attempts to vote
    const acc2VotePower = await tokenisedBallotContract.read.getVoterPower([acc2.account.address]);
    console.log('vote power of account 2: ', acc2VotePower);


    // this user only has 50 votes
    const acct2VoteTx = await tokenisedBallotContract.write.vote([0n, 20n], { account: acc2.account });
    const acc2VoteTxReceipt = await publicClient.waitForTransactionReceipt({ hash: acc1VoteTx });

    if (acc2VoteTxReceipt.status !== 'success') {
        throw new Error('Failed to vote for proposal');
    }

    console.log(`Vote from account 2 ${acc2.account.address} voted with 20n on proposal 0n i.e [${PROPOSALS[0]}]`);

    // get winning proposal
    const winningProposal = await tokenisedBallotContract.read.winnerName();
    const winningProposalName = hexToString(winningProposal, { size: 32 });
    
    console.log(`winning proposal is: ${winningProposal} - ${winningProposalName}`);
    assert(winningProposalName === PROPOSALS[1], `Expected winning proposal to be ${PROPOSALS[1]}, got ${winningProposalName}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})