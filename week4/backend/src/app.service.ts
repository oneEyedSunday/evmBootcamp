import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  PublicClient,
  WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import * as tokenJson from './Assets/artifact.json';

const tokenJsonAbi =
  tokenJson.output.contracts['contracts/YourContract.sol'].YourContract.abi;

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

  getContractAddress(): `0x${string}` {
    return this.configService.get<string>('TOKEN_ADDRESS') as `0x${string}`;
  }

  getServerWalletAddress(): string {
    return this.walletClient.account.address;
  }

  async getTokenName(): Promise<string> {
    const name = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJsonAbi,
      functionName: 'name',
    });
    return name as string;
  }

  async getTotalSupply() {
    const totalSupply = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJsonAbi,
      functionName: 'totalSupply',
    });
    return formatEther(totalSupply as bigint);
  }

  async checkMinterRole(address: string): Promise<boolean> {
    const MINTER_ROLE = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJsonAbi,
      functionName: 'MINTER_ROLE',
    });
    const hasRole = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJsonAbi,
      functionName: 'hasRole',
      args: [MINTER_ROLE, address],
    });
    return hasRole as boolean;
  }

  getTransactionReceipt(hash: string) {
    throw new Error('Method not implemented.');
  }

  getTokenBalance(address: string) {
    throw new Error('Method not implemented.');
  }

  mintTokens(address: string, signature: string) {
    return { result: false };
  }
}
