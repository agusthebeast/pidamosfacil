let currentUser = null;
let products = [];
let filteredProducts = [];
let categories = [];
let selectedCategory = "TODOS";
let cart = [];

const loginScreen = document.getElementById("login-screen");
const catalogScreen = document.getElementById("catalog-screen");
const cartScreen = document.getElementById("cart-screen");
const successScreen = document.getElementById("success-screen");

const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const welcomeUser = document.getElementById("welcome-user");
const logoutBtn = document.getElementById("logout-btn");

const categoriesEl = document.getElementById("categories");
const productsListEl = document.getElementById("products-list");
const cartCountEl = document.getElementById("cart-count");
const searchInput = document.getElementById("search-input");
const openCartBtn = document.getElementById("open-cart-btn");
const backToShopBtn = document.getElementById("back-to-shop-btn");

const cartItemsEl = document.getElementById("cart-items");
const checkoutForm = document.getElementById("checkout-form");
const checkoutMsg = document.getElementById("checkout-msg");

const orderCodeEl = document.getElementById("order-code");
const waLinkEl = document.getElementById("wa-link");
const newOrderBtn = document.getElementById("new-order-btn");

function showScreen(screen) {
  [loginScreen, catalogScreen, cartScreen, successScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function apiUrl(action, extra = {}) {
  const params = new URLSearchParams({ action, ...extra });
  return `${SCRIPT_URL}?${params.toString()}`;
}

async function apiPost(payload) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  });
  return res.json();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Ingresando...";

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(apiUrl("login", { usuario, password }));
    const data = await res.json();

    if (data.ok) {
      currentUser = usuario;
      welcomeUser.textContent = `Hola, ${usuario}`;
      loginMsg.textContent = "";
      await loadProducts();
      showScreen(catalogScreen);
    } else {
      loginMsg.textContent = data.message || "Usuario o contraseña incorrectos.";
    }
  } catch (err) {
    loginMsg.textContent = "No se pudo conectar con el servidor.";
  }
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  cart = [];
  updateCartCount();
  loginForm.reset();
  showScreen(loginScreen);
});

searchInput.addEventListener("input", renderProducts);

openCartBtn.addEventListener("click", () => {
  renderCart();
  showScreen(cartScreen);
});

backToShopBtn.addEventListener("click", () => {
  showScreen(catalogScreen);
});

newOrderBtn.addEventListener("click", async () => {
  cart = [];
  updateCartCount();
  checkoutForm.reset();
  checkoutMsg.textContent = "";
  await loadProducts();
  showScreen(catalogScreen);
});

async function loadProducts() {
  const res = await fetch(apiUrl("productos"));
  const data = await res.json();
  products = data.productos || [];
  filteredProducts = [...products];
  categories = ["TODOS", ...new Set(products.map(p => p.categoria).filter(Boolean))];
  renderCategories();
  renderProducts();
}

function renderCategories() {
  categoriesEl.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `category-chip ${selectedCategory === cat ? "active" : ""}`;
    btn.textContent = cat;
    btn.onclick = () => {
      selectedCategory = cat;
      renderCategories();
      renderProducts();
    };
    categoriesEl.appendChild(btn);
  });
}

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();

  filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "TODOS" || p.categoria === selectedCategory;
    const matchesText =
      p.nombre.toLowerCase().includes(q) ||
      (p.descripcion || "").toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q);
    return matchesCategory && matchesText;
  });

  productsListEl.innerHTML = "";

  if (!filteredProducts.length) {
    productsListEl.innerHTML = `<div class="login-card"><p>No hay productos para mostrar.</p></div>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${product.imagen || ""}" alt="${product.nombre}" onerror="this.src=''; this.style.background='#ddd';" />
      <div class="product-info">
        <h3>${product.nombre}</h3>
        <p>${product.descripcion || ""}</p>
        <div class="qty-row">
          <div class="qty-box">
            <button type="button" class="minus-btn">-</button>
            <span class="qty-number">1</span>
            <button type="button" class="plus-btn">+</button>
          </div>
          <button type="button" class="add-btn">Agregar</button>
        </div>
      </div>
    `;

    const qtyNumber = card.querySelector(".qty-number");
    let qty = 1;

    card.querySelector(".minus-btn").onclick = () => {
      if (qty > 1) qty--;
      qtyNumber.textContent = qty;
    };

    card.querySelector(".plus-btn").onclick = () => {
      qty++;
      qtyNumber.textContent = qty;
    };

    card.querySelector(".add-btn").onclick = () => {
      addToCart(product, qty);
      qty = 1;
      qtyNumber.textContent = qty;
    };

    productsListEl.appendChild(card);
  });
}

function addToCart(product, quantity) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.cantidad += quantity;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion,
      imagen: product.imagen,
      cantidad: quantity
    });
  }
  updateCartCount();
}

function updateCartCount() {
  const totalUnidades = cart.reduce((acc, item) => acc + item.cantidad, 0);
  cartCountEl.textContent = `${totalUnidades} unidades`;
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  if (!cart.length) {
    cartItemsEl.innerHTML = `<div class="login-card"><p>Tu carrito está vacío.</p></div>`;
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <img src="${item.imagen || ""}" alt="${item.nombre}" onerror="this.src=''; this.style.background='#ddd';" />
      <div class="cart-info">
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || ""}</p>
        <div class="qty-row">
          <div class="qty-box">
            <button type="button" class="minus-btn">-</button>
            <span class="qty-number">${item.cantidad}</span>
            <button type="button" class="plus-btn">+</button>
          </div>
          <button type="button" class="remove-btn">Quitar</button>
        </div>
      </div>
    `;

    row.querySelector(".minus-btn").onclick = () => {
      if (item.cantidad > 1) {
        item.cantidad--;
      } else {
        cart = cart.filter(c => c.id !== item.id);
      }
      updateCartCount();
      renderCart();
    };

    row.querySelector(".plus-btn").onclick = () => {
      item.cantidad++;
      updateCartCount();
      renderCart();
    };

    row.querySelector(".remove-btn").onclick = () => {
      cart = cart.filter(c => c.id !== item.id);
      updateCartCount();
      renderCart();
    };

    cartItemsEl.appendChild(row);
  });
}

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!cart.length) {
    checkoutMsg.textContent = "Agregá productos antes de enviar.";
    return;
  }

  const payload = {
    action: "guardarPedido",
    user: currentUser,
    cliente: document.getElementById("cliente").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    pago: document.getElementById("pago").value,
    carrito: cart
  };

  checkoutMsg.textContent = "Enviando pedido...";

  try {
    const data = await apiPost(payload);

    if (!data.ok) {
      checkoutMsg.textContent = data.message || "No se pudo guardar el pedido.";
      return;
    }

    checkoutMsg.textContent = "";
    orderCodeEl.textContent = data.codigo;
    waLinkEl.href = data.whatsappUrl;
    showScreen(successScreen);
  } catch (err) {
    checkoutMsg.textContent = "Error de conexión al guardar el pedido.";
  }
});