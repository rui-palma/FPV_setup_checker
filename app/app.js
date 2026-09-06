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

  const peakAmpsPerMotorFromTest = Number(peakRow.querySelector('.row-current').value);
  const peakVoltagePerMotorFromTest = Number(peakRow.querySelector('.row-voltage').value);
  const peakThrustPerMotorFromTest = Number(peakRow.querySelector('.row-thrust').value);
  const peakLoadedRPMFromTest = Number(peakRow.querySelector('.row-rpm').value);
  
  const values=[weight, motors, propIn, kv, batteryS, capacity, crate, esc, escBurst, escMinS, escMaxS, motorMinS, motorMaxS, testBatteryS, peakAmpsPerMotorFromTest, peakVoltagePerMotorFromTest, peakThrustPerMotorFromTest];
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
  const peakAmpsPerMotor = peakAmpsPerMotorFromTest * Math.pow(voltageRatio, 2);
  const peakThrustPerMotor = peakThrustPerMotorFromTest * Math.pow(voltageRatio, 2);
  const peakVoltagePerMotor = peakVoltagePerMotorFromTest * voltageRatio;
  const peakLoadedRPM = peakLoadedRPMFromTest * voltageRatio;
  const peakPowerPerMotor = peakAmpsPerMotor * peakVoltagePerMotor;
  
  // "total" means it accounts for all motors
  const totalPeakThrust = peakThrustPerMotor * motors;
  const totalAmps = peakAmpsPerMotor * motors;

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
  
  const twr = totalPeakThrust / weight;
  const maxRecommendedWeight = totalPeakThrust / minTargetTwr;
  const requiredThrustPerMotor = weight * minTargetTwr / motors;
  
  const propulsionUtilization = peakThrustPerMotor > 0 ? requiredThrustPerMotor / peakThrustPerMotor : 1.0;
  const redPropulsionLimit = 0.9; // 90% of peak thrust
  let propulsionStatus = 'ok';
  if (propulsionUtilization >= redPropulsionLimit) {
      propulsionStatus = 'bad'
  }
  else if (propulsionUtilization > propulsionUtilizationLimit) {
      propulsionStatus = 'warn'
  }
  const isWeightOk = twr * propulsionUtilization >= minTargetTwr && propulsionStatus !== 'bad';

  
  const rawRequiredAmps = getInterpolatedValue(requiredThrustPerMotor, testData, 'current');
  const requiredContinuousAmps = Math.min(rawRequiredAmps, peakAmpsPerMotor);
  
  const targetRpm = getInterpolatedValue(requiredThrustPerMotor, testData, 'rpm');
  // RPM safety margin derived from propulsion utilization (square root relation: RPM proportional to sqrt of thrust)
  const rpmGreenLimitFactor = Math.sqrt(propulsionUtilizationLimit);
  const rpmRedLimitFactor = Math.sqrt(redPropulsionLimit);
  const maxAllowedRpmLimit = rpmRedLimitFactor * peakLoadedRPM;
  let rpmStatus = 'ok';
  if (targetRpm >= rpmRedLimitFactor * peakLoadedRPM) {
      rpmStatus = 'bad'
  }
  else if (targetRpm > rpmGreenLimitFactor * peakLoadedRPM) {
      rpmStatus = 'warn'
  }
  const isTargetRpmOk = rpmStatus !== 'bad';

  const maxSafeContinuousAmps = esc * escUtilizationLimit;
  const isContinuousOk = requiredContinuousAmps <= maxSafeContinuousAmps;
  const escUtilizationPct = (requiredContinuousAmps / esc) * 100;

  let performanceDesc = "Optimal";
  if (twr > 6.0) performanceDesc = "Very agile";
  else if (twr > 4.0) performanceDesc = "Agile";
  else if (twr > 2 / propulsionUtilizationLimit) performanceDesc = "Reasonable";
  else if (twr >= 2) performanceDesc = "Heavy, becoming underpowered";
  else performanceDesc = "Underpowered (Too Heavy)";

  const minC = totalAmps / capacity;
  const burstOverload = peakAmpsPerMotor / escBurst;
  const excessHeatRate = burstOverload > 1 ? (Math.pow(burstOverload, 2) - 1) * 100 : 0;
  
  const getSymbol = (status) => status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  const getCssClass = (status) => status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'bad';
  
  const checks = [
    ["Battery/Motor Voltage Match", `${batteryS}S`, `Motor accepts ${motorMinS}S to ${motorMaxS}S`, isVoltageForMotorsOk ? 'ok' : 'bad'],
    ["Battery/ESC Voltage Match", `${batteryS}S`, `ESC accepts ${escMinS}S to ${escMaxS}S`, isEscVoltageOk ? 'ok' : 'bad'],
    ["Propulsion Utilization", `${fmt(propulsionUtilization * 100, 1)}%`, `(Yellow > ${Math.round(propulsionUtilizationLimit * 100)}%, Red > ${Math.round(redPropulsionLimit * 100)}%)`, propulsionStatus],
    ["Thrust-to-Weight Ratio", `${fmt(twr,1)} : 1`, `Target ≥ ${minTargetTwr.toFixed(1)} — ${performanceDesc}`, propulsionStatus],
    ["Max Safe Weight (AUW)", `${fmt(maxRecommendedWeight, 0)} g`, `Ceiling for TWR ≥ ${minTargetTwr.toFixed(1)} : 1 (Your build: ${fmt(weight, 0)} g)`, propulsionStatus],
    ["Target Operational RPM Check", `${fmt(targetRpm,0)} RPM`, `(Yellow > ${fmt(rpmGreenLimitFactor * peakLoadedRPM, 0)}) (Red > ${fmt(rpmRedLimitFactor * peakLoadedRPM, 0)})`, rpmStatus],
    ["Peak current/motor", `${fmt(peakAmpsPerMotor,1)} A`, `${fmt(peakPowerPerMotor,0)} W peak at scaled ${fmt(peakVoltagePerMotor,1)}V`, 'ok'],
    ["Total peak system current", `${fmt(totalAmps,1)} A`, `${fmt(peakAmpsPerMotor,1)} A × ${motors}`, 'ok'],
    ["ESC burst capability", `${fmt(escBurst,0)} A`, `Peak ${fmt(peakAmpsPerMotor,1)} A causes ${fmt(excessHeatRate,1)}% excess heat (limit ≤ 10%)`, excessHeatRate <= 10 ? 'ok' : 'bad'],
    ["ESC continuous capability", `${fmt(esc,0)} A`, `Requires ${fmt(requiredContinuousAmps, 1)} A for TWR ${minTargetTwr.toFixed(1)} : 1`, isContinuousOk ? 'ok' : 'bad'],
    ["ESC continuous utilization", `${fmt(escUtilizationPct, 1)}%`, `Current usage is at ${fmt(escUtilizationPct, 1)}% of continuous rating`, isContinuousOk ? 'ok' : 'bad'],
    ["Battery minimum C-rating", `${fmt(minC,1)} C`, "Total amps ÷ capacity", crate >= minC ? 'ok' : 'bad']
  ];

  $("resultList").innerHTML = checks.map(([metric, value, detail, status]) => `
    <div class="result">
      <div class="metric">${getSymbol(status)} ${metric}</div>
      <div class="value">${value}</div>
      <div class="status ${getCssClass(status)}">${detail} — ${status.toUpperCase()}</div>
    </div>`).join("");

  const allOk = checks.every(c => c[3] === 'ok');
  const hasWarnings = checks.some(c => c[3] === 'warn');
  const hasErrors = checks.some(c => c[3] === 'bad');
  
  $("overall").textContent = hasErrors ? "SETUP NEEDS ATTENTION" : hasWarnings ? "SETUP HAS WARNINGS" : "SETUP APPEARS OK";
  $("overall").className = `overall ${hasErrors ? 'badbg' : hasWarnings ? 'warnbg' : 'okbg'}`;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
}

$("check").addEventListener("click", check);