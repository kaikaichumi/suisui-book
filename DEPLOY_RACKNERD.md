# Deploy to RackNerd VM（多網站架構）

## 架構說明

```
Internet → Cloudflare → VM:443
                          ↓
                  /opt/caddy-gateway/   ← 共享反向代理（只跑一次）
                  docker-compose.yml
                          │ Docker network: web
                    ┌─────┴─────┐
             suisui-book/    future-app/
```

- **Caddy Gateway**：唯一佔用 80/443 的容器，負責依 domain 路由
- **每個網站**：只 expose 內部 port，透過 `web` 外部網路讓 Caddy 連到

---

## 一、準備 VM（Ubuntu/Debian，只做一次）

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git ufw

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker   # 或重新登入

# 防火牆
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

## 二、啟動共享 Caddy Gateway（只做一次）

```bash
sudo mkdir -p /opt/caddy-gateway
sudo chown $USER:$USER /opt/caddy-gateway
```

把 `deploy/racknerd/caddy-gateway/` 裡的兩個檔案複製到 VM：

```bash
# 在本機執行（替換 user@VM_IP）
scp deploy/racknerd/caddy-gateway/docker-compose.yml \
    deploy/racknerd/caddy-gateway/Caddyfile \
    user@VM_IP:/opt/caddy-gateway/
```

**編輯 Caddyfile，填入你的 domain 和 email：**

```bash
nano /opt/caddy-gateway/Caddyfile
# 把 suisui.yourdomain.com 改成你的實際 domain
# 把 your@email.com 改成你的 email（Caddy 自動申請 Let's Encrypt）
```

啟動：

```bash
cd /opt/caddy-gateway
docker compose up -d
```

---

## 三、Cloudflare DNS 設定

1. 進 Cloudflare Dashboard → 你的 domain → DNS
2. 新增 A record：
   - Name: `suisui`（或你想要的 subdomain）
   - IPv4 address: 你的 RackNerd VM 公開 IP
   - Proxy status: 先選 **DNS only（灰雲）**，等 HTTPS 正常後再開橘雲
3. SSL/TLS 設定（橘雲開啟後）：設為 **Full (strict)**

---

## 四、Clone 並啟動 SuiSui Book

```bash
git clone <your-repo-url> ~/suisui-book
cd ~/suisui-book
```

建立 .env：

```bash
cp .env.example .env
nano .env
```

最少要填：
- `MONGODB_URI`
- `JWT_SECRET`（用 `openssl rand -hex 32` 產生）
- `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_CALLBACK_URL`

啟動：

```bash
docker compose -f docker-compose.racknerd.yml up -d --build
```

確認容器有加入 web 網路：

```bash
docker network inspect web | grep suisui
```

---

## 五、驗證

```bash
# HTTP 應該 301 redirect 到 HTTPS
curl -I http://suisui.yourdomain.com

# HTTPS 應該正常
curl -I https://suisui.yourdomain.com

# API health check
curl https://suisui.yourdomain.com/api/health
```

---

## 六、未來加新網站

1. 在 VM 上 clone 新專案，它的 docker-compose.yml 要有：
   ```yaml
   networks:
     web:
       external: true
       name: web
   ```
   並且把對外的 service 加到 `web` network。

2. 在 `/opt/caddy-gateway/Caddyfile` 加一個新 block：
   ```
   newsite.yourdomain.com {
       encode gzip zstd
       tls your@email.com
       reverse_proxy new-app-frontend-1:3000
   }
   ```

3. Reload Caddy（不中斷現有服務）：
   ```bash
   cd /opt/caddy-gateway
   docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

4. Cloudflare DNS 加對應的 A record。

---

## 常用指令

```bash
# 看所有容器
docker ps

# 看 Caddy log（含 TLS 申請狀況）
cd /opt/caddy-gateway && docker compose logs -f

# 看 suisui-book log
cd ~/suisui-book && docker compose -f docker-compose.racknerd.yml logs -f

# 更新 suisui-book
cd ~/suisui-book
git pull
docker compose -f docker-compose.racknerd.yml up -d --build

# Caddy reload（改 Caddyfile 後）
cd /opt/caddy-gateway
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```
