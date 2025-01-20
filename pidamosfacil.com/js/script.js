// Desplazamiento suave para todos los enlaces con anclas
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Mensaje predeterminado para contacto por WhatsApp
const whatsappButtons = document.querySelectorAll('a[href*="wa.me"]');
whatsappButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const message = "Hola, quisiera información para crear mi página de pedidos. Mi nombre es:";
        button.href += `?text=${encodeURIComponent(message)}`;
    });
});

// Datos de preguntas y respuestas
const faqsData = [
    {
        pregunta: "¿Es un marketplace como por ejemplo Mercado Libre o Pedidos Ya?",
        respuesta: "No, Pidamos Fácil no es un marketplace. Es una herramienta personalizada para gestionar tus pedidos directamente con tus clientes."
    },
    {
        pregunta: "¿Voy a vender más?",
        respuesta: "Con Pidamos Fácil, tendrás un canal directo de ventas, facilitando la experiencia del cliente y aumentando tus ventas."
    },
    {
        pregunta: "¿Los clientes deben descargar una App para realizar un pedido?",
        respuesta: "No, tus clientes pueden realizar pedidos directamente desde su navegador, sin necesidad de descargar ninguna aplicación."
    },
    {
        pregunta: "¿Cómo puedo crear mi tienda?",
        respuesta: "Solo necesitas enviarnos la información básica de tu negocio y productos. En menos de 24 horas, tu tienda estará lista."
    },
    {
        pregunta: "¿Tengo algún límite de pedidos por WhatsApp?",
        respuesta: "No hay límites en la cantidad de pedidos que puedes recibir por WhatsApp."
    },
    {
        pregunta: "¿Es seguro el sistema?",
        respuesta: "Sí, Pidamos Fácil utiliza tecnologías avanzadas para proteger tus datos y los de tus clientes."
    },
    {
        pregunta: "¿Tiene caídas o procesos lentos de carga?",
        respuesta: "Nuestro sistema está diseñado para ser rápido y estable. Monitoreamos constantemente para evitar interrupciones."
    },
    {
        pregunta: "¿Debo firmar algún contrato?",
        respuesta: "No es necesario firmar contratos. Puedes cancelar tu suscripción mensual en cualquier momento."
    }
];

// Renderizar las FAQs en el DOM
const faqList = document.querySelector('.faq-list');
faqList.innerHTML = faqsData.map((faq, index) => `
    <div class="faq-item" onclick="toggleFAQ(${index})">
        <div class="faq-question">${faq.pregunta}</div>
        <div class="faq-answer" id="faq-answer-${index}">${faq.respuesta}</div>
    </div>
`).join('');

// Función para mostrar/ocultar respuesta
function toggleFAQ(index) {
    const answer = document.getElementById(`faq-answer-${index}`);
    const item = answer.parentElement;

    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    
    if (!isActive) {
        item.classList.add('active');
    }
}
