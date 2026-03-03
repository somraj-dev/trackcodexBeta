#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# TrackCodex — EC2 Bootstrap Script
# Run once on a fresh Ubuntu 22.04 EC2 t2.micro instance:
#   chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
#
# Prerequisites:
#   - EC2 instance: Ubuntu 22.04 LTS, t2.micro
#   - Security group inbound rules: 22 (SSH), 80 (HTTP), 443 (HTTPS)
#   - IAM role attached to EC2 with: AmazonEC2ContainerRegistryReadOnly
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately on error

AWS_REGION="ap-south-1"
ECR_REPO="trackcodex-backend"
ECR_REGISTRY="275142546612.dkr.ecr.ap-south-1.amazonaws.com"
APP_DIR="/opt/trackcodex"

echo "════════════════════════════════════════════════"
echo " TrackCodex EC2 Setup — $(date)"
echo "════════════════════════════════════════════════"

# ─── 1. System Updates ────────────────────────────────────────────────────────
echo "📦 [1/7] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ─── 2. Install Docker ────────────────────────────────────────────────────────
echo "🐳 [2/7] Installing Docker..."
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow ubuntu user to run docker without sudo
usermod -aG docker ubuntu

systemctl enable docker
systemctl start docker

echo "✅ Docker installed: $(docker --version)"

# ─── 3. Install AWS CLI v2 ────────────────────────────────────────────────────
echo "☁️  [3/7] Installing AWS CLI v2..."
apt-get install -y unzip
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

echo "✅ AWS CLI installed: $(aws --version)"

# ─── 4. Install Nginx ─────────────────────────────────────────────────────────
echo "🌐 [4/7] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
echo "✅ Nginx installed: $(nginx -v 2>&1)"

# ─── 5. Install Certbot (Let's Encrypt SSL) ──────────────────────────────────
echo "🔒 [5/7] Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
echo "✅ Certbot installed: $(certbot --version)"

# ─── 6. Set up App Directory ──────────────────────────────────────────────────
echo "📁 [6/7] Creating app directory at $APP_DIR..."
mkdir -p $APP_DIR
chown ubuntu:ubuntu $APP_DIR

# ─── 7. Configure Nginx (copy our config) ────────────────────────────────────
echo "⚙️  [7/7] Configuring Nginx..."
# Copy nginx config from repo (run this after placing the file on EC2)
cat << 'NGINX_CONF' > /etc/nginx/sites-available/trackcodex
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

server {
    listen 80;
    server_name api.trackcodex.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    300s;
        limit_req zone=api_limit burst=50 nodelay;
    }
}
NGINX_CONF

# Enable site and remove default
ln -sf /etc/nginx/sites-available/trackcodex /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo "✅ Nginx configured successfully"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo " ✅ EC2 Setup Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "📋 NEXT STEPS (run manually as ubuntu user):"
echo ""
echo "  1. Place your .env.prod at: $APP_DIR/.env.prod"
echo "     (copy from aws/.env.prod.example and fill in AWS values)"
echo ""
echo "  2. Place docker-compose.prod.yml at: $APP_DIR/"
echo "     (copy from aws/docker-compose.prod.yml and set your ECR URL)"
echo ""
echo "  3. Pull and start the backend container:"
echo "     aws ecr get-login-password --region $AWS_REGION | \\"
echo "       docker login --username AWS --password-stdin \\"
echo "       <YOUR_ACCOUNT_ID>.dkr.ecr.$AWS_REGION.amazonaws.com"
echo "     docker compose -f $APP_DIR/docker-compose.prod.yml up -d"
echo ""
echo "  4. Set up SSL (after DNS is pointing to this EC2 IP):"
echo "     sudo certbot --nginx -d api.trackcodex.com"
echo ""
echo "  5. Add GitHub Secrets in your repo settings:"
echo "     AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
echo "     EC2_HOST (your EC2 public IP or DNS)"
echo "     EC2_SSH_KEY (your .pem private key contents)"
