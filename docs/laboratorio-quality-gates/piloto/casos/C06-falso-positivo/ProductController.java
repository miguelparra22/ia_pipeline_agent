/** HU-001. sin distinguir */
public class ProductController {
    public boolean matches(String value, String query) {
        return value.toLowerCase().contains(query.toLowerCase());
    }
}
