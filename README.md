<h1 align="center">Simple Intrusion Detection System (IDS)</h1>

<p align="center">
  <b>A real-time, Python-based Intrusion Detection System for monitoring network traffic</b><br>
  Detects suspicious activities like <b>Port Scanning</b> and <b>DoS-like attacks</b> with alerts.
</p>

<p align="center">
  <a href="https://www.python.org/">
    <img src="https://img.shields.io/badge/Python-3.x-blue.svg?style=for-the-badge&logo=python">
  </a>
  <a href="https://github.com/mantrapatil03">
    <img src="https://img.shields.io/badge/Author-Mantra%20Patil-green.svg?style=for-the-badge">
  </a>
  <a href="https://www.linkedin.com/in/mantrapatil25">
    <img src="https://img.shields.io/badge/Connect-LinkedIn-blue?style=for-the-badge&logo=linkedin">
  </a>
  <img src="https://img.shields.io/badge/Platform-Kali%20Linux-purple?style=for-the-badge&logo=linux" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" />
</p>

---

## Overview

**Simple IDS** is a lightweight, Python-based **Intrusion Detection System** designed to monitor live network traffic and identify suspicious behavior.

It analyzes incoming packets in real time and triggers alerts when potential security threats such as **port scanning** or **DoS attacks** are detected. Alerts are logged locally, saved in CSV format, and optionally sent via **email notifications**.

⚠️ **For educational and ethical use only.**

---

## Features

✅ Live packet inspection using **Scapy**  
✅ Detects **Port Scanning** attempts  
✅ Detects **DoS-like high traffic patterns**  
✅ Real-time terminal alerts  
✅ Email notifications for detected attacks  
✅ CSV-based alert logging (`alerts.csv`)  
✅ Kali Linux compatible  
✅ Lightweight & easy to extend  

---

---

## Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/mantrapatil03/simple-ids.git
cd simple-ids
```
### 2️⃣ Install dependencies
```
pip3 install -r requirements.txt
```
## Usage
### Kali Linux / Linux
```
sudo python3 ids.py
```

>⚠️ Root privileges are required for packet sniffing.

## Alert Types Detected
| Attack Type     | Description                                 |
| --------------- | ------------------------------------------- |
| Port Scan       | Multiple destination ports accessed rapidly |
| DoS-like Attack | High packet rate from a single IP           |

## Alert Output
### Terminal Alert
```csharp
[ALERT] Possible Port Scan detected from 192.168.1.10
```
### CSV Log (`alerts.csv`)
```css
Time,Attack Type,Source IP
Sun Jan  7 21:30:12 2026,Possible Port Scan,192.168.1.10
```
### Email Alert

- Subject: 🚨 IDS Alert
- Body: Attack type and source IP

## Email Configuration
Edit the following section in `ids.py`:
```python
EMAIL_SENDER = "your_email@gmail.com"
EMAIL_PASSWORD = "your_app_password"
EMAIL_RECEIVER = "your_email@gmail.com"
```

>⚠️ Use a **Gmail App Password**, not your real password.

## Permissions
| Platform   | Required Privilege |
| ---------- | ------------------ |
| Kali Linux | Run with `sudo`    |
| Linux      | Root privileges    |

## Troubleshooting

### Permission Denied
→ Run using `sudo`

### No Alerts Triggered
→ Lower detection thresholds inside `ids.py`

### Email Not Sending
→ Check internet connection and app password

## Developer Guide
### Main Components
| File     | Description                                      |
| -------- | ------------------------------------------------ |
| `ids.py` | Packet sniffing, detection logic, alert handling |

### Extending the IDS
- Add new detection rules (e.g., brute-force login detection)
- Integrate firewall rules for IPS functionality
- Add ML-based anomaly detection

## Contributing
Contributions are welcome!

Steps:
- 1️⃣ Fork the repository
- 2️⃣ Create a new branch
- 3️⃣ Add features or improve detection
- 4️⃣ Submit a pull request

## Author
**Mantra Patil**

✉️ techmantrapatil@gmail.com

<h2 align="center">💫 Thanks for Visiting! 💫</h2> <p align="center"> <i>Made with ❤️ & Python by <b>Mantra Patil</b></i><br><br> <img src="https://img.shields.io/badge/Keep%20Coding-Python-blue?style=for-the-badge&logo=python" /> <img src="https://img.shields.io/badge/Follow%20on-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin" /> <img src="https://img.shields.io/badge/Star%20This%20Repo-GitHub-black?style=for-the-badge&logo=github" /> </p> <p align="center"> 🌟 <b>If you found this project helpful, please give it a star!</b> 🌟<br> Your support motivates further open-source work and new features. </p>











