# FPV Setup Checker

A lightweight, browser-based hardware calculator and safety checker designed specifically for custom FPV drones, long-range rigs, and heavy-lift quads. 

Unlike standard calculators that rely on flat multipliers, this tool uses actual motor manufacturer test data to evaluate real-world flight physics, electrical limits, and structural safety margins.

## 🚀 Key Features

* **Data-Driven Interpolation:** Dynamically scales manufacturer test data based on voltage ratios and propeller slip factors to estimate performance on your specific setup.
* **Capacitor Analysis:** Calculates the minimum required capacitance (µF) based on ESC switching frequency, current ripple, and voltage ripple, while verifying safe voltage margins.
* **Electrical Safety Checks:** Evaluates ESC continuous utilization and peak burst excess heat, while calculating minimum required battery C-ratings.
* **Max Safe Weight & TWR Analysis:** Evaluates Thrust-to-Weight Ratio (TWR) and calculates a maximum safe flight weight based on a required minimum TWR and propulsion utilization limits.
* **Save & Load Setups:** Easily export and import your drone build parameters via JSON files for future reference.

## 🧠 Core Calculations & Physics

The tool applies realistic physics and empirical limits to prevent unrealistic estimations:
* **Thrust Scaling:** Adjusts test thrust using the RPM ratio squared and the propeller diameter ratio to the 4th power.
* **Current Scaling:** Adjusts test current using the RPM ratio cubed and the propeller diameter ratio to the 5th power.
* **Empirical RPM Limits:** Enforces a maximum plausible RPM based on propeller diameter to flag impossible target operational speeds.
* **Thermal/Burst Evaluation:** Calculates excess heat generated during transient zero-airspeed spikes based on ESC burst overload ratios.

## 🛠️ Project Structure

```text
├── index.html           # Main user interface and formula reference
├── style.css            # Modern, clean styling and responsive grid layout
├── app.js               # Core calculation engine and UI event listeners
└── manifest.webmanifest # PWA configuration for offline use
```

## 🏃‍♂️ Getting Started Locally

This is a fully client-side web application built with vanilla web technologies.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/fpv-setup-checker.git](https://github.com/your-username/fpv-setup-checker.git)
   cd fpv-setup-checker
   ```
2. **Open the app:**
   Double-click `index.html` to open it directly in your web browser, or serve it via a local development server.

## 📜 Formulas Used

* **Estimated total static thrust** = Scaled peak 100% throttle thrust (adjusted by RPM ratio squared and propeller diameter ratio to the 4th power) × number of motors.
* **Max safe weight** = (Estimated total static thrust ÷ minimum target TWR) × propulsion utilization limit.
* **Target operational RPM** = Interpolated RPM value from test data corresponding to the required thrust per motor.
* **Total system peak current** = Scaled peak 100% throttle current (adjusted by RPM ratio cubed and propeller diameter ratio to the 5th power) × number of motors.
* **Minimum C-rating** = Total system peak current ÷ (battery capacity in mAh ÷ 1000).
* **ESC excess heat rate** = ((Peak Amps ÷ ESC Burst)² - 1) × 100.
* **Minimum required capacitance** = (I_ripple × ΔT) ÷ ΔV. 

## 🤝 Contributing

Contributions, feature ideas, and hardware calibration tweaks are always welcome! Feel free to open an issue or submit a pull request.