package services

import (
	"pledge-backend/api/common/statecode"
	"pledge-backend/api/models"
	"pledge-backend/api/models/request"
)

// TokenList 代币列表服务
type TokenList struct{}

// NewTokenList 创建代币列表服务实例
func NewTokenList() *TokenList {
	return &TokenList{}
}

// DebtTokenList 获取债务代币列表
// 参数：请求参数，包含链ID等
// 返回值：状态码，债务代币列表
func (c *TokenList) DebtTokenList(req *request.TokenList) (int, []models.TokenInfo) {
	// 调用模型层方法，获取债务代币信息
	res, err := models.NewTokenInfo().GetTokenInfo(req)
	if err != nil {
		// 如果出错，返回服务器错误状态码和空列表
		return statecode.CommonErrServerErr, nil
	}
	// 成功返回成功状态码和债务代币列表
	return statecode.CommonSuccess, res
}

// GetTokenList 获取代币列表
// 参数：请求参数，包含链ID等
// 返回值：状态码，代币列表
func (c *TokenList) GetTokenList(req *request.TokenList) (int, []models.TokenList) {
	// 调用模型层方法，获取代币列表
	tokenList, err := models.NewTokenInfo().GetTokenList(req)
	if err != nil {
		// 如果出错，返回服务器错误状态码和空列表
		return statecode.CommonErrServerErr, nil
	}
	// 成功返回成功状态码和代币列表
	return statecode.CommonSuccess, tokenList
}
