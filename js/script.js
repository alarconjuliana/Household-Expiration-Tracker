// ========================================
// FORMATTING FUNCTIONS
// ========================================

// Format item name with capitalized words
function formatItemName(name) {
    return name
        .toLowerCase()
        .split(" ")
        .map(function(word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

// Format date into a readable format
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

// Store the currently selected item and edit mode
let selectedItem = null;
let editMode = false;


// ========================================
// ADD ITEM
// ========================================

// Open Add Item Popup
addItemButton?.addEventListener("click", function() {
    editMode = false;
    selectedItem = null;
    addItemForm.reset();
    addItemModal.style.display = "block";
});

// Close Add Item Popup
closeAddItemButton?.addEventListener("click", function() {
    addItemModal.style.display = "none";
    addItemForm.reset();
});

// Save new item or update existing item
addItemForm?.addEventListener("submit", function(event) {
    event.preventDefault();

    // Get item information from the form
    const itemName = formatItemName(
        document.getElementById("item-name").value.trim()
    );

    const category = document.getElementById("item-category");
    const itemCategory = category.options[category.selectedIndex].text;

    const itemQuantity = document.getElementById("item-quantity").value;
    const expirationDate = document.getElementById("expiration-date").value;

    // Calculate the number of days left
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiration = new Date(expirationDate + "T00:00:00");
    expiration.setHours(0, 0, 0, 0);

    const difference = expiration - today;

    const daysLeft = Math.round(
        difference / (1000 * 60 * 60 * 24)
    );

    // Determine the item status
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

    // Update an existing item
    if (editMode && selectedItem) {
        // Update the stored item information
        selectedItem.dataset.name = itemName;
        selectedItem.dataset.category = itemCategory;
        selectedItem.dataset.quantity = itemQuantity;
        selectedItem.dataset.expiration = expirationDate;
        selectedItem.dataset.daysLeft = daysLeft;
        selectedItem.dataset.status = status;

        // Move the edited item to the top of the list
        inventoryList.insertBefore(
            selectedItem,
            inventoryList.children[1]
        );

        // Update the item's status appearance
        selectedItem.className =
            "inventory-item-card " + status.toLowerCase();

        // Update the item's displayed information
        selectedItem.innerHTML = `
            <h3>${itemName}</h3>
            <h4>${itemCategory}</h4>
            <p>${daysLeft} days left</p>
            <div class="item-status">${status}</div>
        `;

        // Save the updated inventory
        saveInventory();

        // Exit edit mode
        editMode = false;

        // Close and reset the form
        addItemModal.style.display = "none";
        addItemForm.reset();

        return;
    }

    // Create a new item
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

    // Close the Add Item Popup
    addItemModal.style.display = "none";

    // Clear the form
    addItemForm.reset();
});


// ========================================
// ITEM DETAILS
// ========================================

// Close Item Details Popup
closeDetailsButton?.addEventListener("click", function() {
    itemDetailsModal.style.display = "none";
});


// ========================================
// EDIT ITEM
// ========================================

// Open the Edit Item form
editItemButton?.addEventListener("click", function() {
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
deleteItemButton?.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    itemDetailsModal.style.display = "none";
    deleteConfirmModal.style.display = "block";
});

// Delete the selected item
confirmDeleteButton?.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    saveToHistory(selectedItem, "Deleted");

    selectedItem.remove();
    updateTotalItems();
    saveInventory();

    deleteConfirmModal.style.display = "none";
    selectedItem = null;
});

// Cancel Delete Confirmation
cancelDeleteButton?.addEventListener("click", function(event) {
    event.stopPropagation();

    deleteConfirmModal.style.display = "none";
    itemDetailsModal.style.display = "block";
});


// ========================================
// MARK AS DONE
// ========================================

// Open Mark as Done Popup
doneItemButton?.addEventListener("click", function(event) {
    event.stopPropagation();

    if (!selectedItem) {
        return;
    }

    // Close Item Details Popup
    itemDetailsModal.style.display = "none";

    // Open Mark as Done Popup
    doneItemModal.style.display = "block";
});

// Save a completed or deleted item to history
function saveToHistory(item, action) {
    const savedHistory = localStorage.getItem("itemHistory");

    let history = [];

    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }

    const historyItem = {
        name: item.dataset.name,
        category: item.dataset.category,
        quantity: item.dataset.quantity,
        expiration: item.dataset.expiration,
        status: item.dataset.status,
        action: action,
        actionDate: new Date().getFullYear() + "-" +
            String(new Date().getMonth() + 1).padStart(2, "0") +
            "-" +
            String(new Date().getDate()).padStart(2, "0")
    };

    history.push(historyItem);

    localStorage.setItem("itemHistory", JSON.stringify(history));
}

