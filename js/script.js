// ========================================
// FORMATTING FUNCTIONS
// ========================================

// Format Item Name
function formatItemName(name) {
    return name
        .toLowerCase()
        .split(" ")
        .map(function(word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

// Format Expiration Date
function formatExpirationDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// ========================================
// DOM ELEMENTS AND VARIABLES
// ========================================

// Add Item Popup
const addItemButton = document.getElementById("addItemButton");
const addItemModal = document.getElementById("addItemModal");
const closeAddItemButton = document.getElementById("closeAddItemButton");
const addItemForm = document.getElementById("addItemForm");

// Item Details Popup
const itemDetailsModal = document.getElementById("itemDetailsModal");
const closeDetailsButton = document.getElementById("closeDetailsButton");

// Mark as Done Popup
const doneItemButton = document.getElementById("doneItemButton");
const doneItemModal = document.getElementById("doneItemModal");
const consumedButton = document.getElementById("consumedButton");
const discardedButton = document.getElementById("discardedButton");
const cancelDoneButton = document.getElementById("cancelDoneButton");

// Delete Confirmation Popup
const deleteItemButton = document.getElementById("deleteItemButton");
const editItemButton = document.getElementById("editItemButton");
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");

// Inventory Controls
const searchInput = document.getElementById("search-item");
const categoryFilter = document.getElementById("filter-category");
const sortItems = document.getElementById("sort-items");
const inventoryList = document.querySelector(".inventory-list");
const inventoryTotalItems = document.getElementById("inventory-total-items");

// Selected Item and Edit Mode
let selectedItem = null;
let editMode = false;

// ========================================
// ADD ITEM
// ========================================

// Open Add Item Popup
addItemButton.addEventListener("click", function() {
    editMode = false;
    selectedItem = null;
    addItemForm.reset();
    addItemModal.style.display = "block";
});

// Close Add Item Popup
closeAddItemButton.addEventListener("click", function() {
    addItemModal.style.display = "none";
    addItemForm.reset();
});

// Save Item
addItemForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Get item information
    const itemName = formatItemName(
        document.getElementById("item-name").value.trim()
    );

    const category = document.getElementById("item-category");
    const itemCategory = category.options[category.selectedIndex].text;

    const itemQuantity = document.getElementById("item-quantity").value;
    const expirationDate = document.getElementById("expiration-date").value;

    // Calculate days left
    const today = new Date();
    const expiration = new Date(expirationDate);
    const difference = expiration - today;

    const daysLeft = Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );

    // Determine status
    let status;

    if (daysLeft <= 0) {
        status = "Expired";
    } else if (daysLeft <= 7) {
        status = "Critical";
    } else if (daysLeft <= 15) {
        status = "Urgent";
    } else if (daysLeft <= 30) {
        status = "Soon";
    } else {
        status = "Good";
    }

    // Edit Existing Item
    if (editMode && selectedItem) {
        // Update stored information
        selectedItem.dataset.name = itemName;
        selectedItem.dataset.category = itemCategory;
        selectedItem.dataset.quantity = itemQuantity;
        selectedItem.dataset.expiration = expirationDate;
        selectedItem.dataset.daysLeft = daysLeft;
        selectedItem.dataset.status = status;

        // Update card appearance
        selectedItem.className =
            "inventory-item-card " + status.toLowerCase();

        // Update card information
        selectedItem.innerHTML = `
            <h3>${itemName}</h3>
            <h4>${itemCategory}</h4>
            <p>${daysLeft} days left</p>
            <div class="item-status">${status}</div>
        `;

        // Save changes
        saveInventory();

        // Exit edit mode
        editMode = false;

        // Close form
        addItemModal.style.display = "none";
        addItemForm.reset();

        return;
    }

    // Add New Item
    const newItemData = {
        name: itemName,
        category: itemCategory,
        quantity: itemQuantity,
        expiration: expirationDate,
        daysLeft: daysLeft,
        status: status
    };

    createInventoryCard(newItemData);

    updateTotalItems();
    saveInventory();

    // Close Add Item Popup
    addItemModal.style.display = "none";

    // Clear form
    addItemForm.reset();
});

