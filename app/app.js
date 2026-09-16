const $ = id => document.getElementById(id);
const n = id => Number($(id).value);

function fmt(x, digits=1){ return Number.isFinite(x) ? x.toLocaleString(undefined,{maximumFractionDigits:digits}) : "—"; }

// --- Preset Setups ---
const presetSetups = {
  "5inch 4S": {
    "drone": { "weight": 2000, "motors": 4, "minTargetTwr": 2, "propulsionUtilizationLimit": 85 },
    "propeller": { "propDiameter": 5 },
    "motor": { "kv": 2400, "motorMinS": 3, "motorMaxS": 4, "testBatteryS": 4, "testPropDiameter": 5 },
    "battery": { "batteryS": 4, "capacity": 5000, "crate": 50 },
    "esc": { "esc": 60, "escBurst": 70, "escMinS": 4, "escMaxS": 6, "escUtilizationLimit": 80 },
    "testRows": [
      { "mandatory": true, "throttle": 100, "thrust": 1300, "current": 35.8, "voltage": 16.8, "rpm": null },
      { "mandatory": false, "throttle": 90, "thrust": 1100, "current": 28.1, "voltage": 16.8, "rpm": 25520 },
      { "mandatory": false, "throttle": 80, "thrust": 930, "current": 21.5, "voltage": 16.8, "rpm": 23560 },
      { "mandatory": false, "throttle": 70, "thrust": 760, "current": 15.8, "voltage": 16.8, "rpm": 21320 },
      { "mandatory": false, "throttle": 60, "thrust": 600, "current": 11.1, "voltage": 16.8, "rpm": 18970 },
      { "mandatory": false, "throttle": 50, "thrust": 440, "current": 7.3, "voltage": 16.8, "rpm": 16390 },
      { "mandatory": false, "throttle": 40, "thrust": 300, "current": 4.47, "voltage": 16.8, "rpm": 13720 },
      { "mandatory": false, "throttle": 30, "thrust": 180, "current": 2.31, "voltage": 16.8, "rpm": 10710 }
    ],
    "capacitorRows": [
      { "mandatory": true, "voltage": 35, "uF": 1000 }
    ]
  },
  "10inch 6S": {
    "drone": { "weight": 4000, "motors": 4, "minTargetTwr": 2, "propulsionUtilizationLimit": 85 },
    "propeller": { "propDiameter": 10 },
    "motor": { "kv": 900, "motorMinS": 3, "motorMaxS": 6, "testBatteryS": 6, "testPropDiameter": 10 },
    "battery": { "batteryS": 6, "capacity": 5000, "crate": 50 },
    "esc": { "esc": 60, "escBurst": 65, "escMinS": 3, "escMaxS": 6, "escUtilizationLimit": 80 },
    "testRows": [
      { "mandatory": true, "throttle": 100, "thrust": 3960, "current": 68, "voltage": 22.1, "rpm": 14650 },
      { "mandatory": false, "throttle": 80, "thrust": 3651, "current": 64.2, "voltage": 22.22, "rpm": 13600 },
      { "mandatory": false, "throttle": 70, "thrust": 3178, "current": 47.34, "voltage": 23.12, "rpm": 12599 },
      { "mandatory": false, "throttle": 60, "thrust": 2526, "current": 32.18, "voltage": 23.86, "rpm": 11286 },
      { "mandatory": false, "throttle": 50, "thrust": 1781, "current": 18.25, "voltage": 25.25, "rpm": 9547 },
      { "mandatory": false, "throttle": 20, "thrust": 128, "current": 0.74, "voltage": 25.32, "rpm": 2984 }
    ],
    "capacitorRows": [{ "mandatory": true, "voltage": 35, "uF": 1500 }]
  },
  "13inch 6S": {
    "drone": { "weight": 4000, "motors": 4, "minTargetTwr": 2, "propulsionUtilizationLimit": 85 },
    "propeller": { "propDiameter": 13 },
    "motor": { "kv": 660, "motorMinS": 3, "motorMaxS": 8, "testBatteryS": 6, "testPropDiameter": 13 },
    "battery": { "batteryS": 6, "capacity": 5000, "crate": 50 },
    "esc": { "esc": 80, "escBurst": 100, "escMinS": 3, "escMaxS": 8, "escUtilizationLimit": 80 },
    "testRows": [
      { "mandatory": true, "throttle": 100, "thrust": 5740, "current": 79.06, "voltage": 21.06, "rpm": 10908 },
      { "mandatory": false, "throttle": 90, "thrust": 4862, "current": 60, "voltage": 21.36, "rpm": 10129 },
      { "mandatory": false, "throttle": 80, "thrust": 4044, "current": 45.01, "voltage": 21.59, "rpm": 9328 },
      { "mandatory": false, "throttle": 70, "thrust": 3265, "current": 31.49, "voltage": 21.79, "rpm": 8377 },
      { "mandatory": false, "throttle": 60, "thrust": 2512, "current": 21.09, "voltage": 21.95, "rpm": 7343 },
      { "mandatory": false, "throttle": 50, "thrust": 1750, "current": 12.86, "voltage": 22.09, "rpm": 6199 }
    ],
    "capacitorRows": [{ "mandatory": true, "voltage": 35, "uF": 2200 }]
  }
};

// --- Min Motor KVs
const absoluteMinKvTable = {
  2: { 1: 14000, 2: 7000, 3: 4500, 4: 3500 },
  3: { 1: 8000, 2: 4500, 3: 3000, 4: 2500, 6: 1600 },
  4: { 1: 6000, 2: 3000, 3: 2200, 4: 1800, 6: 1400 },
  5: { 1: 5000, 2: 2500, 3: 2000, 4: 1600, 6: 1200, 8: 900, 12: 600 },
  6: { 1: 4200, 2: 2100, 3: 1700, 4: 1400, 6: 1000, 8: 750, 12: 500 },
  7: { 2: 1700, 3: 1400, 4: 1100, 6: 800, 8: 600, 12: 400 },
  8: { 2: 1400, 3: 1200, 4: 900, 6: 675, 8: 500, 12: 320 },
  9: { 2: 1200, 3: 1000, 4: 780, 6: 560, 8: 420, 12: 260 },
  10: { 2: 1000, 3: 900, 4: 700, 6: 450, 8: 350, 12: 220 },
  11: { 3: 700, 4: 550, 6: 380, 8: 280, 12: 180 },
  12: { 3: 600, 4: 480, 6: 320, 8: 240, 12: 160 },
  13: { 3: 500, 4: 400, 6: 280, 8: 200, 12: 140 },
  14: { 3: 450, 4: 360, 6: 250, 8: 180, 12: 125 },
  15: { 4: 320, 6: 220, 8: 160, 12: 110 },
  16: { 6: 200, 8: 145, 12: 100 },
  17: { 6: 180, 8: 130, 12: 90 },
  18: { 6: 160, 8: 120, 12: 80 },
  19: { 6: 150, 8: 110, 12: 75 },
  20: { 6: 140, 8: 100, 12: 70 }
};

