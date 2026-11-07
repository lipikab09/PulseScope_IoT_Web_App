# PulseScope: Advanced Hybrid ESP32-H2 Pocket Oscilloscope

An open-source, low-cost hybrid digital oscilloscope and voltage monitor powered by the **ESP32-H2**, featuring an onboard **0.96-inch I2C OLED display**, a **KY-040 rotary encoder**, a **potentiometer test signal generator**, and a modern web-based **HTML5 dashboard**.

Developed as an IoT hardware & software systems project (Course: CS2404, RV University).

---

## 🛠️ Project Architecture & Features

- **Standalone Local Display:** Real-time waveform rendering and digital voltage multimeter views on a 128x64 SSD1306 OLED screen.
- **Physical Control Interface:** KY-040 rotary encoder for live voltage scale adjustment (500mV to 3300mV) and push-button display mode toggling.
- **Onboard Signal Source:** 10K rotary potentiometer acting as an adjustable DC test signal generator wired directly into the ADC channel (`GPIO 4`).
- **Web Dashboard Integration:** Modern glassmorphic browser dashboard (`index.html`, `style.css`, `app.js`) built with Chart.js, featuring real-time telemetry stats (Min, Max, Avg, Peak-to-Peak) and a scaffold for BLE / Web serial streaming.

---

## 📌 Hardware Pinout Configuration (ESP32-H2)

| Component / Function | ESP32-H2 Pin | Description |
| :--- | :--- | :--- |
| **OLED Display SDA** | `GPIO 11` | I2C Data line |
| **OLED Display SCL** | `GPIO 10` | I2C Clock line |
| **Analog Input / Potentiometer** | `GPIO 4` (`POT_PIN`) | 12-bit ADC input reading |
| **Rotary Encoder CLK** | `GPIO 12` | Encoder pulse A |
| **Rotary Encoder DT** | `GPIO 22` | Encoder pulse B |
| **Rotary Encoder Switch (SW)** | `GPIO 0` (`SW_PIN`) | Push-button mode toggle |
| **Power Rails** | `3V3` & `GND` | Regulated power bus |

---

## 📂 Repository Structure

```text
PulseScope_IoT_Web_App/
├── firmware/
│   └── ESP32H2_Oscilloscope_Code.c.ino   # Your Arduino firmware code
├── web-dashboard/
│   ├── index.html                       # HTML dashboard
│   ├── style.css                        # CSS styling file
│   └── app.js                           # JavaScript Web Bluetooth logic
├── .gitignore                           # Git ignore rules
└── README.md                            # Project documentation