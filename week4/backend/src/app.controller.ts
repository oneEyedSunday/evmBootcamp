import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MintTokenDto, SelfDelegateDto, VoteDto } from './Dtos';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('contract-address')
  async getContractAddress() {
    return { result: await this.appService.getContractAddressFor('token') };
  }

  @Get('token-name')
  async getTokenName() {
    return { result: await this.appService.getTokenName() };
  }

  @Get('total-supply')
  async getTotalSupply() {
    return { result: await this.appService.getTotalSupply() };
  }

  @Get('token-balance/:address')
  async getTokenBalance(@Param('address') address: string) {
    return { result: await this.appService.getTokenBalance(address) };
  }

  @Get('transaction-receipt')
  async getTransactionReceipt(@Query('hash') hash: string) {
    return { result: await this.appService.getTransactionReceipt(hash) };
  }

  @Get('server-wallet-address')
  getServerWalletAddress() {
    return { result: this.appService.getServerWalletAddress() };
  }

  @Get('check-minter-role')
  async checkMinterRole(@Query('address') address: string) {
    return { result: await this.appService.checkMinterRole(address) };
  }

  @Post('mint-tokens')
  async mintTokens(@Body() body: MintTokenDto) {
    return {
      result: await this.appService.mintTokens(body),
    };
  }

  @Post('self-delegate')
  async selfDelegate(@Body() body: SelfDelegateDto) {
    return {
      result: await this.appService.selfDelegate(body),
    };
  }

  @Post('vote')
  async voteForAProposal(@Body() body: VoteDto) {
    return {
      result: await this.appService.vote(body),
    };
  }

  @Get('winning-proposal')
  async getWinner() {
    return {
      result: await this.appService.getWinner(),
    };
  }
}