const practicalMinKvTable = {
  2: { 1: 18000, 2: 9000, 3: 6000, 4: 4500 },
  3: { 1: 10000, 2: 6000, 3: 4000, 4: 3200, 6: 2200 },
  4: { 1: 8000, 2: 4000, 3: 3000, 4: 2400, 6: 1700 },
  5: { 1: 7000, 2: 3500, 3: 2600, 4: 2100, 6: 1500, 8: 1100, 12: 750 },
  6: { 1: 5600, 2: 2800, 3: 2100, 4: 1700, 6: 1300, 8: 950, 12: 570 },
  7: { 2: 2300, 3: 1700, 4: 1300, 6: 980, 8: 750, 12: 450 },
  8: { 2: 1900, 3: 1400, 4: 1100, 6: 850, 8: 600, 12: 380 },
  9: { 2: 1600, 3: 1200, 4: 950, 6: 700, 8: 520, 12: 340 },
  10: { 2: 1400, 3: 1000, 4: 850, 6: 600, 8: 450, 12: 300 },
  11: { 3: 850, 4: 700, 6: 500, 8: 400, 12: 270 },
  12: { 3: 750, 4: 600, 6: 450, 8: 350, 12: 250 },
  13: { 3: 600, 4: 500, 6: 400, 8: 300, 12: 220 },
  14: { 3: 550, 4: 450, 6: 360, 8: 270, 12: 190 },
  15: { 4: 400, 6: 320, 8: 240, 12: 170 },
  16: { 6: 290, 8: 215, 12: 150 },
  17: { 6: 260, 8: 195, 12: 135 },
  18: { 6: 230, 8: 175, 12: 120 },
  19: { 6: 210, 8: 160, 12: 110 },
  20: { 6: 190, 8: 145, 12: 100 }
};

// --- Min Capacitance Data ---
const absoluteMinCapacitanceTable = {
  2: { 1: 0, 2: 0, 3: 100, 4: 100 },
  3: { 2: 100, 3: 100, 4: 150, 6: 220 },
  4: { 3: 150, 4: 220, 6: 220 },
  5: { 3: 220, 4: 220, 6: 330 },
  6: { 2: 150, 3: 220, 4: 330, 6: 330, 8: 470 },
  7: { 2: 150, 3: 220, 4: 330, 6: 470, 8: 680 },
  8: { 2: 220, 3: 330, 4: 470, 6: 470, 8: 680 },
  9: { 2: 220, 3: 330, 4: 470, 6: 680, 8: 680, 12: 1000 },
  10: { 2: 330, 3: 470, 4: 470, 6: 680, 8: 1000, 12: 1320 },
  11: { 3: 470, 4: 470, 6: 680, 8: 1000, 12: 1320 },
  12: { 3: 680, 4: 680, 6: 1000, 8: 1000, 12: 1320 },
  13: { 3: 680, 4: 680, 6: 1000, 8: 1000, 12: 1320, 14: 1880 },
  14: { 3: 1000, 4: 1000, 6: 1000, 8: 1320, 12: 1880, 14: 1880 },
  15: { 4: 1000, 6: 1320, 8: 1320, 12: 1880, 14: 1880 },
  16: { 6: 1320, 8: 1320, 12: 1880, 14: 1880 },
  17: { 6: 1320, 8: 1880, 12: 1880, 14: 2000 },
  18: { 6: 1320, 8: 1880, 12: 2000, 14: 2720 },
  19: { 6: 1880, 8: 1880, 12: 2000, 14: 2720 },
  20: { 6: 1880, 8: 1880, 12: 2720, 14: 2720 }
};

const reasonableMinCapacitanceTable = {
  2: { 1: 100, 2: 220, 3: 220, 4: 330 },
  3: { 2: 220, 3: 330, 4: 470, 6: 470 },
  4: { 3: 330, 4: 470, 6: 680 },
  5: { 3: 470, 4: 1000, 6: 1000 },
  6: { 2: 330, 3: 470, 4: 680, 6: 1000, 8: 1500 },
  7: { 2: 330, 3: 470, 4: 680, 6: 1000, 8: 1500 },
  8: { 2: 470, 3: 680, 4: 1000, 6: 1000, 8: 1500 },
  9: { 2: 470, 3: 680, 4: 1000, 6: 1000, 8: 1500, 12: 2720 },
  10: { 2: 680, 3: 1000, 4: 1000, 6: 1500, 8: 2720, 12: 4000 },
  11: { 3: 1000, 4: 1000, 6: 1500, 8: 2720, 12: 4000 },
  12: { 3: 1500, 4: 1500, 6: 2000, 8: 2720, 12: 4000 },
  13: { 3: 1500, 4: 1500, 6: 2000, 8: 2720, 12: 4000, 14: 4700 },
  14: { 3: 2000, 4: 2000, 6: 2000, 8: 2720, 12: 4000, 14: 4700 },
  15: { 4: 2000, 6: 2720, 8: 4000, 12: 4700, 14: 4700 },
  16: { 6: 2720, 8: 4000, 12: 4700, 14: 6800 },
  17: { 6: 2720, 8: 4000, 12: 6800, 14: 6800 },
  18: { 6: 4000, 8: 4700, 12: 6800, 14: 8000 },
  19: { 6: 4000, 8: 4700, 12: 8000, 14: 8000 },
  20: { 6: 4000, 8: 4700, 12: 8000, 14: 10000 }
};

// Generic table lookup and interpolation
function getMinTableValue(table, propRaw, cells) {
  const prop = Math.round(propRaw);
  if (!table[prop]) return null;
  const availableCells = Object.keys(table[prop]).map(Number).sort((a, b) => a - b);
  if (cells < availableCells[0] || cells > availableCells[availableCells.length - 1]) return null;

  for (let i = 0; i < availableCells.length; i++) {
    if (cells === availableCells[i]) return table[prop][cells];
    if (i < availableCells.length - 1 && cells > availableCells[i] && cells < availableCells[i + 1]) {
      const c1 = availableCells[i];
      const c2 = availableCells[i + 1];
      const val1 = table[prop][c1];
      const val2 = table[prop][c2];
      return val1 + ((val2 - val1) * (cells - c1)) / (c2 - c1);
    }
  }
  return null;
}

