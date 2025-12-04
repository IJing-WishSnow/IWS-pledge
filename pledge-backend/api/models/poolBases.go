package models

import (
	"encoding/json"
	"pledge-backend/db"
)

// PoolBaseInfo 资金池基础信息响应结构体
type PoolBaseInfo struct {
	PoolID                 int             `json:"pool_id"`                // 资金池ID
	AutoLiquidateThreshold string          `json:"autoLiquidateThreshold"` // 自动清算阈值
	BorrowSupply           string          `json:"borrowSupply"`           // 借款供应量
	BorrowToken            string          `json:"borrowToken"`            // 借款代币地址
	BorrowTokenInfo        BorrowTokenInfo `json:"borrowTokenInfo"`        // 借款代币详情
	EndTime                string          `json:"endTime"`                // 结束时间
	InterestRate           string          `json:"interestRate"`           // 利率
	JpCoin                 string          `json:"jpCoin"`                 // JP代币
	LendSupply             string          `json:"lendSupply"`             // 贷款供应量
	LendToken              string          `json:"lendToken"`              // 贷款代币地址
	LendTokenInfo          LendTokenInfo   `json:"lendTokenInfo"`          // 贷款代币详情
	MartgageRate           string          `json:"martgageRate"`           // 抵押率
	MaxSupply              string          `json:"maxSupply"`              // 最大供应量
	SettleTime             string          `json:"settleTime"`             // 结算时间
	SpCoin                 string          `json:"spCoin"`                 // SP代币
	State                  string          `json:"state"`                  // 状态
}

// PoolBases 资金池数据库模型
type PoolBases struct {
	Id                     int    `json:"-" gorm:"column:id;primaryKey"`                                  // 主键ID
	PoolID                 int    `json:"pool_id" gorm:"column:pool_id;"`                                 // 资金池ID
	AutoLiquidateThreshold string `json:"autoLiquidateThreshold" gorm:"column:auto_liquidata_threshold;"` // 自动清算阈值
	BorrowSupply           string `json:"borrowSupply" gorm:"column:borrow_supply;"`                      // 借款供应量
	BorrowToken            string `json:"borrowToken" gorm:"column:borrow_token;"`                        // 借款代币地址（修正字段映射）
	BorrowTokenInfo        string `json:"borrowTokenInfo" gorm:"column:borrow_token_info;"`               // 借款代币信息JSON
	EndTime                string `json:"endTime" gorm:"column:end_time;"`                                // 结束时间
	InterestRate           string `json:"interestRate" gorm:"column:interest_rate;"`                      // 利率
	JpCoin                 string `json:"jpCoin" gorm:"column:jp_coin;"`                                  // JP代币
	LendSupply             string `json:"lendSupply" gorm:"column:lend_supply;"`                          // 贷款供应量
	LendToken              string `json:"lendToken" gorm:"column:lend_token;"`                            // 贷款代币地址
	LendTokenInfo          string `json:"lendTokenInfo" gorm:"column:lend_token_info;"`                   // 贷款代币信息JSON
	MartgageRate           string `json:"martgageRate" gorm:"column:martgage_rate;"`                      // 抵押率
	MaxSupply              string `json:"maxSupply" gorm:"column:max_supply;"`                            // 最大供应量
	SettleTime             string `json:"settleTime" gorm:"column:settle_time;"`                          // 结算时间
	SpCoin                 string `json:"spCoin" gorm:"column:sp_coin;"`                                  // SP代币
	State                  string `json:"state" gorm:"column:state;"`                                     // 状态
}

// BorrowTokenInfo 借款代币信息
type BorrowTokenInfo struct {
	BorrowFee  string `json:"borrowFee"`  // 借款手续费
	TokenLogo  string `json:"tokenLogo"`  // 代币Logo URL
	TokenName  string `json:"tokenName"`  // 代币名称
	TokenPrice string `json:"tokenPrice"` // 代币价格
}

// LendTokenInfo 贷款代币信息
type LendTokenInfo struct {
	LendFee    string `json:"lendFee"`    // 贷款手续费
	TokenLogo  string `json:"tokenLogo"`  // 代币Logo URL
	TokenName  string `json:"tokenName"`  // 代币名称
	TokenPrice string `json:"tokenPrice"` // 代币价格
}

// PoolBaseInfoRes 资金池基础信息响应包装
type PoolBaseInfoRes struct {
	Index    int          `json:"index"`     // 列表索引
	PoolData PoolBaseInfo `json:"pool_data"` // 资金池数据
}

// NewPoolBases 创建PoolBases实例
func NewPoolBases() *PoolBases {
	return &PoolBases{}
}

// TableName 定义表名
func (p *PoolBases) TableName() string {
	return "poolbases"
}

// PoolBaseInfo 获取资金池基础信息
func (p *PoolBases) PoolBaseInfo(chainId int, res *[]PoolBaseInfoRes) error {
	var poolBases []PoolBases

	// 按链ID查询并按池ID排序
	err := db.Mysql.Table("poolbases").Where("chain_id=?", chainId).Order("pool_id asc").Find(&poolBases).Debug().Error
	if err != nil {
		return err
	}

	// 遍历结果集转换数据格式
	for _, v := range poolBases {
		borrowTokenInfo := BorrowTokenInfo{}
		_ = json.Unmarshal([]byte(v.BorrowTokenInfo), &borrowTokenInfo) // 解析借款代币信息
		lendTokenInfo := LendTokenInfo{}
		_ = json.Unmarshal([]byte(v.LendTokenInfo), &lendTokenInfo) // 解析贷款代币信息

		// 组装响应数据
		*res = append(*res, PoolBaseInfoRes{
			Index: v.PoolID - 1, // 索引从0开始
			PoolData: PoolBaseInfo{
				PoolID:                 v.PoolID,
				AutoLiquidateThreshold: v.AutoLiquidateThreshold,
				BorrowSupply:           v.BorrowSupply,
				BorrowToken:            v.BorrowToken,
				BorrowTokenInfo:        borrowTokenInfo,
				EndTime:                v.EndTime,
				InterestRate:           v.InterestRate,
				JpCoin:                 v.JpCoin,
				LendSupply:             v.LendSupply,
				LendToken:              v.LendToken,
				LendTokenInfo:          lendTokenInfo,
				MartgageRate:           v.MartgageRate,
				MaxSupply:              v.MaxSupply,
				SettleTime:             v.SettleTime,
				SpCoin:                 v.SpCoin,
				State:                  v.State,
			},
		})
	}
	return nil
}
