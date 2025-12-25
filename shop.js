let products = [];
let cart = JSON.parse(localStorage.getItem("officeCart") || "[]");
const itemsPerPage = 12;
let currentPage = 1;
let currentFilteredProducts = [];

const cartItemsList = document.getElementById("cartItemsList");
const cartFooter = document.getElementById("cartFooter");
const emptyMessage = document.getElementById("emptyCartMessage");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartBadge = document.getElementById("offcanvasCartCount");  // Fixed: Matches HTML ID
const sortSelect = document.getElementById("sortSelect");

fetch("product.json")  // Fixed: Matches your file name
  .then(res => res.json())
  .then(data => {
    products = data;
  
    // Render dynamic products if on store.html
    if (document.getElementById("productGrid")) {
      renderProducts(1);
    }
    updateCartUI();
  })
  .catch(err => console.error("JSON load error:", err));

function saveCart() {
  localStorage.setItem("officeCart", JSON.stringify(cart));
}

function getProductsByCategory(category = "all") {
  if (category === "all") return products;
  return products.filter(p => p.category === category);
}

function renderProducts(page = 1) {
  currentPage = page;
  const pageType = (document.body.dataset.category || "all").toLowerCase();
  currentFilteredProducts = sortProducts(getProductsByCategory(pageType));

  const totalItems = currentFilteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageProducts = currentFilteredProducts.slice(start, end);

  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";

  pageProducts.forEach(product => {
    grid.innerHTML += `
      <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
        <div class="card product-card h-100 border-0 shadow-sm product-link" data-id="${product.id}">
          <div class="position-relative">
            <img src="${product.img}" class="card-img-top" data-id="${product.id}" alt="${product.name}">
            
             <button class="add-to-cart-icon btn position-absolute top-0 end-0 m-3 bg-white rounded-circle" data-id="${product.id}" title="Add to Cart">
              <i class="fas fa-shopping-cart"></i>
             </button>
          </div>
          <div class="card-body text-center">
            <h6 class="fw-bold mb-2" data-id="${product.id}">${product.name}</h6>
            <p class="text-danger fw-bold">$${product.price}</p>
          </div>
        </div>
      </div>`;
  });

  updatePagination(totalPages);
}

function updatePagination(totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination || totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" onclick="renderProducts(${i}); return false;">${i}</a>
      </li>`;
  }
}

function showNotification(message) {
  // Simple Bootstrap alert toast
  const toast = document.createElement("div");
  toast.className = "alert alert-success position-fixed top-0 end-0 m-3";
  toast.style.zIndex = "9999";
  toast.innerHTML = `<span>${message}</span><button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(toast);
  new bootstrap.Alert(toast);
  setTimeout(() => toast.remove(), 3000);
}

function addToCart(id, qty = 1) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += qty;
    showNotification(`${product.name} quantity increased by ${qty}!`);
  } else {
    cart.push({ ...product, quantity: qty });
    showNotification(`${product.name} x${qty} added to cart!`);
  }

  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "block" : "none";  // Fixed: "block" for absolute positioned badge
  }

  if (!cartItemsList) return;
  cartItemsList.innerHTML = "";

  if (cart.length === 0) {
    emptyMessage.style.display = "block";
    cartFooter.style.display = "none";
    return;
  }

  emptyMessage.style.display = "none";
  cartFooter.style.display = "block";
  cartSubtotal.textContent = subtotal.toFixed(2);

  cart.forEach(item => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    cartItemsList.innerHTML += `
      <div class="list-group-item d-flex justify-content-between align-items-center p-3">
        <div class="d-flex align-items-center gap-3 flex-grow-1">
          <img src="${item.img}" alt="${item.name}" class="rounded" style="width:70px;height:70px;object-fit:cover;">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <h6 class="mb-0 fw-semibold">${item.name}</h6>
              <span class="text-danger ms-2 remove-item fs-5" style="cursor:pointer;" data-id="${item.id}" title="Remove">&times;</span>
            </div>
            <p class="mb-1 text-muted small">$${item.price} each</p>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary decrease-qty" data-id="${item.id}">&minus;</button>
              <button class="btn btn-light px-3" disabled>${item.quantity}</button>
              <button class="btn btn-outline-secondary increase-qty" data-id="${item.id}">&plus;</button>
            </div>
          </div>
        </div>
        <span class="fw-bold fs-5 ms-2">$${itemTotal}</span>
      </div>`;
  });
}

