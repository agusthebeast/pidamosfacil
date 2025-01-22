const SHEET_ID = "1lsL2QvvA2Jq9Sx2B28gtEtdOspkp44B46WyzFIYJbSs";
const API_KEY = "AIzaSyBRSdvU5TlbwjZN6dcDu-DHr1pjQ1RUWpo";

let cart = {};
let products = [];

async function fetchData() {
    try {
        console.log("Cargando datos...");

        const configResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Configuración?key=${API_KEY}`);
        const configData = await configResponse.json();
        if (configData.values) {
            applyConfig(parseConfig(configData.values));
        }

        const productsResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Productos?key=${API_KEY}`);
        const productsData = await productsResponse.json();
        if (productsData.values) {
            products = parseProducts(productsData.values);
            renderCategories(products);
        }
    } catch (error) {
        console.error("Error al obtener datos:", error);
    }
}

function parseConfig(data) {
    const config = {};
    data.forEach(row => {
        if (row.length === 2) config[row[0]] = row[1];
    });
    return config;
}

function applyConfig(config) {
    // Cambiar el título del negocio
    document.querySelector("header h1").innerText = config["Nombre del Negocio"] || "Tienda Sin Nombre";

    // Cambiar enlace e identificación de Instagram
    document.querySelector("#instagram-link").href = config["Instagram"] || "#";
    document.querySelector("#instagram-link").innerText = config["Instagram"] ? config["Instagram"].split("/").pop() : "Instagram";

    // Aplicar colores dinámicamente
    if (config["Color Primario"]) {
        document.documentElement.style.setProperty("--primary-color", config["Color Primario"]);
    } else {
        console.warn("Color Primario no configurado, usando valor predeterminado.");
    }

    if (config["Color Secundario"]) {
        document.documentElement.style.setProperty("--secondary-color", config["Color Secundario"]);
    } else {
        console.warn("Color Secundario no configurado, usando valor predeterminado.");
    }
}


function parseProducts(data) {
    const headers = data[0];
    return data.slice(1).map(row => {
        const product = {};
        headers.forEach((header, index) => {
            product[header] = row[index];
        });
        return product;
    });
}

