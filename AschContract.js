const OFFERING_TOKEN = 'XAS' //众筹得到的Token

interface FundingInfo {
    tokenAmount: bigint
    xasAmount: bigint
    bchAmount: bigint
}

class Funding {
    // 账户得到的token数量
    tokenAmount: bigint
    // 参与众筹XAS数量
    xasAmount: bigint
    // 参与众筹BCH数量
    bchAmount: bigint
    constructor() {
        this.tokenAmount = BigInt(0)
        this.xasAmount = BigInt(0)
        this.bchAmount = BigInt(0)
    }
}

// 众筹合约类
export class SimpleCrowdFundgingContract extends AschContract {
    // 记录每个地址的众筹信息
    fundingOfAddress: Mapping<Funding>
    // 兑换比例
    rateOfCurrency: Mapping<bigint>
    // 注入token的总数量
    totalFundingToken: bigint
    // 剩余注入token数量
    avalibleTokenAmount: bigint
    // 当前游戏玩家状态信息
    gameInfo: string
    // 转账地址列表
    addressList: string

    // 初始化方法，会在合约注册时被调用
    constructor() {
        super()

        this.rateOfCurrency = new Mapping<bigint>()
        this.rateOfCurrency['XAS'] = BigInt(100) // 1 XAS = 100 token
        this.rateOfCurrency['BCH'] = BigInt(30000) // 1 BCH = 30000 token
        this.totalFundingToken = BigInt(0)
        this.avalibleTokenAmount = BigInt(0)
        this.fundingOfAddress = new Mapping<Funding>()
        this.gameInfo = ''
        this.addressList = ''
        this.wapper = new Vector()
    }

    /**
     * 支付游戏费用
     * @param amount 货币数量
     * @param currency 货币种类
     */
    @payable
    payInitialToken(amount: bigint, currency: string): void {

        // 记录游戏玩家的地址
        const partnerAddress = this.context!.senderAddress
        this.addressList += `[{"address":"${partnerAddress}","amount:${amount}}],`;
        assert(currency === OFFERING_TOKEN, `invalid offering currency, should be ${OFFERING_TOKEN}`)
        this.totalFundingToken += amount
        this.avalibleTokenAmount += amount
        this.gameInfo = '游戏开始'
    }

    /**
     * 结算游戏
     * @param amount 货币数量
     * @param currency 货币种类
     */
    gamebeg(amount: bigint, currency: string): void {

        this.gameInfo = '游戏结算开始'
        const rate = this.rateOfCurrency[currency]!
        const tokenAmount = amount * rate
        const partnerAddress = this.context!.senderAddress
        // 转账给胜利者
        this.transfer(partnerAddress, tokenAmount, OFFERING_TOKEN)
        // 游戏结束
        this.gameOv()
    }

    /**
     * 游戏结束
     */
    private gameOv(): void {
        // 初始化当前玩家游戏状态
        this.gameInfo = ''
        // 初始化当局游戏列表地址
        this.addressList = ''
    }

    /**
     * 获取游戏状态信息
     */
    @constant
    gameInformation(): string {
        return this.gameInfo
    }

    @constant
    getFunding(address: string): FundingInfo {
        return this.fundingOfAddress[address] || new Funding()
    }

    private updateFunding(address: string, amount: bigint, currency: string, tokenAmount: bigint): void {
        const funding = this.getOrCreateFunding(address)
        funding.tokenAmount += tokenAmount

        if (currency === 'XAS') {
            funding.xasAmount += amount
        } else if (currency === 'BCH') {
            funding.bchAmount += amount
        }
    }

    private getOrCreateFunding(address: string): Funding {
        if (this.fundingOfAddress[address] === undefined) {
            this.fundingOfAddress[address] = new Funding()
        }
        return this.fundingOfAddress[address]!
    }

}
