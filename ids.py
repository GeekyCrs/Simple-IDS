from scapy.all import sniff, IP, TCP
from collections import defaultdict
import time
import csv
import smtplib
from email.message import EmailMessage

# ================= CONFIG =================
PORT_SCAN_THRESHOLD = 10
DOS_THRESHOLD = 50
TIME_WINDOW = 10  # seconds

EMAIL_SENDER = "your_email@gmail.com"
EMAIL_PASSWORD = "your_app_password"
EMAIL_RECEIVER = "your_email@gmail.com"
# =========================================

ip_ports = defaultdict(set)
ip_packets = defaultdict(list)

def send_email_alert(message):
    try:
        msg = EmailMessage()
        msg.set_content(message)
        msg['Subject'] = '🚨 IDS Alert'
        msg['From'] = EMAIL_SENDER
        msg['To'] = EMAIL_RECEIVER

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print("Email error:", e)

def save_to_csv(timestamp, alert_type, ip):
    with open("alerts.csv", "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([timestamp, alert_type, ip])

def alert(alert_type, ip):
    timestamp = time.ctime()
    message = f"{alert_type} detected from {ip}"
    
    print(f"[ALERT] {message}")
    save_to_csv(timestamp, alert_type, ip)
    send_email_alert(message)

def detect_intrusion(packet):
    if packet.haslayer(IP):
        src_ip = packet[IP].src
        now = time.time()

        ip_packets[src_ip].append(now)
        ip_packets[src_ip] = [t for t in ip_packets[src_ip] if now - t <= TIME_WINDOW]

        # DoS Detection
        if len(ip_packets[src_ip]) > DOS_THRESHOLD:
            alert("Possible DoS Attack", src_ip)

        # Port Scan Detection
        if packet.haslayer(TCP):
            ip_ports[src_ip].add(packet[TCP].dport)
            if len(ip_ports[src_ip]) > PORT_SCAN_THRESHOLD:
                alert("Possible Port Scan", src_ip)

print("🚨 Simple IDS Running on Kali Linux 🚨")
sniff(prn=detect_intrusion, store=False)
