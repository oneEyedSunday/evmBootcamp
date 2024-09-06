// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IMyToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

contract  TokenisedBallot {
    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    IMyToken public tokenContract;
    Proposal[] public proposals;
    uint256 public targetBlockNumber;
    mapping(address => uint256) public spentVotePower;

    constructor(bytes32[] memory _proposalNames, address _tokenContract,
        uint256 _targetBlockNumber) {
        require(block.number > _targetBlockNumber, "TokemizedBallot: targetBlockNumber isnt in the past");
        tokenContract = IMyToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;
        //  ERC20Votes lets you keep track of historical voting power
        for (uint i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({name: _proposalNames[i], voteCount: 0}));
        }
    }

    function vote(uint256 proposal, uint256 amount) external {
        uint256 senderVotingPower = getVoterPower(msg.sender); // TODO
        // we should be concerned with voting power and not balanced
        // yet care for voting power and self delegating
        require(senderVotingPower >= amount, "TokenizedBallot: insufficient voting power");
       // do first before voting
        spentVotePower[msg.sender] += amount;
        proposals[proposal].voteCount += amount;
    }

    function getVoterPower(address voter) public view returns (uint256 votePower_) {
        votePower_ = tokenContract.getPastVotes(voter, targetBlockNumber) - spentVotePower[voter];
    }

    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