function loadConfigData(config, successMessage = "Setup loaded successfully!") {
  if (config.drone) {
    $("weight").value = config.drone.weight ?? "";
    $("motors").value = config.drone.motors ?? "";
    $("minTargetTwr").value = config.drone.minTargetTwr ?? "2";
    $("propulsionUtilizationLimit").value = config.drone.propulsionUtilizationLimit ?? "80";
  }
  if (config.propeller) {
    $("propDiameter").value = config.propeller.propDiameter ?? "";
  }
  if (config.motor) {
    $("kv").value = config.motor.kv ?? "";
    $("motorMinS").value = config.motor.motorMinS ?? "";
    $("motorMaxS").value = config.motor.motorMaxS ?? "";
    $("testBatteryS").value = config.motor.testBatteryS ?? "";
    $("testPropDiameter").value = config.motor.testPropDiameter ?? "";
  }
  if (config.battery) {
    $("batteryS").value = config.battery.batteryS ?? "";
    $("capacity").value = config.battery.capacity ?? "";
    $("crate").value = config.battery.crate ?? "";
  }
  if (config.esc) {
    $("esc").value = config.esc.esc ?? "";
    $("escBurst").value = config.esc.escBurst ?? "";
    $("escMinS").value = config.esc.escMinS ?? "";
    $("escMaxS").value = config.esc.escMaxS ?? "";
    $("escUtilizationLimit").value = config.esc.escUtilizationLimit ?? "80";
  }

  if (Array.isArray(config.testRows) && config.testRows.length > 0) {
    const container = $("testDataRows");
    container.innerHTML = ""; 

    config.testRows.forEach(rowData => {
      const row = document.createElement("div");
      row.className = "test-row";
      if (rowData.mandatory) row.dataset.mandatory = "true";

      row.style.display = "grid";
      row.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr)) 36px";
      row.style.gap = "6px";
      row.style.marginBottom = "10px";
      row.style.alignItems = "center";

      if (rowData.mandatory) {
        row.innerHTML = `
          <input type="number" class="row-throttle" value="${rowData.throttle}" readonly style="text-align: center;">
          <input type="number" class="row-thrust" min="0" step="1" value="${rowData.thrust}" style="text-align: center;">
          <input type="number" class="row-current" min="0" step="0.1" value="${rowData.current}" style="text-align: center;">
          <input type="number" class="row-voltage" min="0" step="0.1" value="${rowData.voltage}" style="text-align: center;">
          <input type="number" class="row-rpm" min="0" step="100" value="${rowData.rpm ?? ''}" style="text-align: center;">
          <button type="button" class="icon-btn" style="visibility: hidden;" aria-hidden="true">🗑️</button>
        `;
      } else {
        row.innerHTML = `
          <input type="number" class="row-throttle" min="0" max="99" step="1" value="${rowData.throttle}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <input type="number" class="row-thrust" min="0" step="1" value="${rowData.thrust}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <input type="number" class="row-current" min="0" step="0.1" value="${rowData.current}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <input type="number" class="row-voltage" min="0" step="0.1" value="${rowData.voltage}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <input type="number" class="row-rpm" min="0" step="100" value="${rowData.rpm ?? ''}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <button type="button" class="icon-btn remove-row" title="Remove row" style="width: 36px;">🗑️</button>
        `;
        row.querySelector(".remove-row").addEventListener("click", () => row.remove());
      }
      container.appendChild(row);
    });
  }
  
  if (Array.isArray(config.capacitorRows) && config.capacitorRows.length > 0) {
    const capContainer = $("capacitorRows");
    capContainer.innerHTML = ""; 

    config.capacitorRows.forEach(capData => {
      const row = document.createElement("div");
      row.className = "cap-row";
      if (capData.mandatory) row.dataset.mandatory = "true";

      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 1fr 36px";
      row.style.gap = "6px";
      row.style.marginBottom = "10px";
      row.style.alignItems = "center";

      if (capData.mandatory) {
        row.innerHTML = `
          <input type="number" class="cap-voltage" min="0" step="0.1" value="${capData.voltage}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <input type="number" class="cap-uF" min="0" step="1" value="${capData.uF}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <button type="button" class="icon-btn" style="visibility: hidden; width: 36px;" aria-hidden="true">🗑️</button>
        `;
      } else {
        row.innerHTML = `
          <input type="number" class="cap-voltage" min="0" step="0.1" value="${capData.voltage}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <input type="number" class="cap-uF" min="0" step="1" value="${capData.uF}" style="text-align: center; padding: 6px 2px; width: 100%;">
          <button type="button" class="icon-btn remove-cap" title="Remove capacitor" style="width: 36px;">🗑️</button>
        `;
        row.querySelector(".remove-cap").addEventListener("click", () => row.remove());
      }
      capContainer.appendChild(row);
    });
  }
  
  // Clear previous results and approximation warnings
  const resultsSection = $("results");
  if (resultsSection) {
    resultsSection.classList.add("hidden");
    $("resultList").innerHTML = "";
    $("overall").textContent = "";
    $("overall").className = "overall";
  }
  
  const approximationsSection = $("approximationsSection");
  if (approximationsSection) {
    approximationsSection.classList.add("hidden");
    $("approximationsContent").innerHTML = "";
  }
  
  alert(successMessage);
}


// --- Row Management for Test Data ---
$("addRowBtn").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "test-row";
  
  row.style.display = "grid";
  row.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr)) 36px";
  row.style.gap = "6px";
  row.style.marginBottom = "10px";
  row.style.alignItems = "center";
  
  row.innerHTML = `
      <input type="number" class="row-throttle" min="0" max="99" step="1" style="text-align: center; padding: 6px 2px; width: 100%;">
      <input type="number" class="row-thrust" min="0" step="1" style="text-align: center; padding: 6px 2px; width: 100%;">
      <input type="number" class="row-current" min="0" step="0.1" style="text-align: center; padding: 6px 2px; width: 100%;">
      <input type="number" class="row-voltage" min="0" step="0.1" style="text-align: center; padding: 6px 2px; width: 100%;">
      <input type="number" class="row-rpm" min="0" step="100" style="text-align: center; padding: 6px 2px; width: 100%;">
      <button type="button" class="icon-btn remove-row" title="Remove row" style="width: 36px;">🗑️</button>
    `;
  
  row.querySelector(".remove-row").addEventListener("click", () => row.remove());
  $("testDataRows").appendChild(row);
});

