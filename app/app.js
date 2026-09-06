const $ = id => document.getElementById(id);
const n = id => Number($(id).value);

function fmt(x, digits=1){ return Number.isFinite(x) ? x.toLocaleString(undefined,{maximumFractionDigits:digits}) : "—"; }

let isRpmOverride = false;


// --- Row Management for Test Data ---
$("addRowBtn").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "test-row";
  
  // Use a fixed 40px width for the final column to perfectly match the header
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
      testBatteryS: n("testBatteryS")
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
    testRows: []
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
  const esc=n("esc"), escBurst=n("escBurst"), escMinS=n("escMinS"), escMaxS=n("escMaxS");
  const escUtilizationLimit = n("escUtilizationLimit") / 100;
  const propulsionUtilizationLimit = n("propulsionUtilizationLimit") / 100;
  const minTargetTwr = n("minTargetTwr");
  const propIn=n("propDiameter"), weight=n("weight"), motors=n("motors");
  const batteryS = n("batteryS"), motorMinS = n("motorMinS"), motorMaxS = n("motorMaxS");
  const testBatteryS = n("testBatteryS");
  
  const peakRow = document.querySelector('.test-row[data-mandatory="true"]') || document.querySelector('.test-row');
  if (!peakRow) {
    alert("Please ensure the motor test data table is properly loaded.");
    return;
  }

  const rawMotorAmps = Number(peakRow.querySelector('.row-current').value);
  const rawTestVoltage = Number(peakRow.querySelector('.row-voltage').value);
  const rawPeakThrust = Number(peakRow.querySelector('.row-thrust').value);
  
  const values=[weight, motors, propIn, kv, batteryS, capacity, crate, esc, escBurst, escMinS, escMaxS, motorMinS, motorMaxS, testBatteryS, rawMotorAmps, rawTestVoltage, rawPeakThrust];
  if(values.some(v=>!Number.isFinite(v)||v<=0)){ 
    alert("Please enter positive values in all fields, including the test data rows."); 
    return; 
  }
  
  if(escBurst < esc) { 
    alert("The ESC's peak burst rating must be greater than or equal to its continuous rating."); 
    return; 
  }

  const isVoltageForMotorsOk = batteryS >= motorMinS && batteryS <= motorMaxS;
  const isEscVoltageOk = batteryS >= escMinS && batteryS <= escMaxS;
  const voltageRatio = batteryS / testBatteryS;
  const scaledMotorAmps = rawMotorAmps * Math.pow(voltageRatio, 2);
  const scaledPeakThrust = rawPeakThrust * Math.pow(voltageRatio, 2);
  const estimatedTotalThrust = scaledPeakThrust * motors;
  const estimatedUserVoltage = rawTestVoltage * voltageRatio;
  const scaledPower = rawMotorAmps * rawTestVoltage;

  const testData = [{ thrust: 0, current: 0, rpm: 0 }]; 
  document.querySelectorAll('.test-row').forEach(row => {
    const rawThrust = Number(row.querySelector('.row-thrust').value);
    const rawCurrent = Number(row.querySelector('.row-current').value);
    const rawRpm = Number(row.querySelector('.row-rpm').value) || 0;
    
    if (rawThrust > 0 && rawCurrent > 0) {
      testData.push({ 
        thrust: rawThrust * Math.pow(voltageRatio, 2), 
        current: rawCurrent * Math.pow(voltageRatio, 2),
        rpm: rawRpm * voltageRatio
      });
    }
  });
  testData.sort((a, b) => a.thrust - b.thrust);
  
  const totalPower = scaledPower * motors;
  const totalAmps = scaledMotorAmps * motors;
  const maxNoLoadRpm = estimatedUserVoltage * kv;
  const estimatedLoadedRpm = maxNoLoadRpm * 0.85;
  
  const twr = estimatedTotalThrust / weight;
  const targetThrust = weight * minTargetTwr;
  const maxRecommendedWeight = estimatedTotalThrust / minTargetTwr;
  
  const propulsionUtilization = estimatedTotalThrust > 0 ? targetThrust / estimatedTotalThrust : 1.0;
  const isPropulsionUtilizationOk = propulsionUtilization <= propulsionUtilizationLimit;
  const isWeightOk = twr >= minTargetTwr && isPropulsionUtilizationOk;

  const requiredThrustPerMotor = targetThrust / motors;
  const rawRequiredAmps = getInterpolatedCurrent(requiredThrustPerMotor, testData);
  const requiredContinuousAmps = Math.min(rawRequiredAmps, scaledMotorAmps);
  
  const maxSafeContinuousAmps = esc * escUtilizationLimit;
  const isContinuousOk = requiredContinuousAmps <= maxSafeContinuousAmps;
  const escUtilizationPct = (requiredContinuousAmps / esc) * 100;

  let performanceDesc = "Optimal";
  if (!isWeightOk) performanceDesc = "Underpowered (Too Heavy)";
  else if (twr > 6.0) performanceDesc = "Very agile";
  else if (twr > 4.0) performanceDesc = "Agile";
  else performanceDesc = "Reasonable";

  const minC = totalAmps / capacity;
  const burstOverload = scaledMotorAmps / escBurst;
  const excessHeatRate = burstOverload > 1 ? (Math.pow(burstOverload, 2) - 1) * 100 : 0;
  
  const checks=[
    ["Battery/Motor Voltage Match", `${batteryS}S`, `Motor accepts ${motorMinS}S to ${motorMaxS}S`, isVoltageForMotorsOk],
    ["Battery/ESC Voltage Match", `${batteryS}S`, `ESC accepts ${escMinS}S to ${escMaxS}S`, isEscVoltageOk],
    ["Propulsion Utilization", `${fmt(propulsionUtilization * 100, 1)}%`, `Target thrust (${fmt(targetThrust, 0)} gf) vs max available (${fmt(estimatedTotalThrust, 0)} gf) — limit ≤ ${Math.round(propulsionUtilizationLimit * 100)}%`, isPropulsionUtilizationOk],
    ["Thrust-to-Weight Ratio", `${fmt(twr,1)} : 1`, `Target ≥ ${minTargetTwr.toFixed(1)} : 1 — ${performanceDesc}`, isWeightOk],
    ["Max Safe Weight (AUW)", `${fmt(maxRecommendedWeight, 0)} g`, `Ceiling for TWR ≥ ${minTargetTwr.toFixed(1)} : 1 (Your build: ${fmt(weight, 0)} g)`, isWeightOk],
    ["Estimated Loaded RPM", `${fmt(estimatedLoadedRpm,0)} RPM`, `Approximate operational speed under load (~85% of no-load)`, true],
    ["Peak current/motor", `${fmt(scaledMotorAmps,1)} A`, `${fmt(scaledPower,0)} W peak at scaled ${fmt(estimatedUserVoltage,1)}V`, true],
    ["Total peak system current", `${fmt(totalAmps,1)} A`, `${fmt(scaledMotorAmps,1)} A × ${motors}`, true],
    ["ESC burst capability", `${fmt(escBurst,0)} A`, `Peak ${fmt(scaledMotorAmps,1)} A causes ${fmt(excessHeatRate,1)}% excess heat (limit ≤ 10%)`, excessHeatRate <= 10],
    ["ESC continuous capability", `${fmt(esc,0)} A`, `Requires ${fmt(requiredContinuousAmps, 1)} A for TWR ${minTargetTwr.toFixed(1)} : 1 (${fmt(requiredThrustPerMotor, 0)} gf/motor)`, isContinuousOk],
    ["ESC continuous utilization", `${fmt(escUtilizationPct, 1)}%`, `Current usage is at ${fmt(escUtilizationPct, 1)}% of continuous rating (limit ≤ ${Math.round(escUtilizationLimit * 100)}%)`, isContinuousOk],
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