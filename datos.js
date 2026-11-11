// Menú de Lattely: productos, precios y fotos.
// Si algún día tenemos una foto distinta para cada tamaño, solo hay que cambiar la ruta aquí.
let PRODUCTOS = [
  { id: 1, nombre: "Latte", precio: 5200, desc: "Espresso con leche vaporizada.", icono: "☕",
    imagenes: { "Pequeño": "img/latte.webp?v=4", "Mediano": "img/latte.webp?v=4", "Grande": "img/latte.webp?v=4" } },
  { id: 2, nombre: "Cappuccino", precio: 4500, desc: "Espresso, leche y espuma cremosa.", icono: "☕",
    imagenes: { "Pequeño": "img/cappuccino.webp?v=4", "Mediano": "img/cappuccino.webp?v=4", "Grande": "img/cappuccino.webp?v=4" } },
  { id: 3, nombre: "Americano Frío", precio: 3800, desc: "Café con hielo, ligero y fresco.", icono: "🧊", usaLeche: false,
    imagenes: { "Pequeño": "img/americano-frio.webp?v=4", "Mediano": "img/americano-frio.webp?v=4", "Grande": "img/americano-frio.webp?v=4" } },
  { id: 4, nombre: "Té Chai", precio: 4800, desc: "Té negro con especias.", icono: "🍵", usaLeche: false,
    imagenes: { "Pequeño": "img/te-chai.webp?v=4", "Mediano": "img/te-chai.webp?v=4", "Grande": "img/te-chai.webp?v=4" } }
];

// el tamaño no cambia el precio
const TAMANOS = ["Pequeño", "Mediano", "Grande"];
// lo que se suma según la leche
const LECHES = { "Entera": 0, "Deslactosada": 0, "Almendras": 2000 };
// los productos con usaLeche: false no muestran opciones de leche y se guardan como "Sin leche"
const SIN_LECHE = "Sin leche";