$("sortBtn").addEventListener("click", () => {
  const container = $("testDataRows");
  const rows = Array.from(container.querySelectorAll(".test-row"));
  rows.sort((a, b) => {
    const valA = Number(a.querySelector(".row-throttle").value) || 0;
    const valB = Number(b.querySelector(".row-throttle").value) || 0;
    return valB - valA; // Descending order
  });
  rows.forEach(row => container.appendChild(row));
});

$("addCapRowBtn").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "cap-row";
  row.style.display = "grid";
  row.style.gridTemplateColumns = "1fr 1fr 36px";
  row.style.gap = "6px";
  row.style.marginBottom = "10px";
  row.style.alignItems = "center";
  
  row.innerHTML = `
      <input type="number" class="cap-voltage" min="0" step="0.1" style="text-align: center; padding: 6px 2px; width: 100%;">
      <input type="number" class="cap-uF" min="0" step="1" style="text-align: center; padding: 6px 2px; width: 100%;">
      <button type="button" class="icon-btn remove-cap" title="Remove capacitor" style="width: 36px;">🗑️</button>
    `;
  
  row.querySelector(".remove-cap").addEventListener("click", () => row.remove());
  $("capacitorRows").appendChild(row);
});

// Generic function to linearly interpolate/extrapolate any property
function getInterpolatedValue(targetX, dataPoints, propX, propY) {
  if (targetX <= 0) return 0;
  if (dataPoints.length < 2) return 0;

  for (let i = 0; i < dataPoints.length - 1; i++) {
    const p1 = dataPoints[i];
    const p2 = dataPoints[i + 1];
    
    // Check if target falls between these two points
    if (targetX >= p1[propX] && targetX <= p2[propX]) {
      const fraction = (targetX - p1[propX]) / (p2[propX] - p1[propX]);
      return p1[propY] + fraction * (p2[propY] - p1[propY]);
    }
  }
  
  // Extrapolate if above max
  const p1 = dataPoints[dataPoints.length - 2];
  const p2 = dataPoints[dataPoints.length - 1];
  const fraction = (targetX - p1[propX]) / (p2[propX] - p1[propX]);
  return p1[propY] + fraction * (p2[propY] - p1[propY]);
}


// --- Save and Load Setup ---
$("exportBtn").addEventListener("click", () => {
  const config = {
    drone: {
      weight: n("weight"),
      motors: n("motors"),
      minTargetTwr: n("minTargetTwr"),
      propulsionUtilizationLimit: n("propulsionUtilizationLimit")
    },
    propeller: {
      propDiameter: n("propDiameter")
    },
    motor: {
      kv: n("kv"),
      motorMinS: n("motorMinS"),
      motorMaxS: n("motorMaxS"),
      testBatteryS: n("testBatteryS"),
      testPropDiameter: n("testPropDiameter")
    },
    battery: {
      batteryS: n("batteryS"),
      capacity: n("capacity"),
      crate: n("crate")
    },
    esc: {
      esc: n("esc"),
      escBurst: n("escBurst"),
      escMinS: n("escMinS"),
      escMaxS: n("escMaxS"),
      escUtilizationLimit: n("escUtilizationLimit")
    },
    testRows: [],
    capacitorRows: []
  };

  document.querySelectorAll('.test-row').forEach(row => {
    const rpmStr = row.querySelector('.row-rpm').value;
    config.testRows.push({
      mandatory: row.dataset.mandatory === "true",
      throttle: Number(row.querySelector('.row-throttle').value) || 0,
      thrust: Number(row.querySelector('.row-thrust').value) || 0,
      current: Number(row.querySelector('.row-current').value) || 0,
      voltage: Number(row.querySelector('.row-voltage').value) || 0,
      rpm: rpmStr === "" ? null : Number(rpmStr)
    });
  });
  
  document.querySelectorAll('.cap-row').forEach(row => {
    config.capacitorRows.push({
      mandatory: row.dataset.mandatory === "true",
      voltage: Number(row.querySelector('.cap-voltage').value) || 0,
      uF: Number(row.querySelector('.cap-uF').value) || 0
    });
  });

  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "drone-setup.json";
  a.click();
  URL.revokeObjectURL(url);
});

$("importBtn").addEventListener("click", () => $("importFile").click());

$("importFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result);
      loadConfigData(config, "Setup loaded successfully!");
    } catch (err) {
      alert("Failed to parse the configuration file. Please ensure it is a valid JSON file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  event.target.value = ""; 
});

$("presetSelect").addEventListener("change", (e) => {
  const selectedKey = e.target.value;
  const config = presetSetups[selectedKey];
  if (config) {
    loadConfigData(config, "Preset loaded successfully!");
    e.target.value = ""; 
  }
});


function getTwrMessage(twr, minTargetTwr, utilization, yellowLimit, redLimit, performanceDesc) {
  const yellowPct = Math.round(yellowLimit * 100);
  const redPct = Math.round(redLimit * 100);

  if (twr < minTargetTwr) {
    return `Thrust-to-weight ratio is below the required minimum <br> Agility: ${performanceDesc}`;
  }
  if (utilization >= redLimit) {
    return `The drone's thrust-to-weight ratio is too close to the required minimum (above ${redPct}%) <br> Agility: ${performanceDesc}`;
  }
  if (utilization >= yellowLimit) {
    return `The drone's thrust-to-weight ratio is close to the required minimum (above ${yellowPct}%) <br> Agility: ${performanceDesc}`;
  }
  return `Thrust-to-weight ratio is comfortably above the required minimum <br> Agility: ${performanceDesc}`;
}

function getWeightUtilizationMessage(utilization, yellowLimit, redLimit) {
  const yellowPct = Math.round(yellowLimit * 100);
  const redPct = Math.round(redLimit * 100);

  if (utilization >= redLimit) {
    return `The drone's weight is too close to the absolute maximum for the required TWR (above ${redPct}% utilization)`;
  }
  if (utilization >= yellowLimit) {
    return `The drone's weight is close to the absolute maximum for the required TWR (above ${yellowPct}% utilization)`;
  }
  return `The drone's weight is comfortably below the utilization limit`;
}


