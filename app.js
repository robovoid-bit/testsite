let bikeDb = [];
let activeBike = null;

// Deep aftermarket catalog details
const upgradeCatalog = {
  forks: [
    { name: "Fox 36 Factory Kashima (160mm)", weightDelta: -110, geoShift: 0 },
    { name: "RockShox Lyrik Ultimate (160mm)", weightDelta: -90, geoShift: 0 },
    { name: "Ohlins RXF36 m.2 (170mm Over-forked)", weightDelta: 140, geoShift: 10 } // Changing travel alters geo!
  ],
  shocks: [
    { name: "Fox Float X2 Factory", weightDelta: 210 },
    { name: "RockShox Super Deluxe Ultimate Coil", weightDelta: 450 }
  ],
  brakes: [
    { name: "Shimano XT M8120 4-Piston", weightDelta: -40 },
    { name: "Magura MT7 Pro Carbon", weightDelta: -95 },
    { name: "SRAM Maven Ultimate", weightDelta: 180 }
  ]
};

// Fetch data from local json structure on load
async function loadTunerApp() {
  try {
    const res = await fetch('bikes.json');
    bikeDb = await res.json();
    document.getElementById('bike-search').addEventListener('input', runBikeSearch);
  } catch (err) {
    console.error("Error connecting data store:", err);
  }
}

// Live parsing search matching brand, model, or release year
function runBikeSearch(event) {
  const query = event.target.value.toLowerCase();
  const menu = document.getElementById('search-results');
  menu.innerHTML = '';

  if (!query) return;

  const hits = bikeDb.filter(b => 
    `${b.brand} ${b.model} ${b.year}`.toLowerCase().includes(query)
  );

  hits.forEach(bike => {
    const item = document.createElement('div');
    item.className = 'search-row-item';
    item.innerText = `${bike.brand} ${bike.model} [${bike.year}]`;
    item.onclick = () => activateBikeProfile(bike);
    menu.appendChild(item);
  });
}

// Inject selected bike properties into interactive customizer
function activateBikeProfile(bike) {
  activeBike = bike;
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('bike-search').value = `${bike.brand} ${bike.model}`;
  
  // Display layout block
  document.getElementById('tuner-core').classList.remove('hidden');
  document.getElementById('active-bike-name').innerText = `🛠️ Tuning: ${bike.brand} ${bike.model} (${bike.year})`;
  
  // Map out real frame metrics
  document.getElementById('geo-reach').innerText = `Reach: ${bike.geometry.reach}mm`;
  document.getElementById('geo-ha').innerText = `Head Angle: ${bike.geometry.head_angle}°`;
  document.getElementById('geo-wheels').innerText = `Wheels: ${bike.geometry.wheel_size}"`;

  // Build the upgrade menus natively
  fillCustomMenu('part-fork', upgradeCatalog.forks, bike.stock_specs.fork);
  fillCustomMenu('part-shock', upgradeCatalog.shocks, bike.stock_specs.shock);
  fillCustomMenu('part-brakes', upgradeCatalog.brakes, bike.stock_specs.brakes);
  
  updateComponentChanges();
}

function fillCustomMenu(domId, options, stockLabel) {
  const selectNode = document.getElementById(domId);
  selectNode.innerHTML = `<option value="stock" data-weight="0" data-geo="0">[OEM Stock] ${stockLabel}</option>`;
  
  options.forEach((opt, idx) => {
    const node = document.createElement('option');
    node.value = idx;
    node.innerText = `+ Upgrade to: ${opt.name}`;
    node.setAttribute('data-weight', opt.weightDelta || 0);
    node.setAttribute('data-geo', opt.geoShift || 0);
    selectNode.appendChild(node);
  });
}

// Track customization consequences (Weight savings, geo alterations)
function updateComponentChanges() {
  if (!activeBike) return;

  let totalWeightShift = 0;
  let bottomBracketShift = 0;

  // Track Fork choice variables
  const forkNode = document.getElementById('part-fork');
  const selectedForkOpt = forkNode.options[forkNode.selectedIndex];
  totalWeightShift += parseInt(selectedForkOpt.getAttribute('data-weight'));
  bottomBracketShift += parseInt(selectedForkOpt.getAttribute('data-geo')) * 0.3; // Rough mechanical axle ratio

  // Track Shock choice variables
  const shockNode = document.getElementById('part-shock');
  totalWeightShift += parseInt(shockNode.options[shockNode.selectedIndex].getAttribute('data-weight'));

  // Track Brake choice variables
  const brakeNode = document.getElementById('part-brakes');
  totalWeightShift += parseInt(brakeNode.options[brakeNode.selectedIndex].getAttribute('data-weight'));

  // Update DOM interface calculation outputs
  document.getElementById('build-weight-delta').innerText = `Weight impact: ${totalWeightShift >= 0 ? '+' : ''}${totalWeightShift}g`;
  document.getElementById('build-bb-impact').innerText = `Est. Bottom Bracket shift: +${bottomBracketShift.toFixed(1)}mm`;
}

window.onload = loadTunerApp;
