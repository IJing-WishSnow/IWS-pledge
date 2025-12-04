package services

import (
	"encoding/json"
	"errors"
	"os"
	"pledge-backend/config"
	abifile "pledge-backend/contract/abi"
	"pledge-backend/db"
	"pledge-backend/log"
	"pledge-backend/schedule/models"
	"pledge-backend/utils"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"gorm.io/gorm"
)

// TokenSymbol 代币符号服务结构体
type TokenSymbol struct{}

// NewTokenSymbol 创建代币符号服务实例
func NewTokenSymbol() *TokenSymbol {
	return &TokenSymbol{}
}

// UpdateContractSymbol get contract symbol / 更新代币合约符号
func (s *TokenSymbol) UpdateContractSymbol() {
	var tokens []models.TokenInfo
	db.Mysql.Table("token_info").Find(&tokens)
	for _, t := range tokens {
		if t.Token == "" {
			log.Logger.Sugar().Error("UpdateContractSymbol token empty", t.Symbol, t.ChainId)
			continue
		}
		err := errors.New("")
		symbol := ""
		// 根据链ID决定从测试网或主网获取代币符号
		if t.ChainId == config.Config.TestNet.ChainId {
			err, symbol = s.GetContractSymbolOnTestNet(t.Token, config.Config.TestNet.NetUrl)
		} else if t.ChainId == config.Config.MainNet.ChainId {
			// 主网需要检查ABI文件是否存在
			if t.AbiFileExist == 0 {
				err = s.GetRemoteAbiFileByToken(t.Token, t.ChainId)
				if err != nil {
					log.Logger.Sugar().Error("UpdateContractSymbol GetRemoteAbiFileByToken err ", t.Symbol, t.ChainId, err)
					continue
				}
			}
			err, symbol = s.GetContractSymbolOnTestNet(t.Token, config.Config.MainNet.NetUrl)
		} else {
			log.Logger.Sugar().Error("UpdateContractSymbol chain_id err ", t.Symbol, t.ChainId)
			continue
		}
		if err != nil {
			log.Logger.Sugar().Error("UpdateContractSymbol err ", t.Symbol, t.ChainId, err)
			continue
		}

		// 检查是否有新的符号数据需要保存
		hasNewData, err := s.CheckSymbolData(t.Token, t.ChainId, symbol)
		if err != nil {
			log.Logger.Sugar().Error("UpdateContractSymbol CheckSymbolData err ", err)
			continue
		}

		// 如果有新数据则保存到数据库
		if hasNewData {
			err = s.SaveSymbolData(t.Token, t.ChainId, symbol)
			if err != nil {
				log.Logger.Sugar().Error("UpdateContractSymbol SaveSymbolData err ", err)
				continue
			}
		}
	}
}

// GetRemoteAbiFileByToken get and save remote abi file on main net / 从远程获取并保存主网的ABI文件
func (s *TokenSymbol) GetRemoteAbiFileByToken(token, chainId string) error {

	// url := "https://api.bscscan.com/api?module=contract&action=getabi&apikey=HJ3WS4N88QJ6S7PQ8D89BD49IZIFP1JFER&address=" + token

	url := "https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=" + token

	// 发送HTTP请求获取ABI JSON
	res, err := utils.HttpGet(url, map[string]string{})
	if err != nil {
		log.Logger.Error(err.Error())
		return err
	}

	// 格式化ABI JSON字符串
	resStr := s.FormatAbiJsonStr(string(res))

	abiJson := models.AbiJson{}
	err = json.Unmarshal([]byte(resStr), &abiJson)
	if err != nil {
		log.Logger.Error(err.Error())
		return err
	}

	// 检查API返回状态
	if abiJson.Status != "1" {
		log.Logger.Sugar().Error("get remote abi file failed: status 0 ", resStr)
		return errors.New("get remote abi file failed: status 0 ")
	}

	// 序列化并格式化ABI结果
	abiJsonBytes, err := json.MarshalIndent(abiJson.Result, "", "\t")
	if err != nil {
		log.Logger.Error(err.Error())
		return err
	}

	// 构建ABI文件路径并写入文件
	newAbiFile := abifile.GetCurrentAbPathByCaller() + "/" + token + ".abi"

	err = os.WriteFile(newAbiFile, abiJsonBytes, 0777)
	if err != nil {
		log.Logger.Error(err.Error())
		return err
	}

	// 更新数据库标记，表示ABI文件已存在
	err = db.Mysql.Table("token_info").Where("token=? and chain_id=?", token, chainId).Updates(map[string]interface{}{
		"abi_file_exist": 1,
	}).Debug().Error
	if err != nil {
		return err
	}
	return nil
}