function renderCategories(products) {
    const categoryContainer = document.getElementById("category-container");
    const categories = [...new Set(products.map(product => product["Categoría"]))];

    categoryContainer.innerHTML = categories.map(category => {
        const firstProduct = products.find(product => product["Categoría"] === category);
        const bannerUrl = firstProduct && firstProduct["Banner URL"] ? firstProduct["Banner URL"] : "img/default-banner.jpg"; // Banner predeterminado
        const iconUrl = firstProduct && firstProduct["Icono URL"] ? firstProduct["Icono URL"] : "img/default-icon.jpg"; // Ícono predeterminado

        return `
            <div class="category" style="background-image: url('${bannerUrl}');" onclick="renderSubcategories('${category}')">
                <div class="category-content">
                    <div class="category-image">
                        <img src="${iconUrl}" alt="${category}">
                    </div>
                    <span>${category}</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderSubcategories(category) {
    const categoryContainer = document.getElementById("category-container");
    const subcategories = [...new Set(products.filter(product => product["Categoría"] === category).map(product => product["Subcategoría"]))];

    categoryContainer.innerHTML = `
        <!-- Botón de volver -->
        <div class="back-button" onclick="renderCategories(products)">← Volver</div>
        
        <!-- Grid de subcategorías con banners -->
        <div class="subcategory-grid">
            ${subcategories.map(subcategory => {
                const firstProduct = products.find(product => product["Categoría"] === category && product["Subcategoría"] === subcategory);
                const bannerUrl = firstProduct && firstProduct["Subcategoría Banner URL"] ? firstProduct["Subcategoría Banner URL"] : "img/default-subcategory-banner.jpg"; // Banner predeterminado

                return `
                    <div class="subcategory" style="background-image: url('${bannerUrl}');" onclick="renderProducts('${category}', '${subcategory}')">
                        <span>${subcategory}</span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderProducts(category, subcategory, filteredProducts = null) {
    const categoryContainer = document.getElementById("category-container");

    // Almacenar categoría y subcategoría activas
    categoryContainer.setAttribute("data-category", category);
    categoryContainer.setAttribute("data-subcategory", subcategory);

    const productsToRender = filteredProducts || products.filter(product => product["Categoría"] === category && product["Subcategoría"] === subcategory);

    categoryContainer.innerHTML = `
        <!-- Botón de volver -->
        <div class="back-button" onclick="renderSubcategories('${category}')">← Volver</div>

        <!-- Lista de productos -->
        <div class="product-grid">
            ${productsToRender.map(product => `
                <div class="product">
                    <img src="${product["Imagen URL"]}" alt="${product.Nombre}">
                    <div class="product-details">
                        <div class="product-name">${product.Nombre}</div>
                        <div class="product-description">${product.Descripción}</div>
                        <div class="product-price">$${product.Precio}</div>
                        <div class="product-quantity">
                            <label for="quantity-${product.ID}">Cantidad:</label>
                            <input id="quantity-${product.ID}" type="number" min="0" value="${cart[product.ID]?.quantity || 0}" onchange="updateCart('${product.ID}', '${product.Nombre}', ${product.Precio}, this.value)">
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}


function updateCart(id, name, price, quantity) {
    if (quantity > 0) {
        cart[id] = { name, price, quantity: parseInt(quantity) };
    } else {
        delete cart[id];
    }
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById("cart-container");
    const cartItems = Object.values(cart);

    if (cartItems.length === 0) {
        cartContainer.innerHTML = "<p>El carrito está vacío.</p>";
        return;
    }

    cartContainer.innerHTML = cartItems.map(item => `
        <p>${item.name} x ${item.quantity} - $${item.price * item.quantity}</p>
    `).join("");
}

function toggleCart() {
    const cartModal = document.getElementById("cart-modal");
    cartModal.style.display = cartModal.style.display === "none" || cartModal.style.display === "" ? "block" : "none";
}

function openForm() {
    document.getElementById("form-popup").style.display = "block";
}

function closeForm() {
    document.getElementById("form-popup").style.display = "none";
}

/*function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const cuit = document.getElementById("cuit").value;
    const address = document.getElementById("address").value;
    const email = document.getElementById("email").value;

    const cartItems = Object.values(cart).map(item => `${item.name} x ${item.quantity} - $${item.price * item.quantity}`).join("%0A");
    const whatsappNumber = "5491138437425"; // Número de ejemplo

    const whatsappMessage = `Hola, quiero realizar el siguiente pedido:%0A${cartItems}%0A%0ADatos del cliente:%0A${name}%0ACUIT/CUIL: ${cuit}%0ADirección: ${address}%0AEmail: ${email}`;
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    window.open(whatsappURL, "_blank");
    closeForm();
    toggleCart();
}*/

function filterProducts() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const categoryContainer = document.getElementById("category-container");
    const filtered = products.filter(product => product.Nombre.toLowerCase().includes(query));

    if (query.length > 0) {
        categoryContainer.innerHTML = `
            <!-- Botón de "Volver" -->
            <div class="back-button" id="search-back-button" onclick="clearSearch()">← Volver</div>
            ${filtered.length > 0
                ? `
                <!-- Lista de productos filtrados -->
                <div class="product-grid">
                    ${filtered.map(product => `
                        <div class="product">
                            <img src="${product["Imagen URL"]}" alt="${product.Nombre}">
                            <div class="product-details">
                                <div class="product-name">${product.Nombre}</div>
                                <div class="product-description">${product.Descripción}</div>
                                <div class="product-price">$${product.Precio}</div>
                                <div class="product-quantity">
                                    <label for="quantity-${product.ID}">Cantidad:</label>
                                    <input id="quantity-${product.ID}" type="number" min="0" value="${cart[product.ID]?.quantity || 0}" onchange="updateCart('${product.ID}', '${product.Nombre}', ${product.Precio}, this.value)">
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>`
                : "<p>No se encontraron productos.</p>"
            }
        `;
    } else {
        // Si el input está vacío, mostrar las categorías
        renderCategories(products);
    }
}



function renderSearchResults(filteredProducts) {
    const categoryContainer = document.getElementById("category-container");
    categoryContainer.innerHTML = `
        <div class="back-button-container">
            <button class="back-button" onclick="renderCategories(products)">← Volver</button>
        </div>
        <div class="product-grid">
            ${filteredProducts.map(product => `
                <div class="product">
                    <img src="${product["Imagen URL"]}" alt="${product.Nombre}">
                    <div class="product-details">
                        <div class="product-name">${product.Nombre}</div>
                        <div class="product-description">${product.Descripción}</div>
                        <div class="product-price">$${product.Precio}</div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function clearSearch() {
    document.getElementById("search-bar").value = ""; // Limpiar el campo de búsqueda
    document.getElementById("search-back-button").style.display = "none"; // Ocultar el botón
    renderProducts("Todos", "Todos", products); // Mostrar todos los productos
}

function generateUniqueID() {
    const timestamp = Date.now(); // Obtén la marca de tiempo actual
    return `PF-${timestamp}`; // Prefijo para identificar el sistema
}

// Llamar a la función con los datos del pedido
document.querySelector("#enviarPedido").addEventListener("click", () => {
    const orderDetails = {
        id: Date.now().toString(), // Genera un ID único basado en la fecha actual
        cliente: document.querySelector("#cliente").value,
        telefono: document.querySelector("#telefono").value,
        productos: [
            { nombre: "Producto A", cantidad: 2, precio: 100 },
            { nombre: "Producto B", cantidad: 1, precio: 200 }
        ],
        total: 400,
        fecha: new Date().toISOString(),
    };

    sendOrderToGoogleSheet(orderDetails);
});

function submitOrder(event) {
    event.preventDefault(); // Evita recargar la página al enviar

    const scriptURL = "https://script.google.com/macros/s/AKfycbw8IBRIJTFhb5kdUQ7Dd3w834rO6T7uuZovh1hRsLpnLWTqJ5oGj3hsydiNye1fNrih/exec";

    // Recolectar datos del formulario
    const orderDetails = {
        id: Date.now().toString(), // Generar ID único basado en el tiempo
        name: document.getElementById("name").value,
        cuit: document.getElementById("cuit").value,
        address: document.getElementById("address").value,
        email: document.getElementById("email").value,
        fecha: new Date().toISOString()
    };

    // Mostrar ID generado al cliente
    alert(`Pedido enviado con éxito. Tu ID de pedido es: ${orderDetails.id}`);

    // Enviar datos al Apps Script
    fetch(scriptURL, {
        method: "POST",
        body: JSON.stringify(orderDetails),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) {
            alert("Hubo un error al guardar tu pedido. Por favor intenta de nuevo.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error de red al enviar el pedido.");
    });

    closeForm(); // Cierra el formulario después de enviar
}


fetchData();
