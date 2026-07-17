# 1. Update apt
sudo apt update && sudo apt upgrade -y

# 2. Build tools (for better-sqlite3 native compile)
sudo apt install -y build-essential python3 git

# 3. nvm + Node 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20

# 4. (optional but useful) sqlite CLI
sudo apt install -y sqlite3

# 5. Clone project
git clone <your-repo-url>
cd 12mp-dakboard-automation

# 6. Install deps
npm install

# 7. Configure
cp .env.example .env
nano .env               # paste ICS_URL

# 8. Initialize DB + seed
mkdir -p data
npm run dev             # in one terminal
# in another terminal:
curl http://localhost:3000/api/init
curl http://localhost:3000/api/seed
curl http://localhost:3000/api/rebuild