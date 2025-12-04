package models

import (
	"errors"
	"pledge-backend/api/models/request"
	"pledge-backend/db"
)

// TokenInfo 代币信息结构体
type TokenInfo struct {
	Id      int32  `json:"-" gorm:"column:id;primaryKey"`   // 主键ID
	Symbol  string `json:"symbol" gorm:"column:symbol"`     // 代币符号
	Token   string `json:"token" gorm:"column:token"`       // 代币地址
	ChainId int    `json:"chain_id" gorm:"column:chain_id"` // 链ID
}

// TokenList 代币列表结构体
type TokenList struct {
	Id       int32  `json:"-" gorm:"column:id;primaryKey"`   // 主键ID
	Symbol   string `json:"symbol" gorm:"column:symbol"`     // 代币符号
	Decimals int    `json:"decimals" gorm:"column:decimals"` // 小数位数
	Token    string `json:"token" gorm:"column:token"`       // 代币地址
	Logo     string `json:"logo" gorm:"column:logo"`         // 代币Logo URL
	ChainId  int    `json:"chain_id" gorm:"column:chain_id"` // 链ID
}

// NewTokenInfo 创建TokenInfo实例
func NewTokenInfo() *TokenInfo {
	return &TokenInfo{}
}

// GetTokenInfo 获取代币信息
// 返回值修正为：([]TokenInfo, error) - 错误作为最后一个返回值
func (m *TokenInfo) GetTokenInfo(req *request.TokenList) ([]TokenInfo, error) {
	var tokenInfo = make([]TokenInfo, 0)
	err := db.Mysql.Table("token_info").Where("chain_id", req.ChainId).Find(&tokenInfo).Debug().Error
	if err != nil {
		return nil, errors.New("record select err " + err.Error())
	}
	return tokenInfo, nil
}

// GetTokenList 获取代币列表
// 返回值修正为：([]TokenList, error) - 错误作为最后一个返回值
func (m *TokenInfo) GetTokenList(req *request.TokenList) ([]TokenList, error) {
	var tokenList = make([]TokenList, 0)
	err := db.Mysql.Table("token_info").Where("chain_id", req.ChainId).Find(&tokenList).Debug().Error
	if err != nil {
		return nil, errors.New("record select err " + err.Error())
	}
	return tokenList, nil
}
