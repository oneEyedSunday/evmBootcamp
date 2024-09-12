import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Address,
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  toHex,
  keccak256,
  PublicClient,
  WalletClient,
  TransactionReceipt,
  parseEther,
  hexToString,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import * as tokenJson from './Assets/MyToken.json';
import * as ballotJson from './Assets/TokenisedBallot.json';
import { MintTokenDto, SelfDelegateDto, VoteDto } from './Dtos';
import TransactionFailedError from './Errors/TransactionFailedError';

function serializeSafe<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (k, v) => {
      if (typeof v === 'bigint') return v.toString();

      return v;
    }),
  );
}

@Injectable()
export class AppService {
  publicClient: PublicClient;
  walletClient: WalletClient;
  constructor(private readonly configService: ConfigService) {
    const account = privateKeyToAccount(
      `0x${this.configService.get<string>('PRIVATE_KEY')}`,
    );
    // @ts-expect-error some issues here with the typings
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(this.configService.get<string>('RPC_ENDPOINT_URL')),
    } as any);

    this.walletClient = createWalletClient({
      transport: http(this.configService.get<string>('RPC_ENDPOINT_URL')),
      chain: sepolia,
      account: account,
    });
  }

  getContractAddressFor(contractKey: 'token' | 'ballot'): Address {
    switch (contractKey) {
      case 'ballot':
        return this.configService.get<Address>('BALLOT_CONTRACT_ADDRESS');
      case 'token':
        return this.configService.get<Address>('TOKEN_CONTRACT_ADDRESS');
      default:
        throw new Error(`contract address for ${contractKey} not found`);
    }
  }

  getServerWalletAddress(): string {
    return this.walletClient.account.address;
  }

  async getTokenName(): Promise<string> {
    const name = await this.publicClient.readContract({
      address: this.getContractAddressFor('token'),
      abi: tokenJson.abi,
      functionName: 'name',
    });
    return name as string;
  }

  async getTotalSupply() {
    const totalSupply = await this.publicClient.readContract({
      address: this.getContractAddressFor('token'),
      abi: tokenJson.abi,
      functionName: 'totalSupply',
    });
    return formatEther(totalSupply as bigint);
  }

  async checkMinterRole(address: string): Promise<boolean> {
    const MINTER_ROLE = keccak256(toHex('MINTER_ROLE'));
    const hasMinterRole = await this.publicClient.readContract({
      address: this.getContractAddressFor('token'),
      abi: tokenJson.abi,
      functionName: 'hasRole',
      args: [MINTER_ROLE, address],
    });
    return hasMinterRole as boolean;
  }

  async getTransactionReceipt(hash: string) {
    const txReceipt = await this.publicClient.getTransactionReceipt({
      hash: hash as Address,
    });

    return serializeSafe(txReceipt);
  }

  async getTokenBalance(address: string) {
    const tokenBalance = await this.publicClient.readContract({
      address: this.getContractAddressFor('token'),
      abi: tokenJson.abi,
      functionName: 'balanceOf',
      args: [address as Address],
    });

    return formatEther(tokenBalance as bigint);
  }

  private async waitTrxSuccess(trxHash: Address): Promise<TransactionReceipt> {
    const receipt: TransactionReceipt =
      await this.publicClient.waitForTransactionReceipt({
        hash: trxHash,
      });

    if (receipt?.status !== 'success') {
      throw new TransactionFailedError(trxHash);
    }

    return receipt;
  }

  async mintTokens(mintDto: MintTokenDto) {
    // @ts-expect-error some issues here with the typings
    const mintTokenTrx = await this.walletClient.writeContract({
      address: this.getContractAddressFor('token'),
      abi: tokenJson.abi,
      functionName: 'mint',
      args: [mintDto.address, parseEther(mintDto.amount.toString())],
    });

    await this.waitTrxSuccess(mintTokenTrx);

    return {
      transactionHash: mintTokenTrx,
    };
  }

  async selfDelegate(selfDelegateDto: SelfDelegateDto) {
    // @ts-expect-error some issues here with the typings
    const selfDelegationTx = await this.walletClient.writeContract({
      address: this.getContractAddressFor('token'),
      abi: tokenJson.abi,
      functionName: 'delegate',
      args: [selfDelegateDto.address],
    });

    try {
      await this.waitTrxSuccess(selfDelegationTx);

      return {
        message: 'Delegation successful',
        success: true,
      };
    } catch {
      return {
        message: 'Delegation failed',
        success: false,
      };
    }
  }

  async vote(voteDto: VoteDto) {
    // @ts-expect-error some issues here with the typings
    const voteTx = await this.walletClient.writeContract({
      address: this.getContractAddressFor('ballot'),
      abi: ballotJson.abi,
      functionName: 'vote',
      args: [voteDto.proposalIndex, voteDto.amount],
    });

    try {
      await this.waitTrxSuccess(voteTx);

      return {
        message: 'Voting successful',
        success: true,
      };
    } catch {
      return {
        message: 'Voting failed',
        success: false,
      };
    }
  }

  async getWinner() {
    const winner = await this.publicClient.readContract({
      address: this.getContractAddressFor('ballot'),
      abi: ballotJson.abi,
      functionName: 'winnerName',
    });

    const winnerName = hexToString(winner as any, { size: 32 });

    console.log(`original result: ${winner}, parsed result: ${winnerName}`);

    return winnerName;
  }
}