// Mark Item as Consumed
if (consumedButton) {
    consumedButton.addEventListener("click", function() {
        if (!selectedItem) {
            return;
        }

        saveToHistory(selectedItem, "Consumed");
        selectedItem.remove();
        updateTotalItems();
        saveInventory();
        doneItemModal.style.display = "none";
        selectedItem = null;
    });
}

// Mark Item as Discarded
if (discardedButton) {
    discardedButton.addEventListener("click", function() {
        if (!selectedItem) {
            return;
        }

        saveToHistory(selectedItem, "Discarded");
        selectedItem.remove();
        updateTotalItems();
        saveInventory();
        doneItemModal.style.display = "none";
        selectedItem = null;
    });
}

// Cancel Mark as Done
cancelDoneButton?.addEventListener("click", function(event) {
    event.stopPropagation();

    // Close Mark as Done Popup
    doneItemModal.style.display = "none";
});


// ========================================
// INVENTORY CONTROLS
// ========================================

// Update the total number of inventory items
function updateTotalItems() {
    const totalItems =
        inventoryList.querySelectorAll(".inventory-item-card").length;

    inventoryTotalItems.textContent = totalItems;
}

// Apply search text and category filter
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

// Convert the filter value into the category name
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

// Convert the category name into the select value
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

// Sort inventory items
function sortInventory() {
    const selectedSort = sortItems.value;

    const itemCards = Array.from(
        inventoryList.querySelectorAll(".inventory-item-card")
    );

    itemCards.sort(function(a, b) {
        // Sort by name A-Z
        if (selectedSort === "name-az") {
            return a.dataset.name.localeCompare(b.dataset.name);
        }

        // Sort by name Z-A
        if (selectedSort === "name-za") {
            return b.dataset.name.localeCompare(a.dataset.name);
        }

        // Sort by expiration date earliest to latest
        if (selectedSort === "expiration-asc") {
            return a.dataset.expiration.localeCompare(
                b.dataset.expiration
            );
        }

        // Sort by expiration date latest to earliest
        if (selectedSort === "expiration-desc") {
            return b.dataset.expiration.localeCompare(
                a.dataset.expiration
            );
        }
    });

    // Put the sorted cards back into the inventory list
    itemCards.forEach(function(card) {
        inventoryList.appendChild(card);
    });
}

// Search when the user types
searchInput?.addEventListener("input", function() {
    filterItems();
});

// Filter when the category changes
categoryFilter?.addEventListener("change", function() {
    filterItems();
});

// Sort when the sorting option changes
sortItems?.addEventListener("change", function() {
    sortInventory();
});


// ========================================
// LOCAL STORAGE
// ========================================

// Save inventory items to Local Storage
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

// Create an inventory card for an item
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

    // Open Item Details Popup when the card is clicked
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

    // Add the newest item to the top of the list
    inventoryList.insertBefore(newItem, inventoryList.children[1]);
}


// ========================================
// LOAD INVENTORY
// ========================================