function updateQuantity(id, change) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
  updateCartUI();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  showNotification("Item removed from cart!");
}

function showQuickView(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  document.getElementById('modalImg').src = product.img;
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalPrice').textContent = `$${product.price.toFixed(2)}`;
  document.getElementById('modalDesc').textContent = product.description || '';

  const qtyInput = document.getElementById('qtyInput');
  qtyInput.value = 1;

  const addBtn = document.getElementById('addToCartModal');
  addBtn.onclick = null; // Clear previous
  addBtn.onclick = () => {
    const qty = parseInt(qtyInput.value) || 1;
    addToCart(id, qty);
    const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
    modal.hide();
  };

  const decBtn = document.getElementById('decQty');
  const incBtn = document.getElementById('incQty');
  let currentQty = 1;

  const updateQty = () => {
    currentQty = Math.max(1, currentQty);
    qtyInput.value = currentQty;
  };

  decBtn.onclick = () => {
    currentQty--;
    updateQty();
  };

  incBtn.onclick = () => {
    currentQty++;
    updateQty();
  };

  qtyInput.onchange = (e) => {
    currentQty = parseInt(e.target.value) || 1;
    updateQty();
  };

  const modalEl = document.getElementById('quickViewModal');
  new bootstrap.Modal(modalEl).show();
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", e => {
    const addBtn = e.target.closest(".add-to-cart-icon, .bi-cart"); // Handles both dynamic and static .bi-cart
    const increaseBtn = e.target.closest(".increase-qty");
    const decreaseBtn = e.target.closest(".decrease-qty");
    const removeBtn = e.target.closest(".remove-item");
    const eyeBtn = e.target.closest(".bi-eye");
    const productLink = e.target.closest(".product-link, .ps-product-card"); // For product details if needed

    if (addBtn) {
      const id = parseInt(addBtn.dataset.id || addBtn.closest("[data-id]").dataset.id);
      addToCart(id);
    }
    if (increaseBtn) updateQuantity(parseInt(increaseBtn.dataset.id), 1);
    if (decreaseBtn) updateQuantity(parseInt(decreaseBtn.dataset.id), -1);
    if (removeBtn) removeItem(parseInt(removeBtn.dataset.id));
    if (eyeBtn) {
      e.preventDefault();
      const id = parseInt(eyeBtn.dataset.id);
      showQuickView(id);
    }

    // Optional: Navigate to product.html (uncomment if you have it)
    // if (productLink && !e.target.closest(".add-to-cart-icon, .bi-cart")) {
    //   const id = parseInt(productLink.dataset.id);
    //   window.location.href = `product.html?id=${id}`;
    // }
  });

  // Continue Shopping links
  document.querySelectorAll(".continue-shopping").forEach(link => {
    link.href = "store.html";
  });

  updateCartUI();
});

function sortProducts(list) {
  if (!sortSelect) return list;
  const sorted = [...list];

  switch (sortSelect.value) {
    case "low-high":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "high-low":
      sorted.sort((a, b) => b.price - a.price);
      break;
    default:
      // Default: alphabetical by name
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    renderProducts(1);
  });
}
document.addEventListener("DOMContentLoaded", () => {

  const openBtn = document.getElementById("openLogin");
  const overlay = document.getElementById("loginOverlay");
  const closeBtn = document.getElementById("closeLogin");
  const form = document.getElementById("loginForm");

  const userInput = document.getElementById("loginUser");
  const passInput = document.getElementById("loginPass");
  const errors = document.querySelectorAll(".error");

  // OPEN MODAL
  openBtn.addEventListener("click", () => {
    overlay.style.display = "flex";
  });

  // CLOSE MODAL
  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // CLICK OUTSIDE TO CLOSE
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.style.display = "none";
  });

  // FORM SUBMIT
  form.addEventListener("submit", e => {
    e.preventDefault();

    errors.forEach(err => err.style.display = "none");
    let valid = true;

    if (userInput.value.trim() === "") {
      errors[0].style.display = "block";
      valid = false;
    }

    if (passInput.value.length < 6) {
      errors[1].style.display = "block";
      valid = false;
    }

    if (valid) {
      alert("Login Successful ✅");
      overlay.style.display = "none";
      form.reset();
    }
  });

});
