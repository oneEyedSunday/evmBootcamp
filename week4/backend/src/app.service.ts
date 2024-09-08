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
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import * as tokenJson from './Assets/MyToken.json';

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

  getContractAddress(): `0x${string}` {
    return this.configService.get<string>(
      'TOKEN_CONTRACT_ADDRESS',
    ) as `0x${string}`;
  }

  getServerWalletAddress(): string {
    return this.walletClient.account.address;
  }

  async getTokenName(): Promise<string> {
    const name = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'name',
    });
    return name as string;
  }

  async getTotalSupply() {
    const totalSupply = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'totalSupply',
    });
    return formatEther(totalSupply as bigint);
  }

  async checkMinterRole(address: string): Promise<boolean> {
    const MINTER_ROLE = keccak256(toHex('MINTER_ROLE'));
    const hasMinterRole = await this.publicClient.readContract({
      address: this.getContractAddress(),
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
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'balanceOf',
      args: [address as Address],
    });

    return formatEther(tokenBalance as bigint);
  }

  mintTokens(address: string, signature: string) {
    return { result: false };
  }
}