// ========================================
// ITEM DETAILS
// ========================================

// Close Item Details Popup
closeDetailsButton.addEventListener("click", function() {
    itemDetailsModal.style.display = "none";
});

// ========================================
// EDIT ITEM
// ========================================

// Edit Item
editItemButton.addEventListener("click", function() {
    if (!selectedItem) {
        return;
    }

    editMode = true;

    // Fill the form with the item's current information
    document.getElementById("item-name").value =
        selectedItem.dataset.name;

    document.getElementById("item-category").value =
        getCategoryValue(selectedItem.dataset.category);

    document.getElementById("item-quantity").value =
        selectedItem.dataset.quantity;

    document.getElementById("expiration-date").value =
        selectedItem.dataset.expiration;

    // Open the Add Item Form
    addItemModal.style.display = "block";

    // Close the Item Details Popup
    itemDetailsModal.style.display = "none";
});

// ========================================
// DELETE ITEM
// ========================================

// Open Delete Confirmation Popup
deleteItemButton.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    itemDetailsModal.style.display = "none";
    deleteConfirmModal.style.display = "block";
});

// Confirm Delete
confirmDeleteButton.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    selectedItem.remove();

    updateTotalItems();
    saveInventory();

    deleteConfirmModal.style.display = "none";
    selectedItem = null;
});

// Cancel Delete
cancelDeleteButton.addEventListener("click", function(event) {
    event.stopPropagation();

    deleteConfirmModal.style.display = "none";
    itemDetailsModal.style.display = "block";
});

// ========================================
// MARK AS DONE
// ========================================

// Open Mark as Done Popup
doneItemButton.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    // Close Item Details Popup
    itemDetailsModal.style.display = "none";

    // Open Mark as Done Popup
    doneItemModal.style.display = "block";
});

// Mark Item as Consumed
consumedButton.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    // Remove item from inventory
    selectedItem.remove();

    // Update total items
    updateTotalItems();
    saveInventory();

    // Close Mark as Done Popup
    doneItemModal.style.display = "none";

    // Clear selected item
    selectedItem = null;
});

// Mark Item as Discarded
discardedButton.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    // Remove item from inventory
    selectedItem.remove();

    // Update total items
    updateTotalItems();
    saveInventory();

    // Close Mark as Done Popup
    doneItemModal.style.display = "none";

    // Clear selected item
    selectedItem = null;
});

// Cancel Mark as Done
cancelDoneButton.addEventListener("click", function(event) {
    event.stopPropagation();

    // Close Mark as Done Popup
    doneItemModal.style.display = "none";
});

// ========================================
// INVENTORY CONTROLS
// ========================================

// Total Inventory Counter
function updateTotalItems() {
    const totalItems =
        inventoryList.querySelectorAll(".inventory-item-card").length;

    inventoryTotalItems.textContent = totalItems;
}

// Apply Search and Filter
function filterItems() {
    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const itemCards =
        inventoryList.querySelectorAll(".inventory-item-card");

    itemCards.forEach(function(item) {
        const itemName = item.dataset.name.toLowerCase();
        const itemCategory = item.dataset.category.toLowerCase();

        const matchesSearch = itemName.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            itemCategory === getCategoryName(selectedCategory);

        if (matchesSearch && matchesCategory) {
            item.style.display = "grid";
        } else {
            item.style.display = "none";
        }
    });
}

// Convert Filter Value into Category Name
function getCategoryName(category) {
    const categories = {
        food: "food",
        medicine: "medicine",
        toiletries: "toiletries",
        skincare: "skincare",
        cleaning: "cleaning supplies",
        household: "household supplies",
        pet: "pet supplies",
        baby: "baby & child care",
        emergency: "emergency supplies",
        others: "others"
    };

    return categories[category];
}

