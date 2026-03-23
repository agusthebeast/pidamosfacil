let currentUser = null;
let currentRole = "CLIENTE";
let products = [];
let categories = [];
let banners = [];
let filteredProducts = [];
let selectedCategory = null;
let cart = [];
let pedidosAdmin = [];
let userOrders = [];
let bannerIndex = 0;
let bannerInterval = null;

const loginScreen = document.getElementById("login-screen");
const catalogScreen = document.getElementById("catalog-screen");
const cartScreen = document.getElementById("cart-screen");
const successScreen = document.getElementById("success-screen");
const adminScreen = document.getElementById("admin-screen");
const ordersScreen = document.getElementById("orders-screen");

const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const welcomeUser = document.getElementById("welcome-user");
const logoutBtn = document.getElementById("logout-btn");
const adminBtn = document.getElementById("admin-btn");
const ordersBtn = document.getElementById("orders-btn");

const heroBanners = document.getElementById("hero-banners");
const heroTrack = document.getElementById("hero-track");
const searchInput = document.getElementById("search-input");

const categoryView = document.getElementById("category-view");
const productsView = document.getElementById("products-view");
const currentCategoryTitle = document.getElementById("current-category-title");
const backToCategoriesBtn = document.getElementById("back-to-categories-btn");

const productsListEl = document.getElementById("products-list");
const cartCountEl = document.getElementById("cart-count");
const openCartBtn = document.getElementById("open-cart-btn");
const backToShopBtn = document.getElementById("back-to-shop-btn");

const cartItemsEl = document.getElementById("cart-items");
const checkoutForm = document.getElementById("checkout-form");
const checkoutMsg = document.getElementById("checkout-msg");

const orderCodeEl = document.getElementById("order-code");
const waLinkEl = document.getElementById("wa-link");
const newOrderBtn = document.getElementById("new-order-btn");

const backFromAdminBtn = document.getElementById("back-from-admin-btn");
const adminOrdersList = document.getElementById("admin-orders-list");
const adminSearchInput = document.getElementById("admin-search-input");

const backFromOrdersBtn = document.getElementById("back-from-orders-btn");
const userOrdersList = document.getElementById("user-orders-list");

function showScreen(screen) {
  [loginScreen, catalogScreen, cartScreen, successScreen, adminScreen, ordersScreen].forEach(s => s.classList.remove("active"));
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

    if (!data.ok) {
      loginMsg.textContent = data.message || "Usuario o contraseña incorrectos.";
      return;
    }

    currentUser = usuario;
    currentRole = data.rol || "CLIENTE";
    welcomeUser.textContent = `Hola, ${usuario}`;

    if (currentRole === "ADMIN") {
      adminBtn.classList.remove("hidden");
    } else {
      adminBtn.classList.add("hidden");
    }

    loginMsg.textContent = "";
    await loadInitialData();
    showCategories();
    showScreen(catalogScreen);
  } catch {
    loginMsg.textContent = "No se pudo conectar con el servidor.";
  }
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  currentRole = "CLIENTE";
  cart = [];
  pedidosAdmin = [];
  userOrders = [];
  selectedCategory = null;
  updateCartCount();
  loginForm.reset();
  checkoutForm.reset();
  adminBtn.classList.add("hidden");
  stopBannerCarousel();
  showScreen(loginScreen);
});

ordersBtn.addEventListener("click", async () => {
  await loadUserOrders();
  showScreen(ordersScreen);
});

adminBtn.addEventListener("click", async () => {
  await loadPedidosAdmin();
  showScreen(adminScreen);
});

backFromAdminBtn.addEventListener("click", () => {
  showScreen(catalogScreen);
});

backFromOrdersBtn.addEventListener("click", () => {
  showScreen(catalogScreen);
});

backToShopBtn.addEventListener("click", () => {
  showScreen(catalogScreen);
});

openCartBtn.addEventListener("click", () => {
  renderCart();
  showScreen(cartScreen);
});

newOrderBtn.addEventListener("click", async () => {
  cart = [];
  updateCartCount();
  checkoutForm.reset();
  checkoutMsg.textContent = "";
  await loadInitialData();
  showCategories();
  showScreen(catalogScreen);
});

backToCategoriesBtn.addEventListener("click", () => {
  showCategories();
});

searchInput.addEventListener("input", () => {
  if (selectedCategory) renderProducts();
});

adminSearchInput.addEventListener("input", renderPedidosAdmin);

async function loadInitialData() {
  const [prodRes, catRes, bannerRes] = await Promise.all([
    fetch(apiUrl("productos")),
    fetch(apiUrl("categorias")),
    fetch(apiUrl("banners"))
  ]);

  const prodData = await prodRes.json();
  const catData = await catRes.json();
  const bannerData = await bannerRes.json();

  products = prodData.productos || [];
  categories = catData.categorias || [];
  banners = bannerData.banners || [];

  renderHeroBanners();
  renderCategories();
}

