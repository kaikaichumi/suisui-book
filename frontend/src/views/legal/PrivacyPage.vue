<template>
  <div class="legal-page">
    <header class="legal-header">
      <div class="container">
        <h1>隱私權政策</h1>
        <p class="last-updated">最後更新日期：2025 年 1 月</p>
      </div>
    </header>

    <main class="container legal-content">
      <section>
        <h2>一、資料蒐集與使用</h2>
        <p>SuiSui Book（以下稱「本平台」）為提供預約服務，會蒐集以下個人資料：</p>
        <ul>
          <li>姓名</li>
          <li>手機號碼</li>
          <li>電子郵件地址（選填）</li>
          <li>LINE 帳號資訊（若使用 LINE 登入）</li>
        </ul>
        <p>上述資料僅用於預約管理、通知提醒及客戶服務，不會用於其他商業用途。</p>
      </section>

      <section>
        <h2>二、資料保護</h2>
        <p>本平台採取合理的技術與組織措施保護您的個人資料，包含但不限於：</p>
        <ul>
          <li>資料傳輸使用 HTTPS 加密</li>
          <li>密碼經過雜湊處理後儲存</li>
          <li>限制存取權限，僅授權人員可接觸個人資料</li>
        </ul>
      </section>

      <section>
        <h2>三、資料分享</h2>
        <p>本平台不會將您的個人資料出售或提供給第三方，但以下情形除外：</p>
        <ul>
          <li>您預約之店家，為提供服務所必要之資料</li>
          <li>依法律規定或政府機關要求</li>
        </ul>
      </section>

      <section>
        <h2>四、Cookie 使用</h2>
        <p>本平台使用必要的 Cookie 及本地儲存（localStorage）來維持您的登入狀態，不使用追蹤型 Cookie。</p>
      </section>

      <section>
        <h2>五、資料保留</h2>
        <p>您的預約紀錄將保留至服務完成後 180 天。您可隨時聯繫我們要求刪除個人資料。</p>
      </section>

      <section>
        <h2>六、您的權利</h2>
        <p>依據個人資料保護法，您有權：</p>
        <ul>
          <li>查詢或請求閱覽您的個人資料</li>
          <li>請求補充或更正您的個人資料</li>
          <li>請求停止蒐集、處理或利用您的個人資料</li>
          <li>請求刪除您的個人資料</li>
        </ul>
      </section>

      <section>
        <h2>七、政策修訂</h2>
        <p>本平台保留隨時修訂本隱私權政策之權利，修訂後將於本頁面公告。</p>
      </section>

      <div class="back-link">
        <router-link to="/">返回首頁</router-link>
      </div>
    </main>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: var(--bg);
}

.legal-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
}

.legal-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.last-updated {
  opacity: 0.8;
  font-size: 0.875rem;
}

.legal-content {
  padding: var(--spacing-lg) var(--spacing-md);
  max-width: 720px;
  margin: 0 auto;
}

.legal-content section {
  margin-bottom: var(--spacing-xl);
}

.legal-content h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text);
}

.legal-content p {
  color: var(--text-light);
  line-height: 1.8;
  margin-bottom: var(--spacing-sm);
}

.legal-content ul {
  padding-left: var(--spacing-lg);
  color: var(--text-light);
  line-height: 1.8;
  margin-bottom: var(--spacing-sm);
}

.back-link {
  text-align: center;
  margin-top: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
}

.back-link a {
  color: var(--primary-dark);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
}
</style>
