// PippoNet Rental — gestione noleggio sci (100% locale, dati in localStorage)

const STORAGE_KEYS = {
  equipment: 'pn_equipment',
  customers: 'pn_customers',
  rentals: 'pn_rentals',
};

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

let equipment = load(STORAGE_KEYS.equipment);
let customers = load(STORAGE_KEYS.customers);
let rentals = load(STORAGE_KEYS.rentals);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmtMoney(n) {
  return '€' + Number(n).toFixed(2);
}

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') renderDashboard();
  });
});

// ---------- Availability ----------
function activeQtyRented(equipmentId, excludeRentalId = null) {
  return rentals
    .filter((r) => r.equipmentId === equipmentId && r.status === 'attivo' && r.id !== excludeRentalId)
    .reduce((sum, r) => sum + Number(r.qty), 0);
}

function availableQty(item, excludeRentalId = null) {
  return item.totalQty - activeQtyRented(item.id, excludeRentalId);
}

// ---------- Equipment ----------
const equipmentForm = document.getElementById('equipment-form');
const equipmentTableBody = document.querySelector('#equipment-table tbody');

function renderEquipment() {
  equipmentTableBody.innerHTML = '';
  if (equipment.length === 0) {
    equipmentTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Nessuna attrezzatura registrata. Aggiungine una! 🎿</td></tr>';
  }
  equipment.forEach((item) => {
    const avail = availableQty(item);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.category}</td>
      <td>${item.name}</td>
      <td>${item.size || '-'}</td>
      <td>${item.totalQty}</td>
      <td>${avail}</td>
      <td>
        <button class="btn btn-ghost btn-sm" data-edit="${item.id}">Modifica</button>
        <button class="btn btn-danger btn-sm" data-delete="${item.id}">Elimina</button>
      </td>`;
    equipmentTableBody.appendChild(tr);
  });
  refreshEquipmentSelect();
}

equipmentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('equipment-id').value || uid();
  const data = {
    id,
    category: document.getElementById('equipment-category').value,
    name: document.getElementById('equipment-name').value.trim(),
    size: document.getElementById('equipment-size').value.trim(),
    totalQty: Number(document.getElementById('equipment-qty').value),
  };
  const idx = equipment.findIndex((x) => x.id === id);
  if (idx >= 0) equipment[idx] = data;
  else equipment.push(data);
  save(STORAGE_KEYS.equipment, equipment);
  equipmentForm.reset();
  document.getElementById('equipment-id').value = '';
  document.getElementById('equipment-cancel').style.display = 'none';
  renderEquipment();
});

document.getElementById('equipment-cancel').addEventListener('click', () => {
  equipmentForm.reset();
  document.getElementById('equipment-id').value = '';
  document.getElementById('equipment-cancel').style.display = 'none';
});

equipmentTableBody.addEventListener('click', (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.delete;
  if (editId) {
    const item = equipment.find((x) => x.id === editId);
    document.getElementById('equipment-id').value = item.id;
    document.getElementById('equipment-category').value = item.category;
    document.getElementById('equipment-name').value = item.name;
    document.getElementById('equipment-size').value = item.size;
    document.getElementById('equipment-qty').value = item.totalQty;
    document.getElementById('equipment-cancel').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (delId) {
    if (activeQtyRented(delId) > 0) {
      alert('Non puoi eliminare: questa attrezzatura ha noleggi attivi.');
      return;
    }
    if (confirm('Eliminare questa attrezzatura?')) {
      equipment = equipment.filter((x) => x.id !== delId);
      save(STORAGE_KEYS.equipment, equipment);
      renderEquipment();
    }
  }
});

// ---------- Customers ----------
const customerForm = document.getElementById('customer-form');
const customerTableBody = document.querySelector('#customer-table tbody');

function renderCustomers() {
  customerTableBody.innerHTML = '';
  if (customers.length === 0) {
    customerTableBody.innerHTML = '<tr class="empty-row"><td colspan="4">Nessun cliente registrato. 👥</td></tr>';
  }
  customers.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.phone || '-'}</td>
      <td>${c.doc || '-'}</td>
      <td>
        <button class="btn btn-ghost btn-sm" data-edit="${c.id}">Modifica</button>
        <button class="btn btn-danger btn-sm" data-delete="${c.id}">Elimina</button>
      </td>`;
    customerTableBody.appendChild(tr);
  });
  refreshCustomerSelect();
}

customerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('customer-id').value || uid();
  const data = {
    id,
    name: document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('customer-phone').value.trim(),
    doc: document.getElementById('customer-doc').value.trim(),
  };
  const idx = customers.findIndex((x) => x.id === id);
  if (idx >= 0) customers[idx] = data;
  else customers.push(data);
  save(STORAGE_KEYS.customers, customers);
  customerForm.reset();
  document.getElementById('customer-id').value = '';
  document.getElementById('customer-cancel').style.display = 'none';
  renderCustomers();
});

document.getElementById('customer-cancel').addEventListener('click', () => {
  customerForm.reset();
  document.getElementById('customer-id').value = '';
  document.getElementById('customer-cancel').style.display = 'none';
});