function renderHeroBanners() {
  heroTrack.innerHTML = "";
  stopBannerCarousel();

  if (!banners.length) {
    heroBanners.classList.add("hidden");
    return;
  }

  heroBanners.classList.remove("hidden");

  banners.forEach(banner => {
    const slide = document.createElement("div");
    slide.className = "hero-slide";
    slide.innerHTML = `<img src="${banner.imagen}" alt="${banner.titulo || 'Banner'}" onerror="this.style.display='none';">`;
    heroTrack.appendChild(slide);
  });

  bannerIndex = 0;
  updateBannerPosition();

  if (banners.length > 1) {
    bannerInterval = setInterval(() => {
      bannerIndex = (bannerIndex + 1) % banners.length;
      updateBannerPosition();
    }, 3000);
  }
}

function updateBannerPosition() {
  heroTrack.style.transform = `translateX(-${bannerIndex * 100}%)`;
}

function stopBannerCarousel() {
  if (bannerInterval) {
    clearInterval(bannerInterval);
    bannerInterval = null;
  }
}

function renderCategories() {
  categoryView.innerHTML = "";

  if (!categories.length) {
    categoryView.innerHTML = `<div class="login-card"><p>No hay categorías cargadas.</p></div>`;
    return;
  }

  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.className = "category-banner";
    btn.innerHTML = `
      <img src="${category.imagen || ''}" alt="${category.nombre}" onerror="this.style.display='none';" />
      <div class="overlay">
        <h3>${category.nombre}</h3>
      </div>
    `;
    btn.onclick = () => openCategory(category.nombre);
    categoryView.appendChild(btn);
  });
}

function showCategories() {
  selectedCategory = null;
  categoryView.classList.remove("hidden");
  productsView.classList.add("hidden");
}

function openCategory(categoryName) {
  selectedCategory = categoryName;
  currentCategoryTitle.textContent = categoryName;
  categoryView.classList.add("hidden");
  productsView.classList.remove("hidden");
  renderProducts();
}

function getCartQty(productId) {
  const item = cart.find(x => String(x.id) === String(productId));
  return item ? item.cantidad : 0;
}

function setCartQty(product, quantity) {
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const existing = cart.find(item => String(item.id) === String(product.id));

  if (qty === 0) {
    cart = cart.filter(item => String(item.id) !== String(product.id));
  } else if (existing) {
    existing.cantidad = qty;
  } else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion,
      imagen: product.imagen,
      cantidad: qty
    });
  }

  updateCartCount();
}

function renderProducts() {
  const q = searchInput.value.trim().toLowerCase();

  filteredProducts = products.filter(p => {
    const sameCategory = p.categoria === selectedCategory;
    const matchesText =
      (p.nombre || "").toLowerCase().includes(q) ||
      (p.descripcion || "").toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q);
    return sameCategory && matchesText;
  });

  productsListEl.innerHTML = "";

  if (!filteredProducts.length) {
    productsListEl.innerHTML = `<div class="login-card"><p>No hay productos en esta categoría.</p></div>`;
    return;
  }

  filteredProducts.forEach(product => {
    const currentQty = getCartQty(product.id);

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
            <input type="number" min="0" value="${currentQty}" class="qty-input" />
            <button type="button" class="plus-btn">+</button>
          </div>
        </div>
      </div>
    `;

    const input = card.querySelector(".qty-input");
    const minusBtn = card.querySelector(".minus-btn");
    const plusBtn = card.querySelector(".plus-btn");

    minusBtn.onclick = () => {
      const newQty = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
      input.value = newQty;
      setCartQty(product, newQty);
    };

    plusBtn.onclick = () => {
      const newQty = (parseInt(input.value, 10) || 0) + 1;
      input.value = newQty;
      setCartQty(product, newQty);
    };

    input.addEventListener("input", () => {
      setCartQty(product, input.value);
    });

    productsListEl.appendChild(card);
  });
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
            <input type="number" min="0" value="${item.cantidad}" class="qty-input" />
            <button type="button" class="plus-btn">+</button>
          </div>
          <button type="button" class="remove-btn">Quitar</button>
        </div>
      </div>
    `;

    const input = row.querySelector(".qty-input");

    row.querySelector(".minus-btn").onclick = () => {
      const newQty = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
      input.value = newQty;
      setCartQty(item, newQty);
      renderCart();
      renderProducts();
    };

    row.querySelector(".plus-btn").onclick = () => {
      const newQty = (parseInt(input.value, 10) || 0) + 1;
      input.value = newQty;
      setCartQty(item, newQty);
      renderCart();
      renderProducts();
    };

    input.addEventListener("input", () => {
      setCartQty(item, input.value);
      renderCart();
      renderProducts();
    });

    row.querySelector(".remove-btn").onclick = () => {
      setCartQty(item, 0);
      renderCart();
      renderProducts();
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
  } catch {
    checkoutMsg.textContent = "Error de conexión al guardar el pedido.";
  }
});