// Load saved inventory items from Local Storage
function loadInventory() {
    const savedItems = localStorage.getItem("inventoryItems");

    if (!savedItems) {
        return;
    }

    const items = JSON.parse(savedItems);

    for (let i = items.length - 1; i >= 0; i--) {
        createInventoryCard(items[i]);
    }

    updateTotalItems();
}

// Load inventory when the page opens
if (inventoryList) {
    loadInventory();
}


// ========================================
// DASHBOARD
// ========================================

// Load dashboard information
function loadDashboard() {
    const savedItems = localStorage.getItem("inventoryItems");

    if (!savedItems) {
        return;
    }

    const items = JSON.parse(savedItems);

    let goodCount = 0;
    let soonCount = 0;
    let urgentCount = 0;
    let criticalCount = 0;
    let expiredCount = 0;

    items.forEach(function(item) {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get the item's expiration date
        const expiration = new Date(item.expiration + "T00:00:00");
        expiration.setHours(0, 0, 0, 0);

        // Calculate the number of days left
        const difference = expiration - today;

        const daysLeft = Math.round(
            difference / (1000 * 60 * 60 * 24)
        );

        item.daysLeft = daysLeft;

        // Update the item's status
        if (daysLeft <= 0) {
            item.status = "Expired";
            expiredCount++;
        } else if (daysLeft <= 7) {
            item.status = "Critical";
            criticalCount++;
        } else if (daysLeft <= 15) {
            item.status = "Urgent";
            urgentCount++;
        } else if (daysLeft <= 30) {
            item.status = "Soon";
            soonCount++;
        } else {
            item.status = "Good";
            goodCount++;
        }
    });

    // Save updated days left and status
    localStorage.setItem("inventoryItems", JSON.stringify(items));

    // Display the status counts
    document.getElementById("good-count").textContent = goodCount;
    document.getElementById("soon-count").textContent = soonCount;
    document.getElementById("urgent-count").textContent = urgentCount;
    document.getElementById("critical-count").textContent = criticalCount;
    document.getElementById("expired-count").textContent = expiredCount;

    const attentionList = document.getElementById("attention-list");

    // Get items that need attention
    const attentionItems = items.filter(function(item) {
        return Number(item.daysLeft) <= 30;
    });

    // Sort by days left, then alphabetically when days are equal
    attentionItems.sort(function(a, b) {
        const daysDifference =
            Number(a.daysLeft) - Number(b.daysLeft);

        if (daysDifference !== 0) {
            return daysDifference;
        }

        return a.name.localeCompare(b.name);
    });

    // Display items that need attention
    attentionItems.forEach(function(item) {
        const itemCard = document.createElement("div");

        itemCard.classList.add(
            "dashboard-item-card",
            item.status.toLowerCase()
        );

        itemCard.innerHTML = `
            <div class="item-info">
                <h3>${item.name}</h3>
                <h4>${item.category}</h4>
                <p>${item.daysLeft} days left</p>
            </div>
            <div class="item-status">${item.status}</div>
        `;

        attentionList.appendChild(itemCard);
    });
}

// Load dashboard when the page opens
if (document.getElementById("attention-list")) {
    loadDashboard();
}


// ========================================
// ITEM HISTORY
// ========================================

// Load saved item history from Local Storage
function loadHistory() {
    const historyList = document.getElementById("history-list");

    if (!historyList) {
        return;
    }

    const savedHistory = localStorage.getItem("itemHistory");

    if (!savedHistory) {
        return;
    }

    const history = JSON.parse(savedHistory);

    // Display each history record in the table
    history.forEach(function(item) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity || "Not specified"}</td>
            <td>${formatExpirationDate(item.expiration)}</td>
            <td>${item.status}</td>
            <td>${item.action}</td>
            <td>${formatExpirationDate(item.actionDate)}</td>
        `;

        historyList.appendChild(row);
    });
}

// Load item history when the page opens
loadHistory();