// Convert Category Name into Select Value
function getCategoryValue(categoryName) {
    const categories = {
        "Food": "food",
        "Medicine": "medicine",
        "Toiletries": "toiletries",
        "Skincare": "skincare",
        "Cleaning Supplies": "cleaning",
        "Household Supplies": "household",
        "Pet Supplies": "pet",
        "Baby & Child Care": "baby",
        "Emergency Supplies": "emergency",
        "Others": "others"
    };

    return categories[categoryName];
}

// Sort Items
function sortInventory() {
    const selectedSort = sortItems.value;

    const itemCards = Array.from(
        inventoryList.querySelectorAll(".inventory-item-card")
    );

    itemCards.sort(function(a, b) {
        // Sort by Name A-Z
        if (selectedSort === "name-az") {
            return a.dataset.name.localeCompare(b.dataset.name);
        }

        // Sort by Name Z-A
        if (selectedSort === "name-za") {
            return b.dataset.name.localeCompare(a.dataset.name);
        }

        // Sort by Expiration Date Earliest-Latest
        if (selectedSort === "expiration-asc") {
            return a.dataset.expiration.localeCompare(
                b.dataset.expiration
            );
        }

        // Sort by Expiration Date Latest-Earliest
        if (selectedSort === "expiration-desc") {
            return b.dataset.expiration.localeCompare(
                a.dataset.expiration
            );
        }
    });

    // Put the Sorted Cards Back into My Items
    itemCards.forEach(function(card) {
        inventoryList.appendChild(card);
    });
}

// Search when user types
searchInput.addEventListener("input", function() {
    filterItems();
});

// Filter when category changes
categoryFilter.addEventListener("change", function() {
    filterItems();
});

// Sort when sorting option changes
sortItems.addEventListener("change", function() {
    sortInventory();
});

// ========================================
// LOCAL STORAGE
// ========================================

// Save Inventory to Local Storage
function saveInventory() {
    const items = [];

    const itemCards =
        inventoryList.querySelectorAll(".inventory-item-card");

    itemCards.forEach(function(card) {
        items.push({
            name: card.dataset.name,
            category: card.dataset.category,
            quantity: card.dataset.quantity,
            expiration: card.dataset.expiration,
            daysLeft: card.dataset.daysLeft,
            status: card.dataset.status
        });
    });

    localStorage.setItem("inventoryItems", JSON.stringify(items));
}

// ========================================
// CREATE INVENTORY CARD
// ========================================

function createInventoryCard(item) {
    const newItem = document.createElement("div");

    newItem.classList.add(
        "inventory-item-card",
        item.status.toLowerCase()
    );

    newItem.dataset.name = item.name;
    newItem.dataset.category = item.category;
    newItem.dataset.quantity = item.quantity;
    newItem.dataset.expiration = item.expiration;
    newItem.dataset.daysLeft = item.daysLeft;
    newItem.dataset.status = item.status;

    newItem.innerHTML = `
        <h3>${item.name}</h3>
        <h4>${item.category}</h4>
        <p>${item.daysLeft} days left</p>
        <div class="item-status">${item.status}</div>
    `;

    newItem.addEventListener("click", function() {
        selectedItem = this;

        document.getElementById("details-name").textContent =
            this.dataset.name;

        document.getElementById("details-category").textContent =
            this.dataset.category;

        document.getElementById("details-quantity").textContent =
            this.dataset.quantity || "Not specified";

        document.getElementById("details-expiration").textContent =
            formatExpirationDate(this.dataset.expiration);

        document.getElementById("details-days-left").textContent =
            this.dataset.daysLeft + " days";

        document.getElementById("details-status").textContent =
            this.dataset.status;

        itemDetailsModal.style.display = "block";
    });

    inventoryList.appendChild(newItem);
}

// ========================================
// LOAD INVENTORY
// ========================================

// Load Inventory from Local Storage
function loadInventory() {
    const savedItems = localStorage.getItem("inventoryItems");

    if (!savedItems) {
        return;
    }

    const items = JSON.parse(savedItems);

    items.forEach(function(item) {
        createInventoryCard(item);
    });

    updateTotalItems();
}

// Load Inventory when Page Opens
loadInventory();