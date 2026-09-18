const STORAGE_KEY = "shelflife_items_v2";
const AUTH_KEY = "shelflife_auth_user";

let currentCategory = "all";
let currentAuthUser = JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
let deletedItemBackup = null;

// Pre-seeded items including kitchen supplies AND Emergency Go-Bag supplies
const sampleItems = [
  {
    id: "1",
    name: "Water Purification Tablets (50-pk)",
    category: "gobag",
    date: getFutureDate(180),
  },
  {
    id: "2",
    name: "Emergency Ration Biscuits",
    category: "gobag",
    date: getFutureDate(60),
  },
  {
    id: "3",
    name: "Antiseptic & First Aid Ointment",
    category: "gobag",
    date: getFutureDate(30),
  },
  {
    id: "4",
    name: "Fresh Milk 1L",
    category: "fridge",
    date: getFutureDate(1),
  },
  {
    id: "5",
    name: "Eggs (Dozen)",
    category: "fridge",
    date: getFutureDate(3),
  },
  {
    id: "6",
    name: "Sourdough Loaf",
    category: "pantry",
    date: getFutureDate(0),
  },
  {
    id: "7",
    name: "Paracetamol 500mg",
    category: "medicine",
    date: getFutureDate(45),
  },
  {
    id: "8",
    name: "Flashlight D-Cell Batteries",
    category: "gobag",
    date: getFutureDate(120),
  },
];

let items = loadStoredItems();

function getFutureDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function loadStoredItems() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  return [...sampleItems];
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  renderItems();
}

function seedSampleData() {
  items = [...sampleItems];
  saveItems();
  showToast("Demo inventory restored with Go-Bag items!");
}

/* Date Math & Relative Days */
function getDaysRemaining(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = target - today;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getItemStatus(days) {
  if (days < 0) return { label: "Expired", badgeClass: "badge-expired" };
  if (days === 0) return { label: "Use Today", badgeClass: "badge-danger" };
  if (days <= 3) return { label: `${days}d left`, badgeClass: "badge-warning" };
  return { label: `${days}d left`, badgeClass: "badge-fresh" };
}

function formatCategoryLabel(cat) {
  switch (cat) {
    case "gobag":
      return "🎒 Emergency Go-Bag";
    case "fridge":
      return "Fridge";
    case "pantry":
      return "Pantry";
    case "medicine":
      return "Medicine";
    case "cosmetics":
      return "Cosmetics";
    default:
      return capitalize(cat);
  }
}

/* Render Tracker Items */
function renderItems() {
  const container = document.getElementById("itemsContainer");
  if (!container) return;

  const search = (
    document.getElementById("searchInput")?.value || ""
  ).toLowerCase();
  const sortBy = document.getElementById("sortSelect")?.value || "urgency";

  let filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search);
    if (!matchesSearch) return false;

    const days = getDaysRemaining(item.date);
    if (currentCategory === "all") return true;
    if (currentCategory === "critical") return days <= 3;
    return item.category === currentCategory;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "urgency") {
      return getDaysRemaining(a.date) - getDaysRemaining(b.date);
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "category") {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 16px; color:var(--slate-400);">
        <p style="font-size:1.8rem; margin-bottom:8px;">🎒</p>
        <p style="font-weight:600;">No items found in this section</p>
        <small>Adjust filters or add a new supply above.</small>
      </div>
    `;
  } else {
    container.innerHTML = filtered
      .map((item) => {
        const days = getDaysRemaining(item.date);
        const status = getItemStatus(days);
        const isGoBag = item.category === "gobag";

        return `
          <div class="item-card ${isGoBag ? "item-card-gobag" : ""}">
            <div class="item-card-left">
              <div class="item-info">
                <h5>${escapeHtml(item.name)}</h5>
                <div class="item-meta">
                  <span style="${isGoBag ? "color:#e11d48; font-weight:700;" : ""}">${formatCategoryLabel(item.category)}</span>
                  <span>•</span>
                  <span>Exp: ${item.date}</span>
                </div>
              </div>
            </div>
            <div class="item-card-right">
              <span class="status-badge ${status.badgeClass}">${status.label}</span>
              <button class="action-btn-icon" onclick="deleteItem('${item.id}')" title="Mark Used / Rotated">✓</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const summary = document.getElementById("itemsSummaryCount");
  if (summary) {
    summary.textContent = `${items.length} item${items.length === 1 ? "" : "s"} tracked`;
  }
}

/* CRUD Operations */
function handleAddItem(e) {
  e.preventDefault();
  const nameInput = document.getElementById("itemNameInput");
  const catInput = document.getElementById("itemCategorySelect");
  const dateInput = document.getElementById("itemDateInput");

  const name = nameInput.value.trim();
  const category = catInput.value;
  const date = dateInput.value;

  if (!name || !date) return;

  const newItem = {
    id: Date.now().toString(),
    name,
    category,
    date,
  };

  items.unshift(newItem);
  saveItems();
  document.getElementById("addItemForm").reset();
  toggleAddForm();
  showToast(`Added "${newItem.name}" to inventory!`);
}

function deleteItem(id) {
  const idx = items.findIndex((item) => item.id === id);
  if (idx !== -1) {
    deletedItemBackup = { item: items[idx], index: idx };
    items.splice(idx, 1);
    saveItems();
    showToast("Item marked as used / rotated!", true);
  }
}

