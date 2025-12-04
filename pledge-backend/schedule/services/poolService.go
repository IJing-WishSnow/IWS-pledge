package services

import (
	"encoding/json"
	"math/big"
	"pledge-backend/config"
	"pledge-backend/contract/bindings"
	"pledge-backend/db"
	"pledge-backend/log"
	"pledge-backend/schedule/models"
	"pledge-backend/utils"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// poolService 资金池服务结构体，负责链上数据同步
type poolService struct{}

// NewPool 创建资金池服务实例
func NewPool() *poolService {
	return &poolService{}
}

// UpdateAllPoolInfo 更新所有资金池信息（测试网和主网）
// 目前仅启用测试网同步，主网代码已被注释
func (s *poolService) UpdateAllPoolInfo() {
	// 更新测试网资金池信息
	s.UpdatePoolInfo(config.Config.TestNet.PledgePoolToken, config.Config.TestNet.NetUrl, config.Config.TestNet.ChainId)

	// 主网同步暂时注释，可按需启用
	// s.UpdatePoolInfo(config.Config.MainNet.PledgePoolToken, config.Config.MainNet.NetUrl, config.Config.MainNet.ChainId)
}

// UpdatePoolInfo 更新指定链的资金池信息
// contractAddress: 质押池合约地址
// network: 区块链网络RPC URL
// chainId: 链标识符
func (s *poolService) UpdatePoolInfo(contractAddress, network, chainId string) {

	log.Logger.Sugar().Info("开始更新资金池信息 ", contractAddress+" "+network)

	// 1. 连接区块链网络
	ethereumConn, err := ethclient.Dial(network)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// 2. 创建合约实例
	pledgePoolToken, err := bindings.NewPledgePoolToken(common.HexToAddress(contractAddress), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// 3. 获取全局费率参数（借款费和贷款费）
	borrowFee, err := pledgePoolToken.PledgePoolTokenCaller.BorrowFee(nil)
	lendFee, err := pledgePoolToken.PledgePoolTokenCaller.LendFee(nil)

	// 4. 获取资金池总数
	pLength, err := pledgePoolToken.PledgePoolTokenCaller.PoolLength(nil)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// 5. 遍历所有资金池，同步数据
	for i := 0; i <= int(pLength.Int64())-1; i++ {

		log.Logger.Sugar().Info("正在更新资金池 ", i)
		poolId := utils.IntToString(i + 1)

		// 5.1 获取资金池基础信息
		baseInfo, err := pledgePoolToken.PledgePoolTokenCaller.PoolBaseInfo(nil, big.NewInt(int64(i)))
		if err != nil {
			log.Logger.Sugar().Info("获取资金池基础信息失败 ", poolId, err)
			continue
		}

		// 5.2 获取借款和贷款代币的详细信息
		_, borrowToken := models.NewTokenInfo().GetTokenInfo(baseInfo.BorrowToken.String(), chainId)
		_, lendToken := models.NewTokenInfo().GetTokenInfo(baseInfo.LendToken.String(), chainId)

		// 5.3 构建代币信息的JSON字符串
		lendTokenJson, _ := json.Marshal(models.LendToken{
			LendFee:    lendFee.String(), // 贷款手续费
			TokenLogo:  lendToken.Logo,   // 代币Logo
			TokenName:  lendToken.Symbol, // 代币名称
			TokenPrice: lendToken.Price,  // 代币价格
		})
		borrowTokenJson, _ := json.Marshal(models.BorrowToken{
			BorrowFee:  borrowFee.String(), // 借款手续费
			TokenLogo:  borrowToken.Logo,   // 代币Logo
			TokenName:  borrowToken.Symbol, // 代币名称
			TokenPrice: borrowToken.Price,  // 代币价格
		})

		// 5.4 构建资金池基础信息模型
		poolBase := models.PoolBase{
			SettleTime:             baseInfo.SettleTime.String(),             // 结算时间
			PoolId:                 utils.StringToInt(poolId),                // 资金池ID
			ChainId:                chainId,                                  // 链ID
			EndTime:                baseInfo.EndTime.String(),                // 结束时间
			InterestRate:           baseInfo.InterestRate.String(),           // 利率
			MaxSupply:              baseInfo.MaxSupply.String(),              // 最大供应量
			LendSupply:             baseInfo.LendSupply.String(),             // 贷款供应量
			BorrowSupply:           baseInfo.BorrowSupply.String(),           // 借款供应量
			MartgageRate:           baseInfo.MartgageRate.String(),           // 抵押率
			LendToken:              baseInfo.LendToken.String(),              // 贷款代币地址
			LendTokenSymbol:        lendToken.Symbol,                         // 贷款代币符号
			LendTokenInfo:          string(lendTokenJson),                    // 贷款代币详细信息(JSON)
			BorrowToken:            baseInfo.BorrowToken.String(),            // 借款代币地址
			BorrowTokenSymbol:      borrowToken.Symbol,                       // 借款代币符号
			BorrowTokenInfo:        string(borrowTokenJson),                  // 借款代币详细信息(JSON)
			State:                  utils.IntToString(int(baseInfo.State)),   // 资金池状态
			SpCoin:                 baseInfo.SpCoin.String(),                 // SP代币数量
			JpCoin:                 baseInfo.JpCoin.String(),                 // JP代币数量
			AutoLiquidateThreshold: baseInfo.AutoLiquidateThreshold.String(), // 自动清算阈值
		}

		// 5.5 通过MD5比较判断数据是否有变化
		hasInfoData, byteBaseInfoStr, baseInfoMd5Str := s.GetPoolMd5(&poolBase, "base_info:pool_"+chainId+"_"+poolId)
		if !hasInfoData || (baseInfoMd5Str != byteBaseInfoStr) { // 数据不存在或有变化
			// 保存新的资金池基础信息到数据库
			err = models.NewPoolBase().SavePoolBase(chainId, poolId, &poolBase)
			if err != nil {
				log.Logger.Sugar().Error("保存资金池基础信息失败 ", chainId, poolId)
			}
			// 更新Redis缓存，设置30分钟过期时间（防止哈希冲突）
			_ = db.RedisSet("base_info:pool_"+chainId+"_"+poolId, baseInfoMd5Str, 60*30)
		}

		// 5.6 获取资金池数据信息
		dataInfo, err := pledgePoolToken.PledgePoolTokenCaller.PoolDataInfo(nil, big.NewInt(int64(i)))
		if err != nil {
			log.Logger.Sugar().Info("获取资金池数据信息失败 ", poolId, err)
			continue
		}

		// 5.7 通过MD5比较判断资金池数据是否有变化
		hasPoolData, byteDataInfoStr, dataInfoMd5Str := s.GetPoolMd5(&poolBase, "data_info:pool_"+chainId+"_"+poolId)
		if !hasPoolData || (dataInfoMd5Str != byteDataInfoStr) { // 数据不存在或有变化
			poolData := models.PoolData{
				PoolId:                 poolId,                                   // 资金池ID
				ChainId:                chainId,                                  // 链ID
				FinishAmountBorrow:     dataInfo.FinishAmountBorrow.String(),     // 已完成借款金额
				FinishAmountLend:       dataInfo.FinishAmountLend.String(),       // 已完成贷款金额
				LiquidationAmounBorrow: dataInfo.LiquidationAmounBorrow.String(), // 清算借款金额
				LiquidationAmounLend:   dataInfo.LiquidationAmounLend.String(),   // 清算贷款金额
				SettleAmountBorrow:     dataInfo.SettleAmountBorrow.String(),     // 结算借款金额
				SettleAmountLend:       dataInfo.SettleAmountLend.String(),       // 结算贷款金额
			}
			// 保存资金池数据信息到数据库
			err = models.NewPoolData().SavePoolData(chainId, poolId, &poolData)
			if err != nil {
				log.Logger.Sugar().Error("保存资金池数据信息失败 ", chainId, poolId)
			}
			// 更新Redis缓存，设置30分钟过期时间
			_ = db.RedisSet("data_info:pool_"+chainId+"_"+poolId, dataInfoMd5Str, 60*30)
		}
	}
}

// GetPoolMd5 获取资金池信息的MD5哈希值，用于判断数据是否变更
// baseInfo: 资金池基础信息结构体指针
// key: Redis缓存键名
// 返回值: (数据是否存在, 缓存的MD5值, 当前数据的MD5值)
func (s *poolService) GetPoolMd5(baseInfo *models.PoolBase, key string) (bool, string, string) {
	// 将结构体序列化为JSON并计算MD5
	baseInfoBytes, _ := json.Marshal(baseInfo)
	baseInfoMd5Str := utils.Md5(string(baseInfoBytes))

	// 从Redis获取缓存的MD5值
	resInfoBytes, _ := db.RedisGet(key)
	if len(resInfoBytes) > 0 {
		// 返回true（数据存在）、缓存的MD5、当前的MD5
		return true, strings.Trim(string(resInfoBytes), `"`), baseInfoMd5Str
	} else {
		// 返回false（数据不存在）、空字符串、当前的MD5
		return false, strings.Trim(string(resInfoBytes), `"`), baseInfoMd5Str
	}
}
