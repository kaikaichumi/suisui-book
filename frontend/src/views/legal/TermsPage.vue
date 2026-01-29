<template>
  <div class="legal-page">
    <header class="legal-header">
      <div class="container">
        <h1>服務條款</h1>
        <p class="last-updated">最後更新日期：2025 年 1 月</p>
      </div>
    </header>

    <main class="container legal-content">
      <section>
        <h2>一、服務說明</h2>
        <p>SuiSui Book（以下稱「本平台」）提供線上預約管理服務，協助美容美髮等服務業者管理預約，並讓消費者方便地進行預約。</p>
      </section>

      <section>
        <h2>二、使用規範</h2>
        <p>使用本平台服務時，您同意：</p>
        <ul>
          <li>提供正確的個人資訊</li>
          <li>不得惡意重複預約或不到場</li>
          <li>不得利用本平台從事任何違法行為</li>
          <li>不得干擾或破壞本平台之正常運作</li>
        </ul>
      </section>

      <section>
        <h2>三、預約規則</h2>
        <ul>
          <li>預約建立後，狀態為「待確認」，需由店家確認後方為有效預約</li>
          <li>如需取消預約，請儘早操作，以免影響店家排程</li>
          <li>預約時間以系統顯示為準</li>
          <li>各店家可能有各自的取消政策，請留意店家公告</li>
        </ul>
      </section>

      <section>
        <h2>四、免責聲明</h2>
        <p>本平台僅提供預約媒合服務，不對以下情形負責：</p>
        <ul>
          <li>店家提供之服務品質</li>
          <li>因不可抗力導致之服務中斷</li>
          <li>使用者因違反本條款所遭受之損失</li>
        </ul>
      </section>

      <section>
        <h2>五、智慧財產權</h2>
        <p>本平台之所有內容，包含但不限於文字、圖片、程式碼、介面設計等，均受智慧財產權法律保護，未經授權不得擅自使用。</p>
      </section>

      <section>
        <h2>六、帳號管理</h2>
        <p>店家管理員應妥善保管帳號密碼，因帳號遭盜用所生之損害，由帳號持有人負責。如發現帳號遭不正當使用，請立即通知本平台。</p>
      </section>

      <section>
        <h2>七、條款修訂</h2>
        <p>本平台保留隨時修訂本服務條款之權利。修訂後將於本頁面公告，繼續使用本平台即表示同意修訂後之條款。</p>
      </section>

      <section>
        <h2>八、準據法</h2>
        <p>本條款之解釋與適用，以中華民國法律為準據法。</p>
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