function undoDelete() {
  if (deletedItemBackup) {
    items.splice(deletedItemBackup.index, 0, deletedItemBackup.item);
    deletedItemBackup = null;
    saveItems();
    showToast("Action undone!");
  }
}

function consumeAllExpired() {
  const initialCount = items.length;
  items = items.filter((item) => getDaysRemaining(item.date) >= 0);
  const diff = initialCount - items.length;
  if (diff > 0) {
    saveItems();
    showToast(`Cleared ${diff} expired item${diff === 1 ? "" : "s"}!`);
  } else {
    showToast("No expired items found.");
  }
}

function setCategoryFilter(category, btnElement) {
  currentCategory = category;
  document
    .querySelectorAll(".filter-pill")
    .forEach((pill) => pill.classList.remove("active"));
  btnElement.classList.add("active");
  renderItems();
}

function toggleAddForm() {
  const form = document.getElementById("addItemForm");
  const chevron = document.getElementById("formChevron");
  form.classList.toggle("open");
  chevron.textContent = form.classList.contains("open") ? "▲" : "▼";
  if (form.classList.contains("open")) {
    document.getElementById("itemNameInput").focus();
  }
}

/* Philippine Peso Calculator Engine */
function updateCalculator() {
  const familySlider = document.getElementById("familySizeSlider");
  const spendSlider = document.getElementById("spendSlider");
  if (!familySlider || !spendSlider) return;

  const familySize = parseInt(familySlider.value, 10);
  const weeklySpend = parseInt(spendSlider.value, 10);

  document.getElementById("familySizeLabel").textContent =
    `${familySize} ${familySize === 1 ? "person" : "people"}`;
  document.getElementById("spendLabel").textContent = formatPeso(weeklySpend);

  const annualSpend = weeklySpend * 52;
  const estimatedSavings = Math.round(annualSpend * 0.18);
  const wasteDivertedKg = Math.round(familySize * 48);

  document.getElementById("annualSavingsVal").textContent =
    formatPeso(estimatedSavings);
  document.getElementById("wasteDivertedVal").textContent =
    `${wasteDivertedKg} kg`;
}

function formatPeso(val) {
  return "₱" + val.toLocaleString("en-PH");
}

/* FAQ Accordion */
function toggleFaq(button) {
  const item = button.parentElement;
  const isActive = item.classList.contains("active");
  document.querySelectorAll(".faq-item").forEach((i) => {
    i.classList.remove("active");
    i.querySelector(".faq-chevron").textContent = "▼";
  });
  if (!isActive) {
    item.classList.add("active");
    item.querySelector(".faq-chevron").textContent = "▲";
  }
}

/* Toast Notification */
function showToast(message, allowUndo = false) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span>${message}</span>
    ${allowUndo ? '<button class="toast-undo" onclick="undoDelete()">Undo</button>' : ""}
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* Auth & User Session Simulation */
let isSignUpMode = false;
function openAuthModal(mode = "signin") {
  isSignUpMode = mode === "signup";
  updateAuthModalUI();
  document.getElementById("authModal").classList.add("active");
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  updateAuthModalUI();
}

function updateAuthModalUI() {
  document.getElementById("authModalTitle").textContent = isSignUpMode
    ? "Create a ShelfLife Account"
    : "Sign In to ShelfLife";
  document.getElementById("authSubmitBtn").textContent = isSignUpMode
    ? "Create Account"
    : "Sign In";
  document.getElementById("authToggleLink").textContent = isSignUpMode
    ? "Already have an account? Sign In"
    : "Don't have an account? Create one";
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("authEmailInput").value.trim();
  currentAuthUser = { email, name: email.split("@")[0] };
  localStorage.setItem(AUTH_KEY, JSON.stringify(currentAuthUser));
  closeModal("authModal");
  renderAuthState();
  showToast(`Welcome, ${currentAuthUser.name}!`);
}

function handleSignOut() {
  currentAuthUser = null;
  localStorage.removeItem(AUTH_KEY);
  renderAuthState();
  showToast("Signed out successfully.");
}

function renderAuthState() {
  const authBox = document.getElementById("authContainer");
  const syncStatusPill = document.getElementById("syncStatusPill");
  if (!authBox || !syncStatusPill) return;

  if (currentAuthUser) {
    const initial = currentAuthUser.email.charAt(0).toUpperCase();
    authBox.innerHTML = `
      <div class="auth-profile">
        <div class="avatar-badge">${initial}</div>
        <span class="auth-email">${escapeHtml(currentAuthUser.email)}</span>
        <button class="btn btn-sm btn-outline" onclick="handleSignOut()" style="padding:4px 8px; font-size:0.75rem;">Exit</button>
      </div>
    `;
    syncStatusPill.innerHTML = `<span>● Cloud Synced (${escapeHtml(currentAuthUser.name)})</span>`;
    syncStatusPill.style.color = "#6ee7b7";
  } else {
    authBox.innerHTML = `<button class="btn btn-primary btn-sm" onclick="openAuthModal('signin')">Sign In</button>`;
    syncStatusPill.innerHTML = `<span>● Local Storage Active</span>`;
    syncStatusPill.style.color = "#93c5fd";
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}

/* Helper Utilities */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("itemDateInput");
  if (dateInput) {
    const todayStr = new Date().toISOString().split("T")[0];
    dateInput.min = todayStr;
    dateInput.value = getFutureDate(180); // Default to 6-month disaster rotation
  }

  renderAuthState();
  renderItems();
  updateCalculator();
});
