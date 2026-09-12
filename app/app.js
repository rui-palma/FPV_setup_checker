const $ = id => document.getElementById(id);
const n = id => Number($(id).value);

function fmt(x, digits=1){ return Number.isFinite(x) ? x.toLocaleString(undefined,{maximumFractionDigits:digits}) : "—"; }

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


// Generic function to linearly interpolate/extrapolate any property based on target thrust
function getInterpolatedValue(targetThrust, dataPoints, property) {
  if (targetThrust <= 0) return 0;
  if (dataPoints.length < 2) return 0;

  for (let i = 0; i < dataPoints.length - 1; i++) {
    const p1 = dataPoints[i];
    const p2 = dataPoints[i + 1];
    if (targetThrust >= p1.thrust && targetThrust <= p2.thrust) {
      const fraction = (targetThrust - p1.thrust) / (p2.thrust - p1.thrust);
      return p1[property] + fraction * (p2[property] - p1[property]);
    }
  }
  
  const p1 = dataPoints[dataPoints.length - 2];
  const p2 = dataPoints[dataPoints.length - 1];
  const fraction = (targetThrust - p1.thrust) / (p2.thrust - p1.thrust);
  return p1[property] + fraction * (p2[property] - p1[property]);
}

const maxPlausibleRpmByPropDiameter = {
    2: 90000,
    3: 40000,
    4: 35000,
    5: 33000,
    6: 32500,
    7: 25500,
    8: 21500,
    9: 18000,
    10: 16000,
    11: 14500,
    12: 13500,
    13: 13000,
    14: 10500,
    15: 10000,
    16: 9000,
    17: 8500,
    18: 7500,
    19: 7000,
    20: 6500
};

