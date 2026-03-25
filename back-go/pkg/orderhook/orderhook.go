package orderhook

// OrderInterceptor define lo que un plugin debe realizar tras crear una orden
type OrderInterceptor interface {
	Matches(body map[string]interface{}) bool
	Execute(orderID interface{}, total float64, body map[string]interface{}) (map[string]interface{}, error)
}
