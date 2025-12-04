package models

import (
	"encoding/json"
	"pledge-backend/api/models/request"
	"pledge-backend/db"
	"pledge-backend/schedule/models"
)

// Pool 资金池信息结构体
type Pool struct {
	PoolID                 int      `json:"pool_id"`                // 资金池ID
	SettleTime             string   `json:"settleTime"`             // 结算时间
	EndTime                string   `json:"endTime"`                // 结束时间
	InterestRate           string   `json:"interestRate"`           // 利率
	MaxSupply              string   `json:"maxSupply"`              // 最大供应量
	LendSupply             string   `json:"lendSupply"`             // 贷款供应量
	BorrowSupply           string   `json:"borrowSupply"`           // 借款供应量
	MartgageRate           string   `json:"martgageRate"`           // 抵押率
	LendToken              string   `json:"lendToken"`              // 贷款代币名称
	LendTokenSymbol        string   `json:"lend_token_symbol"`      // 贷款代币符号
	BorrowToken            string   `json:"borrowToken"`            // 借款代币名称
	BorrowTokenSymbol      string   `json:"borrow_token_symbol"`    // 借款代币符号
	State                  string   `json:"state"`                  // 状态
	SpCoin                 string   `json:"spCoin"`                 // SP代币
	JpCoin                 string   `json:"jpCoin"`                 // JP代币
	AutoLiquidateThreshold string   `json:"autoLiquidateThreshold"` // 自动清算阈值
	Pooldata               PoolData `json:"pooldata"`               // 资金池详细数据
}

// NewPool 创建Pool实例
func NewPool() *Pool {
	return &Pool{}
}

// Pagination 资金池分页查询
// 参数：
//   - req: 搜索请求参数，包含分页和链ID信息
//   - whereCondition: SQL查询条件字符串
//
// 返回值：
//   - int64: 符合条件的总记录数
//   - []Pool: 分页查询到的资金池列表
//   - error: 错误信息（按照Go规范作为最后一个返回值）
func (p *Pool) Pagination(req *request.Search, whereCondition string) (int64, []Pool, error) {
	var total int64
	pools := []Pool{}
	poolBase := []models.PoolBase{}

	// 统计符合条件的总记录数
	db.Mysql.Table("poolbases").Where(whereCondition).Count(&total)

	// 分页查询资金池基础信息
	err := db.Mysql.Table("poolbases").Where(whereCondition).Order("pool_id desc").Limit(req.PageSize).Offset((req.Page - 1) * req.PageSize).Find(&poolBase).Debug().Error
	if err != nil {
		return 0, nil, err
	}

	// 遍历查询结果，补充详细信息
	for _, b := range poolBase {
		poolData := PoolData{}
		// 查询资金池详细数据
		err = db.Mysql.Table("pooldata").Where("chain_id=?", req.ChainID).First(&poolData).Debug().Error
		if err != nil {
			return 0, nil, err
		}

		// 解析JSON格式的代币信息（忽略解析错误，使用空值继续）
		var lendToken models.LendToken
		_ = json.Unmarshal([]byte(b.LendTokenInfo), &lendToken)
		var borrowToken models.BorrowToken
		_ = json.Unmarshal([]byte(b.BorrowTokenInfo), &borrowToken)

		// 构建返回数据结构
		pools = append(pools, Pool{
			PoolID:                 b.PoolId,
			SettleTime:             b.SettleTime,
			EndTime:                b.EndTime,
			InterestRate:           b.InterestRate,
			MaxSupply:              b.MaxSupply,
			LendSupply:             b.LendSupply,
			BorrowSupply:           b.BorrowSupply,
			MartgageRate:           b.MartgageRate,
			LendToken:              lendToken.TokenName,
			BorrowToken:            borrowToken.TokenName,
			State:                  b.State,
			SpCoin:                 b.SpCoin,
			JpCoin:                 b.JpCoin,
			AutoLiquidateThreshold: b.AutoLiquidateThreshold,
			Pooldata:               poolData,
		})
	}

	// 返回总数、数据列表和nil错误
	return total, pools, nil
}
