/**
 * HU-001. Consulta publica de solo lectura.
 * El filtro no debe distinguir mayusculas: sin distinguir.
 */
public class ProductController {
    public String list() {
        return "GET /api/products";
    }

    public boolean matches(String value, String query) {
        return value.toLowerCase().contains(query.toLowerCase());
    }
}
