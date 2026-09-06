const $ = id => document.getElementById(id);
const n = id => Number($(id).value);

function fmt(x, digits=1){ return Number.isFinite(x) ? x.toLocaleString(undefined,{maximumFractionDigits:digits}) : "—"; }

let isRpmOverride = false;

// Function to calculate max RPM smoothly across different materials/sizes
function getAutoRpmLimit(propSize) {
  let constant;
  if (propSize <= 7) {
    constant = 150000;
  } else if (propSize >= 10) {
    constant = 165000;
  } else {
    const t = (propSize - 7) / (10 - 7);
    constant = 150000 + (t * (165000 - 150000));
  }
  return Math.round(constant / propSize);
}

// Function to determine realistic full-throttle system efficiency (gf/W) based on prop size
function getEfficiencyFactor(propSize) {
  if (propSize <= 5) return 3.3;
  if (propSize >= 10) return 3.4; // Heavy-lift full-throttle baseline
  const t = (propSize - 5) / (10 - 5);
  return Number((3.3 + (t * (3.4 - 3.3))).toFixed(1));
}

// Function to update the RPM limit and efficiency UI fields
function updateRpmLimitUI() {
  const propSize = Number($("propDiameter").value);
  if (propSize > 0) {
    if (!isRpmOverride && $("rpmLimit")) {
      $("rpmLimit").value = getAutoRpmLimit(propSize);
    }
    if ($("gramsPerWatt")) {
      $("gramsPerWatt").value = getEfficiencyFactor(propSize);
    }
  }
}

// Calculate the actual voltage under load
function getSaggedVoltage() {
  const v = Number($("voltage").value);
  const sag = Number($("voltageSag").value) / 100;
  return v > 0 ? v * (1 - sag) : 0;
}

