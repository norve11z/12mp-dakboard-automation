# Deployment Guide

Complete instructions for deploying the Control Room app to a Raspberry Pi 5 (ARM64) using Docker.

The dev machine builds an ARM64 Docker image, exports it as a tarball, and copies it to the Pi where it runs via Docker Compose. No registry needed.

---

## Architecture Overview

- One Pi (server Pi) runs the Docker container hosting the webapp
- All 4 Pis run DAKboard, each configured with a Website block pointing at `http://<server-pi-ip>:3000/controlroom/N`
- Only devices on the same LAN as the server Pi can access it
- No public exposure required

---

## Prerequisites

**Dev machine (WSL / Linux / macOS):**
- Docker with `buildx` support
- SSH access to the Pi

**Raspberry Pi 5:**
- Raspberry Pi OS 64-bit
- Network reachable from dev machine
- SSH enabled
- Static local IP or DHCP reservation

---

## 1. Build the ARM64 image (on dev machine)

From the project root:

~~~bash
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap

docker buildx build --platform linux/arm64 \
  -t controlroom-app:latest \
  --output type=docker,dest=controlroom-app-arm64.tar \
  .
~~~

Output: `controlroom-app-arm64.tar` (~200 MB).

---

## 2. Copy files to the Pi

Replace `<pi-user>` and `<pi-ip>`.

Create target folder on Pi:
~~~bash
ssh <pi-user>@<pi-ip> "mkdir -p ~/controlroom/data"
~~~

Copy files:
~~~bash
scp controlroom-app-arm64.tar <pi-user>@<pi-ip>:~/
scp docker-compose.yml <pi-user>@<pi-ip>:~/controlroom/
scp .env <pi-user>@<pi-ip>:~/controlroom/
~~~

---

## 3. Install Docker on the Pi (first time only)

SSH into the Pi:
~~~bash
ssh <pi-user>@<pi-ip>
~~~

Install:
~~~bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
~~~

Log out and back in:
~~~bash
exit
ssh <pi-user>@<pi-ip>
~~~

Verify:
~~~bash
docker --version
docker compose version
~~~

---

## 4. Load the image on the Pi

~~~bash
cd ~
docker load -i controlroom-app-arm64.tar
docker images
~~~

---

## 5. Configure docker-compose on the Pi

Edit `~/controlroom/docker-compose.yml` — change `build: .` to `image: controlroom-app:latest`:

~~~yaml
services:
  app:
    image: controlroom-app:latest
    container_name: controlroom-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_PATH=/app/data/app.db
      - TZ=America/Chicago
    env_file:
      - .env
~~~

Verify `.env` contains your real `ICS_URL`.

---

## 6. Start the app

~~~bash
cd ~/controlroom
docker compose up -d
docker compose logs -f
~~~

Expected:
~~~
[scheduler] started (0 6,18 * * * America/Chicago)
▲ Next.js ready on :3000
~~~

---

## 7. Initialize data

From any machine on the network:

~~~bash
curl http://<pi-ip>:3000/api/init
curl http://<pi-ip>:3000/api/import
curl http://<pi-ip>:3000/api/rebuild
~~~

---

## 8. Point DAKboard at the app

In DAKboard, for each screen (PCR1–PCR4):

1. Add a Website block, full-screen
2. Set URL to:
   - `http://<pi-ip>:3000/controlroom/1`
   - `http://<pi-ip>:3000/controlroom/2`
   - `http://<pi-ip>:3000/controlroom/3`
   - `http://<pi-ip>:3000/controlroom/4`
3. Set refresh interval (e.g., 12 hours)

---

## Updating later

Dev machine:
~~~bash
docker buildx build --platform linux/arm64 \
  -t controlroom-app:latest \
  --output type=docker,dest=controlroom-app-arm64.tar .
scp controlroom-app-arm64.tar <pi-user>@<pi-ip>:~/
~~~

Pi:
~~~bash
docker load -i ~/controlroom-app-arm64.tar
cd ~/controlroom
docker compose up -d
docker compose logs -f
~~~

---

## Common commands (on Pi)

~~~bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
docker compose up -d
~~~

---

## Backup

~~~bash
scp <pi-user>@<pi-ip>:~/controlroom/data/app.db ./app-backup-$(date +%F).db
~~~

---

## Troubleshooting

- **Image won't load:** confirm `uname -m` on Pi returns `aarch64`
- **Port 3000 not reachable:** check `sudo ufw status` and `docker compose ps`
- **Displays blank:** verify `curl http://localhost:3000/controlroom/1` on Pi returns HTML
- **Data lost after restart:** ensure `./data:/app/data` volume is in `docker-compose.yml`
- **DAKboard shows nothing:** confirm Pi's IP is stable and reachable from DAKboard Pi