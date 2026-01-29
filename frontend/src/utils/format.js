/**
 * 格式化價格為 NT$ x,xxx
 */
export function formatPrice(price) {
  if (price == null || isNaN(price)) return 'NT$ 0'
  return `NT$ ${Number(price).toLocaleString('zh-TW')}`
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