async function loadUserOrders() {
  const res = await fetch(apiUrl("pedidosUsuario", { usuario: currentUser }));
  const data = await res.json();
  userOrders = data.pedidos || [];
  renderUserOrders();
}

function renderUserOrders() {
  userOrdersList.innerHTML = "";

  if (!userOrders.length) {
    userOrdersList.innerHTML = `<div class="login-card"><p>Todavía no hiciste pedidos.</p></div>`;
    return;
  }

  userOrders.forEach(pedido => {
    const card = document.createElement("div");
    card.className = "admin-card";

    card.innerHTML = `
      <h3>${pedido.codigo}</h3>
      <div class="admin-meta">
        <strong>Fecha:</strong> ${pedido.fecha} ${pedido.hora}<br>
        <strong>Cliente:</strong> ${pedido.cliente}<br>
        <strong>Pago:</strong> ${pedido.pago}
      </div>
      <div class="admin-products">
        <strong>Productos:</strong><br>
        ${pedido.detalleHtml}
      </div>
      <div class="status-badge">${pedido.estado}</div>
    `;

    userOrdersList.appendChild(card);
  });
}

async function loadPedidosAdmin() {
  const res = await fetch(apiUrl("pedidos"));
  const data = await res.json();
  pedidosAdmin = data.pedidos || [];
  renderPedidosAdmin();
}

function renderPedidosAdmin() {
  const q = adminSearchInput.value.trim().toLowerCase();
  adminOrdersList.innerHTML = "";

  const filtrados = pedidosAdmin.filter(p =>
    (p.codigo || "").toLowerCase().includes(q) ||
    (p.cliente || "").toLowerCase().includes(q) ||
    (p.usuario || "").toLowerCase().includes(q)
  );

  if (!filtrados.length) {
    adminOrdersList.innerHTML = `<div class="login-card"><p>No hay pedidos para mostrar.</p></div>`;
    return;
  }

  filtrados.forEach(pedido => {
    const card = document.createElement("div");
    card.className = "admin-card";

    card.innerHTML = `
      <h3>${pedido.codigo}</h3>
      <div class="admin-meta">
        <strong>Usuario:</strong> ${pedido.usuario}<br>
        <strong>Cliente:</strong> ${pedido.cliente}<br>
        <strong>Tel:</strong> ${pedido.telefono}<br>
        <strong>Dirección:</strong> ${pedido.direccion}<br>
        <strong>Pago:</strong> ${pedido.pago}<br>
        <strong>Fecha:</strong> ${pedido.fecha} ${pedido.hora}<br>
        <strong>Estado:</strong> ${pedido.estado}
      </div>
      <div class="admin-products">
        <strong>Productos:</strong><br>
        ${pedido.detalleHtml}
      </div>
      <div class="admin-actions">
        <select class="estado-select">
          <option ${pedido.estado === "Recibido" ? "selected" : ""}>Recibido</option>
          <option ${pedido.estado === "Confirmado" ? "selected" : ""}>Confirmado</option>
          <option ${pedido.estado === "Preparando" ? "selected" : ""}>Preparando</option>
          <option ${pedido.estado === "Listo" ? "selected" : ""}>Listo</option>
          <option ${pedido.estado === "Entregado" ? "selected" : ""}>Entregado</option>
        </select>
        <button class="update-btn">Guardar estado</button>
        <button class="copy-btn">Copiar facturación</button>
        <span class="copy-ok"></span>
      </div>
    `;

    card.querySelector(".update-btn").onclick = async () => {
      const nuevoEstado = card.querySelector(".estado-select").value;
      const result = await apiPost({
        action: "actualizarEstado",
        codigo: pedido.codigo,
        estado: nuevoEstado
      });
      if (result.ok) await loadPedidosAdmin();
    };

    card.querySelector(".copy-btn").onclick = async () => {
      const msg = card.querySelector(".copy-ok");
      try {
        await navigator.clipboard.writeText(pedido.datosFactura || "");
        msg.textContent = "Copiado";
      } catch {
        msg.textContent = "No se pudo copiar";
      }
      setTimeout(() => msg.textContent = "", 2000);
    };

    adminOrdersList.appendChild(card);
  });
}