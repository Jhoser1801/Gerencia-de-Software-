// Datos de Supabase. Si se dejan vacíos, los pedidos se guardan en el navegador.
// Ojo: aquí solo va la clave "anon public", nunca la "service_role".
// pinCafeteria: PIN de la vista "Cafetería" en modo local. En modo Supabase el PIN se guarda en la
// tabla "ajustes" de la base de datos y este valor no se usa.
const LATTELY_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  pinCafeteria: "2468"
};