customerTableBody.addEventListener('click', (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.delete;
  if (editId) {
    const c = customers.find((x) => x.id === editId);
    document.getElementById('customer-id').value = c.id;
    document.getElementById('customer-name').value = c.name;
    document.getElementById('customer-phone').value = c.phone;
    document.getElementById('customer-doc').value = c.doc;
    document.getElementById('customer-cancel').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (delId) {
    if (rentals.some((r) => r.customerId === delId && r.status === 'attivo')) {
      alert('Non puoi eliminare: questo cliente ha noleggi attivi.');
      return;
    }
    if (confirm('Eliminare questo cliente?')) {
      customers = customers.filter((x) => x.id !== delId);
      save(STORAGE_KEYS.customers, customers);
      renderCustomers();
    }
  }
});

// ---------- Rentals ----------
const rentalForm = document.getElementById('rental-form');
const rentalTableBody = document.querySelector('#rental-table tbody');
const activeRentalsTableBody = document.querySelector('#active-rentals-table tbody');

function refreshCustomerSelect() {
  const sel = document.getElementById('rental-customer');
  const current = sel.value;
  sel.innerHTML = '<option value="">Cliente</option>' +
    customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  sel.value = current;
}

function refreshEquipmentSelect() {
  const sel = document.getElementById('rental-equipment');
  const current = sel.value;
  sel.innerHTML = '<option value="">Attrezzatura</option>' +
    equipment.map((item) => {
      const avail = availableQty(item);
      return `<option value="${item.id}" ${avail <= 0 ? 'disabled' : ''}>${item.category} - ${item.name}${item.size ? ' (' + item.size + ')' : ''} — disp: ${avail}</option>`;
    }).join('');
  sel.value = current;
}

function rentalRowHtml(r, { showStatusBadge }) {
  const cust = customers.find((c) => c.id === r.customerId);
  const item = equipment.find((eq) => eq.id === r.equipmentId);
  const badge = r.status === 'attivo'
    ? '<span class="badge badge-active">Attivo</span>'
    : '<span class="badge badge-returned">Restituito</span>';
  const returnBtn = r.status === 'attivo'
    ? `<button class="btn btn-success btn-sm" data-return="${r.id}">Segna restituito</button> `
    : '';

  return `
    <tr>
      <td>${cust ? cust.name : '—'}</td>
      <td>${item ? item.category + ' - ' + item.name : '—'}</td>
      <td>${r.qty}</td>
      <td>${fmtDate(r.start)}</td>
      <td>${fmtDate(r.end)}</td>
      <td>${fmtMoney(r.price)}</td>
      ${showStatusBadge ? `<td>${badge}</td>` : ''}
      <td>${returnBtn}<button class="btn btn-danger btn-sm" data-delete-rental="${r.id}">Elimina</button></td>
    </tr>`;
}

function renderRentals() {
  rentalTableBody.innerHTML = '';
  if (rentals.length === 0) {
    rentalTableBody.innerHTML = '<tr class="empty-row"><td colspan="8">Nessun noleggio ancora. 🏂</td></tr>';
  } else {
    rentals
      .slice()
      .sort((a, b) => b.start.localeCompare(a.start))
      .forEach((r) => {
        rentalTableBody.insertAdjacentHTML('beforeend', rentalRowHtml(r, { showStatusBadge: true }));
      });
  }
  refreshEquipmentSelect();
}

function renderDashboard() {
  const activeRentals = rentals.filter((r) => r.status === 'attivo');
  document.getElementById('stat-active-rentals').textContent = activeRentals.length;
  document.getElementById('stat-available').textContent = equipment.reduce((sum, item) => sum + availableQty(item), 0);
  document.getElementById('stat-revenue').textContent = fmtMoney(rentals.reduce((sum, r) => sum + Number(r.price), 0));
  document.getElementById('stat-customers').textContent = customers.length;

  activeRentalsTableBody.innerHTML = '';
  if (activeRentals.length === 0) {
    activeRentalsTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Nessun noleggio attivo al momento. ❄️</td></tr>';
  } else {
    activeRentals.forEach((r) => {
      activeRentalsTableBody.insertAdjacentHTML('beforeend', rentalRowHtml(r, { showStatusBadge: false }));
    });
  }
}

rentalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const equipmentId = document.getElementById('rental-equipment').value;
  const qty = Number(document.getElementById('rental-qty').value);
  const item = equipment.find((x) => x.id === equipmentId);
  const start = document.getElementById('rental-start').value;
  const end = document.getElementById('rental-end').value;

  if (end < start) {
    alert('La data di fine non può essere prima della data di inizio.');
    return;
  }
  if (!item || qty > availableQty(item)) {
    alert('Quantità non disponibile per questa attrezzatura.');
    return;
  }

  const data = {
    id: uid(),
    customerId: document.getElementById('rental-customer').value,
    equipmentId,
    qty,
    start,
    end,
    price: Number(document.getElementById('rental-price').value),
    status: 'attivo',
  };
  rentals.push(data);
  save(STORAGE_KEYS.rentals, rentals);
  rentalForm.reset();
  document.getElementById('rental-qty').value = 1;
  setDefaultRentalDates();
  renderRentals();
  renderDashboard();
  renderEquipment();
});

function handleRentalTableClick(e) {
  const returnId = e.target.dataset.return;
  const delId = e.target.dataset.deleteRental;
  if (returnId) {
    const r = rentals.find((x) => x.id === returnId);
    r.status = 'restituito';
    save(STORAGE_KEYS.rentals, rentals);
    renderRentals();
    renderDashboard();
    renderEquipment();
  }
  if (delId) {
    if (confirm('Eliminare questo noleggio?')) {
      rentals = rentals.filter((x) => x.id !== delId);
      save(STORAGE_KEYS.rentals, rentals);
      renderRentals();
      renderDashboard();
      renderEquipment();
    }
  }
}

rentalTableBody.addEventListener('click', handleRentalTableClick);
activeRentalsTableBody.addEventListener('click', handleRentalTableClick);

function setDefaultRentalDates() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('rental-start').value = today;
  document.getElementById('rental-end').value = today;
}

// ---------- Init ----------
(function init() {
  setDefaultRentalDates();

  renderEquipment();
  renderCustomers();
  renderRentals();
  renderDashboard();
})();