function interpolatePropRpmLimit(diameter) {
    const keys = Object.keys(maxPlausibleRpmByPropDiameter).map(Number).sort((a, b) => a - b);
    if (diameter <= keys[0]) return maxPlausibleRpmByPropDiameter[keys[0]];
    if (diameter >= keys[keys.length - 1]) return maxPlausibleRpmByPropDiameter[keys[keys.length - 1]];

    for (let i = 0; i < keys.length - 1; i++) {
        const k1 = keys[i];
        const k2 = keys[i + 1];
        if (diameter >= k1 && diameter <= k2) {
            const v1 = maxPlausibleRpmByPropDiameter[k1];
            const v2 = maxPlausibleRpmByPropDiameter[k2];
            const fraction = (diameter - k1) / (k2 - k1);
            return v1 + fraction * (v2 - v1);
        }
    }
    return 10000;
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
    config.testRows.push({
      mandatory: row.dataset.mandatory === "true",
      throttle: Number(row.querySelector('.row-throttle').value) || 0,
      thrust: Number(row.querySelector('.row-thrust').value) || 0,
      current: Number(row.querySelector('.row-current').value) || 0,
      voltage: Number(row.querySelector('.row-voltage').value) || 0,
      rpm: Number(row.querySelector('.row-rpm').value) || 0
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
      
      alert("Setup loaded successfully!");
    } catch (err) {
      alert("Failed to parse the configuration file. Please ensure it is a valid JSON file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  event.target.value = ""; 
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

function getWeightMessage(utilization, yellowLimit, redLimit) {
  const yellowPct = Math.round(yellowLimit * 100);
  const redPct = Math.round(redLimit * 100);

  if (utilization >= redLimit) {
    return `The drone's weight is too close to the absolute maximum (above ${redPct}%)`;
  }
  if (utilization >= yellowLimit) {
    return `The drone's weight is close to the absolute maximum (above ${yellowLimit}%)`;
  }
  return `The drone's weight is comfortably below the absolute maximum`;
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
  
  const rawRows = Array.from(document.querySelectorAll('.test-row')).map(row => ({
    throttle: Number(row.querySelector('.row-throttle').value) || 0,
    thrust: Number(row.querySelector('.row-thrust').value) || 0,
    current: Number(row.querySelector('.row-current').value) || 0,
    voltage: Number(row.querySelector('.row-voltage').value) || 0,
    rpm: Number(row.querySelector('.row-rpm').value) || 0
  }));

  if (rawRows.some(r => r.throttle > 100)) {
    alert("Throttle levels cannot exceed 100%.");
    return;
  }
  
  rawRows.sort((a, b) => a.throttle - b.throttle);
  
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
  const testPropDiameterMeters = testPropIn * 0.0254;
  const airDensity = 1.225;
  const MAX_PLAUSIBLE_STATIC_CT = 0.30; 
  
  for (const row of rawRows) {
    if (row.voltage > 0) { 
      if (row.voltage < expectedMinVoltage || row.voltage > expectedMaxVoltage) {
        alert(`Data error: The test voltage (${row.voltage}V) at ${row.throttle}% throttle does not match a ${testBatteryS}S battery.`);
        return;
      }
    }
    
    const effectiveVoltage = row.voltage > 0 ? row.voltage : (testBatteryS * 3.7);
    const kvLimit = kv * effectiveVoltage;
    const propLimit = interpolatePropRpmLimit(testPropIn);
    const rpmMargin = 1.15;
    const hardRpmLimit = Math.min(kvLimit, propLimit * rpmMargin);

    if (row.rpm > hardRpmLimit && row.rpm > 0) {
      alert(`Data error: Entered RPM (${row.rpm}) exceeds maximum empirical limit (${hardRpmLimit.toFixed(0)} RPM).`);
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

  const peakLoadedRPM = peakLoadedRPMFromTest * voltageRatio * rpmSlipFactor;
  const actualRpmRatio = peakLoadedRPM / peakLoadedRPMFromTest;

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
  
  const twr = totalPeakThrust / weight;
  const requiredThrustPerMotor = weight * minTargetTwr / motors;
  
  const yellowPropulsionLimit = propulsionUtilizationLimit;
  const redPropulsionLimit = 0.9;
  const yellowThrustPoint = peakThrustPerMotor * yellowPropulsionLimit;
  const redThrustPoint = peakThrustPerMotor * redPropulsionLimit;
  const yellowContinuousAmps = esc * escUtilizationLimit;
  const redContinuousAmps = esc * 0.90;
  const yellowExcessHeatRate = 0; 
  const redExcessHeatRate = 15; 

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

  const targetRpm = getInterpolatedValue(requiredThrustPerMotor, testData, 'rpm');
  const maxNoLoadRpm = kv * (batteryS * 4.2); 
  
  let rpmStatus = 'ok';
  let rpmMessage = `The required operational RPM is within physical constraints`;
  
  if (targetRpm > maxNoLoadRpm) {
      rpmStatus = 'bad';
      rpmMessage = `The required operational RPM is above the theoretical no-load maximum (${fmt(maxNoLoadRpm, 0)} RPM)`;
  } else if (targetRpm > maxNoLoadRpm * 0.9) {
      rpmStatus = 'bad';
      rpmMessage = `The required operational RPM is above 90% of the theoretical no-load maximum (${fmt(maxNoLoadRpm, 0)} RPM).This is practically impossible, and not empircally observed.`;
  } else if (targetRpm > maxNoLoadRpm * 0.8) {
    rpmStatus = 'warning';
    rpmMessage = `The required operational RPM is above 80% of the theoretical no-load maximum (${fmt(maxNoLoadRpm, 0)} RPM). This is extremely unusual.`;
  }
  
  const requiredAmpsPerMotor = getInterpolatedValue(requiredThrustPerMotor, testData, 'current');
  const requiredContinuousAmpsPerMotor = Math.min(requiredAmpsPerMotor, peakAmpsPerMotor);
  let continuousAmpsStatus = 'ok';
  if (requiredContinuousAmpsPerMotor >= redContinuousAmps) {
      continuousAmpsStatus = 'bad';
  } else if (requiredContinuousAmpsPerMotor > yellowContinuousAmps) {
      continuousAmpsStatus = 'warning';
  }
  const escUtilizationPct = (requiredContinuousAmpsPerMotor / esc) * 100;

  let performanceDesc = "Optimal";
  if (twr > 6.0) performanceDesc = "Very agile";
  else if (twr > 4.0) performanceDesc = "Agile";
  else if (twr > 2 / propulsionUtilizationLimit) performanceDesc = "Reasonable";
  else if (twr >= 2) performanceDesc = "Heavy, becoming underpowered";
  else performanceDesc = "Underpowered (Too Heavy)";

  const minC = totalPeakAmps / (capacity / 1000);
  const burstOverload = peakAmpsPerMotor / escBurst;
  const excessHeatRate = burstOverload > 1 ? (Math.pow(burstOverload, 2) - 1) * 100 : 0;
  let excessHeatRateStatus = 'ok';
  if (excessHeatRate >= redExcessHeatRate) {
      excessHeatRateStatus = 'bad';
  } else if (excessHeatRate > yellowExcessHeatRate) {
      excessHeatRateStatus = 'warning';
  }
  
  const yellowCrateLimit = 0.10; // 10% margin
  const redCrateLimit = 0.20;    // 20% margin
  const cRatio = minC / crate;
  let cStatus = 'ok';
  let cDetail = "";
  
  if (cRatio > (1 + redCrateLimit)) {
    cStatus = 'bad';
    cDetail = `Requires ${fmt(minC, 1)} C (exceeds ${crate} C rating by more than ${redCrateLimit * 100}%)`;
  } else if (cRatio > 1 || cRatio > (1 - yellowCrateLimit)) {
    cStatus = 'warning';
    cDetail = `Requires ${fmt(minC, 1)} C (rating is close to or exceeds limit; lacks recommended ${yellowCrateLimit * 100}% margin)`;
  } else {
    cDetail = `Requires ${fmt(minC, 1)} C (healthy safety margin)`;
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

  // 1. Voltage Check
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

  // 2. Capacitance Check
  const f_sw = 24000;
  const delta_T = 1 / f_sw; 
  const currentRipple = 0.22 * totalPeakAmps;
  const voltageRipple = 0.1 * maxBatVoltage;
  
  const minCapFarads = (currentRipple * delta_T) / voltageRipple;
  const minCapUF = minCapFarads * 1000000;

  let capAmountStatus = 'ok';
  let capAmountDetail = '';

  if (totalCapacitance < (minCapUF)) {
    capAmountStatus = 'bad';
    capAmountDetail = `Total capacitance is critically low (minimum: ${fmt(minCapUF, 0)} µF)`;
  } else if (totalCapacitance < (1.5 * minCapUF)) {
    capAmountStatus = 'warning';
    capAmountDetail = `Total capacitance is marginal (recommended > ${fmt(1.5 * minCapUF, 0)} µF) <br> Dangerously low if below ${fmt(minCapUF, 0)} µF `;
  } else {
    capAmountStatus = 'ok';
    capAmountDetail = `Total capacitance is sufficient <br> Recommended to be above ${fmt(1.5 * minCapUF, 0)} µF <br> Dangerously low if below ${fmt(0.5 * minCapUF, 0)} µF`;
  }
  
  const maxWeight = totalPeakThrust / minTargetTwr;
  const maxRecommendedWeight = maxWeight * yellowPropulsionLimit;
  
  // --- Approximation Analysis Section ---
  const approximations = [];
  if (testBatteryS !== batteryS) {
    approximations.push("The motor test battery cell count is different from the user battery.");
  }
  if (testPropIn !== propIn) {
    approximations.push("The motor test propeller size is different from the user's propeller size.");
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

  const getSymbol = (status) => status === 'ok' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  const getCssClass = (status) => status === 'ok' ? 'ok' : status === 'warning' ? 'warning' : 'bad';
  
  const checks = [
    ["Battery/Motor Voltage Match", `${batteryS}S`, `Motor accepts ${motorMinS}S to ${motorMaxS}S`, isVoltageForMotorsOk ? 'ok' : 'bad'],
    ["Battery/ESC Voltage Match", `${batteryS}S`, `ESC accepts ${escMinS}S to ${escMaxS}S`, isEscVoltageOk ? 'ok' : 'bad'],
    ["Propulsion Utilization", `${fmt(propulsionUtilization * 100, 1)}%`, propulsionMessage, propulsionStatus],
    ["Thrust-to-Weight Ratio", `${fmt(twr, 1)} : 1`, getTwrMessage(twr, minTargetTwr, propulsionUtilization, yellowPropulsionLimit, redPropulsionLimit, performanceDesc), propulsionStatus],
    ["Max Safe Weight", `${fmt(maxRecommendedWeight, 0)} g`, [`The maximum possible weight for the minimum required thrust-to-weight ratio is ${maxWeight.toFixed(1)} g.`,
                                                            `The max safe weight is ${fmt(maxRecommendedWeight, 0)} g, which is ${Math.round(yellowPropulsionLimit * 100)}% of the total max weight.`,
                                                            `The drone's weight is ${fmt(weight, 0)} g`,
                                                            getWeightMessage(propulsionUtilization, yellowPropulsionLimit, redPropulsionLimit)].join('<br>'), propulsionStatus],
    ["Target Operational RPM Check", `${fmt(targetRpm,0)} RPM`, rpmMessage, rpmStatus],
    ["Peak current/motor", `${fmt(peakAmpsPerMotor,1)} A`, `${fmt(peakPowerPerMotor,0)} W peak at ${fmt(peakVoltagePerMotor,1)}V`, 'ok'],
    ["Total peak system current", `${fmt(totalPeakAmps,1)} A`, `${fmt(peakAmpsPerMotor,1)} A × ${motors}`, 'ok'],
    ["ESC burst capability", `${fmt(peakAmpsPerMotor,1)} / ${fmt(escBurst,0)} A`, 
                                            [`Peak ${fmt(peakAmpsPerMotor,1)} A causes ${fmt(excessHeatRate,1)}% excess heat`,
                                             `(Yellow > ${fmt(yellowExcessHeatRate, 1)}%) (Red > ${fmt(redExcessHeatRate, 1)}%)`].join('<br>'), excessHeatRateStatus],
    ["ESC continuous utilization", `${fmt(requiredContinuousAmpsPerMotor, 1)} / ${fmt(esc,0)} A`,
                                            [`Requires ${fmt(requiredContinuousAmpsPerMotor, 1)} A for maintaining the target thrust-to-weight ratio of ${minTargetTwr.toFixed(1)} : 1`,
                                             `This is ${fmt(escUtilizationPct, 1)}% of the ESC continuous rating of ${fmt(esc,0)} A`,
                                             `(Yellow > ${fmt((yellowContinuousAmps/ esc) * 100, 1)}%) (Red > ${fmt((redContinuousAmps/ esc) * 100, 1)}%)`].join('<br>'), continuousAmpsStatus],
    ["Battery C-rating check", `${fmt(minC,1)} / ${crate} C`, cDetail, cStatus],
    ["Capacitor Voltage Margin", `${capVoltage} V`, capVoltageDetail, capVoltageStatus],
    ["Capacitance Rating", `${totalCapacitance} µF`, capAmountDetail, capAmountStatus]
  ];

  $("resultList").innerHTML = checks.map(([metric, value, detail, status]) => `
    <div class="result">
      <div class="metric">${getSymbol(status)} ${metric}</div>
      <div class="value">${value}</div>
      <div class="status ${getCssClass(status)}">${detail} — ${status.toUpperCase()}</div>
    </div>`).join("");

  const hasWarnings = checks.some(c => c[3] === 'warning');
  const hasErrors = checks.some(c => c[3] === 'bad');
  
  $("overall").textContent = hasErrors ? "SETUP NEEDS ATTENTION" : hasWarnings ? "SETUP HAS WARNINGS" : "SETUP APPEARS OK";
  $("overall").className = `overall ${hasErrors ? 'badbg' : hasWarnings ? 'warnbg' : 'okbg'}`;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
}

$("check").addEventListener("click", check);