function check(){
  const kv=n("kv"), capacity=n("capacity"), crate=n("crate");
  const esc=n("esc"), escBurst=n("escBurst"), escMinS=n("escMinS"), escMaxS=n("escMaxS");
  const escUtilizationLimit = n("escUtilizationLimit") / 100;
  const propulsionUtilizationLimit = n("propulsionUtilizationLimit") / 100;
  const minTargetTwr = n("minTargetTwr");
  const propIn=n("propDiameter"), weight=n("weight"), motors=n("motors");
  const batteryS = n("batteryS"), motorMinS = n("motorMinS"), motorMaxS = n("motorMaxS");
  const testBatteryS = n("testBatteryS");
  const testPropIn = n("testPropDiameter");
  
  const peakRow = document.querySelector('.test-row[data-mandatory="true"]') || document.querySelector('.test-row');
  if (!peakRow) {
    alert("Please ensure the motor test data table is properly loaded.");
    return;
  }
  
  const values=[weight, motors, propIn, kv, batteryS, capacity, crate, esc, escBurst, escMinS, escMaxS,
                motorMinS, motorMaxS, testBatteryS, testPropIn];
  
  if(values.some(v=>!Number.isFinite(v)||v<=0)){ 
    alert("Please enter positive values in all fields, including the test data rows."); 
    return; 
  }
  if(escBurst < esc) { 
    alert("The ESC's peak burst rating must be greater than or equal to its continuous rating."); 
    return; 
  }
  if (motorMinS > motorMaxS) {
    alert("Motor minimum cells cannot be greater than maximum cells.");
    return;
  }
  if (escMinS > escMaxS) {
    alert("ESC minimum cells cannot be greater than maximum cells.");
    return;
  }
  if (testBatteryS < motorMinS || testBatteryS > motorMaxS) {
    alert(`Test battery (${testBatteryS}S) must be within the motor's supported range (${motorMinS}S - ${motorMaxS}S).`);
    return;
  }
  
  const rawRows = Array.from(document.querySelectorAll('.test-row')).map(row => {
    const rpmStr = row.querySelector('.row-rpm').value;
    return {
      throttle: Number(row.querySelector('.row-throttle').value) || 0,
      thrust: Number(row.querySelector('.row-thrust').value) || 0,
      current: Number(row.querySelector('.row-current').value) || 0,
      voltage: Number(row.querySelector('.row-voltage').value) || 0,
      rpm: rpmStr === "" ? null : Number(rpmStr) // Stores null if blank, or the number if typed
    };
  });

  if (rawRows.some(r => r.throttle > 100)) {
    alert("Throttle levels cannot exceed 100%.");
    return;
  }
  
  rawRows.sort((a, b) => a.throttle - b.throttle);
  
  // Handle Missing 100% RPM
  const peakRowIdx = rawRows.length - 1;
  if (rawRows[peakRowIdx].rpm === null && rawRows.length > 1) {
    for (let i = peakRowIdx - 1; i >= 0; i--) {
      if (rawRows[i].rpm !== null && rawRows[i].thrust > 0 && rawRows[peakRowIdx].thrust > 0) {
        rawRows[peakRowIdx].rpm = rawRows[i].rpm * Math.sqrt(rawRows[peakRowIdx].thrust / rawRows[i].thrust);
        break; 
      }
    }
  }
  
  const hasAnyRpm = rawRows.some(r => r.rpm !== null); // Check if any RPM data exists at all
  
  for (let i = 0; i < rawRows.length - 1; i++) {
    const currentData = rawRows[i];
    const nextData = rawRows[i + 1];
    
    if (currentData.thrust > nextData.thrust) {
      alert(`Data error: Thrust decreases from ${currentData.thrust}gf to ${nextData.thrust}gf as throttle increases.`);
      return;
    }
    if (currentData.current > nextData.current) {
      alert(`Data error: Current decreases from ${currentData.current}A to ${nextData.current}A as throttle increases.`);
      return;
    }
    if (currentData.rpm > nextData.rpm && currentData.rpm > 0) {
      alert(`Data error: RPM decreases from ${currentData.rpm} to ${nextData.rpm} as throttle increases.`);
      return;
    }
  }
  
  const minVoltsPerCell = 3.0;
  const maxVoltsPerCell = 4.4;
  const expectedMinVoltage = testBatteryS * minVoltsPerCell;
  const expectedMaxVoltage = testBatteryS * maxVoltsPerCell;
  
  for (const row of rawRows) {
    if (row.voltage > 0) { 
      if (row.voltage < expectedMinVoltage || row.voltage > expectedMaxVoltage) {
        alert(`Data error: The test voltage (${row.voltage}V) at ${row.throttle}% throttle does not match a ${testBatteryS}S battery.`);
        return;
      }
    }
    
    const effectiveVoltage = row.voltage > 0 ? row.voltage : (testBatteryS * 3.7);
    const kvLimit = kv * effectiveVoltage;
    const maxSafeTestRpm = 720000 / (testPropIn * Math.PI);
    const hardTestRpmLimit = Math.min(kvLimit, maxSafeTestRpm);

    if (row.rpm > hardTestRpmLimit && row.rpm > 0) {
      alert(`Data error: Entered RPM (${row.rpm}) exceeds the maximum theoretical limit (${hardTestRpmLimit.toFixed(0)} RPM).`);
      return;
    }
  }
  
  const correctedPeakRow = rawRows[rawRows.length - 1];
  const peakAmpsPerMotorFromTest = correctedPeakRow.current;
  const peakVoltagePerMotorFromTest = correctedPeakRow.voltage > 0 ? correctedPeakRow.voltage : (testBatteryS * 4.2);
  const peakThrustPerMotorFromTest = correctedPeakRow.thrust;
  const peakLoadedRPMFromTest = correctedPeakRow.rpm;
  
  const isVoltageForMotorsOk = batteryS >= motorMinS && batteryS <= motorMaxS;
  const isEscVoltageOk = batteryS >= escMinS && batteryS <= escMaxS;
  
  const voltageRatio = batteryS / testBatteryS;
  const diameterRatio = propIn / testPropIn; 
  const slipExponent = 1.3;
  const rpmSlipFactor = Math.pow(1 / diameterRatio, slipExponent);
  const actualRpmRatio = voltageRatio * rpmSlipFactor;

  const peakThrustPerMotor = peakThrustPerMotorFromTest * Math.pow(actualRpmRatio, 2) * Math.pow(diameterRatio, 4);
  const peakAmpsPerMotor = peakAmpsPerMotorFromTest * Math.pow(actualRpmRatio, 3) * Math.pow(diameterRatio, 5);
  
  const peakVoltagePerMotor = peakVoltagePerMotorFromTest * voltageRatio;
  const peakPowerPerMotor = peakAmpsPerMotor * peakVoltagePerMotor;
  
  const totalPeakThrust = peakThrustPerMotor * motors;
  const totalPeakAmps = peakAmpsPerMotor * motors;

  const testData = [{ thrust: 0, current: 0, rpm: 0 }]; 
  rawRows.forEach(row => {
    if (row.thrust > 0 && row.current > 0) {
      const scaledRpm = row.rpm * voltageRatio * rpmSlipFactor;
      const rowRpmRatio = row.rpm > 0 ? (scaledRpm / row.rpm) : voltageRatio;

      testData.push({ 
        thrust: row.thrust * Math.pow(rowRpmRatio, 2) * Math.pow(diameterRatio, 4), 
        current: row.current * Math.pow(rowRpmRatio, 3) * Math.pow(diameterRatio, 5),
        rpm: scaledRpm
      });
    }
  });
  testData.sort((a, b) => a.thrust - b.thrust);
  
  // --- Max Motor KV Check ---
  const nominalVoltage = batteryS * 3.7;
  const maxSafeRpm = 720000 / (propIn * Math.PI); 
  const maxSafeKv = Math.floor(maxSafeRpm / nominalVoltage);

  let kvStatus = 'ok';
  let kvMessage = `Motor KV is safely within aerodynamic limits (Max limit: ${maxSafeKv} KV)`;
  if (kv > maxSafeKv) {
    kvStatus = 'bad';
    kvMessage = `Motor KV exceeds the aerodynamic tip-speed limit! (Max limit: ${maxSafeKv} KV)`;
  } else if (kv > maxSafeKv * 0.9) {
    kvStatus = 'warning';
    kvMessage = `Motor KV is very close to the aerodynamic tip-speed limit (Max limit: ${maxSafeKv} KV)`;
  }
  
  // --- Min Motor KV Check ---
  const roundedProp = Math.round(propIn);
  const absMinKv = getMinTableValue(absoluteMinKvTable, roundedProp, batteryS);
  const pracMinKv = getMinTableValue(practicalMinKvTable, roundedProp, batteryS);

  let minKvStatus = 'ok';
  let minKvMessage = '';

  if (absMinKv === null || pracMinKv === null) {
    minKvStatus = 'irregular';
    minKvMessage = `This combination of a ${propIn}" prop on ${batteryS}S is so unheard of that it might not even make sense.`;
  } else {
    if (kv < absMinKv) {
      minKvStatus = 'bad';
      minKvMessage = `KV is below the absolute minimum flight floor (~${Math.round(absMinKv)} KV).`;
    } else if (kv < pracMinKv) {
      minKvStatus = 'warning';
      minKvMessage = `KV is below the practical minimum (~${Math.round(pracMinKv)} KV). <br> While it is still above the absolute minimum (~${Math.round(absMinKv)} KV), this is a problematic setup`;
    } else {
      minKvStatus = 'ok';
      minKvMessage = `KV is safely above the practical minimum for a ${propIn}" prop on ${batteryS}S (~${Math.round(pracMinKv)} KV).`;
    }
  }
  
  const requiredThrustPerMotor = weight * minTargetTwr / motors;
  const yellowPropulsionLimit = propulsionUtilizationLimit;
  const redPropulsionLimit = 0.9;
  const propulsionUtilization = peakThrustPerMotor > 0 ? requiredThrustPerMotor / peakThrustPerMotor : 1.0;
  let propulsionStatus = 'ok';
  const yellowPct = Math.round(yellowPropulsionLimit * 100);
  const redPct = Math.round(redPropulsionLimit * 100);
  let propulsionMessage = `The required thrust is below ${yellowPct}% of the peak thrust`;
  
  if (propulsionUtilization >= redPropulsionLimit) {
      propulsionStatus = 'bad';
      propulsionMessage = `The required thrust is above ${redPct}% of the peak thrust!`;
  } else if (propulsionUtilization > yellowPropulsionLimit) {
      propulsionStatus = 'warning';
      propulsionMessage = `The required thrust is between ${yellowPct}% to ${redPct}% of the peak thrust!`;
  }

  const targetRpm = getInterpolatedValue(requiredThrustPerMotor, testData, 'thrust', 'rpm');
  const maxNoLoadRpm = kv * (batteryS * 4.2); 
  
  let rpmStatus = 'ok';
  let rpmMessage = `The required operational RPM is within physical constraints`;
  
  if (!hasAnyRpm) {
      rpmStatus = 'irregular';
      rpmMessage = `No information on RPM was provided in the test data.`;
  } else if (targetRpm > maxNoLoadRpm) {
      rpmStatus = 'bad';
      rpmMessage = `The required operational RPM is above the theoretical no-load maximum (${fmt(maxNoLoadRpm, 0)} RPM)`;
  } else if (targetRpm > maxNoLoadRpm * 0.9) {
      rpmStatus = 'bad';
      rpmMessage = `The required operational RPM is above 90% of the theoretical no-load maximum (${fmt(maxNoLoadRpm, 0)} RPM). This is practically impossible, and not empircally observed.`;
  } else if (targetRpm > maxNoLoadRpm * 0.8) {
    rpmStatus = 'warning';
    rpmMessage = `The required operational RPM is above 80% of the theoretical no-load maximum (${fmt(maxNoLoadRpm, 0)} RPM). This is extremely unusual.`;
  }
  
  const yellowContinuousAmps = esc * escUtilizationLimit;
  const redContinuousAmps = esc * 0.90;
  const requiredAmpsPerMotor = getInterpolatedValue(requiredThrustPerMotor, testData, 'thrust', 'current');
  const requiredContinuousAmpsPerMotor = Math.min(requiredAmpsPerMotor, peakAmpsPerMotor);
  let continuousAmpsStatus = 'ok';
  if (requiredContinuousAmpsPerMotor >= redContinuousAmps) {
      continuousAmpsStatus = 'bad';
  } else if (requiredContinuousAmpsPerMotor > yellowContinuousAmps) {
      continuousAmpsStatus = 'warning';
  }
  const escUtilizationPct = (requiredContinuousAmpsPerMotor / esc) * 100;
  
  const twr = totalPeakThrust / weight;
  let performanceDesc = "Optimal";
  if (twr > 6.0) performanceDesc = "Very agile";
  else if (twr > 4.0) performanceDesc = "Agile";
  else if (twr > 2 / propulsionUtilizationLimit) performanceDesc = "Reasonable";
  else if (twr >= 2) performanceDesc = "Heavy, becoming underpowered";
  else performanceDesc = "Underpowered (Too Heavy)";
  
  const burstOverload = peakAmpsPerMotor / escBurst;
  const excessHeatRate = burstOverload > 1 ? (Math.pow(burstOverload, 2) - 1) * 100 : 0;
  const yellowExcessHeatRate = 0; 
  const redExcessHeatRate = 15; 
  let excessHeatRateStatus = 'ok';
  if (excessHeatRate >= redExcessHeatRate) {
      excessHeatRateStatus = 'bad';
  } else if (excessHeatRate > yellowExcessHeatRate) {
      excessHeatRateStatus = 'warning';
  }

  const totalAmpsFor2to1 = requiredAmpsPerMotor * motors;
  const minC = totalAmpsFor2to1 / (capacity / 1000); 
  const maxBatteryAmps = crate * (capacity / 1000);
  const minCapacity = (totalAmpsFor2to1 / crate) * 1000; 

  const reqText = `<br>Required to meet demand: <br>- Either a ${fmt(minC, 1)}C rating<br>- Or a ${fmt(minCapacity, 0)}mAh capacity for the current C-rating`;

  let cStatus = 'ok';
  let cDetail = "";
  if (maxBatteryAmps < totalAmpsFor2to1) {
    cStatus = 'bad'; // Red
    cDetail = `2:1 TWR requires ${fmt(totalAmpsFor2to1, 1)} A. Battery only provides ${fmt(maxBatteryAmps, 1)} A.${reqText}`;
  } else if (maxBatteryAmps >= totalAmpsFor2to1 * 1.15) {
    cStatus = 'ok';  // Green
    cDetail = `Battery provides ${fmt(maxBatteryAmps, 1)} A, safely exceeding the 2:1 TWR requirement of ${fmt(totalAmpsFor2to1, 1)} A by >15%.${reqText}`;
  } else {
    cStatus = 'warning'; // Yellow
    cDetail = `Battery provides ${fmt(maxBatteryAmps, 1)} A. Meets 2:1 TWR requirement (${fmt(totalAmpsFor2to1, 1)} A) but lacks a 15% margin.${reqText}`;
  }
  
  // --- Capacitor Analysis ---
  const capRows = Array.from(document.querySelectorAll('.cap-row')).map(row => ({
    voltage: Number(row.querySelector('.cap-voltage').value) || 0,
    uF: Number(row.querySelector('.cap-uF').value) || 0
  }));

  if (capRows.length === 0) {
    alert("Please include at least one capacitor.");
    return;
  }

  const capVoltage = capRows[0].voltage;
  if (capRows.some(cap => cap.voltage !== capVoltage)) {
    alert("The app only supports the case of multiple capacitors with the same voltage rating.");
    return;
  }

  const totalCapacitance = capRows.reduce((sum, cap) => sum + cap.uF, 0);
  const maxBatVoltage = batteryS * 4.2;
  let capVoltageStatus = 'ok';
  let capVoltageDetail = '';
  if (capVoltage < maxBatVoltage) {
    capVoltageStatus = 'bad';
    capVoltageDetail = `Capacitor voltage (${capVoltage} V) is less than max battery voltage (${fmt(maxBatVoltage, 1)} V)`;
  } else if (capVoltage < (maxBatVoltage * 1.35)) {
    capVoltageStatus = 'warning';
    capVoltageDetail = `Less than 30% voltage margin compared to the full battery (${fmt(maxBatVoltage, 1)} V)`;
  } else {
    capVoltageStatus = 'ok';
    capVoltageDetail = `More than 30% voltage margin compared to the full battery (${fmt(maxBatVoltage, 1)} V)`;
  }

  const absMinCap = getMinTableValue(absoluteMinCapacitanceTable, roundedProp, batteryS);
  const reasonableMinCap = getMinTableValue(reasonableMinCapacitanceTable, roundedProp, batteryS);

  let capAmountStatus = 'ok';
  let capAmountDetail = '';

  if (absMinCap === null || reasonableMinCap === null) {
    capAmountStatus = 'irregular';
    capAmountDetail = `The combination of a ${propIn}" prop on ${batteryS}S is highly irregular and falls completely outside of standard physics bounds for determining required capacitance`
  } else if (totalCapacitance < absMinCap) {
    capAmountStatus = 'bad';
    capAmountDetail = `Total capacitance is critically low (absolute minimum: ${fmt(absMinCap, 0)} µF)`;
  } else if (totalCapacitance < reasonableMinCap) {
    capAmountStatus = 'warning';
    capAmountDetail = `Total capacitance is marginal (recommended &ge; ${fmt(reasonableMinCap, 0)} µF) <br> Dangerously low if below ${fmt(absMinCap, 0)} µF`;
  } else {
    capAmountStatus = 'ok';
    capAmountDetail = `Total capacitance is sufficient <br> Recommended to be &ge; ${fmt(reasonableMinCap, 0)} µF <br> Dangerously low if below ${fmt(absMinCap, 0)} µF`;
  }
  
  // --- Max Safe Weight Calculation ---
  const maxWeight = totalPeakThrust / minTargetTwr;
  const maxWeightForMaxPropulsionUtilization = maxWeight * yellowPropulsionLimit;
  
  const maxCurrentPerMotorFor15PercentMargin = (maxBatteryAmps / 1.15) / motors;
  const maxThrustForBatteryMargin = getInterpolatedValue(maxCurrentPerMotorFor15PercentMargin, testData, 'current', 'thrust');
  const maxWeightForBattery = (maxThrustForBatteryMargin * motors) / 2; // Derived from 2:1 TWR requirement
  
  const trueMaxSafeWeight = Math.min(maxWeightForMaxPropulsionUtilization, maxWeightForBattery);
  
  let maxSafeWeightStatus = 'ok';
  let safeWeightDesc = "The drone weight sits comfortably within these constraints.";
  
  if (weight <= trueMaxSafeWeight) {
      maxSafeWeightStatus = 'ok';
  } else if (propulsionUtilization < redPropulsionLimit && maxBatteryAmps > totalAmpsFor2to1) {
      // Prop utilization < 90% AND current for C rating above TWR
      maxSafeWeightStatus = 'warning';
      safeWeightDesc = "The drone weight exceeds optimal constraints but remains within marginal safety limits.";
  } else {
      maxSafeWeightStatus = 'bad';
      safeWeightDesc = "The drone weight exceeds the maximum safe constraints!";
  }
  
  // --- Approximation Analysis Section ---
  const approximations = [];
  if (testBatteryS !== batteryS) {
    approximations.push("The motor test battery cell count is different from the user battery.");
  }
  if (testPropIn !== propIn) {
    approximations.push("The motor test propeller size is different from the user's propeller size.");
  }
  if (minKvStatus === 'irregular') {
    approximations.push(`The combination of a ${propIn}" prop on ${batteryS}S is highly irregular and falls completely outside of standard physics bounds for minimum KV expectations.`);
  }
  if (absMinCap === null) {
    approximations.push(`The combination of a ${roundedProp}" prop on ${batteryS}S falls outside standard capacitor sizing tables.`);
  }

  const approxContent = $("approximationsContent");
  const approxSection = $("approximationsSection");

  if (approximations.length === 0) {
    approxContent.innerHTML = "<p>No significant approximations were made.</p>";
  } else {
    approxContent.innerHTML = `
          <p style="margin-top: 0; margin-bottom: 8px;"><strong>The following factors require approximations that may substantially affect results:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            ${approximations.map(msg => `<li style="margin-bottom: 4px;">${msg}</li>`).join("")}
          </ul>
        `;
  }
  approxSection.classList.remove("hidden");

  // Format mapping modifications to support the new "irregular" state
  const getSymbol = (status) => status === 'ok' ? '✅' : status === 'warning' ? '⚠️' : status === 'irregular' ? '⁉️' : '❌';
  const getCssClass = (status) => status === 'ok' ? 'ok' : status === 'warning' ? 'warning' : status === 'irregular' ? 'irregular' : 'bad';
  
  const checks = [
    ["Battery/Motor Voltage Match", `${batteryS}S`, `Motor accepts ${motorMinS}S to ${motorMaxS}S`, isVoltageForMotorsOk ? 'ok' : 'bad'],
    ["Battery/ESC Voltage Match", `${batteryS}S`, `ESC accepts ${escMinS}S to ${escMaxS}S`, isEscVoltageOk ? 'ok' : 'bad'],
    ["Motor KV Aerodynamic Limit", `${kv} KV`, kvMessage, kvStatus],
    ["Minimum Motor KV Flight Floor", `${kv} KV`, minKvMessage, minKvStatus],
    ["Propulsion Utilization", `${fmt(propulsionUtilization * 100, 1)}%`, propulsionMessage, propulsionStatus],
    ["Thrust-to-Weight Ratio", `${fmt(twr, 1)} : 1`, getTwrMessage(twr, minTargetTwr, propulsionUtilization, yellowPropulsionLimit, redPropulsionLimit, performanceDesc), propulsionStatus],
    ["Weight vs Max Propulsion Utilization", `${fmt(maxWeightForMaxPropulsionUtilization, 0)} g`, [`The maximum possible weight for the minimum required thrust-to-weight ratio is ${maxWeight.toFixed(1)} g.`,
                                                            `The weight limit for ${Math.round(yellowPropulsionLimit * 100)}% utilization is ${fmt(maxWeightForMaxPropulsionUtilization, 0)} g.`,
                                                            `The drone's weight is ${fmt(weight, 0)} g`,
                                                            getWeightUtilizationMessage(propulsionUtilization, yellowPropulsionLimit, redPropulsionLimit)].join('<br>'), propulsionStatus],
    ["Max Safe Weight", `${fmt(trueMaxSafeWeight, 0)} g`,
                                                           [`The max safe weight is the maximum possible weight permitting at most ${Math.round(yellowPropulsionLimit * 100)}% propulsion utilization, and whose battery C rating allows a current 15% above that of the 2:1 Thrust-to-Weight ratio.`,
                                                            `The drone's weight is ${fmt(weight, 0)} g.`,
                                                            safeWeightDesc
                                                           ].join('<br>'), maxSafeWeightStatus],
    ["Battery C-rating check", `${fmt(minC,1)} / ${crate} C`, cDetail, cStatus],
    ["Target Operational RPM Check", hasAnyRpm ? `${fmt(targetRpm,0)} RPM` : "N/A", rpmMessage, rpmStatus],
    ["Peak current/motor", `${fmt(peakAmpsPerMotor,1)} A`, `${fmt(peakPowerPerMotor,0)} W peak at ${fmt(peakVoltagePerMotor,1)}V`, 'ok'],
    ["Total peak system current", `${fmt(totalPeakAmps,1)} A`, `${fmt(peakAmpsPerMotor,1)} A × ${motors}`, 'ok'],
    ["ESC burst capability", `${fmt(peakAmpsPerMotor,1)} / ${fmt(escBurst,0)} A`, 
                                            [`Peak ${fmt(peakAmpsPerMotor,1)} A causes ${fmt(excessHeatRate,1)}% excess heat`,
                                             `(Warning > ${fmt(yellowExcessHeatRate, 1)}%) (Critical > ${fmt(redExcessHeatRate, 1)}%)`].join('<br>'), excessHeatRateStatus],
    ["ESC continuous utilization", `${fmt(requiredContinuousAmpsPerMotor, 1)} / ${fmt(esc,0)} A`,
                                            [`Requires ${fmt(requiredContinuousAmpsPerMotor, 1)} A for maintaining the target thrust-to-weight ratio of ${minTargetTwr.toFixed(1)} : 1`,
                                             `This is ${fmt(escUtilizationPct, 1)}% of the ESC continuous rating of ${fmt(esc,0)} A`,
                                             `(Warning > ${fmt((yellowContinuousAmps/ esc) * 100, 1)}%) (Critical > ${fmt((redContinuousAmps/ esc) * 100, 1)}%)`].join('<br>'), continuousAmpsStatus],
    ["Capacitor Voltage Margin", `${capVoltage} V`, capVoltageDetail, capVoltageStatus],
    ["Capacitance Rating", `${totalCapacitance} µF`, capAmountDetail, capAmountStatus]
  ];

  $("resultList").innerHTML = checks.map(([metric, value, detail, status]) => `
    <div class="result">
      <div class="metric">${getSymbol(status)} ${metric}</div>
      <div class="value">${value}</div>
      <div class="status ${getCssClass(status)}">${detail} — ${status.toUpperCase()}</div>
    </div>`).join("");

  const hasWarnings = checks.some(c => c[3] === 'warning' || c[3] === 'irregular');
  const hasErrors = checks.some(c => c[3] === 'bad');
  
  $("overall").textContent = hasErrors ? "SETUP NEEDS ATTENTION" : hasWarnings ? "SETUP HAS WARNINGS" : "SETUP APPEARS OK";
  $("overall").className = `overall ${hasErrors ? 'badbg' : hasWarnings ? 'warnbg' : 'okbg'}`;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
}

$("check").addEventListener("click", check);