// --- Row Management for Test Data ---
$("addRowBtn").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "test-row";
  
  // Use a fixed 40px width for the final column to perfectly match the header
  row.style.display = "grid";
  row.style.gridTemplateColumns = "repeat(4, 1fr) 40px";
  row.style.gap = "10px";
  row.style.marginBottom = "10px";
  row.style.alignItems = "center";
  
  row.innerHTML = `
    <input type="number" class="row-throttle" min="0" max="99" step="1" style="text-align: center;">
    <input type="number" class="row-thrust" min="0" step="1" style="text-align: center;">
    <input type="number" class="row-current" min="0" step="0.1" style="text-align: center;">
    <input type="number" class="row-voltage" min="0" step="0.1" style="text-align: center;">
    <button type="button" class="icon-btn remove-row" title="Remove row">🗑️</button>
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

// Event Listeners
$("propDiameter").addEventListener("input", updateRpmLimitUI);

// Handle the override toggle button
$("toggleOverride").addEventListener("click", () => {
  isRpmOverride = !isRpmOverride;
  const input = $("rpmLimit");
  const btn = $("toggleOverride");

  if (isRpmOverride) {
    input.removeAttribute("readonly");
    btn.textContent = "🔄";
    btn.title = "Reset to auto-calculated limit";
    input.focus();
  } else {
    input.setAttribute("readonly", true);
    btn.textContent = "✏️";
    btn.title = "Override default limit";
    updateRpmLimitUI(); 
  }
});

updateRpmLimitUI();

// Function to linearly interpolate/extrapolate current based on target thrust
function getInterpolatedCurrent(targetThrust, dataPoints) {
  if (targetThrust <= 0) return 0;
  if (dataPoints.length < 2) return 0;

  for (let i = 0; i < dataPoints.length - 1; i++) {
    const p1 = dataPoints[i];
    const p2 = dataPoints[i + 1];
    if (targetThrust >= p1.thrust && targetThrust <= p2.thrust) {
      const fraction = (targetThrust - p1.thrust) / (p2.thrust - p1.thrust);
      return p1.current + fraction * (p2.current - p1.current);
    }
  }
  
  // Extrapolate if the target thrust exceeds the highest tested value
  const p1 = dataPoints[dataPoints.length - 2];
  const p2 = dataPoints[dataPoints.length - 1];
  const fraction = (targetThrust - p1.thrust) / (p2.thrust - p1.thrust);
  return p1.current + fraction * (p2.current - p1.current);
}

// --- Save and Load Setup ---
$("exportBtn").addEventListener("click", () => {
  const config = {
    drone: {
      weight: n("weight"),
      motors: n("motors")
    },
    propeller: {
      propDiameter: n("propDiameter"),
      rpmLimit: n("rpmLimit")
    },
    motor: {
      kv: n("kv"),
      voltageSag: n("voltageSag"),
      motorMinS: n("motorMinS"),
      motorMaxS: n("motorMaxS")
    },
    battery: {
      batteryS: n("batteryS"),
      capacity: n("capacity"),
      crate: n("crate")
    },
    esc: {
      esc: n("esc"),
      escBurst: n("escBurst")
    },
    testRows: []
  };

  document.querySelectorAll('.test-row').forEach(row => {
    config.testRows.push({
      mandatory: row.dataset.mandatory === "true",
      throttle: Number(row.querySelector('.row-throttle').value) || 0,
      thrust: Number(row.querySelector('.row-thrust').value) || 0,
      current: Number(row.querySelector('.row-current').value) || 0,
      voltage: Number(row.querySelector('.row-voltage').value) || 0
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
      }
      if (config.propeller) {
        $("propDiameter").value = config.propeller.propDiameter ?? "";
        $("rpmLimit").value = config.propeller.rpmLimit ?? "";
        updateRpmLimitUI();
      }
      if (config.motor) {
        $("kv").value = config.motor.kv ?? "";
        $("voltageSag").value = config.motor.voltageSag ?? "";
        $("motorMinS").value = config.motor.motorMinS ?? "";
        $("motorMaxS").value = config.motor.motorMaxS ?? "";
      }
      if (config.battery) {
        $("batteryS").value = config.battery.batteryS ?? "";
        $("capacity").value = config.battery.capacity ?? "";
        $("crate").value = config.battery.crate ?? "";
      }
      if (config.esc) {
        $("esc").value = config.esc.esc ?? "";
        $("escBurst").value = config.esc.escBurst ?? "";
      }

      if (Array.isArray(config.testRows) && config.testRows.length > 0) {
        const container = $("testDataRows");
        container.innerHTML = ""; 

        config.testRows.forEach(rowData => {
          const row = document.createElement("div");
          row.className = "test-row";
          if (rowData.mandatory) row.dataset.mandatory = "true";

          row.style.display = "grid";
          row.style.gridTemplateColumns = "repeat(4, 1fr) 40px";
          row.style.gap = "10px";
          row.style.marginBottom = "10px";
          row.style.alignItems = "center";

          if (rowData.mandatory) {
            row.innerHTML = `
              <input type="number" class="row-throttle" value="${rowData.throttle}" readonly style="text-align: center;">
              <input type="number" class="row-thrust" min="0" step="1" value="${rowData.thrust}" style="text-align: center;">
              <input type="number" class="row-current" min="0" step="0.1" value="${rowData.current}" style="text-align: center;">
              <input type="number" class="row-voltage" min="0" step="0.1" value="${rowData.voltage}" style="text-align: center;">
              <button type="button" class="icon-btn" style="visibility: hidden;" aria-hidden="true">🗑️</button>
            `;
          } else {
            row.innerHTML = `
              <input type="number" class="row-throttle" min="0" max="99" step="1" value="${rowData.throttle}" style="text-align: center;">
              <input type="number" class="row-thrust" min="0" step="1" value="${rowData.thrust}" style="text-align: center;">
              <input type="number" class="row-current" min="0" step="0.1" value="${rowData.current}" style="text-align: center;">
              <input type="number" class="row-voltage" min="0" step="0.1" value="${rowData.voltage}" style="text-align: center;">
              <button type="button" class="icon-btn remove-row" title="Remove row">🗑️</button>
            `;
            row.querySelector(".remove-row").addEventListener("click", () => row.remove());
          }
          container.appendChild(row);
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


function check(){
  const kv=n("kv"), capacity=n("capacity"), crate=n("crate");
  const esc=n("esc"), escBurst=n("escBurst");
  const propIn=n("propDiameter"), weight=n("weight"), motors=n("motors"), rpmLimit=n("rpmLimit");
  const sag = n("voltageSag");
  const batteryS = n("batteryS"), motorMinS = n("motorMinS"), motorMaxS = n("motorMaxS");
  
  const peakRow = document.querySelector('.test-row[data-mandatory="true"]') || document.querySelector('.test-row');
  if (!peakRow) {
    alert("Please ensure the motor test data table is properly loaded.");
    return;
  }

  const rawMotorAmps = Number(peakRow.querySelector('.row-current').value);
  const rawTestVoltage = Number(peakRow.querySelector('.row-voltage').value);
  
  const values=[weight, motors, propIn, rpmLimit, kv, batteryS, capacity, crate, esc, escBurst, motorMinS, motorMaxS, rawMotorAmps, rawTestVoltage];
  if(values.some(v=>!Number.isFinite(v)||v<=0)){ 
    alert("Please enter positive values in all fields, including the test data rows."); 
    return; 
  }
  
  if(escBurst < esc) { 
    alert("The ESC's peak burst rating must be greater than or equal to its continuous rating."); 
    return; 
  }

  const isVoltageOk = batteryS >= motorMinS && batteryS <= motorMaxS;
  
  // Calculate Target Voltages (using 3.7V nominal per cell)
  const nominalBatteryVoltage = batteryS * 3.7;
  const saggedVoltage = nominalBatteryVoltage * (1 - sag / 100);

  // Scale Peak Values based on V^2 relation
  const peakVRatio = saggedVoltage / rawTestVoltage;
  const scaledMotorAmps = rawMotorAmps * Math.pow(peakVRatio, 2);
  const scaledPower = scaledMotorAmps * saggedVoltage;

  // Extract and Scale all test data rows for interpolation
  const testData = [{ thrust: 0, current: 0 }]; 
  document.querySelectorAll('.test-row').forEach(row => {
    const rawThrust = Number(row.querySelector('.row-thrust').value);
    const rawCurrent = Number(row.querySelector('.row-current').value);
    const rawVolt = Number(row.querySelector('.row-voltage').value);
    
    if (rawThrust > 0 && rawCurrent > 0 && rawVolt > 0) {
      const vRatio = saggedVoltage / rawVolt;
      testData.push({ 
        thrust: rawThrust * Math.pow(vRatio, 2), 
        current: rawCurrent * Math.pow(vRatio, 2) 
      });
    }
  });
  testData.sort((a, b) => a.thrust - b.thrust);
   
  // Derived calculations
  const totalPower = scaledPower * motors;
  const totalAmps = scaledMotorAmps * motors;
  const loadedRpm = saggedVoltage * kv * 0.85;
  const efficiencyFactor = getEfficiencyFactor(propIn);
  const estimatedTotalThrust = totalPower * efficiencyFactor;
  const twr = estimatedTotalThrust / weight;
  
  const minTargetTwr = propIn >= 10 ? 2.0 : 3.0;
  const maxRecommendedWeight = estimatedTotalThrust / minTargetTwr;
  const isWeightOk = twr >= minTargetTwr;

  // Continuous current interpolation using scaled data
  const requiredThrustPerMotor = (weight * minTargetTwr) / motors;
  const requiredContinuousAmps = getInterpolatedCurrent(requiredThrustPerMotor, testData);
  const continuousRatio = requiredContinuousAmps / esc;
  const isContinuousOk = continuousRatio <= 1.0;

  let performanceDesc = "Optimal";
  if (!isWeightOk) performanceDesc = "Underpowered (Too Heavy)";
  else if (twr > 6.0) performanceDesc = "Very agile";
  else if (twr > 4.0) performanceDesc = "Agile";
  else performanceDesc = "Reasonable";

  const minC = totalAmps / capacity;
  
  const burstOverload = scaledMotorAmps / escBurst;
  const excessHeatRate = burstOverload > 1 ? (Math.pow(burstOverload, 2) - 1) * 100 : 0;
  
  const checks=[
    ["Battery/Motor Voltage Match", `${batteryS}S`, `Motor accepts ${motorMinS}S to ${motorMaxS}S`, isVoltageOk],
    ["Thrust-to-Weight Ratio", `${fmt(twr,1)} : 1`, `Target ≥ ${minTargetTwr.toFixed(1)} : 1 — ${performanceDesc}`, isWeightOk],
    ["Max Safe Weight (AUW)", `${fmt(maxRecommendedWeight, 0)} g`, `Ceiling for TWR ≥ ${minTargetTwr.toFixed(1)} : 1 (Your build: ${fmt(weight, 0)} g)`, isWeightOk],
    ["Estimated loaded RPM", `${fmt(loadedRpm,0)} RPM`, `Limit ≤ ${fmt(rpmLimit,0)} RPM (${fmt(saggedVoltage,1)}V × ${kv}KV × 0.85)`, loadedRpm <= rpmLimit],
    ["Scaled peak current/motor", `${fmt(scaledMotorAmps,1)} A`, `${fmt(scaledPower,0)} W test peak (adjusted to ${fmt(saggedVoltage,1)}V)`, true],
    ["Total peak system current", `${fmt(totalAmps,1)} A`, `${fmt(scaledMotorAmps,1)} A × ${motors}`, true],
    ["ESC burst capability", `${fmt(escBurst,0)} A`, `Peak ${fmt(scaledMotorAmps,1)} A causes ${fmt(excessHeatRate,1)}% excess heat (limit ≤ 10%)`, excessHeatRate <= 10],
    ["ESC continuous capability", `${fmt(esc,0)} A`, `Requires ${fmt(requiredContinuousAmps, 1)} A for TWR ${minTargetTwr.toFixed(1)} : 1 (${fmt(requiredThrustPerMotor, 0)} gf/motor)`, isContinuousOk],
    ["Battery minimum C-rating", `${fmt(minC,1)} C`, "Total amps ÷ capacity", crate >= minC]
  ];

  $("resultList").innerHTML=checks.map(([metric,value,detail,ok])=>`
    <div class="result">
      <div class="metric">${ok?"✅":"❌"} ${metric}</div>
      <div class="value">${value}</div>
      <div class="status ${ok?"ok":"bad"}">${detail} — ${ok?"OK":"NOT OK"}</div>
    </div>`).join("");

  const allOk=checks.every(c=>c[3]);
  $("overall").textContent=allOk?"SETUP APPEARS OK":"SETUP NEEDS ATTENTION";
  $("overall").className=`overall ${allOk?"okbg":"badbg"}`;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
}

// Bind button (if not already bound elsewhere)
$("check").addEventListener("click", check);