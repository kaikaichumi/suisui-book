/**
 * 格式化價格為 NT$ x,xxx 或 NT$ x,xxx ~ y,yyy
 * 支援單一價格或 service 物件 { priceMin, priceMax }
 */
export function formatPrice(priceOrService) {
  if (priceOrService == null) return 'NT$ 0'

  // 如果傳入的是 service 物件
  if (typeof priceOrService === 'object') {
    const { priceMin, priceMax } = priceOrService
    const min = Number(priceMin)
    if (isNaN(min)) return 'NT$ 0'
    const fmt = (n) => `NT$ ${n.toLocaleString('zh-TW')}`
    if (priceMax && Number(priceMax) > min) {
      return `${fmt(min)} ~ ${fmt(Number(priceMax))}`
    }
    return fmt(min)
  }

  // 向後相容：傳入單一數字
  if (isNaN(priceOrService)) return 'NT$ 0'
  return `NT$ ${Number(priceOrService).toLocaleString('zh-TW')}`
}

/**
 * 格式化日期為 M/D (週x)
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${month}/${day} (${weekday})`
}

/**
 * 格式化完整日期 YYYY/M/D (週x)
 */
export function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${year}/${month}/${day} (${weekday})`
}