// FormatAbiJsonStr format the abi string / 格式化ABI JSON字符串
func (s *TokenSymbol) FormatAbiJsonStr(result string) string {
	resStr := strings.Replace(result, `\`, ``, -1)
	resStr = strings.Replace(result, `\"`, `"`, -1)
	resStr = strings.Replace(resStr, `"[{`, `[{`, -1)
	resStr = strings.Replace(resStr, `}]"`, `}]`, -1)
	return resStr
}

// GetContractSymbolOnMainNet get contract symbol on main net / 在主网上获取代币合约符号
func (s *TokenSymbol) GetContractSymbolOnMainNet(token, network string) (error, string) {
	// 连接以太坊网络
	ethereumConn, err := ethclient.Dial(network)
	if nil != err {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}
	// 通过代币地址获取ABI
	abiStr, err := abifile.GetAbiByToken(token)
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}
	// 解析ABI字符串
	parsed, err := abi.JSON(strings.NewReader(abiStr))
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}
	// 创建绑定合约实例
	contract, err := bind.NewBoundContract(common.HexToAddress(token), parsed, ethereumConn, ethereumConn, ethereumConn), nil
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}

	// 调用合约的symbol方法
	res := make([]interface{}, 0)
	err = contract.Call(nil, &res, "symbol")
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", err)
		return err, ""
	}

	return nil, res[0].(string)
}

// GetContractSymbolOnTestNet get contract symbol on test net / 在测试网上获取代币合约符号
func (s *TokenSymbol) GetContractSymbolOnTestNet(token, network string) (error, string) {
	// 连接以太坊网络
	ethereumConn, err := ethclient.Dial(network)
	if nil != err {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}
	// 使用标准的ERC20 ABI文件
	abiStr, err := abifile.GetAbiByToken("erc20")
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}
	// 解析ABI字符串
	parsed, err := abi.JSON(strings.NewReader(abiStr))
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}
	// 创建绑定合约实例
	contract, err := bind.NewBoundContract(common.HexToAddress(token), parsed, ethereumConn, ethereumConn, ethereumConn), nil
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}

	// 调用合约的symbol方法
	res := make([]interface{}, 0)
	err = contract.Call(nil, &res, "symbol")
	if err != nil {
		log.Logger.Sugar().Error("GetContractSymbolOnMainNet err ", token, err)
		return err, ""
	}

	return nil, res[0].(string)
}

// CheckSymbolData Saving symbol data to redis if it has new symbol / 检查并保存符号数据到Redis
func (s *TokenSymbol) CheckSymbolData(token, chainId, symbol string) (bool, error) {
	redisKey := "token_info:" + chainId + ":" + token
	redisTokenInfoBytes, err := db.RedisGet(redisKey)
	if len(redisTokenInfoBytes) <= 0 {
		// Redis中没有数据，先检查数据库
		err = s.CheckTokenInfo(token, chainId)
		if err != nil {
			log.Logger.Error(err.Error())
		}
		// 将新数据存入Redis
		err = db.RedisSet(redisKey, models.RedisTokenInfo{
			Token:   token,
			ChainId: chainId,
			Symbol:  symbol,
		}, 0)
		if err != nil {
			log.Logger.Error(err.Error())
			return false, err
		}
	} else {
		// Redis中已有数据，进行反序列化
		redisTokenInfo := models.RedisTokenInfo{}
		err = json.Unmarshal(redisTokenInfoBytes, &redisTokenInfo)
		if err != nil {
			log.Logger.Error(err.Error())
			return false, err
		}

		// 检查符号是否相同
		if redisTokenInfo.Symbol == symbol {
			return false, nil
		}

		// 符号不同则更新Redis缓存
		redisTokenInfo.Symbol = symbol
		err = db.RedisSet(redisKey, redisTokenInfo, 0)
		if err != nil {
			log.Logger.Error(err.Error())
			return true, err
		}
	}
	return true, nil
}

// CheckTokenInfo  Insert token information if it was not in mysql / 检查并插入代币信息到数据库
func (s *TokenSymbol) CheckTokenInfo(token, chainId string) error {
	tokenInfo := models.TokenInfo{}
	err := db.Mysql.Table("token_info").Where("token=? and chain_id=?", token, chainId).First(&tokenInfo).Debug().Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 记录不存在，创建新记录
			tokenInfo = models.TokenInfo{}
			nowDateTime := utils.GetCurDateTimeFormat()
			tokenInfo.Token = token
			tokenInfo.ChainId = chainId
			tokenInfo.UpdatedAt = nowDateTime
			tokenInfo.CreatedAt = nowDateTime
			err = db.Mysql.Table("token_info").Create(tokenInfo).Debug().Error
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}
	return nil
}

// SaveSymbolData Saving symbol data to mysql if it has new symbol / 保存符号数据到MySQL数据库
func (s *TokenSymbol) SaveSymbolData(token, chainId, symbol string) error {
	nowDateTime := utils.GetCurDateTimeFormat()

	// 更新数据库中的代币符号
	err := db.Mysql.Table("token_info").Where("token=? and chain_id=? ", token, chainId).Updates(map[string]interface{}{
		"symbol":     symbol,
		"updated_at": nowDateTime,
	}).Debug().Error
	if err != nil {
		log.Logger.Sugar().Error("UpdateContractSymbol SaveSymbolData err ", err)
		return err
	}

	return nil
}
