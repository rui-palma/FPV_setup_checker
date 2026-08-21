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

// Sync Power (W) and Current (A) inputs based on Voltage
function syncPowerToAmps() {
  const v = Number($("voltage").value);
  const p = Number($("power").value);
  if (v > 0 && p > 0) {
    $("motorAmpsInput").value = (p / v).toFixed(1);
  }
}

function syncAmpsToPower() {
  const v = Number($("voltage").value);
  const a = Number($("motorAmpsInput").value);
  if (v > 0 && a > 0) {
    $("power").value = Math.round(a * v);
  }
}

// Event Listeners
$("propDiameter").addEventListener("input", updateRpmLimitUI);
$("power").addEventListener("input", syncPowerToAmps);
$("motorAmpsInput").addEventListener("input", syncAmpsToPower);
$("voltage").addEventListener("input", syncPowerToAmps);

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

// Initialize UI fields on page load
updateRpmLimitUI();
syncPowerToAmps();

function check(){
  const kv=n("kv"), power=n("power"), motorAmps=n("motorAmpsInput"), voltage=n("voltage"), capacity=n("capacity"), crate=n("crate");
  const esc=n("esc"), escBurst=n("escBurst");
  const propIn=n("propDiameter"), weight=n("weight"), motors=n("motors"), rpmLimit=n("rpmLimit");

  const values=[weight,motors,propIn,rpmLimit,kv,power,motorAmps,voltage,capacity,crate,esc,escBurst];
  if(values.some(v=>!Number.isFinite(v)||v<=0)){ alert("Please enter positive values in all fields."); return; }
  
  if(escBurst < esc) { 
    alert("The ESC's peak burst rating must be greater than or equal to its continuous rating."); 
    return; 
  }

  // Derived calculations & realistic performance metrics
  const totalPower = power * motors;
  const totalAmps = motorAmps * motors;
  const loadedRpm = voltage * kv * 0.80;
  const efficiencyFactor = getEfficiencyFactor(propIn);
  const estimatedTotalThrust = totalPower * efficiencyFactor;
  const twr = estimatedTotalThrust / weight;
  
  // Dynamic minimum target TWR (2.0 for large macro-quads, 3.0 for smaller quads)
  const minTargetTwr = propIn >= 10 ? 2.0 : 3.0;
  const maxRecommendedWeight = estimatedTotalThrust / minTargetTwr;
  const isWeightOk = twr >= minTargetTwr;

  // Performance category description
  let performanceDesc = "Optimal";
  if (!isWeightOk) performanceDesc = "Underpowered (Too Heavy)";
  else if (twr > 6.0) performanceDesc = "Very agile";
  else if (twr > 4.0) performanceDesc = "Agile";
  else performanceDesc = "Reasonable";

  const minC = totalAmps / capacity;

  const checks=[
    ["Thrust-to-Weight Ratio", `${fmt(twr,1)} : 1`, `Target ≥ ${minTargetTwr.toFixed(1)} : 1 — ${performanceDesc}`, isWeightOk],
    ["Max Safe Weight (AUW)", `${fmt(maxRecommendedWeight, 0)} g`, `Ceiling for TWR ≥ ${minTargetTwr.toFixed(1)} : 1 (Your build: ${fmt(weight, 0)} g)`, isWeightOk],
    ["Estimated loaded RPM", `${fmt(loadedRpm,0)} RPM`, `Limit ≤ ${fmt(rpmLimit,0)} RPM`, loadedRpm <= rpmLimit],
    ["Peak current per motor", `${fmt(motorAmps,1)} A`, `${fmt(power,0)} W ÷ ${fmt(voltage,1)} V`, true],
    ["Total peak system current", `${fmt(totalAmps,1)} A`, `${fmt(motorAmps,1)} A × ${motors}`, true],
    ["ESC burst capability", `${fmt(escBurst,0)} A`, `Must cover peak ${fmt(motorAmps,1)} A`, escBurst >= motorAmps],
    ["ESC continuous capability", `${fmt(esc,0)} A`, `Target ≥ 80% peak (${fmt(motorAmps * 0.8, 1)} A)`, esc >= (motorAmps * 0.8)],
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

$("check").addEventListener("click", check);