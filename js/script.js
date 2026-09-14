// Add Item Popup

const addItemButton = document.getElementById("addItemButton");
const addItemModal = document.getElementById("addItemModal");
const closeAddItemButton = document.getElementById("closeAddItemButton");


// Open the popup
addItemButton.addEventListener("click", function () {
    addItemModal.style.display = "block";
});


// Close the popup
closeAddItemButton.addEventListener("click", function () {
    addItemModal.style.display = "none";
});