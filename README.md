# FPV Setup Checker

A lightweight, browser-based hardware calculator and safety checker designed specifically for high-performance FPV drones, long-range rigs, and heavy-lift industrial macro-quads (supporting components like Pilotix motors and large-scale frames). 

Standard drone calculators often rely on flat multipliers and linear wattage assumptions that break down on large-scale setups. This tool uses size-dependent dynamic scaling to evaluate real-world flight physics, electrical limits, and structural safety margins.

---

## 🚀 Key Features

* **Dynamic Propeller-Driven Limits:** Automatically calculates safe RPM limits and size-dependent full-throttle system efficiencies (`gf/W`) based on propeller diameter (with smooth interpolation from 5" freestyle builds up to 13"+ heavy lifters).
* **Max Safe Weight (AUW) & TWR Analysis:** Moves away from confusing raw thrust metrics by evaluating the **Thrust-to-Weight Ratio** alongside a calculated **Max Safe Flight Weight**, ensuring your drone has enough structural and operational headroom.
* **Smart Performance Tiers:** Dynamically categorizes your build's performance profile (e.g., *Cinematic / Long-Range Cruiser*, *High Agility / Freestyle*, or *Extremely Overpowered / Rocket*).
* **Electrical Safety Checks:** Verifies continuous and peak burst ratings for ESCs, syncs power and current dynamically based on battery voltage, and calculates minimum required battery C-ratings.
* **Fully Responsive & Offline-Ready:** Built with vanilla HTML5, CSS3, and modern JavaScript with PWA manifest support.

---

## 🧠 Core Calculations & Physics

Unlike basic calculators that multiply raw electrical watts by a flat multiplier, this tool accounts for real-world constraints:
* **Full-Throttle Efficiency Scaling:** Recognizes that motors and propellers experience diminishing returns and heavy electromagnetic/aerodynamic drag at 100% throttle, utilizing realistic baseline efficiencies (e.g., ~3.4 gf/W for heavy-lift macro setups).
* **Dynamic TWR Floor:** Enforces a minimum safety threshold of **2.0:1** for large macro-quads (≥ 10") and **3.0:1** for smaller freestyle quads (≤ 7").
* **Loaded RPM Estimation:** Factors in standard voltage sag and operational drag ($\text{Voltage} \times \text{KV} \times 0.80$).

---

## 🛠️ Project Structure

```text
├── index.html           # Main user interface and formula reference
├── style.css            # Modern, clean styling and responsive grid layout
├── app.js               # Core calculation engine and UI event listeners
└── manifest.webmanifest # PWA configuration for offline use
```

---

## 🏃‍♂️ Getting Started Locally

Since this is a fully client-side web application built with vanilla web technologies.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/fpv-setup-checker.git](https://github.com/your-username/fpv-setup-checker.git)
   cd fpv-setup-checker
   ```
2. **Open the app:**
   Simply double-click `index.html` to open it directly in your web browser, or serve it via a local development server (like the VS Code *Live Server* extension).

---

## 📜 Formulas Used

* **Estimated Total Static Thrust** = Total Peak Power (W) × Size-Dependent Full-Throttle Efficiency (gf/W)
* **Thrust-to-Weight Ratio (TWR)** = Estimated Total Static Thrust ÷ Actual Drone Weight
* **Max Safe Weight (AUW)** = Estimated Total Static Thrust ÷ Minimum Target TWR (2.0 for ≥ 10" props, 3.0 for smaller props)
* **Estimated Loaded RPM** ≈ Voltage × KV × 0.80
* **Peak Current per Motor** = Peak Power per Motor (W) ÷ Battery Voltage (V)
* **Total System Peak Current** = Peak Current per Motor × Number of Motors
* **Minimum Battery C-Rating** = Total System Peak Current ÷ Battery Capacity (Ah)
* **ESC Verification:** Burst rating must cover absolute peak current; continuous rating must comfortably handle ≥ 80% of peak operational draw.

---

## 🤝 Contributing

Contributions, feature ideas, and hardware calibration tweaks (especially for specialized industrial frames or alternative motor specs) are always welcome! Feel free to open an issue or submit a pull request.